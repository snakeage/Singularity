export function todayISO(): string {
  const d = new Date();
  return toISODate(d);
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Monday of the week containing `date` (local). */
export function weekStartISO(date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toISODate(d);
}

/** Sunday of the week containing `date` (local). */
export function weekEndISO(date = new Date()): string {
  const start = weekStartISO(date);
  const d = parseISODate(start);
  d.setDate(d.getDate() + 6);
  return toISODate(d);
}

export function parseISODate(iso: string): Date {
  const [y, m, day] = iso.split("-").map(Number);
  return new Date(y, m - 1, day);
}

export function formatWeekLabel(weekStart: string): string {
  const start = parseISODate(weekStart);
  const end = parseISODate(weekEndISO(start));
  const fmt = (d: Date) =>
    d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  return `${fmt(start)} – ${fmt(end)}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}
