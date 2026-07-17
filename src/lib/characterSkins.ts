import type { Profile } from "@/lib/types";

/** Which portrait catalog to show. */
export type Presentation = "male" | "female";

/** Archetype id — shared across genders; art differs by presentation. */
export type SkinArchetypeId =
  | "wanderer"
  | "apprentice"
  | "keeper"
  | "channeler";

/** Soft scene behind the card (art-direction locales, CSS only until N12c). */
export type SkinLocale =
  | "planet"
  | "mentor"
  | "deck"
  | "network";

export type CharacterSkin = {
  id: SkinArchetypeId;
  title: string;
  /** One-line role for the picker. */
  blurb: string;
  /** Short story: who you are on this path. */
  story: string;
  locale: SkinLocale;
  /** Accent for portrait + card. */
  accent: string;
  accentSoft: string;
};

export const PRESENTATION_LABEL: Record<Presentation, string> = {
  male: "Мужской",
  female: "Женский",
};

export const LOCALE_LABEL: Record<SkinLocale, string> = {
  planet: "Чужая планета",
  mentor: "Пост наставника",
  deck: "Палуба судна",
  network: "Узел сети",
};

/** Fixed catalog — all unlocked; skin ≠ class. */
export const CHARACTER_SKINS: CharacterSkin[] = [
  {
    id: "wanderer",
    title: "Путник",
    blurb: "Только вышел на тропу.",
    story:
      "Ты ещё без канала и громких титулов. Честно смотришь на точку А и делаешь первый шаг — без прикрас и без прыжка через ступень.",
    locale: "planet",
    accent: "#2f6f7a",
    accentSoft: "#d8ebea",
  },
  {
    id: "apprentice",
    title: "Ученик",
    blurb: "Идёшь рядом с наставником.",
    story:
      "Рядом голос учителя: урок недели, практики, разбор ошибок. Ты не герой сети — ты тот, кто повторяет, пока база не встанет.",
    locale: "mentor",
    accent: "#9a6b3a",
    accentSoft: "#f3e6d4",
  },
  {
    id: "keeper",
    title: "Хранитель курса",
    blurb: "Держишь нормы день за днём.",
    story:
      "Курс важнее вспышек. Серия норм, отказ от боковых квестов, рабочий канал. Красота — в том, что ты не сбился.",
    locale: "deck",
    accent: "#3f6a55",
    accentSoft: "#d8e8df",
  },
  {
    id: "channeler",
    title: "Связной канала",
    blurb: "Усиливаешь базы и рубежи.",
    story:
      "Канал уже не «терминал»: ты апгрейдишь планку, закрываешь рубежи, смотришь на сеть этапа как на карту компетенций — без лута и без фарм-классов.",
    locale: "network",
    accent: "#4a5f8f",
    accentSoft: "#dde3f2",
  },
];

export const DEFAULT_PRESENTATION: Presentation = "male";
export const DEFAULT_SKIN_ID: SkinArchetypeId = "wanderer";

/** Real portrait art under /public/portraits/{id}-{presentation}.jpg */
export function portraitSrc(
  skinId: SkinArchetypeId,
  presentation: Presentation,
): string {
  return `/portraits/${skinId}-${presentation}.jpg`;
}

export function isPresentation(value: unknown): value is Presentation {
  return value === "male" || value === "female";
}

export function isSkinArchetypeId(value: unknown): value is SkinArchetypeId {
  return CHARACTER_SKINS.some((s) => s.id === value);
}

export function getSkin(skinId: string | undefined): CharacterSkin {
  return (
    CHARACTER_SKINS.find((s) => s.id === skinId) ??
    CHARACTER_SKINS.find((s) => s.id === DEFAULT_SKIN_ID)!
  );
}

export function resolvePresentation(
  profile: Profile | undefined,
): Presentation | null {
  return isPresentation(profile?.presentation) ? profile.presentation : null;
}

export function resolveSkinId(profile: Profile | undefined): SkinArchetypeId {
  return isSkinArchetypeId(profile?.skinId)
    ? profile.skinId
    : DEFAULT_SKIN_ID;
}

export function hasCharacterPortrait(profile: Profile | undefined): boolean {
  return (
    isPresentation(profile?.presentation) &&
    isSkinArchetypeId(profile?.skinId)
  );
}

export function normalizePortraitFields(profile: {
  presentation?: unknown;
  skinId?: unknown;
}): Pick<Profile, "presentation" | "skinId"> {
  return {
    presentation: isPresentation(profile.presentation)
      ? profile.presentation
      : undefined,
    skinId: isSkinArchetypeId(profile.skinId) ? profile.skinId : undefined,
  };
}
