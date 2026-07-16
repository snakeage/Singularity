"use client";

import { useEffect, useRef, useState } from "react";
import {
  LEVEL_LABEL,
  longRunThresholdMinutes,
  levelTone,
} from "@/lib/practiceLevels";
import {
  elapsedToMinutes,
  formatElapsed,
  getTimerElapsedMs,
} from "@/lib/timer";
import type { CheckIn, Practice } from "@/lib/types";
import { useApp } from "@/store/AppProvider";
import { Badge, Button, ProgressBar } from "./ui";

export function PracticeTimer({
  practice,
  checkIn,
}: {
  practice: Practice;
  checkIn?: CheckIn;
  onMarkedDone?: () => void;
}) {
  const {
    data,
    startPracticeTimer,
    pausePracticeTimer,
    resetPracticeTimer,
    setPracticeTimerMinutes,
    completePracticeWithTimer,
  } = useApp();

  const session = (data.practiceTimers ?? []).find(
    (t) => t.practiceId === practice.id,
  );
  const [now, setNow] = useState(() => Date.now());
  const longRunAsked = useRef(false);

  useEffect(() => {
    if (!session?.runningSince) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [session?.runningSince]);

  useEffect(() => {
    if (!session || checkIn || longRunAsked.current) return;
    const elapsed = getTimerElapsedMs(session);
    const thresholdMs = longRunThresholdMinutes(practice) * 60_000;
    if (elapsed < thresholdMs) return;

    longRunAsked.current = true;
    if (session.runningSince) pausePracticeTimer(practice.id);
    const mins = elapsedToMinutes(elapsed);
    const keepAll = window.confirm(
      `Таймер насчитал ${mins} мин. Если ты был не у практики всё это время — лучше поправить.\n\nЗасчитать все ${mins} мин?`,
    );
    if (keepAll) return;

    const raw = window.prompt(
      "Сколько минут реально было?",
      String(Math.min(mins, practice.minMinutes ?? 25)),
    );
    if (raw == null) {
      resetPracticeTimer(practice.id);
      return;
    }
    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n) || n <= 0) {
      resetPracticeTimer(practice.id);
      return;
    }
    setPracticeTimerMinutes(practice.id, n);
  }, [
    session,
    checkIn,
    practice,
    pausePracticeTimer,
    resetPracticeTimer,
    setPracticeTimerMinutes,
  ]);

  const elapsedMs = getTimerElapsedMs(session, now);
  const minutes = elapsedToMinutes(elapsedMs);
  const min = practice.minMinutes;
  const ratio = min && min > 0 ? Math.min(1, minutes / min) : 0;
  const running = Boolean(session?.runningSince);
  const hasSession = Boolean(session);
  const closed = Boolean(checkIn);

  if (closed && checkIn) {
    return (
      <div className="mt-3 rounded-md border border-[var(--line)] bg-[var(--panel-2)]/40 px-3 py-2 text-xs text-[var(--muted)]">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={levelTone(checkIn.status)}>
            {LEVEL_LABEL[checkIn.status]}
          </Badge>
          {checkIn.minutesSpent != null ? (
            <span>
              {checkIn.minutesSpent} мин
              {min ? ` · план ${min}` : ""}
            </span>
          ) : min ? (
            <span>план был {min} мин</span>
          ) : null}
        </div>
      </div>
    );
  }

  function finish() {
    completePracticeWithTimer(practice.id, practice.frequency);
  }

  return (
    <div className="mt-3 space-y-2 rounded-md border border-[var(--line)] bg-[var(--panel)] px-3 py-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
            Таймер
          </p>
          <p className="font-display text-2xl tracking-tight text-[var(--ink)] tabular-nums">
            {formatElapsed(elapsedMs)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {min ? (
            <Badge
              tone={
                minutes >= Math.ceil(min * 1.5)
                  ? "strong"
                  : minutes >= min
                    ? "accent"
                    : minutes > 0
                      ? "partial"
                      : "muted"
              }
            >
              план {min} мин
            </Badge>
          ) : (
            <Badge>без минимума</Badge>
          )}
          {running ? <Badge tone="metal">идёт</Badge> : null}
          {hasSession && !running ? <Badge>пауза</Badge> : null}
        </div>
      </div>

      {min ? (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-[var(--faint)]">
            <span>К норме / сильно (≥{Math.ceil(min * 1.5)})</span>
            <span>
              {minutes}/{min} мин
            </span>
          </div>
          <ProgressBar ratio={ratio} />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {running ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => pausePracticeTimer(practice.id)}
          >
            Пауза
          </Button>
        ) : (
          <Button
            type="button"
            variant={hasSession || minutes > 0 ? "ghost" : "primary"}
            onClick={() => startPracticeTimer(practice.id)}
          >
            {hasSession ? "Продолжить" : "Старт"}
          </Button>
        )}
        {hasSession || minutes > 0 ? (
          <>
            <Button type="button" variant="primary" onClick={finish}>
              Готово · {minutes} мин
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                if (
                  elapsedMs > 0 &&
                  !window.confirm("Сбросить накопленное время?")
                ) {
                  return;
                }
                resetPracticeTimer(practice.id);
                longRunAsked.current = false;
              }}
            >
              Сброс
            </Button>
          </>
        ) : null}
      </div>
      <p className="text-[10px] text-[var(--faint)]">
        Можно уходить в другие вкладки. Если меньше плана — засчитается как
        «частично», не как норма.
      </p>
    </div>
  );
}
