"use client";

import NextImage from "next/image";
import type { CSSProperties } from "react";
import {
  type Presentation,
  type SkinArchetypeId,
} from "@/lib/characterSkins";

export type DrillBayMode = "idle" | "live" | "paused" | "done";

const MODE_LABEL: Record<DrillBayMode, string> = {
  idle: "готов к сессии",
  live: "сессия · база заливается",
  paused: "пауза · капсула держит",
  done: "норма закрыта",
};

/** Empty bay fallback if a skin art is missing. */
export const DRILL_BAY_FALLBACK = "/drill/capsule-bay.jpg";

/** In-capsule art while session is live/paused. */
export function drillBaySessionSrc(
  skinId: SkinArchetypeId,
  presentation: Presentation | null,
): string {
  if (!presentation) return DRILL_BAY_FALLBACK;
  return `/drill/capsule-${skinId}-${presentation}.jpg`;
}

/** Beside / about-to-enter art when base is not in active session. */
export function drillBayReadySrc(
  skinId: SkinArchetypeId,
  presentation: Presentation | null,
): string {
  if (!presentation) return DRILL_BAY_FALLBACK;
  return `/drill/capsule-${skinId}-${presentation}-ready.jpg`;
}

export function drillBaySrc(
  skinId: SkinArchetypeId,
  presentation: Presentation | null,
  mode: DrillBayMode,
): string {
  if (mode === "live" || mode === "paused") {
    return drillBaySessionSrc(skinId, presentation);
  }
  return drillBayReadySrc(skinId, presentation);
}

type Props = {
  skinId: SkinArchetypeId;
  presentation: Presentation | null;
  mode: DrillBayMode;
  accent: string;
  accentSoft: string;
};

export function DrillBay({
  skinId,
  presentation,
  mode,
  accent,
  accentSoft,
}: Props) {
  const src = drillBaySrc(skinId, presentation, mode);

  return (
    <div
      className={`drill-bay drill-bay--${mode}`}
      style={
        {
          "--create-accent": accent,
          "--create-soft": accentSoft,
        } as CSSProperties
      }
    >
      <div className="drill-bay__stage">
        <NextImage
          key={src}
          src={src}
          alt=""
          fill
          priority
          sizes="(max-width: 768px) 100vw, 720px"
          className="drill-bay__art object-cover object-center"
        />
        <div className="drill-bay__wash" aria-hidden />
        <div className="drill-bay__glow" aria-hidden />
        <div className="drill-bay__scan" aria-hidden />
        <div className="drill-bay__vignette" aria-hidden />
      </div>
      <p className="drill-bay__status">
        <span className="drill-bay__pulse" aria-hidden />
        {MODE_LABEL[mode]}
      </p>
    </div>
  );
}
