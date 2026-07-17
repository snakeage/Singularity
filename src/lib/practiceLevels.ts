import {
  nowISO,
  parseISODate,
  toISODate,
  weekEndISO,
  weekStartISO,
} from "./dates";
import { createId } from "./id";
import { elapsedToMinutes, getTimerElapsedMs } from "./timer";
import type {
  AppData,
  CheckIn,
  CheckInStatus,
  Practice,
  PracticeTimerSession,
} from "./types";

function practicePeriodKey(practice: Practice, refDate = new Date()): string {
  return practice.frequency === "weekly"
    ? weekStartISO(refDate)
    : toISODate(refDate);
}

export const LEVEL_LABEL: Record<CheckInStatus, string> = {
  skipped: "Пропуск",
  partial: "Частично",
  done: "Норма",
  strong: "Сильно",
};

/** Full credit for XP / streak. */
export function isFullCredit(status: CheckInStatus): boolean {
  return status === "done" || status === "strong";
}

export function strongThreshold(minMinutes: number): number {
  return Math.ceil(minMinutes * 1.5);
}

/** Level from timed minutes vs practice minimum. */
export function resolveEffortStatus(
  practice: Practice | undefined,
  minutesSpent: number,
): CheckInStatus {
  const min = practice?.minMinutes;
  if (!min) {
    return minutesSpent > 0 ? "done" : "partial";
  }
  if (minutesSpent >= strongThreshold(min)) return "strong";
  if (minutesSpent >= min) return "done";
  if (minutesSpent > 0) return "partial";
  return "partial";
}

/** Claiming done without a timer. */
export function resolveClaimWithoutTimer(
  practice: Practice | undefined,
): CheckInStatus {
  if (practice?.minMinutes) return "partial";
  return "done";
}

export function levelTone(
  status: CheckInStatus | null | undefined,
): "muted" | "accent" | "strong" | "partial" | "skip" {
  if (!status) return "muted";
  if (status === "strong") return "strong";
  if (status === "done") return "accent";
  if (status === "partial") return "partial";
  return "skip";
}

export function longRunThresholdMinutes(practice: Practice): number {
  return Math.max(90, (practice.minMinutes ?? 30) * 2);
}

export type HistoryDot = {
  key: string;
  label: string;
  /** Full date for tooltips, e.g. «чт, 16 июля». */
  titleDate: string;
  status: CheckInStatus | null;
  minutesSpent?: number;
  isCurrent?: boolean;
};

/** Short weekday without trailing dot: пн, вт, … */
function shortWeekday(d: Date): string {
  return d
    .toLocaleDateString("ru-RU", { weekday: "short" })
    .replace(/\.$/, "")
    .toLowerCase();
}

function fullDayLabel(d: Date): string {
  return d.toLocaleDateString("ru-RU", {
    weekday: "short",
    day: "numeric",
    month: "long",
  });
}

export function getPracticeHistory(
  data: AppData,
  practice: Practice,
  count = 7,
): HistoryDot[] {
  const dots: HistoryDot[] = [];
  const cursor = new Date();
  const todayKey = toISODate(cursor);
  const thisWeekKey = weekStartISO(cursor);

  for (let i = 0; i < count; i += 1) {
    const d = new Date(cursor);
    if (practice.frequency === "weekly") {
      d.setDate(d.getDate() - i * 7);
      const key = weekStartISO(d);
      const weekDate = parseISODate(key);
      const checkIn = data.checkIns.find(
        (c) => c.practiceId === practice.id && c.date === key,
      );
      dots.push({
        key,
        label: weekDate.toLocaleDateString("ru-RU", {
          day: "numeric",
          month: "short",
        }),
        titleDate: weekDate.toLocaleDateString("ru-RU", {
          day: "numeric",
          month: "long",
        }),
        status: checkIn?.status ?? null,
        minutesSpent: checkIn?.minutesSpent,
        isCurrent: key === thisWeekKey,
      });
    } else {
      d.setDate(d.getDate() - i);
      const key = toISODate(d);
      const checkIn = data.checkIns.find(
        (c) => c.practiceId === practice.id && c.date === key,
      );
      dots.push({
        key,
        label: shortWeekday(d),
        titleDate: fullDayLabel(d),
        status: checkIn?.status ?? null,
        minutesSpent: checkIn?.minutesSpent,
        isCurrent: key === todayKey,
      });
    }
  }

  return dots.reverse();
}

function periodEndMs(
  periodKey: string,
  frequency: Practice["frequency"],
): number {
  if (frequency === "daily") {
    const d = parseISODate(periodKey);
    d.setHours(23, 59, 59, 999);
    return d.getTime();
  }
  const end = parseISODate(weekEndISO(parseISODate(periodKey)));
  end.setHours(23, 59, 59, 999);
  return end.getTime();
}

export function inferSessionPeriodKey(
  session: PracticeTimerSession,
  practice: Practice,
): string {
  if (session.periodKey) return session.periodKey;
  if (session.runningSince) {
    const started = new Date(session.runningSince);
    return practice.frequency === "weekly"
      ? weekStartISO(started)
      : toISODate(started);
  }
  return practicePeriodKey(practice);
}

function upsertPeriodCheckIn(
  checkIns: CheckIn[],
  practice: Practice,
  periodKey: string,
  status: CheckInStatus,
  minutesSpent: number,
): CheckIn[] {
  const frequency = practice.frequency;
  const weekStart = periodKey;
  const weekEnd =
    frequency === "weekly"
      ? weekEndISO(parseISODate(periodKey))
      : periodKey;

  const without = checkIns.filter((c) => {
    if (c.practiceId !== practice.id) return true;
    if (frequency === "daily") return c.date !== periodKey;
    return !(c.date >= weekStart && c.date <= weekEnd);
  });

  return [
    ...without,
    {
      id: createId("checkin"),
      practiceId: practice.id,
      date: periodKey,
      status,
      minutesSpent: minutesSpent > 0 ? minutesSpent : undefined,
      createdAt: nowISO(),
    },
  ];
}

export type SettleResult = {
  data: AppData;
  messages: string[];
};

/** Close timers whose period already ended; pause overflow into a new period. */
export function settleExpiredTimers(
  data: AppData,
  now = new Date(),
): SettleResult {
  const timers = data.practiceTimers ?? [];
  if (timers.length === 0) return { data, messages: [] };

  let checkIns = data.checkIns;
  const kept: PracticeTimerSession[] = [];
  const messages: string[] = [];
  const nowMs = now.getTime();

  for (const session of timers) {
    const practice = data.practices.find((p) => p.id === session.practiceId);
    if (!practice) continue;

    const periodKey = inferSessionPeriodKey(session, practice);
    const currentKey = practicePeriodKey(practice, now);
    if (periodKey === currentKey) {
      kept.push({ ...session, periodKey });
      continue;
    }

    const endMs = periodEndMs(periodKey, practice.frequency);
    const cappedMs = getTimerElapsedMs(session, Math.min(nowMs, endMs));
    const minutes = elapsedToMinutes(cappedMs);
    const status = resolveEffortStatus(practice, minutes);
    checkIns = upsertPeriodCheckIn(
      checkIns,
      practice,
      periodKey,
      status,
      minutes,
    );

    const label = LEVEL_LABEL[status];
    if (practice.minMinutes) {
      messages.push(
        `${practice.title}: ${label} · ${minutes}/${practice.minMinutes} мин (авто за прошлый период)`,
      );
    } else {
      messages.push(
        `${practice.title}: ${label} · ${minutes} мин (авто за прошлый период)`,
      );
    }
  }

  if (messages.length === 0 && kept.length === timers.length) {
    return { data, messages: [] };
  }

  return {
    data: {
      ...data,
      checkIns,
      practiceTimers: kept,
    },
    messages,
  };
}

export function motivationCopy(
  status: CheckInStatus,
  minutes: number,
  min?: number,
  xp?: number,
): string {
  const xpBit = xp && xp > 0 ? ` · +${xp} XP` : "";
  if (status === "strong") {
    return min
      ? `Сильный заход · ${minutes}/${min} мин${xpBit}`
      : `Сильный заход · ${minutes} мин${xpBit}`;
  }
  if (status === "done") {
    return min
      ? `Норма закрыта · ${minutes}/${min} мин${xpBit}`
      : `Сделано · ${minutes} мин${xpBit}`;
  }
  if (status === "partial") {
    return min
      ? `Есть движение · ${minutes}/${min} мин — добери в следующий раз`
      : `Частично · ${minutes} мин`;
  }
  return "Пропуск записан";
}
