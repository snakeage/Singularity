"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { weekStartISO } from "@/lib/dates";
import { XP_HINTS } from "@/lib/gamification";
import {
  LEARNING_WINDOW_HINT,
  LEARNING_WINDOW_LABEL,
  learningWindowTone,
  WEEK_LESSON_TOUCH_LABEL,
  weekLessonTouchTone,
} from "@/lib/learningWindows";
import { LEVEL_LABEL, levelTone } from "@/lib/practiceLevels";
import {
  getActiveStage,
  getFocusDream,
  getPrimaryTeacher,
  getWeekReviewStats,
} from "@/lib/selectors";
import type { LearningWindowStatus, WeekLessonTouch } from "@/lib/types";
import { useApp } from "@/store/AppProvider";
import {
  Badge,
  Button,
  EmptyState,
  Field,
  FieldHint,
  Hint,
  ProgressBar,
  Section,
  Textarea,
} from "./ui";

const WINDOW_OPTIONS: LearningWindowStatus[] = ["none", "missed", "used"];

export function ReviewView() {
  const { ready, data, saveReview } = useApp();
  const [worked, setWorked] = useState("");
  const [blocked, setBlocked] = useState("");
  const [nextChange, setNextChange] = useState("");
  const [learningWindows, setLearningWindows] = useState<
    LearningWindowStatus | ""
  >("");
  const [learningUsed, setLearningUsed] = useState("");
  const [weekLessonTouch, setWeekLessonTouch] = useState<WeekLessonTouch | "">(
    "",
  );
  const [hydrated, setHydrated] = useState(false);

  const dream = ready ? getFocusDream(data) : undefined;
  const weekStart = weekStartISO();
  const current = dream
    ? data.reviews.find(
        (r) => r.dreamId === dream.id && r.weekStart === weekStart,
      )
    : undefined;
  const stats = dream ? getWeekReviewStats(data, dream.id) : null;
  const activeStage = dream ? getActiveStage(data, dream.id) : undefined;
  const teacher = activeStage
    ? getPrimaryTeacher(data, activeStage.id)
    : undefined;
  const weekLesson = teacher?.weekLesson?.trim() || "";

  const lessonTouchOptions: WeekLessonTouch[] = weekLesson
    ? ["missed", "touched", "done"]
    : ["no_lesson"];

  useEffect(() => {
    if (!current || hydrated) return;
    setWorked(current.worked);
    setBlocked(current.blocked);
    setNextChange(current.nextChange);
    setLearningUsed(current.learningUsed ?? "");
    setLearningWindows(current.learningWindows ?? "");
    setWeekLessonTouch(
      current.weekLessonTouch ?? (weekLesson ? "" : "no_lesson"),
    );
    setHydrated(true);
  }, [current, hydrated, weekLesson]);

  useEffect(() => {
    if (hydrated) return;
    if (!weekLesson && !weekLessonTouch) {
      setWeekLessonTouch("no_lesson");
    }
  }, [weekLesson, weekLessonTouch, hydrated]);

  if (!ready) {
    return <p className="text-sm text-[var(--muted)]">Загрузка…</p>;
  }

  if (!dream) {
    return (
      <EmptyState
        title="Нечего обозревать"
        body="Сначала заведи мечту и пройди несколько дней пути."
        action={
          <Link href="/dream">
            <Button type="button">К мечте</Button>
          </Link>
        }
      />
    );
  }

  const history = data.reviews
    .filter((r) => r.dreamId === dream.id)
    .sort((a, b) => b.weekStart.localeCompare(a.weekStart));

  const dailyCoverage =
    stats && stats.dayBars.length > 0
      ? stats.daysWithDone / stats.dayBars.length
      : 0;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!learningWindows) {
      window.alert("Отметь окна обучения — это часть курса из канона.");
      return;
    }
    if (weekLesson && !weekLessonTouch) {
      window.alert("Как прошёл урок недели наставника?");
      return;
    }
    if (
      learningWindows === "used" &&
      !learningUsed.trim() &&
      !window.confirm(
        "Окна были и вложены, но без заметки. Сохранить без подробностей?",
      )
    ) {
      return;
    }
    const touch: WeekLessonTouch | undefined = weekLesson
      ? weekLessonTouch || undefined
      : weekLessonTouch || "no_lesson";
    saveReview({
      dreamId: dream!.id,
      worked,
      blocked,
      nextChange,
      learningUsed,
      learningWindows,
      weekLessonTouch: touch,
      weekLessonSnapshot: weekLesson || undefined,
    });
  }

  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--accent)]">
          Обзор
        </p>
        <h1 className="font-display text-3xl tracking-tight text-[var(--ink)]">
          Неделя {stats?.label ?? weekStart}
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Что сработало, что мешало, окна обучения. Мечта: {dream.title}
        </p>
      </div>

      {stats ? (
        <Section
          title="Картина недели"
          hint="Живые цифры по текущей неделе — до и после сохранения обзора."
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Норма"
              value={String(stats.doneCheckIns)}
              hint="план закрыт"
            />
            <StatCard
              label="Сильно"
              value={String(stats.strongCheckIns)}
              hint="овер плана"
            />
            <StatCard
              label="Частично"
              value={String(stats.partialCheckIns)}
              hint="движение без нормы"
            />
            <StatCard
              label="Пропуски"
              value={String(stats.skippedCheckIns)}
              hint="осознанно мимо"
            />
          </div>

          <div className="rounded-md border border-[var(--line)] bg-[var(--panel)] p-4">
            <div className="mb-2 flex items-end justify-between gap-2">
              <p className="text-sm font-medium text-[var(--ink)]">
                Дни с нормой или сильно
              </p>
              <span className="text-xs text-[var(--muted)]">
                {stats.daysWithDone}/7 · рубежи {stats.milestonesDoneInWeek}
              </span>
            </div>
            <ProgressBar ratio={dailyCoverage} />
            <div className="mt-4 flex h-28 items-end gap-1.5 sm:gap-2">
              {stats.dayBars.map((day) => {
                const total = day.done + day.partial;
                const height =
                  total === 0
                    ? 8
                    : Math.max(
                        16,
                        Math.round((total / stats.maxDayDone) * 100),
                      );
                return (
                  <div
                    key={day.date}
                    className="flex min-w-0 flex-1 flex-col items-center gap-1"
                    title={`${day.date}: норма/сильно ${day.done}, частично ${day.partial}, пропуск ${day.skipped}`}
                  >
                    <span className="text-[10px] text-[var(--faint)]">
                      {total || "·"}
                    </span>
                    <div
                      className={`w-full max-w-[2.25rem] rounded-sm ${
                        day.done > 0
                          ? "bg-[var(--level-done)]/85"
                          : day.partial > 0
                            ? "bg-[var(--level-partial)]/90"
                            : "bg-[var(--panel-2)]"
                      }`}
                      style={{ height }}
                    />
                    <span className="truncate text-[10px] uppercase text-[var(--muted)]">
                      {day.shortLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {stats.weeklyPractices.length > 0 ? (
            <div className="rounded-md border border-[var(--line)] bg-[var(--panel)] p-4">
              <p className="mb-2 text-sm font-medium text-[var(--ink)]">
                Еженедельные практики
              </p>
              <ul className="space-y-2">
                {stats.weeklyPractices.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-2 text-sm"
                  >
                    <span className="text-[var(--ink)]">{p.title}</span>
                    {p.status === "open" ? (
                      <Badge>ещё открыто</Badge>
                    ) : (
                      <Badge tone={levelTone(p.status)}>
                        {LEVEL_LABEL[p.status]}
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {current?.learningWindows ? (
            <div className="flex flex-wrap items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--panel)] px-4 py-3 text-sm">
              <span className="text-[var(--muted)]">Окна обучения:</span>
              <Badge tone={learningWindowTone(current.learningWindows)}>
                {LEARNING_WINDOW_LABEL[current.learningWindows]}
              </Badge>
              {current.weekLessonTouch ? (
                <Badge tone={weekLessonTouchTone(current.weekLessonTouch)}>
                  {WEEK_LESSON_TOUCH_LABEL[current.weekLessonTouch]}
                </Badge>
              ) : null}
            </div>
          ) : null}
        </Section>
      ) : null}

      <Hint title="Зачем обзор">
        <p>
          Раз в неделю сверяешь курс: двигался к мечте или отклонился? Были ли
          окна на обучение — и ушли ли они в урок недели? Сохранение даёт{" "}
          {XP_HINTS.review}.
        </p>
      </Hint>

      <Section
        title="Урок недели"
        hint="Контекст от наставника этапа — на что смотреть, когда появляется окно."
      >
        {teacher ? (
          <div className="rounded-md border border-[var(--metal)]/35 bg-[var(--wash-2)]/30 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-medium uppercase tracking-[0.1em] text-[var(--metal)]">
                Наставник
              </p>
              <Badge tone="metal">{teacher.title}</Badge>
            </div>
            {weekLesson ? (
              <p className="mt-2 text-sm text-[var(--ink)]">{weekLesson}</p>
            ) : (
              <p className="mt-2 text-sm text-[var(--muted)]">
                Урок недели ещё не задан. На Этапе разбей эпик наставника на
                узкий кусок — иначе окна легко уйдут «просто в учёбу».
              </p>
            )}
            <Link href="/stage" className="mt-2 inline-block">
              <Button type="button" variant="ghost">
                {weekLesson ? "Изменить урок" : "Задать урок недели"}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-[var(--metal)]/40 bg-[var(--wash-2)]/25 px-4 py-3">
            <p className="text-sm text-[var(--muted)]">
              Нет главного учителя на этапе — окна обучения сложнее нацелить.
            </p>
            <Link href="/stage" className="mt-2 inline-block">
              <Button type="button" variant="ghost">
                Назначить учителя
              </Button>
            </Link>
          </div>
        )}
      </Section>

      <Section title="Итоги недели">
        <form
          onSubmit={onSubmit}
          className="space-y-3 rounded-md border border-[var(--line)] bg-[var(--panel)] p-4"
        >
          <Field label="Что сработало">
            <Textarea
              value={worked}
              onChange={(e) => setWorked(e.target.value)}
              required
            />
          </Field>
          <Field label="Что мешало">
            <Textarea
              value={blocked}
              onChange={(e) => setBlocked(e.target.value)}
              required
            />
          </Field>

          <Field label="Окна обучения">
            <div className="flex flex-col gap-2 text-sm text-[var(--ink)]">
              {WINDOW_OPTIONS.map((option) => (
                <label
                  key={option}
                  className="flex cursor-pointer items-start gap-2"
                >
                  <input
                    type="radio"
                    name="learning-windows"
                    className="mt-1"
                    checked={learningWindows === option}
                    onChange={() => setLearningWindows(option)}
                    required
                  />
                  <span>
                    <span className="font-medium">
                      {LEARNING_WINDOW_LABEL[option]}
                    </span>
                    <span className="mt-0.5 block text-xs text-[var(--muted)]">
                      {LEARNING_WINDOW_HINT[option]}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </Field>

          {learningWindows === "used" || learningWindows === "missed" ? (
            <Field
              label={
                learningWindows === "used"
                  ? "Во что вложил окна"
                  : "Куда ушло время вместо учёбы"
              }
            >
              <Textarea
                value={learningUsed}
                onChange={(e) => setLearningUsed(e.target.value)}
                placeholder={
                  weekLesson
                    ? `Например: кусок урока «${weekLesson.slice(0, 80)}${
                        weekLesson.length > 80 ? "…" : ""
                      }»`
                    : "Книга, курс, ментор, ИИ под этап…"
                }
              />
              <FieldHint>
                Канон: появилось время → в учёбу под этап, не в пустое ожидание.
              </FieldHint>
            </Field>
          ) : null}

          {weekLesson ? (
            <Field label="Урок недели наставника">
              <div className="flex flex-col gap-2 text-sm text-[var(--ink)]">
                {lessonTouchOptions.map((option) => (
                  <label
                    key={option}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <input
                      type="radio"
                      name="week-lesson-touch"
                      checked={weekLessonTouch === option}
                      onChange={() => setWeekLessonTouch(option)}
                      required
                    />
                    {WEEK_LESSON_TOUCH_LABEL[option]}
                  </label>
                ))}
              </div>
            </Field>
          ) : (
            <FieldHint>
              Урок недели не задан — в обзоре зафиксируем «урока не было». Задай
              узкий кусок на Этапе, чтобы окна целились точнее.
            </FieldHint>
          )}

          <Field label="Что меняем на следующей неделе">
            <Textarea
              value={nextChange}
              onChange={(e) => setNextChange(e.target.value)}
              required
            />
          </Field>
          <Button type="submit">
            {current ? "Обновить обзор" : "Сохранить обзор"}
          </Button>
        </form>
      </Section>

      {history.length > 0 ? (
        <Section title="История">
          <ul className="space-y-3">
            {history.map((r) => (
              <li
                key={r.id}
                className="rounded-md border border-[var(--line)] bg-[var(--panel)] p-4 text-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-[var(--ink)]">
                    Неделя с {r.weekStart}
                  </p>
                  {r.statsSnapshot ? (
                    <span className="text-xs text-[var(--faint)]">
                      сделано {r.statsSnapshot.checkInsDone} · рубежи{" "}
                      {r.statsSnapshot.milestonesDone}
                    </span>
                  ) : null}
                  {r.learningWindows ? (
                    <Badge tone={learningWindowTone(r.learningWindows)}>
                      {LEARNING_WINDOW_LABEL[r.learningWindows]}
                    </Badge>
                  ) : null}
                  {r.weekLessonTouch ? (
                    <Badge tone={weekLessonTouchTone(r.weekLessonTouch)}>
                      {WEEK_LESSON_TOUCH_LABEL[r.weekLessonTouch]}
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-[var(--muted)]">
                  Сработало: {r.worked}
                </p>
                <p className="text-[var(--muted)]">Мешало: {r.blocked}</p>
                {r.weekLessonSnapshot ? (
                  <p className="text-[var(--muted)]">
                    Урок недели: {r.weekLessonSnapshot}
                  </p>
                ) : null}
                {r.learningUsed ? (
                  <p className="text-[var(--muted)]">
                    Окна: {r.learningUsed}
                  </p>
                ) : null}
                <p className="text-[var(--muted)]">Меняем: {r.nextChange}</p>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-md border border-[var(--line)] bg-[var(--panel)] px-3 py-3">
      <p className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl text-[var(--ink)]">{value}</p>
      <p className="text-xs text-[var(--faint)]">{hint}</p>
    </div>
  );
}
