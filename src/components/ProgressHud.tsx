"use client";

import {
  DEFAULT_PRESENTATION,
  DEFAULT_SKIN_ID,
  getSkin,
  resolvePresentation,
  resolveSkinId,
} from "@/lib/characterSkins";
import { getCharacterProgress, XP_HINTS } from "@/lib/gamification";
import { useApp } from "@/store/AppProvider";
import { PortraitAvatar } from "./PortraitAvatar";
import { ProgressBar } from "./ui";

export function ProgressHud({
  compact = false,
  showPortrait = true,
}: {
  compact?: boolean;
  /** Hide when shell header already shows the portrait (avoid twin circles). */
  showPortrait?: boolean;
}) {
  const { ready, data } = useApp();
  if (!ready) return null;

  const progress = getCharacterProgress(data);
  if (!progress) return null;

  const displayName = progress.name || "Путник";
  const presentation = resolvePresentation(data.profile) ?? DEFAULT_PRESENTATION;
  const skinId = resolveSkinId(data.profile);
  const skin = getSkin(skinId);
  const hasPortrait = resolvePresentation(data.profile) != null;

  if (compact) {
    return (
      <div className="min-w-[140px] max-w-[200px] flex-1 sm:max-w-[220px] sm:flex-none">
        <div className="flex items-center gap-2">
          {showPortrait && hasPortrait ? (
            <PortraitAvatar
              presentation={presentation}
              skinId={skinId}
              size="sm"
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2 text-xs text-[var(--muted)]">
              <span className="truncate">
                {showPortrait ? (
                  <>
                    {displayName} · ур. {progress.level}
                  </>
                ) : (
                  <>ур. {progress.level}</>
                )}
              </span>
              <span className="shrink-0 text-[var(--metal)]">
                {progress.xp} XP
              </span>
            </div>
            <div className="mt-1">
              <ProgressBar ratio={progress.levelProgress} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel-frame rounded-md p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-start gap-3">
          {showPortrait && hasPortrait ? (
            <PortraitAvatar
              presentation={presentation}
              skinId={skinId}
              size="lg"
            />
          ) : null}
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.1em] text-[var(--metal)]">
              {showPortrait ? "Персонаж" : "Прогресс"}
              {hasPortrait ? ` · ${skin.title}` : ""}
            </p>
            <p className="font-display text-2xl text-[var(--ink)]">
              {displayName}
            </p>
            <p className="text-sm text-[var(--muted)]">
              Уровень {progress.level} · {progress.title}
            </p>
          </div>
        </div>
        <p className="text-sm text-[var(--metal)]">{progress.xp} XP</p>
      </div>

      <div className="mt-3 space-y-1">
        <div className="flex justify-between text-xs text-[var(--muted)]">
          <span>До следующего уровня</span>
          <span>
            {progress.xpIntoLevel}/{progress.xpForNextLevel}
          </span>
        </div>
        <ProgressBar ratio={progress.levelProgress} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <Stat
          label="Этап"
          value={`${progress.floor}/${progress.floorsTotal}`}
        />
        <Stat
          label="Серия норм"
          value={
            progress.streakDays > 0
              ? `${progress.streakDays}`
              : "—"
          }
        />
        <Stat
          label="Рубежи этапа"
          value={`${progress.milestonesDone}/${progress.milestonesTotal || "—"}`}
        />
        <Stat label="Практик сделано" value={`${progress.checkInsDone}`} />
      </div>

      <p className="mt-3 text-xs text-[var(--faint)]">
        Серия — дни подряд с «нормой» или «сильно» (не частично). Практика{" "}
        {XP_HINTS.checkInScale} · рубеж {XP_HINTS.milestone} · этап{" "}
        {XP_HINTS.stage} · обзор {XP_HINTS.review}. XP только после закрытия
        практики, не пока идёт таймер.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-[var(--panel-2)]/50 px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--muted)]">
        {label}
      </p>
      <p className="font-medium text-[var(--ink)]">{value}</p>
    </div>
  );
}
