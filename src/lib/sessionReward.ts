import { getCharacterProgress, type CharacterProgress } from "./gamification";
import type { AppData, CheckInStatus } from "./types";

export type SessionRewardEvent = {
  practiceTitle: string;
  status: CheckInStatus;
  minutesSpent?: number;
  minMinutes?: number;
  xpGained: number;
  levelBefore: number;
  levelAfter: number;
  titleAfter: string;
  leveledUp: boolean;
};

type RewardListener = (event: SessionRewardEvent) => void;

const listeners = new Set<RewardListener>();

export function pushSessionReward(event: SessionRewardEvent): void {
  for (const listener of listeners) listener(event);
}

export function subscribeSessionReward(listener: RewardListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function buildSessionReward(
  before: CharacterProgress | null,
  after: CharacterProgress | null,
  meta: {
    practiceTitle: string;
    status: CheckInStatus;
    minutesSpent?: number;
    minMinutes?: number;
  },
): SessionRewardEvent | null {
  if (!before || !after) return null;
  const xpGained = after.xp - before.xp;
  if (xpGained <= 0) return null;
  return {
    practiceTitle: meta.practiceTitle,
    status: meta.status,
    minutesSpent: meta.minutesSpent,
    minMinutes: meta.minMinutes,
    xpGained,
    levelBefore: before.level,
    levelAfter: after.level,
    titleAfter: after.title,
    leveledUp: after.level > before.level,
  };
}

/** Compare progress before/after a data mutation that may award practice XP. */
export function rewardFromDataChange(
  prev: AppData,
  next: AppData,
  meta: {
    practiceTitle: string;
    status: CheckInStatus;
    minutesSpent?: number;
    minMinutes?: number;
  },
): SessionRewardEvent | null {
  return buildSessionReward(
    getCharacterProgress(prev),
    getCharacterProgress(next),
    meta,
  );
}
