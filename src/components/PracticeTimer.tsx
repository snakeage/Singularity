"use client";

import { useEffect, useRef, useState } from "react";
import {
  getEffortBarState,
  proposeRecalibrate,
  proposeStepDown,
  proposeStepUp,
} from "@/lib/effortLadder";
import {
  LEVEL_LABEL,
  longRunThresholdMinutes,
  levelTone,
  strongThreshold,
} from "@/lib/practiceLevels";
import {
  CHECKPOINT_EVERY_MINUTES,
  OVERWORK_MIN_MULTIPLIER,
  momentBody,
  momentSpeaker,
  type MomentKind,
} from "@/lib/practiceMoments";
import { getPrimaryTeacher } from "@/lib/selectors";
import {
  elapsedToMinutes,
  formatElapsed,
  getTimerElapsedMs,
} from "@/lib/timer";
import type { CheckIn, Practice } from "@/lib/types";
import { useApp } from "@/store/AppProvider";
import { EffortProgressBar } from "./EffortProgressBar";
import {
  PracticeMomentDialog,
  type MomentChoice,
} from "./PracticeMomentDialog";
import { Badge, Button } from "./ui";

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
    markPracticeMoments,
    clearPracticeMoments,
    setPracticeMinMinutes,
    completePracticeWithTimer,
  } = useApp();

  const session = (data.practiceTimers ?? []).find(
    (t) => t.practiceId === practice.id,
  );
  const [now, setNow] = useState(() => Date.now());
  const [moment, setMoment] = useState<MomentKind | null>(null);
  const longRunAsked = useRef(false);
  const momentLock = useRef(false);

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
  const running = Boolean(session?.runningSince);
  const hasSession = Boolean(session);
  const closed = Boolean(checkIn);
  const bar = min && min > 0 ? getEffortBarState(minutes, min) : null;
  const teacher = getPrimaryTeacher(data, practice.stageId);
  const speaker = momentSpeaker(teacher);
  const stepUp = min && min > 0 ? proposeStepUp(min) : null;
  const recalibrate = min && min > 0 ? proposeRecalibrate(min) : null;
  const stepDown = min && min > 0 ? proposeStepDown(min) : null;

  useEffect(() => {
    if (!min || closed || !session || moment || momentLock.current) return;

    const shown = session.momentsShown ?? [];
    const strongAt = strongThreshold(min);
    const overworkAt = Math.ceil(min * OVERWORK_MIN_MULTIPLIER);
    const strongMs = strongAt * 60_000;
    const checkpointEveryMs = CHECKPOINT_EVERY_MINUTES * 60_000;
    let next: MomentKind | null = null;
    const mark: MomentKind[] = [];
    let checkpointElapsedMs: number | undefined;

    if (minutes >= strongAt && !shown.includes("strong")) {
      next = "strong";
      mark.push("strong");
      if (!shown.includes("norma")) mark.push("norma");
      checkpointElapsedMs = strongMs;
    } else if (minutes >= min && !shown.includes("norma")) {
      next = "norma";
      mark.push("norma");
    } else if (minutes >= overworkAt && !shown.includes("overwork")) {
      next = "overwork";
      mark.push("overwork");
    } else if (minutes >= strongAt) {
      const watermark = session.lastCheckpointElapsedMs ?? strongMs;
      if (elapsedMs >= watermark + checkpointEveryMs) {
        next = "checkpoint";
        checkpointElapsedMs = elapsedMs;
      }
    }

    if (!next) return;

    momentLock.current = true;
    if (session.runningSince) pausePracticeTimer(practice.id);
    markPracticeMoments(practice.id, mark, { checkpointElapsedMs });
    setMoment(next);
  }, [
    min,
    minutes,
    elapsedMs,
    closed,
    session,
    moment,
    practice.id,
    pausePracticeTimer,
    markPracticeMoments,
  ]);

  useEffect(() => {
    if (!moment) momentLock.current = false;
  }, [moment]);

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
    return completePracticeWithTimer(practice.id, practice.frequency);
  }

  function offerEaseAfterPartial() {
    if (!min || !stepDown) return;
    if (
      window.confirm(
        `Частично — до нормы не дотянул. Снизить планку с ${min} до ${stepDown} мин?`,
      )
    ) {
      setPracticeMinMinutes(practice.id, stepDown);
    }
  }

  function bumpAndContinue(next: number) {
    setPracticeMinMinutes(practice.id, next);
    clearPracticeMoments(practice.id);
    startPracticeTimer(practice.id);
  }

  function bumpAndClose(next: number) {
    // Close on the OLD minimum first, then raise for future sessions.
    finish();
    setPracticeMinMinutes(practice.id, next);
  }

  function onMomentChoose(id: string) {
    const kind = moment;
    setMoment(null);
    if (!kind) return;

    if (id === "fix") {
      const result = finish();
      if (result.status === "partial") offerEaseAfterPartial();
      return;
    }
    if (id === "continue") {
      startPracticeTimer(practice.id);
      return;
    }
    if (id === "rest") {
      pausePracticeTimer(practice.id);
      return;
    }
    if (id === "fix-time") {
      const raw = window.prompt(
        "Сколько минут реально было у практики?",
        String(minutes),
      );
      if (raw == null) {
        pausePracticeTimer(practice.id);
        return;
      }
      const n = Number.parseInt(raw, 10);
      if (!Number.isFinite(n) || n <= 0) {
        pausePracticeTimer(practice.id);
        return;
      }
      setPracticeTimerMinutes(practice.id, n);
      return;
    }
    if (id === "ease" && stepDown != null) {
      setPracticeMinMinutes(practice.id, stepDown);
      clearPracticeMoments(practice.id);
      pausePracticeTimer(practice.id);
      return;
    }
    if (id === "step-continue" && stepUp != null) {
      bumpAndContinue(stepUp);
      return;
    }
    if (id === "step-close" && stepUp != null) {
      bumpAndClose(stepUp);
      return;
    }
    if (id === "recal-continue" && recalibrate != null) {
      bumpAndContinue(recalibrate);
      return;
    }
    if (id === "recal-close" && recalibrate != null) {
      bumpAndClose(recalibrate);
    }
  }

  const momentChoices: MomentChoice[] =
    moment === "norma"
      ? [
          { id: "continue", label: "Продолжить", variant: "primary" },
          { id: "rest", label: "Пауза" },
          { id: "fix", label: "Закрыть практику · норма" },
          ...(stepDown != null
            ? [
                {
                  id: "ease",
                  label: `Облегчить норму до ${stepDown} мин`,
                } satisfies MomentChoice,
              ]
            : []),
        ]
      : moment === "strong"
        ? [
            { id: "continue", label: "Продолжить", variant: "primary" },
            { id: "rest", label: "Пауза" },
            ...(stepUp != null
              ? [
                  {
                    id: "step-continue",
                    label: `Поднять плавно до ${stepUp} мин и продолжить`,
                  } satisfies MomentChoice,
                  {
                    id: "step-close",
                    label: `Поднять плавно до ${stepUp} мин и закрыть`,
                  } satisfies MomentChoice,
                ]
              : []),
            ...(recalibrate != null && recalibrate !== stepUp
              ? [
                  {
                    id: "recal-continue",
                    label: `Подкалибровать до ${recalibrate} мин и продолжить`,
                  } satisfies MomentChoice,
                  {
                    id: "recal-close",
                    label: `Подкалибровать до ${recalibrate} мин и закрыть`,
                  } satisfies MomentChoice,
                ]
              : []),
            { id: "fix", label: "Закрыть практику · сильно" },
          ]
        : moment === "overwork"
          ? [
              { id: "continue", label: "Продолжить", variant: "primary" },
              { id: "rest", label: "Пауза" },
              { id: "fix-time", label: "Поправить время" },
              { id: "fix", label: "Закрыть практику" },
            ]
          : moment === "checkpoint"
            ? [
                { id: "continue", label: "Остаюсь на посту", variant: "primary" },
                { id: "rest", label: "Пауза" },
                { id: "fix", label: "Закрыть практику" },
              ]
            : [];

  return (
    <div className="mt-3 space-y-2 rounded-md border border-[var(--line)] bg-[var(--panel)] px-3 py-3">
      {moment && bar ? (
        <PracticeMomentDialog
          kind={moment}
          speaker={speaker}
          body={momentBody(moment, practice, minutes, speaker, teacher)}
          choices={momentChoices}
          onChoose={onMomentChoose}
        />
      ) : null}

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
                bar?.phase === "strong"
                  ? "strong"
                  : bar?.phase === "norma"
                    ? "accent"
                    : minutes > 0
                      ? "partial"
                      : "muted"
              }
            >
              {bar?.phase === "strong"
                ? `овер · ${minutes}/${min}`
                : bar?.phase === "norma"
                  ? `норма ✓ · ${minutes}/${min}`
                  : `план ${min} мин`}
            </Badge>
          ) : (
            <Badge>без минимума</Badge>
          )}
          {running ? <Badge tone="metal">идёт</Badge> : null}
          {hasSession && !running ? <Badge>пауза</Badge> : null}
        </div>
      </div>

      {bar ? (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-[var(--faint)]">
            <span>
              Норма {bar.minMinutes} · сильно ≥{bar.strongAt}
            </span>
            <span>
              {minutes}/{min} мин
              {bar.phase === "norma" || bar.phase === "strong"
                ? ` · +${Math.max(0, minutes - min!)}`
                : ""}
            </span>
          </div>
          <EffortProgressBar state={bar} />
          {bar.phase === "building" && stepDown != null ? (
            <button
              type="button"
              className="text-[10px] text-[var(--muted)] underline-offset-2 hover:text-[var(--ink)] hover:underline"
              onClick={() => {
                if (
                  window.confirm(
                    `Снизить норму с ${min} до ${stepDown} мин?`,
                  )
                ) {
                  setPracticeMinMinutes(practice.id, stepDown);
                  clearPracticeMoments(practice.id);
                }
              }}
            >
              Слишком жёстко? Облегчить до {stepDown} мин
            </button>
          ) : null}
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
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                const result = finish();
                if (result.status === "partial") offerEaseAfterPartial();
              }}
            >
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
                setMoment(null);
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
