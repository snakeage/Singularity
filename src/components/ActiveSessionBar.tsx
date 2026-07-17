"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  elapsedToMinutes,
  formatElapsed,
  getTimerElapsedMs,
} from "@/lib/timer";
import { useApp } from "@/store/AppProvider";

/** Global live session chip — timer keeps running across screens. */
export function ActiveSessionBar() {
  const pathname = usePathname();
  const { ready, data } = useApp();
  const [now, setNow] = useState(() => Date.now());

  const session = (data.practiceTimers ?? []).find((t) => t.runningSince);
  const practice = session
    ? data.practices.find((p) => p.id === session.practiceId)
    : undefined;

  useEffect(() => {
    if (!session?.runningSince) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [session?.runningSince]);

  if (!ready || !session || !practice) return null;
  if (pathname.startsWith("/drill")) return null;

  const elapsedMs = getTimerElapsedMs(session, now);
  const minutes = elapsedToMinutes(elapsedMs);

  return (
    <div className="active-session-bar relative z-20 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--accent)_12%,var(--panel))]">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2 px-4 py-2">
        <p className="min-w-0 text-sm text-[var(--ink)]">
          <span className="mr-2 inline-flex h-2 w-2 animate-pulse rounded-full bg-[var(--accent)]" />
          <span className="font-medium">Сессия:</span>{" "}
          <span className="truncate">{practice.title}</span>
          <span className="text-[var(--muted)]">
            {" "}
            · {formatElapsed(elapsedMs)}
            {practice.minMinutes ? ` / ${practice.minMinutes} мин` : ""}
            {minutes > 0 ? ` · ${minutes} мин` : ""}
          </span>
        </p>
        <Link
          href={`/drill?id=${practice.id}`}
          className="shrink-0 text-xs font-medium text-[var(--accent)] underline-offset-2 hover:underline"
        >
          В разучивание
        </Link>
      </div>
    </div>
  );
}
