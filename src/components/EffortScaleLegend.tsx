const SCALE = [
  { level: "open", label: "пусто" },
  { level: "partial", label: "меньше" },
  { level: "done", label: "норма" },
  { level: "strong", label: "сверх" },
  { level: "skipped", label: "пропуск" },
] as const;

/** Compact effort scale — one place for Today, not per practice card. */
export function EffortScaleLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <ul className="flex flex-wrap items-center gap-2">
        {SCALE.map((item) => (
          <li
            key={item.level}
            className="inline-flex items-center gap-1 text-[11px] text-[var(--muted)]"
          >
            <span
              className="history-cell history-cell--sm"
              data-level={item.level}
              aria-hidden
            />
            {item.label}
          </li>
        ))}
      </ul>
      <span className="text-[11px] text-[var(--faint)]">
        XP — норма и сверх
      </span>
    </div>
  );
}
