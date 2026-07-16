"use client";

import Link from "next/link";
import {
  COURSE_CHECK_LABEL,
  courseCheckTone,
} from "@/lib/courseCheck";
import { formatWeekLabel, weekStartISO } from "@/lib/dates";
import { XP_HINTS } from "@/lib/gamification";
import {
  isFullCredit,
  LEVEL_LABEL,
  levelTone,
} from "@/lib/practiceLevels";
import {
  getActiveStage,
  getCheckInForPracticePeriod,
  getFocusDream,
  getPractices,
  stageProgress,
} from "@/lib/selectors";
import type { AppData, CheckIn, Practice } from "@/lib/types";
import { useApp } from "@/store/AppProvider";
import { PathMap } from "./PathMap";
import { PracticeHistoryStrip } from "./PracticeHistoryStrip";
import { PracticeTimer } from "./PracticeTimer";
import { ProgressHud } from "./ProgressHud";
import { TeacherLane } from "./TeacherLane";
import {
  Badge,
  Button,
  EmptyState,
  Hint,
  LadderChain,
  ProgressBar,
  Section,
} from "./ui";

/** Open first; partial next; skipped; full credit sinks. */
function sortPracticesForToday(
  practices: Practice[],
  data: AppData,
): Practice[] {
  const rank = (p: Practice) => {
    const status = getCheckInForPracticePeriod(data, p)?.status;
    if (!status) return 0;
    if (status === "partial") return 1;
    if (status === "skipped") return 2;
    if (status === "done") return 3;
    return 4; // strong
  };
  return [...practices].sort((a, b) => rank(a) - rank(b));
}

function confirmClaimWithoutTimer(practice: Practice, claim: () => void) {
  if (practice.minMinutes) {
    const ok = window.confirm(
      `У практики минимум ${practice.minMinutes} мин. Без таймера это будет «частично», не норма. Продолжить?`,
    );
    if (!ok) return;
  }
  claim();
}

function PracticeCard({
  practice,
  dreamTitle,
  stageTitle,
  checkIn,
  onClaimWithoutTimer,
  onSkip,
  onClear,
}: {
  practice: Practice;
  dreamTitle: string;
  stageTitle: string;
  checkIn?: CheckIn;
  onClaimWithoutTimer: () => void;
  onSkip: () => void;
  onClear: () => void;
}) {
  const isWeekly = practice.frequency === "weekly";
  const level = checkIn?.status ?? "open";

  return (
    <li className="practice-card rounded-md p-4" data-level={level}>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Badge tone="metal">Практика</Badge>
        <Badge>{isWeekly ? "на неделю" : "на сегодня"}</Badge>
        {practice.courseCheck && practice.courseCheck !== "on_course" ? (
          <Badge tone={courseCheckTone(practice.courseCheck)}>
            {COURSE_CHECK_LABEL[practice.courseCheck]}
          </Badge>
        ) : null}
        {checkIn ? (
          <Badge tone={levelTone(checkIn.status)}>
            {LEVEL_LABEL[checkIn.status]}
          </Badge>
        ) : null}
        <span className="text-xs text-[var(--faint)]">
          внутри этапа «{stageTitle}»
        </span>
      </div>
      <LadderChain
        dream={dreamTitle}
        stage={stageTitle}
        practice={practice.title}
      />
      {practice.cue ? (
        <p className="mt-2 text-xs text-[var(--muted)]">
          Когда/где: {practice.cue}
        </p>
      ) : null}
      {practice.minMinutes ? (
        <p className="mt-1 text-xs text-[var(--muted)]">
          Минимум по времени: {practice.minMinutes} мин · сильно от{" "}
          {Math.ceil(practice.minMinutes * 1.5)} мин
        </p>
      ) : null}
      {practice.whyForStage ? (
        <p className="mt-1 text-xs text-[var(--muted)]">
          Зачем этапу: {practice.whyForStage}
        </p>
      ) : null}
      {isWeekly ? (
        <p className="mt-2 text-xs text-[var(--faint)]">
          Одна отметка на неделю ({formatWeekLabel(weekStartISO())}).
        </p>
      ) : null}

      <PracticeHistoryStrip practice={practice} />

      {checkIn?.status !== "skipped" ? (
        <PracticeTimer practice={practice} checkIn={checkIn} />
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {checkIn && isFullCredit(checkIn.status) ? (
          <>
            <Button type="button" variant="primary" disabled>
              {LEVEL_LABEL[checkIn.status]}
              {checkIn.minutesSpent != null
                ? ` · ${checkIn.minutesSpent} мин`
                : ""}{" "}
              · {XP_HINTS.checkIn}
            </Button>
            <Button type="button" variant="ghost" onClick={onClear}>
              Отменить
            </Button>
          </>
        ) : checkIn?.status === "partial" ? (
          <>
            <Button type="button" variant="primary" disabled>
              Частично
              {checkIn.minutesSpent != null
                ? ` · ${checkIn.minutesSpent} мин`
                : ""}
            </Button>
            <Button type="button" variant="ghost" onClick={onClear}>
              Отменить
            </Button>
          </>
        ) : checkIn?.status === "skipped" ? (
          <>
            <Button type="button" variant="primary" disabled>
              {isWeekly ? "Пропущено на этой неделе" : "Пропущено"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                confirmClaimWithoutTimer(practice, onClaimWithoutTimer)
              }
            >
              Всё же отметить
            </Button>
            <Button type="button" variant="ghost" onClick={onClear}>
              Отменить
            </Button>
          </>
        ) : (
          <>
            <Button type="button" variant="ghost" onClick={onSkip}>
              Пропуск
            </Button>
            <button
              type="button"
              className="text-xs text-[var(--faint)] underline-offset-2 hover:text-[var(--muted)] hover:underline"
              onClick={() =>
                confirmClaimWithoutTimer(practice, onClaimWithoutTimer)
              }
            >
              Без таймера
              {practice.minMinutes ? " → частично" : ` · ${XP_HINTS.checkIn}`}
            </button>
          </>
        )}
      </div>
    </li>
  );
}

export function TodayView() {
  const {
    ready,
    data,
    claimPracticeWithoutTimer,
    setPracticePeriodCheckIn,
    clearPracticePeriodCheckIn,
  } = useApp();
  if (!ready) {
    return <p className="text-sm text-[var(--muted)]">Загрузка…</p>;
  }

  const dream = getFocusDream(data);
  if (!dream) {
    return (
      <EmptyState
        title="Пока нет мечты"
        body="Опиши мечту, где ты сейчас, и этапы пути. Дальше каждый день будет вести к ней маленькими шагами."
        action={
          <Link href="/dream">
            <Button type="button">Создать мечту</Button>
          </Link>
        }
      />
    );
  }

  const stage = getActiveStage(data, dream.id);
  const practices = stage ? getPractices(data, stage.id) : [];
  const daily = sortPracticesForToday(
    practices.filter((p) => p.frequency === "daily"),
    data,
  );
  const weekly = sortPracticesForToday(
    practices.filter((p) => p.frequency === "weekly"),
    data,
  );
  const progress = stage ? stageProgress(data, stage.id) : null;
  const weekLabel = formatWeekLabel(weekStartISO());

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--accent)]">
          Сегодня
        </p>
        <h1 className="font-display text-3xl tracking-tight text-[var(--ink)]">
          {dream.title}
        </h1>
        <LadderChain
          dream={dream.title}
          stage={stage?.title ?? "этап не выбран"}
        />
        {stage && progress ? (
          <div className="space-y-1 pt-2">
            <div className="flex justify-between text-xs text-[var(--muted)]">
              <span>Рубежи этапа (доказательства роста)</span>
              <span>
                {progress.done}/{progress.total || "добавь на Этапе"}
              </span>
            </div>
            <ProgressBar ratio={progress.ratio} />
          </div>
        ) : null}
      </div>

      <ProgressHud />
      {stage ? <TeacherLane stageId={stage.id} /> : null}
      <PathMap compact />

      <Hint title="Честная шкала">
        <p>
          <strong>Частично</strong> — были минуты, но меньше плана.{" "}
          <strong>Норма</strong> — план закрыт. <strong>Сильно</strong> — от
          1.5× минимума. XP только за норму и сильно.
        </p>
      </Hint>

      {!stage ? (
        <EmptyState
          title="Нет активного этапа"
          body="Разложи мечту на ступени и выбери, над каким этапом работаешь сейчас."
          action={
            <Link href="/dream">
              <Button type="button">К мечте и этапам</Button>
            </Link>
          }
        />
      ) : practices.length === 0 ? (
        <Section title="Практики" hint={`Этап «${stage.title}».`}>
          <div className="space-y-3">
            <Hint title="С чего начать">
              <p>
                На экране <strong>Этап</strong> добавь практики и минимум минут —
                дальше таймер на Сегодня.
              </p>
            </Hint>
            <Link href="/stage">
              <Button type="button">Добавить практики</Button>
            </Link>
          </div>
        </Section>
      ) : (
        <>
          <Section
            title="На сегодня"
            hint={`Ежедневные практики этапа «${stage.title}». Норма/сильно даёт ${XP_HINTS.checkIn}.`}
          >
            {daily.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                Ежедневных практик нет. Их можно добавить на экране этапа.
              </p>
            ) : (
              <ul className="space-y-3">
                {daily.map((practice) => (
                  <PracticeCard
                    key={practice.id}
                    practice={practice}
                    dreamTitle={dream.title}
                    stageTitle={stage.title}
                    checkIn={getCheckInForPracticePeriod(data, practice)}
                    onClaimWithoutTimer={() =>
                      claimPracticeWithoutTimer(
                        practice.id,
                        practice.frequency,
                      )
                    }
                    onSkip={() =>
                      setPracticePeriodCheckIn(
                        practice.id,
                        practice.frequency,
                        "skipped",
                      )
                    }
                    onClear={() =>
                      clearPracticePeriodCheckIn(
                        practice.id,
                        practice.frequency,
                      )
                    }
                  />
                ))}
              </ul>
            )}
          </Section>

          {weekly.length > 0 ? (
            <Section
              title="На эту неделю"
              hint={`${weekLabel}. Одна отметка на практику за всю неделю.`}
            >
              <ul className="space-y-3">
                {weekly.map((practice) => (
                  <PracticeCard
                    key={practice.id}
                    practice={practice}
                    dreamTitle={dream.title}
                    stageTitle={stage.title}
                    checkIn={getCheckInForPracticePeriod(data, practice)}
                    onClaimWithoutTimer={() =>
                      claimPracticeWithoutTimer(
                        practice.id,
                        practice.frequency,
                      )
                    }
                    onSkip={() =>
                      setPracticePeriodCheckIn(
                        practice.id,
                        practice.frequency,
                        "skipped",
                      )
                    }
                    onClear={() =>
                      clearPracticePeriodCheckIn(
                        practice.id,
                        practice.frequency,
                      )
                    }
                  />
                ))}
              </ul>
            </Section>
          ) : null}
        </>
      )}
    </div>
  );
}
