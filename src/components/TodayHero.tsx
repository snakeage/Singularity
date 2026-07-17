"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import {
  LOCALE_LABEL,
  getSkin,
  resolvePresentation,
  resolveSkinId,
} from "@/lib/characterSkins";
import { useApp } from "@/store/AppProvider";
import { ProgressBar } from "./ui";

type Props = {
  dreamTitle: string;
  stageTitle?: string;
  milestonesDone?: number;
  milestonesTotal?: number;
  milestoneRatio?: number;
};

/**
 * Today banner — atmosphere from skin palette, not another face.
 * Circular portrait stays only in the app header (N13a).
 */
export function TodayHero({
  dreamTitle,
  stageTitle,
  milestonesDone = 0,
  milestonesTotal = 0,
  milestoneRatio = 0,
}: Props) {
  const { data } = useApp();
  const skinId = resolveSkinId(data.profile);
  const skin = getSkin(skinId);
  const hasPortrait = resolvePresentation(data.profile) != null;

  return (
    <section
      className="today-hero relative overflow-hidden rounded-2xl border border-[var(--line)]"
      style={
        {
          "--today-accent": skin.accent,
          "--today-soft": skin.accentSoft,
        } as CSSProperties
      }
    >
      <div className="today-hero__wash absolute inset-0" aria-hidden />

      <div className="relative z-10 space-y-3 p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--accent)]">
              Сегодня
              {hasPortrait ? (
                <span className="text-[var(--muted)]">
                  {" "}
                  · {LOCALE_LABEL[skin.locale]}
                </span>
              ) : null}
            </p>
            <h1 className="mt-1 font-display text-3xl tracking-tight text-[var(--ink)] sm:text-[2rem]">
              {dreamTitle}
            </h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {stageTitle ? (
                <>
                  Этап «{stageTitle}»
                  {hasPortrait ? (
                    <span className="text-[var(--faint)]">
                      {" "}
                      · {skin.title}
                    </span>
                  ) : null}
                </>
              ) : (
                "Этап ещё не выбран"
              )}
            </p>
          </div>
          <Link
            href="/dream"
            className="text-xs font-medium text-[var(--accent)] hover:underline"
          >
            К мечте
          </Link>
        </div>

        {stageTitle ? (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-[var(--muted)]">
              <span>Рубежи этапа</span>
              <span>
                {milestonesDone}/{milestonesTotal || "—"}
              </span>
            </div>
            <ProgressBar ratio={milestoneRatio} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
