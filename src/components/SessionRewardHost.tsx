"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  subscribeSessionReward,
  type SessionRewardEvent,
} from "@/lib/sessionReward";
import type { CheckInStatus } from "@/lib/types";
import { Button } from "./ui";

function prefersReducedMotion() {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function statusLine(status: CheckInStatus): string {
  if (status === "strong") return "Сильный заход";
  if (status === "done") return "Норма закрыта";
  return "Шаг записан";
}

function metaLine(event: SessionRewardEvent): string {
  const parts = [`«${event.practiceTitle}»`];
  if (event.minutesSpent != null && event.minutesSpent > 0) {
    if (event.minMinutes && event.minMinutes > 0) {
      parts.push(`${event.minutesSpent}/${event.minMinutes} мин`);
    } else {
      parts.push(`${event.minutesSpent} мин`);
    }
  }
  return parts.join(" · ");
}

export function SessionRewardHost() {
  const [mounted, setMounted] = useState(false);
  const [event, setEvent] = useState<SessionRewardEvent | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    return subscribeSessionReward((next) => {
      setEvent(next);
    });
  }, []);

  useEffect(() => {
    if (!event) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEvent(null);
    };
    window.addEventListener("keydown", onKey);
    const ms = prefersReducedMotion()
      ? 2800
      : event.leveledUp
        ? 5600
        : 4200;
    const timer = window.setTimeout(() => setEvent(null), ms);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(timer);
    };
  }, [event]);

  if (!mounted || !event) return null;

  const dialog = (
    <div
      className={`session-reward-backdrop${
        event.leveledUp ? " session-reward-backdrop--levelup" : ""
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-reward-title"
      onClick={() => setEvent(null)}
    >
      <div
        className={`session-reward${
          event.leveledUp ? " session-reward--levelup" : ""
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="session-reward__eyebrow">
          {event.leveledUp ? "Канал вырос" : "Разряд капсулы"}
        </p>
        <p id="session-reward-title" className="session-reward__xp">
          +{event.xpGained} XP
        </p>
        <p className="session-reward__status">{statusLine(event.status)}</p>
        <p className="session-reward__meta">{metaLine(event)}</p>
        {event.leveledUp ? (
          <div className="session-reward__level-block">
            <p className="session-reward__level">
              Уровень {event.levelAfter}
            </p>
            <p className="session-reward__title">{event.titleAfter}</p>
          </div>
        ) : null}
        <div className="session-reward__actions">
          <Button type="button" onClick={() => setEvent(null)}>
            Дальше
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}
