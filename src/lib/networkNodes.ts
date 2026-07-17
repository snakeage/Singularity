import { toISODate } from "@/lib/dates";
import { getCharacterProgress } from "@/lib/gamification";
import { isFullCredit } from "@/lib/practiceLevels";
import {
  getActiveStage,
  getFocusDream,
  getMilestones,
  getPractices,
  getPrimaryTeacher,
} from "@/lib/selectors";
import type { AppData, CheckInStatus, Practice } from "@/lib/types";

/** Node state on the stage network map (mythology-network.md). */
export type NetworkNodeState =
  | "slot"
  | "installed"
  | "drilling"
  | "holding"
  | "upgraded"
  | "certified";

export type NetworkChannel =
  | "offline"
  | "access"
  | "working"
  | "deep";

export const NETWORK_CHANNEL_LABEL: Record<NetworkChannel, string> = {
  offline: "Вне сети",
  access: "Канал доступа",
  working: "Рабочий канал",
  deep: "Глубокий канал",
};

export const NETWORK_NODE_LABEL: Record<NetworkNodeState, string> = {
  slot: "Слот",
  installed: "Установлена",
  drilling: "В закалке",
  holding: "Держится",
  upgraded: "Усилена",
  certified: "Подтверждена",
};

export type NetworkNode = {
  practiceId: string;
  title: string;
  frequency: Practice["frequency"];
  minMinutes?: number;
  state: NetworkNodeState;
  lastStatus: CheckInStatus | null;
  fullCreditCount: number;
  holdingDays: number;
};

export type StageNetwork = {
  dreamTitle: string;
  stageTitle: string;
  stageId: string;
  channel: NetworkChannel;
  channelLabel: string;
  teacherName?: string;
  nodes: NetworkNode[];
  installedCount: number;
  certifiedCount: number;
};

function practiceCheckIns(data: AppData, practiceId: string) {
  return data.checkIns.filter((c) => c.practiceId === practiceId);
}

function holdingStreakDays(data: AppData, practiceId: string): number {
  const doneDates = new Set(
    practiceCheckIns(data, practiceId)
      .filter((c) => isFullCredit(c.status))
      .map((c) => c.date),
  );
  if (doneDates.size === 0) return 0;

  let streak = 0;
  const cursor = new Date();
  const today = toISODate(cursor);
  if (!doneDates.has(today)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (doneDates.has(toISODate(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function latestStatus(
  data: AppData,
  practiceId: string,
): CheckInStatus | null {
  const list = practiceCheckIns(data, practiceId).sort((a, b) =>
    b.date.localeCompare(a.date),
  );
  return list[0]?.status ?? null;
}

export function resolveNetworkNodeState(
  data: AppData,
  practice: Practice,
  stageHasCertifiedPath: boolean,
): NetworkNodeState {
  const ins = practiceCheckIns(data, practice.id);
  const full = ins.filter((c) => isFullCredit(c.status));
  if (full.length === 0) return "slot";

  const hasStrong = full.some((c) => c.status === "strong");
  const holding = holdingStreakDays(data, practice.id);
  const certified = stageHasCertifiedPath && full.length >= 1;

  if (certified) return "certified";
  if (hasStrong) return "upgraded";
  if (holding >= 3) return "holding";
  if (ins.some((c) => c.date === toISODate(new Date()) || holding >= 1)) {
    return "drilling";
  }
  return "installed";
}

export function resolveNetworkChannel(
  data: AppData,
  nodes: NetworkNode[],
): NetworkChannel {
  const progress = getCharacterProgress(data);
  const level = progress?.level ?? 1;
  const installed = nodes.filter((n) => n.state !== "slot").length;
  const certified = nodes.filter((n) => n.state === "certified").length;
  const stageDoneMilestone = progress
    ? progress.milestonesDone > 0
    : false;

  if (installed === 0) return "offline";
  if (
    (level >= 6 && (certified > 0 || stageDoneMilestone)) ||
    certified >= 2
  ) {
    return "deep";
  }
  if (level >= 3 || installed >= 3 || nodes.some((n) => n.state === "holding")) {
    return "working";
  }
  return "access";
}

export function getStageNetwork(data: AppData): StageNetwork | null {
  const dream = getFocusDream(data);
  if (!dream) return null;
  const stage = getActiveStage(data, dream.id);
  if (!stage) return null;

  const milestones = getMilestones(data, stage.id);
  const stageHasCertifiedPath = milestones.some((m) => m.status === "done");
  const practices = getPractices(data, stage.id);
  const teacher = getPrimaryTeacher(data, stage.id);

  const nodes: NetworkNode[] = practices.map((p) => {
    const fullCreditCount = practiceCheckIns(data, p.id).filter((c) =>
      isFullCredit(c.status),
    ).length;
    const holdingDays = holdingStreakDays(data, p.id);
    return {
      practiceId: p.id,
      title: p.title,
      frequency: p.frequency,
      minMinutes: p.minMinutes,
      state: resolveNetworkNodeState(data, p, stageHasCertifiedPath),
      lastStatus: latestStatus(data, p.id),
      fullCreditCount,
      holdingDays,
    };
  });

  const channel = resolveNetworkChannel(data, nodes);

  return {
    dreamTitle: dream.title,
    stageTitle: stage.title,
    stageId: stage.id,
    channel,
    channelLabel: NETWORK_CHANNEL_LABEL[channel],
    teacherName: teacher?.title,
    nodes,
    installedCount: nodes.filter((n) => n.state !== "slot").length,
    certifiedCount: nodes.filter((n) => n.state === "certified").length,
  };
}
