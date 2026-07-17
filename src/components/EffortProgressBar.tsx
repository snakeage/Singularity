"use client";

import type { EffortBarState } from "@/lib/effortLadder";

export function EffortProgressBar({ state }: { state: EffortBarState }) {
  const normaPct = Math.round(state.normaRatio * 100);
  const overPct = Math.round(state.overRatio * 100);
  const normaFlex = state.minMinutes;
  const overFlex = Math.max(1, state.strongAt - state.minMinutes);

  return (
    <div
      className="effort-bar"
      data-phase={state.phase}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={state.strongAt}
      aria-valuenow={state.minutes}
      aria-label={`Прогресс: ${state.minutes} из ${state.minMinutes} мин, сильно от ${state.strongAt}`}
    >
      <div className="effort-bar__track">
        <div
          className="effort-bar__zone effort-bar__zone--norma"
          style={{ flexGrow: normaFlex, flexBasis: 0 }}
        >
          <div
            className="effort-bar__fill effort-bar__fill--norma"
            style={{ width: `${normaPct}%` }}
          />
        </div>
        <div
          className="effort-bar__zone effort-bar__zone--over"
          style={{ flexGrow: overFlex, flexBasis: 0 }}
        >
          <div
            className="effort-bar__fill effort-bar__fill--over"
            style={{ width: `${overPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
