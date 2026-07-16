"use client";

import { useEffect, useState } from "react";
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
  onMarkedDone,
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
    completePracticeWithTimer,
  } = useApp();

  const session = (data.practiceTimers ?? []).find(
    (t) => t.practiceId === practice.id,
  );
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!session?.runningSince) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [session?.runningSince]);

  const elapsedMs = getTimerElapsedMs(session, now);
  const minutes = elapsedToMinutes(elapsedMs);
  const min = practice.minMinutes;
  const ratio = min && min > 0 ? Math.min(1, minutes / min) : 0;
  const running = Boolean(session?.runningSince);
  const hasSession = Boolean(session);
  const done = checkIn?.status === "done";

  if (done) {
    if (checkIn.minutesSpent == null && !min) return null;
    return (
      <div className="mt-3 rounded-md border border-[var(--line)] bg-[var(--panel-2)]/40 px-3 py-2 text-xs text-[var(--muted)]">
        {checkIn.minutesSpent != null ? (
          <span>
            Потрачено:{" "}
            <strong className="text-[var(--ink)]">
              {checkIn.minutesSpent} мин
            </strong>
            {min ? ` · минимум был ${min} мин` : null}
          </span>
        ) : (
          <span>Минимум был {min} мин (без таймера)</span>
        )}
      </div>
    );
  }

  function finish() {
    if (min && minutes < min) {
      const ok = window.confirm(
        `Минимум ${min} мин, набрано ${minutes} мин. Всё равно отметить как сделано?`,
      );
      if (!ok) return;
    }
    completePracticeWithTimer(practice.id, practice.frequency);
    onMarkedDone?.();
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
            <Badge tone={minutes >= min ? "accent" : "muted"}>
              мин. {min} мин
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
            <span>К минимуму</span>
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
            variant="primary"
            onClick={() => startPracticeTimer(practice.id)}
          >
            {hasSession ? "Продолжить" : "Старт"}
          </Button>
        )}
        {hasSession || minutes > 0 ? (
          <>
            <Button type="button" onClick={finish}>
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
              }}
            >
              Сброс
            </Button>
          </>
        ) : null}
      </div>
      <p className="text-[10px] text-[var(--faint)]">
        Можно ставить на паузу и вернуться позже — время сохранится. Кулдаун
        «когда/где» — напоминание, таймер — сколько реально вложился.
      </p>
    </div>
  );
}
