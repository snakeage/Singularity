"use client";

import { useId, type CSSProperties } from "react";
import {
  getSkin,
  type Presentation,
  type SkinArchetypeId,
} from "@/lib/characterSkins";

type Props = {
  presentation: Presentation;
  skinId: SkinArchetypeId | string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZE = {
  sm: "h-9 w-9",
  md: "h-14 w-14",
  lg: "h-24 w-24",
} as const;

/**
 * Stylized portrait placeholder until N12c arts land.
 * Distinct male/female silhouettes; accent from archetype.
 */
export function PortraitAvatar({
  presentation,
  skinId,
  size = "md",
  className = "",
}: Props) {
  const uid = useId().replace(/:/g, "");
  const skin = getSkin(skinId);
  const female = presentation === "female";
  const gradId = `pg-${uid}`;

  return (
    <div
      className={`portrait-avatar relative shrink-0 overflow-hidden rounded-full border border-[var(--line)] ${SIZE[size]} ${className}`}
      style={
        {
          "--portrait-accent": skin.accent,
          "--portrait-soft": skin.accentSoft,
        } as CSSProperties
      }
      data-presentation={presentation}
      data-skin={skin.id}
      aria-hidden
    >
      <svg viewBox="0 0 64 64" className="h-full w-full" role="img">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--portrait-soft)" />
            <stop
              offset="100%"
              stopColor="var(--portrait-accent)"
              stopOpacity="0.35"
            />
          </linearGradient>
        </defs>
        <rect width="64" height="64" fill={`url(#${gradId})`} />
        <ellipse
          cx="32"
          cy="58"
          rx={female ? 18 : 20}
          ry="12"
          fill="var(--portrait-accent)"
          opacity="0.85"
        />
        <rect
          x="28"
          y="36"
          width="8"
          height="10"
          rx="2"
          fill="var(--portrait-accent)"
          opacity="0.7"
        />
        <ellipse
          cx="32"
          cy="26"
          rx={female ? 11 : 12}
          ry={female ? 13 : 13.5}
          fill="var(--portrait-accent)"
          opacity="0.9"
        />
        {female ? (
          <>
            <path
              d="M18 28 C18 14 46 14 46 28 L44 42 C40 36 24 36 20 42 Z"
              fill="var(--portrait-accent)"
            />
            <ellipse
              cx="32"
              cy="18"
              rx="12"
              ry="8"
              fill="var(--portrait-accent)"
            />
          </>
        ) : (
          <path
            d="M20 24 C20 12 44 12 44 24 L42 28 C38 22 26 22 22 28 Z"
            fill="var(--portrait-accent)"
          />
        )}
        <ellipse
          cx="32"
          cy="28"
          rx="6"
          ry="5"
          fill="var(--portrait-soft)"
          opacity="0.35"
        />
      </svg>
    </div>
  );
}
