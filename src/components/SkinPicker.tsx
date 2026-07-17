"use client";

import {
  CHARACTER_SKINS,
  PRESENTATION_LABEL,
  type Presentation,
  type SkinArchetypeId,
} from "@/lib/characterSkins";
import { PortraitAvatar } from "./PortraitAvatar";

type Props = {
  presentation: Presentation;
  skinId: SkinArchetypeId;
  onSelect: (skinId: SkinArchetypeId) => void;
};

export function SkinPicker({ presentation, skinId, onSelect }: Props) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {CHARACTER_SKINS.map((skin) => {
        const selected = skin.id === skinId;
        return (
          <li key={skin.id}>
            <button
              type="button"
              onClick={() => onSelect(skin.id)}
              className={`flex w-full items-start gap-3 rounded-md border p-3 text-left transition ${
                selected
                  ? "border-[var(--accent)] bg-[var(--wash)]"
                  : "border-[var(--line)] bg-[var(--panel)] hover:border-[var(--metal)]"
              }`}
              aria-pressed={selected}
            >
              <PortraitAvatar
                presentation={presentation}
                skinId={skin.id}
                size="md"
              />
              <span className="min-w-0">
                <span className="block font-medium text-[var(--ink)]">
                  {skin.title}
                </span>
                <span className="mt-0.5 block text-[10px] uppercase tracking-[0.08em] text-[var(--faint)]">
                  {PRESENTATION_LABEL[presentation]}
                </span>
                <span className="mt-1 block text-xs text-[var(--muted)]">
                  {skin.blurb}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
