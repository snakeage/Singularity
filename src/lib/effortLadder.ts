import { strongThreshold } from "@/lib/practiceLevels";

/** Standard focus blocks — progressive overload ladder. */
export const EFFORT_MINUTE_LADDER = [
  15, 20, 25, 30, 40, 45, 50, 60, 75, 90,
] as const;

/** +1 step on the ladder (25→30). Default progressive overload. */
export function proposeStepUp(currentMin: number): number | null {
  for (const step of EFFORT_MINUTE_LADDER) {
    if (step > currentMin) return step;
  }
  const bumped = currentMin + 5;
  return bumped > currentMin ? bumped : null;
}

/**
 * Recalibrate when the minimum was sandbagged: snap near today's strong
 * proof (25 → ~38 → 40 on the ladder).
 */
export function proposeRecalibrate(currentMin: number): number | null {
  const floor = strongThreshold(currentMin);
  for (const step of EFFORT_MINUTE_LADDER) {
    if (step >= floor && step > currentMin) return step;
  }
  const bumped = Math.max(currentMin + 5, floor);
  return bumped > currentMin ? bumped : null;
}

/** −1 step when the norma is overhard (25→20). */
export function proposeStepDown(currentMin: number): number | null {
  for (let i = EFFORT_MINUTE_LADDER.length - 1; i >= 0; i -= 1) {
    const step = EFFORT_MINUTE_LADDER[i];
    if (step < currentMin) return step;
  }
  if (currentMin > 5) return Math.max(5, currentMin - 5);
  return null;
}

export type EffortBarState = {
  /** 0–1 fill of the norma segment. */
  normaRatio: number;
  /** 0–1 fill of the overtime segment toward strong. */
  overRatio: number;
  phase: "empty" | "building" | "norma" | "strong";
  minutes: number;
  minMinutes: number;
  strongAt: number;
};

export function getEffortBarState(
  minutes: number,
  minMinutes: number,
): EffortBarState {
  const strongAt = strongThreshold(minMinutes);
  const normaRatio = Math.min(1, minutes / minMinutes);
  const overSpan = Math.max(1, strongAt - minMinutes);
  const overRatio =
    minutes <= minMinutes
      ? 0
      : Math.min(1, (minutes - minMinutes) / overSpan);

  let phase: EffortBarState["phase"] = "empty";
  if (minutes >= strongAt) phase = "strong";
  else if (minutes >= minMinutes) phase = "norma";
  else if (minutes > 0) phase = "building";

  return { normaRatio, overRatio, phase, minutes, minMinutes, strongAt };
}
