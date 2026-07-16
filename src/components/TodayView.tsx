"use client";

import Link from "next/link";
import { formatWeekLabel, weekStartISO } from "@/lib/dates";
import { XP_HINTS } from "@/lib/gamification";
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
import { PracticeTimer } from "./PracticeTimer";
import { ProgressHud } from "./ProgressHud";
import {
  Badge,
  Button,
  EmptyState,
  Hint,
  LadderChain,
  ProgressBar,
  Section,
} from "./ui";

/** Open practices first; done sinks so remaining work stays visible. */
function sortPracticesForToday(
  practices: Practice[],
  data: AppData,
): Practice[] {
  const rank = (p: Practice) => {
    const status = getCheckInForPracticePeriod(data, p)?.status;
    if (status === "done") return 2;
    if (status === "skipped") return 1;
    return 0;
  };
  return [...practices].sort((a, b) => rank(a) - rank(b));
}

function PracticeCard({
  practice,
  dreamTitle,
  stageTitle,
  checkIn,
  onDone,
  onSkip,
  onClear,
}: {
  practice: Practice;
  dreamTitle: string;
  stageTitle: string;
  checkIn?: CheckIn;
  onDone: () => void;
  onSkip: () => void;
  onClear: () => void;
}) {
  const isWeekly = practice.frequency === "weekly";

  return (
    <li className="practice-card rounded-md p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Badge tone="metal">Практика</Badge>
        <Badge>{isWeekly ? "на неделю" : "на сегодня"}</Badge>
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
          Минимум по времени: {practice.minMinutes} мин
        </p>
      ) : null}
      {practice.whyForStage ? (
        <p className="mt-1 text-xs text-[var(--muted)]">
          Зачем этапу: {practice.whyForStage}
        </p>
      ) : null}
      {isWeekly ? (
        <p className="mt-2 text-xs text-[var(--faint)]">
          Одна отметка на неделю ({formatWeekLabel(weekStartISO())}). Не нужно
          отмечать каждый день.
        </p>
      ) : null}

      {checkIn?.status !== "skipped" ? (
        <PracticeTimer practice={practice} checkIn={checkIn} />
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {checkIn?.status === "done" ? (
          <>
            <Button type="button" variant="primary" disabled>
              {isWeekly ? "Сделано на этой неделе ✓" : "Сделано ✓"}
              {checkIn.minutesSpent != null
                ? ` · ${checkIn.minutesSpent} мин`
                : ""}{" "}
              · {XP_HINTS.checkIn}
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
            <Button type="button" variant="ghost" onClick={onDone}>
              Всё же сделано · {XP_HINTS.checkIn}
            </Button>
            <Button type="button" variant="ghost" onClick={onClear}>
              Отменить
            </Button>
          </>
        ) : (
          <>
            <Button type="button" variant="ghost" onClick={onDone}>
              Сделано без таймера · {XP_HINTS.checkIn}
            </Button>
            <Button type="button" variant="ghost" onClick={onSkip}>
              Пропуск
            </Button>
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
      <PathMap compact />

      <Hint title="Три уровня — не путай">
        <p>
          <strong>Этап</strong> — большая ступень к мечте.{" "}
          <strong>Практика</strong> — действие внутри этапа (каждый день или раз
          в неделю). <strong>Рубеж</strong> — доказательство, что этап можно
          закрывать.
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
                На экране <strong>Этап</strong> добавь практики: ежедневные и
                при необходимости еженедельные.
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
            hint={`Ежедневные практики этапа «${stage.title}». Отметка даёт ${XP_HINTS.checkIn}.`}
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
                    onDone={() =>
                      setPracticePeriodCheckIn(
                        practice.id,
                        practice.frequency,
                        "done",
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
                    onDone={() =>
                      setPracticePeriodCheckIn(
                        practice.id,
                        practice.frequency,
                        "done",
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
