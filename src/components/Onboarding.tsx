"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  completeOnboarding,
  isOnboardingDone,
} from "@/lib/onboarding";
import { Button } from "./ui";

const steps = [
  {
    title: "Singularity — трекер цели",
    body: "Помогает разложить большую мечту на этапы и каждый день делать маленькие шаги, не теряя курс.",
  },
  {
    title: "1. Мечта и «где я сейчас»",
    body: "Опиши цель: что, зачем, какой результат. Затем честно зафиксируй старт — навыки, ресурсы и что мешает.",
  },
  {
    title: "2. Этапы пути",
    body: "Разбей мечту на 2–5 этапов. Работай только на одном активном — так цель не кажется бесконечной.",
  },
  {
    title: "3. Практики и рубежи",
    body: "Практика — ежедневное действие на «Сегодня». Рубеж — доказательство, что этап можно закрывать. Препятствия и планы на срыв — внизу экрана «Мечта».",
  },
] as const;

type Props = {
  open: boolean;
  onClose: () => void;
};

export function Onboarding({ open, onClose }: Props) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  if (!open) return null;

  const current = steps[step];
  const isLast = step === steps.length - 1;

  function finish() {
    completeOnboarding();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--ink)]/35 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="panel-frame w-full max-w-lg rounded-lg p-5 shadow-lg">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--accent)]">
          Как начать · шаг {step + 1} из {steps.length}
        </p>
        <h2
          id="onboarding-title"
          className="mt-2 font-display text-2xl tracking-tight text-[var(--ink)]"
        >
          {current.title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
          {current.body}
        </p>

        <div className="mt-4 flex gap-1.5" aria-hidden>
          {steps.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full ${
                i <= step ? "bg-[var(--accent)]" : "bg-[var(--panel-2)]"
              }`}
            />
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          <Button type="button" variant="ghost" onClick={finish}>
            Пропустить
          </Button>
          <div className="flex flex-wrap gap-2">
            {step > 0 ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep((s) => s - 1)}
              >
                Назад
              </Button>
            ) : null}
            {isLast ? (
              <>
                <Button type="button" variant="ghost" onClick={finish}>
                  Понятно
                </Button>
                <Link href="/dream" onClick={finish}>
                  <Button type="button">Создать мечту</Button>
                </Link>
              </>
            ) : (
              <Button type="button" onClick={() => setStep((s) => s + 1)}>
                Дальше
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Shows onboarding once until dismissed. */
export function OnboardingHost() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(!isOnboardingDone());
  }, []);

  return <Onboarding open={open} onClose={() => setOpen(false)} />;
}
