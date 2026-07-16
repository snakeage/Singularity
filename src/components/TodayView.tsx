"use client";

import Link from "next/link";
import { todayISO } from "@/lib/dates";
import { XP_HINTS } from "@/lib/gamification";
import {
  getActiveStage,
  getCheckInForPractice,
  getFocusDream,
  getPractices,
  stageProgress,
} from "@/lib/selectors";
import { useApp } from "@/store/AppProvider";
import { PathMap } from "./PathMap";
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

export function TodayView() {
  const { ready, data, setCheckIn } = useApp();
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
  const progress = stage ? stageProgress(data, stage.id) : null;
  const date = todayISO();

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
          <strong>Практика</strong> — ежедневное маленькое действие{" "}
          <em>внутри</em> этапа. <strong>Рубеж</strong> — доказательство, что
          этап можно закрывать.
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
      ) : (
        <Section
          title="Практики на сегодня"
          hint={`Ежедневные действия этапа «${stage.title}». Отметка даёт ${XP_HINTS.checkIn}.`}
        >
          {practices.length === 0 ? (
            <div className="space-y-3">
              <Hint title="С чего начать">
                <p>
                  На экране <strong>Этап</strong> добавь 1–3 практики: маленькие
                  действия под текущую ступень.
                </p>
                <p>
                  Пример: этап «База фронтенда» → практика «45 мин кода после
                  ужина».
                </p>
              </Hint>
              <Link href="/stage">
                <Button type="button">Добавить практики</Button>
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {practices.map((practice) => {
                const checkIn = getCheckInForPractice(
                  data,
                  practice.id,
                  date,
                );
                return (
                  <li key={practice.id} className="practice-card rounded-md p-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge tone="metal">Практика</Badge>
                      <span className="text-xs text-[var(--faint)]">
                        внутри этапа «{stage.title}»
                      </span>
                    </div>
                    <LadderChain
                      dream={dream.title}
                      stage={stage.title}
                      practice={practice.title}
                    />
                    {practice.cue ? (
                      <p className="text-xs text-[var(--muted)]">
                        Когда/где: {practice.cue}
                      </p>
                    ) : null}
                    {practice.whyForStage ? (
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        Зачем этапу: {practice.whyForStage}
                      </p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant={
                          checkIn?.status === "done" ? "primary" : "ghost"
                        }
                        onClick={() =>
                          setCheckIn(practice.id, date, "done")
                        }
                      >
                        Сделано · {XP_HINTS.checkIn}
                      </Button>
                      <Button
                        type="button"
                        variant={
                          checkIn?.status === "skipped" ? "primary" : "ghost"
                        }
                        onClick={() =>
                          setCheckIn(practice.id, date, "skipped")
                        }
                      >
                        Пропуск
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>
      )}
    </div>
  );
}
