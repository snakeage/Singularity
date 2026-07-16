import {
  formatWeekLabel,
  parseISODate,
  toISODate,
  weekEndISO,
  weekStartISO,
} from "./dates";
import { isFullCredit } from "./practiceLevels";
import type {
  AppData,
  CheckIn,
  CheckInStatus,
  Dream,
  GrowthSource,
  Milestone,
  PointA,
  Practice,
  Stage,
} from "./types";

export type WeekDayBar = {
  date: string;
  shortLabel: string;
  done: number;
  partial: number;
  skipped: number;
};

export type WeekReviewStats = {
  weekStart: string;
  weekEnd: string;
  label: string;
  doneCheckIns: number;
  partialCheckIns: number;
  strongCheckIns: number;
  skippedCheckIns: number;
  daysWithDone: number;
  dayBars: WeekDayBar[];
  maxDayDone: number;
  weeklyPractices: Array<{
    id: string;
    title: string;
    status: CheckInStatus | "open";
  }>;
  milestonesDoneInWeek: number;
};

export function getFocusDream(data: AppData): Dream | undefined {
  return (
    data.dreams.find((d) => d.status === "active") ??
    data.dreams.find((d) => d.status === "draft") ??
    data.dreams[0]
  );
}

export function getDreams(data: AppData): Dream[] {
  return [...data.dreams].sort((a, b) => {
    if (a.status === "active" && b.status !== "active") return -1;
    if (b.status === "active" && a.status !== "active") return 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

/** Newest first. Multiple snapshots per dream = Point A history. */
export function getPointAsForDream(data: AppData, dreamId: string): PointA[] {
  return data.pointAs
    .filter((p) => p.dreamId === dreamId)
    .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
}

export function getLatestPointA(
  data: AppData,
  dreamId: string,
): PointA | undefined {
  return getPointAsForDream(data, dreamId)[0];
}

export function getStagesForDream(data: AppData, dreamId: string): Stage[] {
  return data.stages
    .filter((s) => s.dreamId === dreamId)
    .sort((a, b) => a.order - b.order);
}

export function getActiveStage(data: AppData, dreamId: string): Stage | undefined {
  return getStagesForDream(data, dreamId).find((s) => s.status === "active");
}

export function getMilestones(data: AppData, stageId: string): Milestone[] {
  return data.milestones
    .filter((m) => m.stageId === stageId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function getPractices(data: AppData, stageId: string): Practice[] {
  return data.practices.filter(
    (p) => p.stageId === stageId && p.status === "active",
  );
}

export function getGrowthSources(
  data: AppData,
  stageId: string,
): GrowthSource[] {
  return data.growthSources.filter((g) => g.stageId === stageId);
}

export function getStageTeachers(
  data: AppData,
  stageId: string,
): GrowthSource[] {
  return getGrowthSources(data, stageId).filter(
    (g) => (g.role ?? "material") === "teacher",
  );
}

export function getStageMaterials(
  data: AppData,
  stageId: string,
): GrowthSource[] {
  return getGrowthSources(data, stageId).filter(
    (g) => (g.role ?? "material") === "material",
  );
}

/** Primary teacher for the stage (Lacuna-lane), if any. */
export function getPrimaryTeacher(
  data: AppData,
  stageId: string,
): GrowthSource | undefined {
  const teachers = getStageTeachers(data, stageId);
  return teachers.find((t) => t.primary) ?? teachers[0];
}

export function stageProgress(data: AppData, stageId: string): {
  done: number;
  total: number;
  ratio: number;
} {
  const list = getMilestones(data, stageId);
  const done = list.filter((m) => m.status === "done").length;
  const total = list.length;
  return {
    done,
    total,
    ratio: total === 0 ? 0 : done / total,
  };
}

export function getCheckInForPractice(
  data: AppData,
  practiceId: string,
  date: string,
) {
  return data.checkIns.find(
    (c) => c.practiceId === practiceId && c.date === date,
  );
}

/** Period key used when saving a check-in: day ISO or week Monday ISO. */
export function getPracticePeriodKey(
  practice: Practice,
  refDate = new Date(),
): string {
  return practice.frequency === "weekly"
    ? weekStartISO(refDate)
    : toISODate(refDate);
}

/**
 * Find check-in for the current day (daily) or current week (weekly).
 * Weekly also matches legacy mid-week dates in the same week.
 */
export function getCheckInForPracticePeriod(
  data: AppData,
  practice: Practice,
  refDate = new Date(),
): CheckIn | undefined {
  if (practice.frequency === "daily") {
    return getCheckInForPractice(data, practice.id, toISODate(refDate));
  }

  const start = weekStartISO(refDate);
  const end = weekEndISO(refDate);
  return (
    data.checkIns.find(
      (c) => c.practiceId === practice.id && c.date === start,
    ) ??
    data.checkIns.find(
      (c) =>
        c.practiceId === practice.id &&
        c.date >= start &&
        c.date <= end,
    )
  );
}

/** Live stats for the current week — shown on Review before/after save. */
export function getWeekReviewStats(
  data: AppData,
  dreamId: string,
  refDate = new Date(),
): WeekReviewStats {
  const weekStart = weekStartISO(refDate);
  const weekEnd = weekEndISO(refDate);
  const stageIds = new Set(
    getStagesForDream(data, dreamId).map((s) => s.id),
  );
  const practiceIds = new Set(
    data.practices
      .filter((p) => stageIds.has(p.stageId))
      .map((p) => p.id),
  );

  const weekCheckIns = data.checkIns.filter(
    (c) =>
      c.practiceId &&
      practiceIds.has(c.practiceId) &&
      c.date >= weekStart &&
      c.date <= weekEnd,
  );

  const dayBars: WeekDayBar[] = [];
  const start = parseISODate(weekStart);
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const date = toISODate(d);
    const dayIns = weekCheckIns.filter((c) => c.date === date);
    dayBars.push({
      date,
      shortLabel: d.toLocaleDateString("ru-RU", { weekday: "short" }),
      done: dayIns.filter((c) => isFullCredit(c.status)).length,
      partial: dayIns.filter((c) => c.status === "partial").length,
      skipped: dayIns.filter((c) => c.status === "skipped").length,
    });
  }

  const active = getActiveStage(data, dreamId);
  const weeklyPractices = active
    ? getPractices(data, active.id)
        .filter((p) => p.frequency === "weekly")
        .map((p) => {
          const checkIn = getCheckInForPracticePeriod(data, p, refDate);
          return {
            id: p.id,
            title: p.title,
            status: checkIn?.status ?? ("open" as const),
          };
        })
    : [];

  const milestonesDoneInWeek = data.milestones.filter((m) => {
    if (m.status !== "done" || !m.completedAt || !stageIds.has(m.stageId)) {
      return false;
    }
    const day = m.completedAt.slice(0, 10);
    return day >= weekStart && day <= weekEnd;
  }).length;

  const doneCheckIns = weekCheckIns.filter((c) => c.status === "done").length;
  const strongCheckIns = weekCheckIns.filter(
    (c) => c.status === "strong",
  ).length;
  const partialCheckIns = weekCheckIns.filter(
    (c) => c.status === "partial",
  ).length;
  const skippedCheckIns = weekCheckIns.filter(
    (c) => c.status === "skipped",
  ).length;
  const maxDayDone = Math.max(1, ...dayBars.map((d) => d.done + d.partial));

  return {
    weekStart,
    weekEnd,
    label: formatWeekLabel(weekStart),
    doneCheckIns,
    partialCheckIns,
    strongCheckIns,
    skippedCheckIns,
    daysWithDone: dayBars.filter((d) => d.done > 0).length,
    dayBars,
    maxDayDone,
    weeklyPractices,
    milestonesDoneInWeek,
  };
}
