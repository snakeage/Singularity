"use client";

import Image from "next/image";
import {
  CHARACTER_SKINS,
  LOCALE_LABEL,
  PRESENTATION_LABEL,
  portraitSrc,
  type Presentation,
  type SkinArchetypeId,
} from "@/lib/characterSkins";

type Props = {
  presentation: Presentation;
  skinId: SkinArchetypeId;
  onPresentationChange: (presentation: Presentation) => void;
  onSelect: (skinId: SkinArchetypeId) => void;
  /** create = game select; settings = cards with story under each */
  variant?: "create" | "settings";
  /** When true, parent renders the gender toggle (e.g. sticky header). */
  hideGender?: boolean;
};

export function GenderToggle({
  presentation,
  onPresentationChange,
  variant = "settings",
}: {
  presentation: Presentation;
  onPresentationChange: (presentation: Presentation) => void;
  variant?: "create" | "settings";
}) {
  const create = variant === "create";
  return (
    <div
      className={`flex p-1 ${
        create
          ? "rounded-full border border-white/15 bg-white/5"
          : "rounded-lg border border-[var(--line)] bg-[var(--panel)]"
      }`}
      role="group"
      aria-label="Представление"
    >
      {(["female", "male"] as const).map((p) => {
        const active = presentation === p;
        return (
          <button
            key={p}
            type="button"
            onClick={() => onPresentationChange(p)}
            className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition ${
              create
                ? active
                  ? "bg-white text-[var(--ink)] shadow-sm"
                  : "text-white/70 hover:text-white"
                : active
                  ? "bg-[var(--ink)] text-[var(--bg)]"
                  : "text-[var(--muted)] hover:text-[var(--ink)]"
            }`}
            aria-pressed={active}
          >
            {PRESENTATION_LABEL[p]}
          </button>
        );
      })}
    </div>
  );
}

export function SkinPicker({
  presentation,
  skinId,
  onPresentationChange,
  onSelect,
  variant = "settings",
  hideGender = false,
}: Props) {
  const create = variant === "create";

  return (
    <div className={create ? "space-y-3" : "space-y-4"}>
      {!hideGender ? (
        <GenderToggle
          presentation={presentation}
          onPresentationChange={onPresentationChange}
          variant={variant}
        />
      ) : null}

      {create ? (
        <ul className="character-create__rail">
          {CHARACTER_SKINS.map((skin) => {
            const selected = skin.id === skinId;
            const src = portraitSrc(skin.id, presentation);
            return (
              <li key={skin.id} className="character-create__rail-item">
                <button
                  type="button"
                  onClick={() => onSelect(skin.id)}
                  className={`relative w-full overflow-hidden rounded-2xl text-left transition ${
                    selected
                      ? "ring-2 ring-[var(--create-accent,#0d6e66)] ring-offset-2 ring-offset-[#070f11]"
                      : "opacity-70 hover:opacity-100"
                  }`}
                  aria-pressed={selected}
                >
                  <span className="relative block aspect-[3/4] w-full bg-black/30">
                    <Image
                      src={src}
                      alt=""
                      fill
                      className="object-cover object-[center_12%]"
                      sizes="140px"
                      priority={selected}
                    />
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-2 pb-2 pt-8">
                      <span className="block font-display text-sm text-white">
                        {skin.title}
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {CHARACTER_SKINS.map((skin) => {
            const selected = skin.id === skinId;
            const src = portraitSrc(skin.id, presentation);
            return (
              <li key={skin.id}>
                <button
                  type="button"
                  onClick={() => onSelect(skin.id)}
                  className={`group relative w-full overflow-hidden rounded-xl border text-left transition ${
                    selected
                      ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/35"
                      : "border-[var(--line)] hover:border-[var(--metal)]"
                  }`}
                  aria-pressed={selected}
                >
                  <span className="relative block aspect-[4/5] w-full bg-[var(--panel-2)]">
                    <Image
                      src={src}
                      alt=""
                      fill
                      className="object-cover object-[center_12%] transition duration-300 group-hover:scale-[1.02]"
                      sizes="(max-width: 640px) 90vw, 280px"
                    />
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[var(--ink)]/75 via-[var(--ink)]/35 to-transparent p-3 pt-12">
                      <span className="block font-display text-lg text-white">
                        {skin.title}
                      </span>
                      <span className="mt-0.5 block text-[10px] uppercase tracking-[0.1em] text-white/70">
                        {LOCALE_LABEL[skin.locale]}
                      </span>
                    </span>
                  </span>
                  <span className="block space-y-1 bg-[var(--panel)] p-3">
                    <span className="block text-sm font-medium text-[var(--ink)]">
                      {skin.blurb}
                    </span>
                    <span className="block text-xs leading-relaxed text-[var(--muted)]">
                      {skin.story}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
