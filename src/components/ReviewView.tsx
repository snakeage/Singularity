"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { weekStartISO } from "@/lib/dates";
import { XP_HINTS } from "@/lib/gamification";
import { LEVEL_LABEL, levelTone } from "@/lib/practiceLevels";
import { getFocusDream, getWeekReviewStats } from "@/lib/selectors";
import { useApp } from "@/store/AppProvider";
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Hint,
  ProgressBar,
  Section,
  Textarea,
} from "./ui";

export function ReviewView() {
  const { ready, data, saveReview } = useApp();
  const [worked, setWorked] = useState("");
  const [blocked, setBlocked] = useState("");
  const [nextChange, setNextChange] = useState("");
  const [learningUsed, setLearningUsed] = useState("");
  const [hydrated, setHydrated] = useState(false);

  const dream = ready ? getFocusDream(data) : undefined;
  const weekStart = weekStartISO();
  const current = dream
    ? data.reviews.find(
        (r) => r.dreamId === dream.id && r.weekStart === weekStart,
      )
    : undefined;
  const stats = dream ? getWeekReviewStats(data, dream.id) : null;

  useEffect(() => {
    if (!current || hydrated) return;
    setWorked(current.worked);
    setBlocked(current.blocked);
    setNextChange(current.nextChange);
    setLearningUsed(current.learningUsed ?? "");
    setHydrated(true);
  }, [current, hydrated]);

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
    saveReview({
      dreamId: dream!.id,
      worked,
      blocked,
      nextChange,
      learningUsed,
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
        </Section>
      ) : null}

      <Hint title="Зачем обзор">
        <p>
          Раз в неделю сверяешь курс: двигался к мечте или отклонился? Были ли
          окна на обучение? Сохранение даёт {XP_HINTS.review}.
        </p>
      </Hint>

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
          <Field label="Окна обучения — использованы?">
            <Textarea
              value={learningUsed}
              onChange={(e) => setLearningUsed(e.target.value)}
              placeholder="Было ли свободное время на учёбу под этап?"
            />
          </Field>
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
                </div>
                <p className="mt-1 text-[var(--muted)]">
                  Сработало: {r.worked}
                </p>
                <p className="text-[var(--muted)]">Мешало: {r.blocked}</p>
                {r.learningUsed ? (
                  <p className="text-[var(--muted)]">
                    Обучение: {r.learningUsed}
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
