import { toISODate, weekEndISO, weekStartISO } from "./dates";
import type { AppData, CheckIn, Dream, Milestone, Practice, Stage } from "./types";

export function getFocusDream(data: AppData): Dream | undefined {
  return (
    data.dreams.find((d) => d.status === "active") ??
    data.dreams.find((d) => d.status === "draft") ??
    data.dreams[0]
  );
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
