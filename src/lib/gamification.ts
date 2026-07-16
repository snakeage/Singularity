import { todayISO, toISODate } from "./dates";
import {
  getActiveStage,
  getFocusDream,
  getStagesForDream,
  stageProgress,
} from "./selectors";
import type { AppData } from "./types";

const XP_CHECKIN = 10;
const XP_MILESTONE = 25;
const XP_STAGE = 50;
const XP_REVIEW = 15;

export type CharacterProgress = {
  xp: number;
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  levelProgress: number;
  streakDays: number;
  floor: number;
  floorsTotal: number;
  floorTitle: string;
  milestonesDone: number;
  milestonesTotal: number;
  checkInsDone: number;
  title: string;
};

function levelFromXp(xp: number): {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
} {
  // Soft curve: level N needs 100 + (N-1)*40 XP
  let level = 1;
  let remaining = xp;
  let need = 100;
  while (remaining >= need) {
    remaining -= need;
    level += 1;
    need = 100 + (level - 1) * 40;
  }
  return { level, xpIntoLevel: remaining, xpForNextLevel: need };
}

function characterTitle(level: number, floor: number): string {
  if (level <= 1 && floor <= 1) return "В начале пути";
  if (level < 3) return "Делает первые шаги";
  if (level < 6) return "В пути";
  if (level < 10) return "Набирает силу";
  return "Близко к мечте";
}

function computeStreak(data: AppData): number {
  const doneDates = new Set(
    data.checkIns.filter((c) => c.status === "done").map((c) => c.date),
  );
  if (doneDates.size === 0) return 0;

  let streak = 0;
  const cursor = new Date();
  // If today empty, start from yesterday (streak not broken until day ends)
  if (!doneDates.has(todayISO())) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (doneDates.has(toISODate(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function getCharacterProgress(data: AppData): CharacterProgress | null {
  const dream = getFocusDream(data);
  if (!dream) return null;

  const stages = getStagesForDream(data, dream.id);
  const active = getActiveStage(data, dream.id);
  const stageIds = new Set(stages.map((s) => s.id));

  const checkInsDone = data.checkIns.filter(
    (c) => c.status === "done" && c.practiceId,
  ).length;
  const milestonesDone = data.milestones.filter(
    (m) => m.status === "done" && stageIds.has(m.stageId),
  ).length;
  const stagesDone = stages.filter((s) => s.status === "completed").length;
  const reviewsDone = data.reviews.filter((r) => r.dreamId === dream.id).length;

  const xp =
    checkInsDone * XP_CHECKIN +
    milestonesDone * XP_MILESTONE +
    stagesDone * XP_STAGE +
    reviewsDone * XP_REVIEW;

  const { level, xpIntoLevel, xpForNextLevel } = levelFromXp(xp);
  const floor = active?.order ?? Math.max(1, stagesDone);
  const floorsTotal = Math.max(stages.length, 1);
  const ms = active
    ? stageProgress(data, active.id)
    : { done: 0, total: 0, ratio: 0 };

  return {
    xp,
    level,
    xpIntoLevel,
    xpForNextLevel,
    levelProgress: xpForNextLevel === 0 ? 0 : xpIntoLevel / xpForNextLevel,
    streakDays: computeStreak(data),
    floor,
    floorsTotal,
    floorTitle: active?.title ?? "этап не выбран",
    milestonesDone: ms.done,
    milestonesTotal: ms.total,
    checkInsDone,
    title: characterTitle(level, floor),
  };
}

export const XP_HINTS = {
  checkIn: `+${XP_CHECKIN} XP`,
  milestone: `+${XP_MILESTONE} XP`,
  stage: `+${XP_STAGE} XP`,
  review: `+${XP_REVIEW} XP`,
};
