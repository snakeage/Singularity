import { getStagesForDream } from "./selectors";
import type { AppData, Stage } from "./types";

/** First stage that is not completed (by order). */
export function getFrontierStage(
  data: AppData,
  dreamId: string,
): Stage | undefined {
  return getStagesForDream(data, dreamId).find((s) => s.status !== "completed");
}

/**
 * In strict ladder mode you may only activate the frontier stage
 * (no jumping ahead over unfinished steps).
 */
export function canActivateStage(
  data: AppData,
  dreamId: string,
  stageId: string,
): { ok: true } | { ok: false; reason: string } {
  if (!data.profile?.strictLadder) return { ok: true };

  const stages = getStagesForDream(data, dreamId);
  const target = stages.find((s) => s.id === stageId);
  if (!target) {
    return { ok: false, reason: "Этап не найден" };
  }
  if (target.status === "completed") {
    return {
      ok: false,
      reason: "В строгом режиме нельзя снова активировать пройденный этап",
    };
  }

  const blockers = stages.filter(
    (s) => s.order < target.order && s.status !== "completed",
  );
  if (blockers.length > 0) {
    return {
      ok: false,
      reason: `Сначала закрой этап «${blockers[0].title}»`,
    };
  }

  return { ok: true };
}
