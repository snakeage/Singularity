import type { Profile } from "@/lib/types";

/** Which portrait catalog to show. */
export type Presentation = "male" | "female";

/** Archetype id — shared across genders; art differs by presentation. */
export type SkinArchetypeId =
  | "wanderer"
  | "apprentice"
  | "keeper"
  | "channeler";

export type CharacterSkin = {
  id: SkinArchetypeId;
  title: string;
  blurb: string;
  /** Accent for CSS portrait (no image required for N12a). */
  accent: string;
  accentSoft: string;
};

export const PRESENTATION_LABEL: Record<Presentation, string> = {
  male: "Мужской",
  female: "Женский",
};

/** Fixed catalog — all unlocked; skin ≠ class. */
export const CHARACTER_SKINS: CharacterSkin[] = [
  {
    id: "wanderer",
    title: "Путник",
    blurb: "Старт с нуля: честная точка А и первый шаг.",
    accent: "#2f6f7a",
    accentSoft: "#c5dde2",
  },
  {
    id: "apprentice",
    title: "Ученик",
    blurb: "Рядом с наставником: практики и урок недели.",
    accent: "#8a5a2b",
    accentSoft: "#edd9c0",
  },
  {
    id: "keeper",
    title: "Хранитель курса",
    blurb: "Держит нормы: серия и стабильный канал.",
    accent: "#3d5a4c",
    accentSoft: "#c9d9cf",
  },
  {
    id: "channeler",
    title: "Связной канала",
    blurb: "Глубокий канал: апгрейды баз и рубежи.",
    accent: "#4a5e8a",
    accentSoft: "#cfd6e8",
  },
];

export const DEFAULT_PRESENTATION: Presentation = "male";
export const DEFAULT_SKIN_ID: SkinArchetypeId = "wanderer";

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
