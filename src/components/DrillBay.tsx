"use client";

import NextImage from "next/image";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  type Presentation,
  type SkinArchetypeId,
} from "@/lib/characterSkins";

export type DrillBayMode = "idle" | "live" | "paused" | "done";

export type DrillBayHandle = {
  /** Scroll bay into view and play enter beat (Старт → в капсуле). */
  revealEnter: () => void;
};

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

function prefersReducedMotion() {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type Props = {
  skinId: SkinArchetypeId;
  presentation: Presentation | null;
  mode: DrillBayMode;
  accent: string;
  accentSoft: string;
};

export const DrillBay = forwardRef<DrillBayHandle, Props>(function DrillBay(
  { skinId, presentation, mode, accent, accentSoft },
  ref,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const src = drillBaySrc(skinId, presentation, mode);
  const [frontSrc, setFrontSrc] = useState(src);
  const [backSrc, setBackSrc] = useState<string | null>(null);
  const [entering, setEntering] = useState(false);
  const [swapOn, setSwapOn] = useState(false);

  useEffect(() => {
    if (src === frontSrc) return;
    setBackSrc(frontSrc);
    setFrontSrc(src);
    setSwapOn(false);
    const kick = requestAnimationFrame(() => {
      requestAnimationFrame(() => setSwapOn(true));
    });
    const clear = window.setTimeout(() => {
      setBackSrc(null);
      setSwapOn(false);
    }, prefersReducedMotion() ? 0 : 560);
    return () => {
      cancelAnimationFrame(kick);
      window.clearTimeout(clear);
    };
  }, [src, frontSrc]);

  useImperativeHandle(ref, () => ({
    revealEnter() {
      const el = rootRef.current;
      if (!el) return;
      const reduce = prefersReducedMotion();
      el.scrollIntoView({
        behavior: reduce ? "auto" : "smooth",
        block: "center",
      });
      if (reduce) return;
      setEntering(true);
      window.setTimeout(() => setEntering(false), 700);
    },
  }));

  return (
    <div
      ref={rootRef}
      className={`drill-bay drill-bay--${mode}${entering ? " drill-bay--entering" : ""}`}
      style={
        {
          "--create-accent": accent,
          "--create-soft": accentSoft,
        } as CSSProperties
      }
    >
      <div className="drill-bay__stage">
        {backSrc ? (
          <NextImage
            src={backSrc}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 720px"
            className={`drill-bay__art drill-bay__art--back object-cover object-center${
              swapOn ? " drill-bay__art--out" : ""
            }`}
          />
        ) : null}
        <NextImage
          src={frontSrc}
          alt=""
          fill
          priority
          sizes="(max-width: 768px) 100vw, 720px"
          className={`drill-bay__art drill-bay__art--front object-cover object-center${
            backSrc ? (swapOn ? " drill-bay__art--in" : " drill-bay__art--prep") : ""
          }`}
        />
        <div className="drill-bay__wash" aria-hidden />
        <div className="drill-bay__glow" aria-hidden />
        <div className="drill-bay__scan" aria-hidden />
        <div className="drill-bay__vignette" aria-hidden />
        <div className="drill-bay__flash" aria-hidden />
      </div>
      <p className="drill-bay__status">
        <span className="drill-bay__pulse" aria-hidden />
        {MODE_LABEL[mode]}
      </p>
    </div>
  );
});
