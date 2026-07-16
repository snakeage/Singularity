"use client";

import { useState } from "react";
import { getPracticeHistory, LEVEL_LABEL } from "@/lib/practiceLevels";
import type { CheckInStatus, Practice } from "@/lib/types";
import { useApp } from "@/store/AppProvider";

type HistoryCell = ReturnType<typeof getPracticeHistory>[number];

function statusLine(cell: HistoryCell, mode: "idle" | "peek"): string {
  const when =
    mode === "idle" && cell.isCurrent
      ? cell.label.length <= 3
        ? "сегодня"
        : "эта неделя"
      : cell.titleDate;
  if (!cell.status) return `${when} · пусто`;
  const minutes =
    cell.minutesSpent != null ? ` · ${cell.minutesSpent} мин` : "";
  return `${when} · ${LEVEL_LABEL[cell.status]}${minutes}`;
}

function levelForDot(status: CheckInStatus | null): string {
  return status ?? "open";
}

export function PracticeHistoryStrip({ practice }: { practice: Practice }) {
  const { data } = useApp();
  const cells = getPracticeHistory(data, practice, 7);
  const [peekKey, setPeekKey] = useState<string | null>(null);

  const span =
    practice.frequency === "weekly" ? "7 недель" : "7 дней";
  const current = cells.find((c) => c.isCurrent) ?? cells[cells.length - 1];
  const peeked = peekKey
    ? cells.find((c) => c.key === peekKey) ?? null
    : null;
  const shown = peeked ?? current;
  const mode = peeked ? "peek" : "idle";

  return (
    <div className="mt-3 space-y-2">
      <div className="flex min-h-[1.25rem] items-center justify-between gap-3">
        <p className="shrink-0 text-[10px] uppercase tracking-[0.08em] text-[var(--faint)]">
          {span}
        </p>
        {shown ? (
          <p
            className="history-readout flex min-w-0 items-center justify-end gap-1.5 text-[11px] text-[var(--muted)]"
            data-active={peeked ? "true" : undefined}
            aria-live="polite"
          >
            <span
              className="history-cell history-cell--sm shrink-0"
              data-level={levelForDot(shown.status)}
              aria-hidden
            />
            <span className="truncate font-medium text-[var(--ink)]">
              {statusLine(shown, mode)}
            </span>
          </p>
        ) : null}
      </div>

      <div className="history-strip-track flex items-end gap-1.5">
        {cells.map((cell) => (
          <button
            key={cell.key}
            type="button"
            className="history-cell-wrap flex min-w-0 flex-1 flex-col items-center gap-1.5 border-0 bg-transparent p-0"
            data-current={cell.isCurrent ? "true" : undefined}
            data-peek={peekKey === cell.key ? "true" : undefined}
            aria-label={statusLine(cell, "peek")}
            onMouseEnter={() => setPeekKey(cell.key)}
            onMouseLeave={() => setPeekKey(null)}
            onFocus={() => setPeekKey(cell.key)}
            onBlur={() => setPeekKey(null)}
          >
            <span
              className="history-cell"
              data-level={cell.status ?? "open"}
              data-current={cell.isCurrent ? "true" : undefined}
            />
            <span
              className={`truncate text-[10px] tracking-[0.02em] ${
                cell.isCurrent || peekKey === cell.key
                  ? "font-semibold text-[var(--ink)]"
                  : "text-[var(--faint)]"
              }`}
            >
              {cell.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
