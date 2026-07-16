import type { PracticeTimerSession } from "./types";

export function getTimerElapsedMs(
  session: PracticeTimerSession | undefined,
  now = Date.now(),
): number {
  if (!session) return 0;
  const running = session.runningSince
    ? Math.max(0, now - new Date(session.runningSince).getTime())
    : 0;
  return session.accumulatedMs + running;
}

export function elapsedToMinutes(elapsedMs: number): number {
  return Math.max(0, Math.round(elapsedMs / 60_000));
}

export function formatElapsed(elapsedMs: number): string {
  const totalSec = Math.floor(elapsedMs / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function parseMinMinutes(raw: string): number | undefined {
  const n = Number.parseInt(raw.trim(), 10);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.min(n, 24 * 60);
}
