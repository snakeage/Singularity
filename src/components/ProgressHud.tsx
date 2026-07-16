"use client";

import { getCharacterProgress, XP_HINTS } from "@/lib/gamification";
import { useApp } from "@/store/AppProvider";
import { ProgressBar } from "./ui";

export function ProgressHud({ compact = false }: { compact?: boolean }) {
  const { ready, data } = useApp();
  if (!ready) return null;

  const progress = getCharacterProgress(data);
  if (!progress) return null;

  const displayName = progress.name || "Путник";

  if (compact) {
    return (
      <div className="hidden min-w-[170px] sm:block">
        <div className="flex items-baseline justify-between gap-2 text-xs text-[var(--muted)]">
          <span>
            {displayName} · ур. {progress.level}
          </span>
          <span className="text-[var(--metal)]">{progress.xp} XP</span>
        </div>
        <div className="mt-1">
          <ProgressBar ratio={progress.levelProgress} />
        </div>
      </div>
    );
  }

  return (
    <div className="panel-frame rounded-md p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.1em] text-[var(--metal)]">
            Персонаж
          </p>
          <p className="font-display text-2xl text-[var(--ink)]">
            {displayName}
          </p>
          <p className="text-sm text-[var(--muted)]">
            Уровень {progress.level} · {progress.title}
          </p>
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
        <Stat label="Серия дней" value={`${progress.streakDays}`} />
        <Stat
          label="Рубежи этапа"
          value={`${progress.milestonesDone}/${progress.milestonesTotal || "—"}`}
        />
        <Stat label="Практик сделано" value={`${progress.checkInsDone}`} />
      </div>

      <p className="mt-3 text-xs text-[var(--faint)]">
        Практика (отметка) {XP_HINTS.checkIn} · рубеж {XP_HINTS.milestone} ·
        этап закрыт {XP_HINTS.stage} · обзор недели {XP_HINTS.review}. Имя
        меняется на экране «Данные».
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
