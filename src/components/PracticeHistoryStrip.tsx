"use client";

import { getPracticeHistory, LEVEL_LABEL } from "@/lib/practiceLevels";
import type { Practice } from "@/lib/types";
import { useApp } from "@/store/AppProvider";

const SCALE = [
  { level: "open", label: "пусто" },
  { level: "partial", label: "меньше" },
  { level: "done", label: "норма" },
  { level: "strong", label: "сверх" },
] as const;

export function PracticeHistoryStrip({ practice }: { practice: Practice }) {
  const { data } = useApp();
  const cells = getPracticeHistory(data, practice, 7);

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--faint)]">
          {practice.frequency === "weekly" ? "7 недель" : "7 дней"}
        </p>
        <p className="text-[10px] text-[var(--faint)]">
          наведи на клетку — минуты и статус
        </p>
      </div>

      <div className="flex items-end gap-1.5">
        {cells.map((cell) => (
          <div
            key={cell.key}
            className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
            title={
              cell.status
                ? `${cell.label}: ${LEVEL_LABEL[cell.status]}${
                    cell.minutesSpent != null
                      ? ` · ${cell.minutesSpent} мин`
                      : ""
                  }`
                : `${cell.label}: пусто`
            }
          >
            <span
              className="history-cell"
              data-level={cell.status ?? "open"}
            />
            <span className="truncate text-[9px] uppercase text-[var(--faint)]">
              {cell.label}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[10px] text-[var(--muted)]">
        <span className="text-[var(--faint)]">слабее</span>
        <ul className="flex items-center gap-1">
          {SCALE.map((item) => (
            <li key={item.level} className="inline-flex items-center gap-1">
              <span
                className="history-cell history-cell--sm"
                data-level={item.level}
                title={item.label}
              />
            </li>
          ))}
        </ul>
        <span className="text-[var(--faint)]">сильнее</span>
        <span className="text-[var(--faint)]">·</span>
        <span>янтарь = меньше плана · бирюза = норма · тёмный = сверх</span>
      </div>
    </div>
  );
}
