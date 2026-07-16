import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

export function Section({
  title,
  children,
  hint,
}: {
  title: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-display text-xl tracking-tight text-[var(--ink)]">
          {title}
        </h2>
        {hint ? (
          <div className="mt-1 text-sm text-[var(--muted)]">{hint}</div>
        ) : null}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-md border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-sm text-[var(--ink)] outline-none transition placeholder:text-[var(--faint)] focus:border-[var(--accent)]";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`${inputClass} min-h-[88px] resize-y ${props.className ?? ""}`}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`${inputClass} ${props.className ?? ""}`}
    />
  );
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
}) {
  const styles =
    variant === "primary"
      ? "bg-[var(--accent)] text-[var(--accent-ink)] hover:brightness-105"
      : variant === "danger"
        ? "bg-transparent text-red-700 border border-red-300 hover:bg-red-50"
        : "bg-transparent text-[var(--ink)] border border-[var(--line)] hover:bg-[var(--panel-2)]";
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-md px-3.5 py-2 text-sm font-medium transition disabled:opacity-40 ${styles} ${className}`}
    />
  );
}

export function LadderChain({
  dream,
  stage,
  practice,
}: {
  dream?: string;
  stage?: string;
  practice?: string;
}) {
  const parts: { label: string; value: string }[] = [];
  if (dream) parts.push({ label: "Мечта", value: dream });
  if (stage) parts.push({ label: "Этап", value: stage });
  if (practice) parts.push({ label: "Практика", value: practice });
  if (parts.length === 0) return null;
  return (
    <div className="space-y-2 text-sm">
      {parts.map((part, i) => (
        <div key={`${part.label}-${i}`}>
          {i > 0 ? (
            <p className="mb-1 text-[var(--faint)]" aria-hidden>
              →
            </p>
          ) : null}
          <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--faint)]">
            {part.label}
          </p>
          <p
            className={
              i === parts.length - 1
                ? "mt-0.5 font-medium text-[var(--ink)]"
                : "mt-0.5 text-[var(--muted)]"
            }
          >
            {part.value}
          </p>
        </div>
      ))}
    </div>
  );
}

export function Badge({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "accent" | "metal";
}) {
  const styles =
    tone === "accent"
      ? "bg-[var(--wash)] text-[var(--accent)] ring-1 ring-[var(--accent)]/30"
      : tone === "metal"
        ? "bg-[var(--metal)]/15 text-[var(--metal)] ring-1 ring-[var(--metal)]/35"
        : "bg-[var(--panel-2)]/70 text-[var(--muted)]";
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${styles}`}
    >
      {children}
    </span>
  );
}

export function ProgressBar({ ratio }: { ratio: number }) {
  const pct = Math.round(Math.min(1, Math.max(0, ratio)) * 100);
  return (
    <div className="h-2 overflow-hidden rounded-full bg-[var(--panel-2)]">
      <div
        className="h-full rounded-full bg-[var(--accent)] transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-[var(--line)] bg-[var(--panel)]/60 px-5 py-8 text-center">
      <h2 className="font-display text-2xl text-[var(--ink)]">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

/** Contextual tip — explains what to write, not just another empty field. */
export function Hint({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <aside className="rounded-md border border-[var(--accent)]/25 bg-[var(--wash)] px-3.5 py-3 text-sm text-[var(--ink)]">
      {title ? (
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--accent)]">
          {title}
        </p>
      ) : null}
      <div className="space-y-1.5 text-[var(--muted)] [&_strong]:text-[var(--ink)]">
        {children}
      </div>
    </aside>
  );
}

export function FieldHint({ children }: { children: ReactNode }) {
  return <p className="text-xs text-[var(--faint)]">{children}</p>;
}

/** Inline save confirmation — use with role="status" for screen readers. */
export function SaveNotice({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p
      role="status"
      aria-live="polite"
      className="rounded-md border border-[var(--accent)]/35 bg-[var(--wash)] px-3 py-2 text-sm font-medium text-[var(--accent)]"
    >
      {message}
    </p>
  );
}
