"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  DEFAULT_PRESENTATION,
  DEFAULT_SKIN_ID,
  PRESENTATION_LABEL,
  isSkinArchetypeId,
  type Presentation,
  type SkinArchetypeId,
} from "@/lib/characterSkins";
import {
  completeOnboarding,
  isOnboardingDone,
} from "@/lib/onboarding";
import { useApp } from "@/store/AppProvider";
import { PortraitAvatar } from "./PortraitAvatar";
import { SkinPicker } from "./SkinPicker";
import { Button, Field, FieldHint, Input } from "./ui";

type Step = "presentation" | "skin" | "name" | "dream" | "done";

const STEP_ORDER: Step[] = [
  "presentation",
  "skin",
  "name",
  "dream",
  "done",
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export function Onboarding({ open, onClose }: Props) {
  const router = useRouter();
  const { createDream, updateProfile, data } = useApp();
  const [step, setStep] = useState<Step>("presentation");
  const [presentation, setPresentation] = useState<Presentation>(
    DEFAULT_PRESENTATION,
  );
  const [skinId, setSkinId] = useState<SkinArchetypeId>(DEFAULT_SKIN_ID);
  const [name, setName] = useState("");
  const [dreamTitle, setDreamTitle] = useState("");

  useEffect(() => {
    if (!open) return;
    setStep("presentation");
    setPresentation(
      data.profile?.presentation === "female"
        ? "female"
        : DEFAULT_PRESENTATION,
    );
    setSkinId(
      isSkinArchetypeId(data.profile?.skinId)
        ? data.profile.skinId
        : DEFAULT_SKIN_ID,
    );
    setName(data.profile?.name ?? "");
    setDreamTitle("");
  }, [
    open,
    data.profile?.presentation,
    data.profile?.skinId,
    data.profile?.name,
  ]);

  if (!open) return null;

  const stepIndex = STEP_ORDER.indexOf(step);
  const total = STEP_ORDER.length;

  function finish(goTo: "/" | "/dream") {
    updateProfile({
      presentation,
      skinId,
      name: name.trim(),
    });
    const title = dreamTitle.trim();
    if (title) {
      createDream({
        title,
        why: "",
        outcomeVision: "",
        horizon: "",
      });
    }
    completeOnboarding();
    onClose();
    router.push(goTo);
  }

  function skipAll() {
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
          Создание персонажа · шаг {stepIndex + 1} из {total}
        </p>

        {step === "presentation" ? (
          <>
            <h2
              id="onboarding-title"
              className="mt-2 font-display text-2xl tracking-tight text-[var(--ink)]"
            >
              Кто ты на этом пути?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              Выбери представление — откроется свой каталог портретов. Скин не
              даёт бонусов, только внешний вид.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {(["male", "female"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPresentation(p)}
                  className={`rounded-md border p-4 text-center transition ${
                    presentation === p
                      ? "border-[var(--accent)] bg-[var(--wash)]"
                      : "border-[var(--line)] bg-[var(--panel)]"
                  }`}
                  aria-pressed={presentation === p}
                >
                  <PortraitAvatar
                    presentation={p}
                    skinId={skinId}
                    size="md"
                    className="mx-auto"
                  />
                  <span className="mt-2 block font-medium text-[var(--ink)]">
                    {PRESENTATION_LABEL[p]}
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : null}

        {step === "skin" ? (
          <>
            <h2
              id="onboarding-title"
              className="mt-2 font-display text-2xl tracking-tight text-[var(--ink)]"
            >
              Портрет · {PRESENTATION_LABEL[presentation]}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              Архетип пути — дух роли, не герой из книги. Все варианты открыты
              сразу.
            </p>
            <div className="mt-4 max-h-[50vh] overflow-y-auto">
              <SkinPicker
                presentation={presentation}
                skinId={skinId}
                onSelect={setSkinId}
              />
            </div>
          </>
        ) : null}

        {step === "name" ? (
          <>
            <h2
              id="onboarding-title"
              className="mt-2 font-display text-2xl tracking-tight text-[var(--ink)]"
            >
              Как тебя зовут?
            </h2>
            <div className="mt-4 flex items-center gap-3">
              <PortraitAvatar
                presentation={presentation}
                skinId={skinId}
                size="lg"
              />
              <Field label="Имя на пути">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Например: Алекс, Ника, Путник"
                  maxLength={40}
                  autoFocus
                />
                <FieldHint>Без имени в интерфейсе будет «Путник».</FieldHint>
              </Field>
            </div>
          </>
        ) : null}

        {step === "dream" ? (
          <>
            <h2
              id="onboarding-title"
              className="mt-2 font-display text-2xl tracking-tight text-[var(--ink)]"
            >
              Мечта одной фразой
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              Можно пропустить и описать позже на экране «Мечта».
            </p>
            <div className="mt-4">
              <Field label="Куда идёшь">
                <Input
                  value={dreamTitle}
                  onChange={(e) => setDreamTitle(e.target.value)}
                  placeholder="Например: стать сильным разработчиком"
                  maxLength={120}
                  autoFocus
                />
              </Field>
            </div>
          </>
        ) : null}

        {step === "done" ? (
          <>
            <h2
              id="onboarding-title"
              className="mt-2 font-display text-2xl tracking-tight text-[var(--ink)]"
            >
              Готово к пути
            </h2>
            <div className="mt-4 flex items-center gap-3 rounded-md border border-[var(--line)] bg-[var(--panel)] p-3">
              <PortraitAvatar
                presentation={presentation}
                skinId={skinId}
                size="lg"
              />
              <div>
                <p className="font-display text-xl text-[var(--ink)]">
                  {name.trim() || "Путник"}
                </p>
                <p className="text-sm text-[var(--muted)]">
                  {dreamTitle.trim()
                    ? `Мечта: ${dreamTitle.trim()}`
                    : "Мечту можно задать на экране «Мечта»"}
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm text-[var(--muted)]">
              Капсула — на «Сегодня». Сеть этапа — узлы практик. Курс не
              отклоняется.
            </p>
          </>
        ) : null}

        <div className="mt-4 flex gap-1.5" aria-hidden>
          {STEP_ORDER.map((s, i) => (
            <span
              key={s}
              className={`h-1.5 flex-1 rounded-full ${
                i <= stepIndex ? "bg-[var(--accent)]" : "bg-[var(--panel-2)]"
              }`}
            />
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          <Button type="button" variant="ghost" onClick={skipAll}>
            Пропустить
          </Button>
          <div className="flex flex-wrap gap-2">
            {stepIndex > 0 ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep(STEP_ORDER[stepIndex - 1]!)}
              >
                Назад
              </Button>
            ) : null}
            {step === "done" ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => finish("/")}
                >
                  На Сегодня
                </Button>
                <Button type="button" onClick={() => finish("/dream")}>
                  К мечте
                </Button>
              </>
            ) : (
              <Button
                type="button"
                onClick={() => setStep(STEP_ORDER[stepIndex + 1]!)}
              >
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
