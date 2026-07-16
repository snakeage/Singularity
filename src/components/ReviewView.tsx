"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { weekStartISO } from "@/lib/dates";
import { getFocusDream } from "@/lib/selectors";
import { useApp } from "@/store/AppProvider";
import { XP_HINTS } from "@/lib/gamification";
import { Button, EmptyState, Field, Hint, Section, Textarea } from "./ui";

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
          Неделя с {weekStart}
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Что сработало, что мешало, окна обучения. Мечта: {dream.title}
        </p>
      </div>

      {current?.statsSnapshot ? (
        <p className="text-sm text-[var(--muted)]">
          За неделю: отметок «сделано» — {current.statsSnapshot.checkInsDone},
          закрытых рубежей — {current.statsSnapshot.milestonesDone}
        </p>
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
                <p className="font-medium text-[var(--ink)]">
                  Неделя с {r.weekStart}
                </p>
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
