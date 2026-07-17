"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";
import {
  DEFAULT_PRESENTATION,
  DEFAULT_SKIN_ID,
  LOCALE_LABEL,
  getSkin,
  isSkinArchetypeId,
  portraitSrc,
  type Presentation,
  type SkinArchetypeId,
} from "@/lib/characterSkins";
import {
  completeOnboarding,
  isOnboardingDone,
} from "@/lib/onboarding";
import { getFocusDream } from "@/lib/selectors";
import { useApp } from "@/store/AppProvider";
import { GenderToggle, SkinPicker } from "./SkinPicker";
import { Button } from "./ui";

type Step = "skin" | "name" | "dream" | "done";

const STEP_ORDER: Step[] = ["skin", "name", "dream", "done"];

const STEP_META: Record<Step, { label: string; title: string }> = {
  skin: { label: "Портрет", title: "Кто ты на этом пути" },
  name: { label: "Имя", title: "Как тебя зовут" },
  dream: { label: "Мечта", title: "Куда идёшь" },
  done: { label: "Старт", title: "Готов к пути" },
};

type DreamChoice = "keep" | "create";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function Onboarding({ open, onClose }: Props) {
  const router = useRouter();
  const { createDream, updateProfile, data } = useApp();
  const [step, setStep] = useState<Step>("skin");
  const [presentation, setPresentation] = useState<Presentation>(
    DEFAULT_PRESENTATION,
  );
  const [skinId, setSkinId] = useState<SkinArchetypeId>(DEFAULT_SKIN_ID);
  const [name, setName] = useState("");
  const [dreamTitle, setDreamTitle] = useState("");
  const [dreamChoice, setDreamChoice] = useState<DreamChoice>("create");
  const [entered, setEntered] = useState(false);

  const focusDream = getFocusDream(data);
  const hasActiveDream = Boolean(focusDream);
  const skin = getSkin(skinId);
  const heroSrc = portraitSrc(skinId, presentation);

  useEffect(() => {
    if (!open) {
      setEntered(false);
      return;
    }
    setStep("skin");
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
    setDreamChoice(getFocusDream(data) ? "keep" : "create");
    const t = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(t);
  }, [
    open,
    data.profile?.presentation,
    data.profile?.skinId,
    data.profile?.name,
    focusDream?.id,
  ]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const stepIndex = STEP_ORDER.indexOf(step);
  const total = STEP_ORDER.length;
  const meta = STEP_META[step];

  function finish(goTo: "/" | "/dream") {
    updateProfile({
      presentation,
      skinId,
      name: name.trim(),
    });

    const title = dreamTitle.trim();
    const shouldCreate =
      title.length > 0 &&
      (!hasActiveDream || dreamChoice === "create");

    if (shouldCreate) {
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

  const willCreateDream =
    dreamTitle.trim().length > 0 &&
    (!hasActiveDream || dreamChoice === "create");

  const displayName = name.trim() || "Путник";

  return (
    <div
      className={`character-create fixed inset-0 z-[100] flex flex-col text-white ${
        entered ? "character-create--in" : ""
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      style={
        {
          "--create-accent": skin.accent,
          "--create-soft": skin.accentSoft,
        } as CSSProperties
      }
    >
      {/* Full-bleed atmosphere from selected skin */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <Image
          key={heroSrc}
          src={heroSrc}
          alt=""
          fill
          priority
          className="character-create__bg object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 character-create__veil" />
        <div className="absolute inset-0 character-create__grain" />
      </div>

      {/* Top bar */}
      <header className="relative z-10 flex shrink-0 items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <div>
          <p className="font-display text-xl tracking-tight sm:text-2xl">
            Singularity
          </p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/55">
            Создание персонажа
          </p>
        </div>
        <nav className="hidden items-center gap-1 sm:flex" aria-label="Шаги">
          {STEP_ORDER.map((s, i) => {
            const active = i === stepIndex;
            const done = i < stepIndex;
            return (
              <button
                key={s}
                type="button"
                onClick={() => {
                  if (i <= stepIndex) setStep(s);
                }}
                className={`rounded-full px-3 py-1.5 text-xs transition ${
                  active
                    ? "bg-white text-[var(--ink)]"
                    : done
                      ? "bg-white/15 text-white hover:bg-white/25"
                      : "text-white/40"
                }`}
                disabled={i > stepIndex}
              >
                {i + 1}. {STEP_META[s].label}
              </button>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={skipAll}
          className="text-xs text-white/50 transition hover:text-white/80"
        >
          Пропустить
        </button>
      </header>

      {/* Mobile step dots */}
      <div className="relative z-10 flex gap-1.5 px-5 sm:hidden" aria-hidden>
        {STEP_ORDER.map((s, i) => (
          <span
            key={s}
            className={`h-1 flex-1 rounded-full transition ${
              i <= stepIndex ? "bg-white" : "bg-white/20"
            }`}
          />
        ))}
      </div>

      {/* Stage */}
      <div
        className={`relative z-10 mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col md:gap-5 md:px-6 md:py-4 lg:gap-6 lg:px-8 lg:py-5 ${
          step === "skin"
            ? "overflow-hidden md:grid md:grid-cols-[minmax(240px,0.9fr)_minmax(280px,1.1fr)] md:items-stretch"
            : "gap-4 overflow-y-auto px-5 py-4 sm:px-8 md:grid md:grid-cols-[minmax(240px,1fr)_minmax(280px,1fr)] md:items-stretch md:overflow-hidden"
        }`}
      >
        {/* Hero preview — phone: tall stack; md+: side-by-side (covers half-laptop) */}
        <aside
          className={`character-create__hero relative flex flex-col justify-end overflow-hidden ${
            step === "skin"
              ? "character-create__hero--select shrink-0 rounded-none md:h-full md:min-h-0 md:max-h-none md:rounded-2xl lg:rounded-3xl"
              : "relative mx-0 h-[clamp(12rem,32svh,18rem)] shrink-0 rounded-3xl md:mx-0 md:h-full md:max-h-none md:min-h-0"
          }`}
        >
          <Image
            key={`${heroSrc}-hero`}
            src={heroSrc}
            alt=""
            fill
            priority
            className="object-cover object-[center_14%] transition duration-500"
            sizes="(max-width: 768px) 100vw, 45vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070f11] via-black/25 to-transparent" />
          <div className="relative z-10 space-y-1 px-5 pb-3 pt-10 sm:space-y-1.5 sm:px-7 sm:pb-5 sm:pt-14 lg:p-7">
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/60">
              {LOCALE_LABEL[skin.locale]} ·{" "}
              {presentation === "female" ? "Женский" : "Мужской"}
            </p>
            <h1 className="font-display text-2xl tracking-tight sm:text-3xl lg:text-5xl">
              {step === "skin" ? skin.title : displayName}
            </h1>
            <p className="character-create__hero-blurb max-w-md text-sm text-white/75">
              {step === "skin" ? skin.blurb : `${skin.title} · ${skin.blurb}`}
            </p>
          </div>
        </aside>

        {/* Controls dock — on mobile skin step sits under the hero like a game tray */}
        <section
          className={`character-create__panel flex min-h-0 flex-1 flex-col overflow-hidden border-white/10 shadow-2xl ${
            step === "skin"
              ? "rounded-t-3xl border-t md:rounded-2xl md:border lg:rounded-3xl"
              : "mx-0 rounded-3xl border md:mx-0"
          }`}
        >
          {step === "skin" ? (
            <div className="shrink-0 space-y-3 border-b border-white/10 bg-[#070f11]/95 px-4 pb-3 pt-4 sm:px-6">
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--create-soft)]">
                Шаг {stepIndex + 1} из {total} · {meta.label}
              </p>
              <h2
                id="onboarding-title"
                className="font-display text-xl tracking-tight sm:text-2xl lg:text-3xl"
              >
                Выбери облик
              </h2>
              <GenderToggle
                presentation={presentation}
                onPresentationChange={setPresentation}
                variant="create"
              />
            </div>
          ) : null}

          <div
            className={`flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-2 sm:px-6 ${
              step === "skin" ? "pt-3" : "pt-4 sm:pt-5"
            }`}
          >
            {step !== "skin" ? (
              <>
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--create-soft)]">
                  Шаг {stepIndex + 1} из {total} · {meta.label}
                </p>
                <h2
                  id="onboarding-title"
                  className="mt-1 font-display text-xl tracking-tight sm:text-2xl lg:text-3xl"
                >
                  {meta.title}
                </h2>
              </>
            ) : null}

            <div className={step === "skin" ? "flex-1" : "mt-3 flex-1"}>
              {step === "skin" ? (
                <div className="space-y-3">
                  <SkinPicker
                    presentation={presentation}
                    skinId={skinId}
                    onPresentationChange={setPresentation}
                    onSelect={setSkinId}
                    variant="create"
                    hideGender
                  />
                  <p className="text-xs leading-relaxed text-white/65 sm:text-sm">
                    {skin.story}
                  </p>
                </div>
              ) : null}

              {step === "name" ? (
                <div className="space-y-4">
                  <p className="text-sm text-white/70">
                    Имя увидишь в шапке, на карте и в сети. Без имени будет
                    «Путник».
                  </p>
                  <label className="block">
                    <span className="mb-1.5 block text-xs uppercase tracking-[0.12em] text-white/50">
                      Имя на пути
                    </span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Например: Алекс, Ника, Путник"
                      maxLength={40}
                      autoFocus
                      className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-lg text-white outline-none placeholder:text-white/35 focus:border-white/50"
                    />
                  </label>
                </div>
              ) : null}

              {step === "dream" ? (
                <div className="space-y-4">
                  <p className="text-sm leading-relaxed text-white/70">
                    Здесь только{" "}
                    <span className="text-white">заголовок</span> мечты. Зачем,
                    точка А и этапы — на экране «Мечта» после старта. Можно
                    пропустить.
                  </p>

                  {hasActiveDream && focusDream ? (
                    <div className="space-y-3 rounded-2xl border border-white/15 bg-white/5 p-4">
                      <p className="text-xs text-white/55">Уже активна:</p>
                      <p className="font-medium">«{focusDream.title}»</p>
                      <label className="flex items-start gap-2 text-sm">
                        <input
                          type="radio"
                          className="mt-1"
                          name="dream-choice"
                          checked={dreamChoice === "keep"}
                          onChange={() => setDreamChoice("keep")}
                        />
                        <span>
                          Оставить её
                          <span className="mt-0.5 block text-xs text-white/50">
                            Новую из поля ниже не создаём.
                          </span>
                        </span>
                      </label>
                      <label className="flex items-start gap-2 text-sm">
                        <input
                          type="radio"
                          className="mt-1"
                          name="dream-choice"
                          checked={dreamChoice === "create"}
                          onChange={() => setDreamChoice("create")}
                        />
                        <span>
                          Создать новую
                          <span className="mt-0.5 block text-xs text-white/50">
                            Станет активной; текущая — на паузу.
                          </span>
                        </span>
                      </label>
                    </div>
                  ) : (
                    <p className="text-xs text-white/55">
                      Фраза создаст новую мечту и сделает её активной.
                    </p>
                  )}

                  <label className="block">
                    <span className="mb-1.5 block text-xs uppercase tracking-[0.12em] text-white/50">
                      {hasActiveDream && dreamChoice === "keep"
                        ? "Новая мечта (не используется)"
                        : "Куда идёшь"}
                    </span>
                    <input
                      value={dreamTitle}
                      onChange={(e) => setDreamTitle(e.target.value)}
                      placeholder="Например: стать сильным разработчиком"
                      maxLength={120}
                      disabled={hasActiveDream && dreamChoice === "keep"}
                      autoFocus={!(hasActiveDream && dreamChoice === "keep")}
                      className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-lg text-white outline-none placeholder:text-white/35 focus:border-white/50 disabled:opacity-40"
                    />
                    <span className="mt-2 block text-xs text-white/45">
                      Детали допишешь на «Мечте».
                    </span>
                  </label>
                </div>
              ) : null}

              {step === "done" ? (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-white/15 bg-white/5 p-5">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-white/50">
                      Твой сейв
                    </p>
                    <p className="mt-2 font-display text-3xl">{displayName}</p>
                    <p className="mt-1 text-sm text-white/70">
                      {skin.title} · {LOCALE_LABEL[skin.locale]}
                    </p>
                    <p className="mt-3 text-sm text-white/65">
                      {willCreateDream
                        ? `Мечта «${dreamTitle.trim()}» — детали на экране «Мечта»`
                        : hasActiveDream && focusDream
                          ? `Активная мечта: «${focusDream.title}»`
                          : "Мечту можно задать на экране «Мечта»"}
                    </p>
                  </div>
                  <p className="text-sm text-white/60">
                    Дальше: на «Сегодня» отмечай практики дня, на «Сети» смотри
                    прогресс по ним. Мечту и этапы допишешь на «Мечте».
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="shrink-0 border-t border-white/10 bg-[#070f11]/90 px-4 py-3.5 sm:px-6 sm:py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {stepIndex > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep(STEP_ORDER[stepIndex - 1]!)}
                  className="!text-white/80 hover:!bg-white/10"
                >
                  Назад
                </Button>
              ) : (
                <span />
              )}
              <div className="flex flex-wrap gap-2">
                {step === "done" ? (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => finish("/")}
                      className="!text-white/80 hover:!bg-white/10"
                    >
                      На Сегодня
                    </Button>
                    <button
                      type="button"
                      onClick={() => finish("/dream")}
                      className="character-create__cta rounded-xl px-5 py-2.5 text-sm font-medium text-[var(--ink)]"
                    >
                      К мечте
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setStep(STEP_ORDER[stepIndex + 1]!)}
                    disabled={
                      step === "dream" &&
                      dreamChoice === "create" &&
                      hasActiveDream &&
                      !dreamTitle.trim()
                    }
                    className="character-create__cta rounded-xl px-5 py-2.5 text-sm font-medium text-[var(--ink)] disabled:opacity-40"
                  >
                    Дальше
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/** Shows character create once until dismissed. */
export function OnboardingHost() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(!isOnboardingDone());
  }, []);

  return <Onboarding open={open} onClose={() => setOpen(false)} />;
}
