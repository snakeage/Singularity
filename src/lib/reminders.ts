import { todayISO } from "./dates";
import {
  getActiveStage,
  getCheckInForPracticePeriod,
  getFocusDream,
  getPractices,
} from "./selectors";
import type { AppData, Reminders } from "./types";

export const DEFAULT_REMINDERS: Reminders = {
  enabled: false,
  time: "09:00",
};

export function normalizeReminders(
  reminders?: Partial<Reminders> | null,
): Reminders {
  const time =
    typeof reminders?.time === "string" && /^\d{2}:\d{2}$/.test(reminders.time)
      ? reminders.time
      : DEFAULT_REMINDERS.time;
  return {
    enabled: Boolean(reminders?.enabled),
    time,
    lastSentDate:
      typeof reminders?.lastSentDate === "string"
        ? reminders.lastSentDate
        : undefined,
  };
}

export function currentTimeHHMM(date = new Date()): string {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export function countOpenDailyPractices(data: AppData): number {
  const dream = getFocusDream(data);
  if (!dream) return 0;
  const stage = getActiveStage(data, dream.id);
  if (!stage) return 0;
  return getPractices(data, stage.id).filter((p) => {
    if (p.frequency !== "daily") return false;
    return getCheckInForPracticePeriod(data, p)?.status !== "done";
  }).length;
}

export function shouldSendReminder(
  reminders: Reminders,
  openCount: number,
  now = new Date(),
): boolean {
  if (!reminders.enabled || openCount <= 0) return false;
  if (typeof Notification === "undefined") return false;
  if (Notification.permission !== "granted") return false;
  const today = todayISO();
  if (reminders.lastSentDate === today) return false;
  return currentTimeHHMM(now) >= reminders.time;
}

export function buildReminderBody(openCount: number): string {
  if (openCount === 1) return "Осталась 1 ежедневная практика на сегодня.";
  if (openCount < 5) return `Осталось ${openCount} ежедневные практики.`;
  return `Осталось ${openCount} ежедневных практик.`;
}

export async function requestNotificationPermission(): Promise<
  NotificationPermission | "unsupported"
> {
  if (typeof Notification === "undefined") return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

export function showPracticeReminder(openCount: number): void {
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  new Notification("Singularity — пора к практикам", {
    body: buildReminderBody(openCount),
    tag: "singularity-daily-practices",
  });
}
