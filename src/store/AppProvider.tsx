"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { downloadBackup, parseBackup } from "@/lib/backup";
import {
  nowISO,
  todayISO,
  weekEndISO,
  weekStartISO,
} from "@/lib/dates";
import { createId } from "@/lib/id";
import { xpForCheckInStatus } from "@/lib/gamification";
import { normalizeReminders } from "@/lib/reminders";
import {
  motivationCopy,
  resolveClaimWithoutTimer,
  resolveEffortStatus,
  settleExpiredTimers,
} from "@/lib/practiceLevels";
import {
  getActiveStage,
  getFocusDream,
  getMilestones,
  getPracticePeriodKey,
  getPractices,
  getStagesForDream,
} from "@/lib/selectors";
import { loadData, saveData } from "@/lib/storage";
import { canActivateStage } from "@/lib/stages";
import { parseTags } from "@/lib/tags";
import { elapsedToMinutes, getTimerElapsedMs, parseMinMinutes } from "@/lib/timer";
import {
  pushSessionReward,
  rewardFromDataChange,
} from "@/lib/sessionReward";
import { pushToast } from "@/lib/toastBus";
import {
  EMPTY_DATA,
  type AppData,
  type CheckInStatus,
  type CourseCheck,
  type GrowthSourceType,
  type LearningWindowStatus,
  type PracticeFrequency,
  type PracticeMomentKind,
  type Reminders,
  type WeekLessonTouch,
} from "@/lib/types";

type AppContextValue = {
  ready: boolean;
  data: AppData;
  focusDreamId: string | undefined;
  exportBackup: () => void;
  importBackupFile: (file: File) => Promise<void>;
  createDream: (input: {
    title: string;
    why: string;
    outcomeVision: string;
    horizon: string;
    context?: string;
  }) => string;
  setFocusDream: (dreamId: string) => void;
  updateDream: (
    dreamId: string,
    patch: Partial<{
      title: string;
      why: string;
      outcomeVision: string;
      horizon: string;
      context: string;
      status: AppData["dreams"][number]["status"];
    }>,
  ) => void;
  savePointA: (
    dreamId: string,
    input: {
      skills: string;
      resources: string;
      constraints: string;
      notes?: string;
    },
  ) => void;
  replaceStages: (
    dreamId: string,
    stages: Array<{
      title: string;
      objective: string;
      exitCriteria: string;
    }>,
    activeIndex: number,
  ) => void;
  updateStage: (
    stageId: string,
    patch: {
      title: string;
      objective: string;
      exitCriteria: string;
    },
  ) => void;
  addStage: (
    dreamId: string,
    input: {
      title: string;
      objective: string;
      exitCriteria: string;
    },
  ) => void;
  removeStage: (stageId: string) => void;
  moveStage: (stageId: string, direction: "up" | "down") => void;
  setActiveStage: (dreamId: string, stageId: string) => void;
  completeStage: (stageId: string) => void;
  addMilestone: (
    stageId: string,
    input: { title: string; successMetric: string; dueAt?: string },
  ) => void;
  toggleMilestone: (milestoneId: string) => void;
  updateMilestone: (
    milestoneId: string,
    input: { title: string; successMetric: string; dueAt?: string },
  ) => void;
  removeMilestone: (milestoneId: string) => void;
  addPractice: (
    stageId: string,
    input: {
      title: string;
      frequency: PracticeFrequency;
      cue?: string;
      focus?: string;
      whyForStage?: string;
      courseCheck?: CourseCheck;
      tags?: string;
      minMinutes?: string;
    },
  ) => void;
  updatePractice: (
    practiceId: string,
    input: {
      title: string;
      frequency: PracticeFrequency;
      cue?: string;
      focus?: string;
      whyForStage?: string;
      courseCheck?: CourseCheck;
      tags?: string;
      minMinutes?: string;
    },
  ) => void;
  removePractice: (practiceId: string) => void;
  startPracticeTimer: (practiceId: string) => void;
  pausePracticeTimer: (practiceId: string) => void;
  resetPracticeTimer: (practiceId: string) => void;
  /** Set paused timer to an exact minute count (long-run honesty). */
  setPracticeTimerMinutes: (practiceId: string, minutes: number) => void;
  /** Remember which effort-moment dialogs fired this period. */
  markPracticeMoments: (
    practiceId: string,
    kinds: PracticeMomentKind[],
    options?: {
      checkpointElapsedMs?: number;
      pendingMoment?: PracticeMomentKind | null;
      longRunReviewed?: boolean;
    },
  ) => void;
  /** Clear moment flags so new thresholds can fire after a min bump. */
  clearPracticeMoments: (practiceId: string) => void;
  /** Progressive overload: raise practice minimum minutes. */
  setPracticeMinMinutes: (practiceId: string, minMinutes: number) => void;
  /** Close timer into partial/done/strong from minutes. */
  completePracticeWithTimer: (
    practiceId: string,
    frequency: PracticeFrequency,
  ) => { minutesSpent: number; status: CheckInStatus };
  /** Claim without timer — partial if practice has a minimum. */
  claimPracticeWithoutTimer: (
    practiceId: string,
    frequency: PracticeFrequency,
  ) => CheckInStatus;
  settlePracticeTimers: () => void;
  updateProfile: (patch: {
    name?: string;
    presentation?: "male" | "female";
    skinId?: string;
    reminders?: Reminders;
    strictLadder?: boolean;
  }) => void;
  markReminderSent: (dateISO: string) => void;
  setCheckIn: (
    practiceId: string,
    date: string,
    status: CheckInStatus,
  ) => void;
  clearCheckIn: (practiceId: string, date: string) => void;
  /** Daily: one mark per day. Weekly: one mark per week (Monday key). */
  setPracticePeriodCheckIn: (
    practiceId: string,
    frequency: PracticeFrequency,
    status: CheckInStatus,
    minutesSpent?: number,
  ) => void;
  clearPracticePeriodCheckIn: (
    practiceId: string,
    frequency: PracticeFrequency,
  ) => void;
  addGrowthSource: (
    stageId: string,
    input: {
      title: string;
      type: GrowthSourceType;
      url?: string;
      notes?: string;
      role?: "teacher" | "material";
      teaching?: string;
      weekLesson?: string;
      primary?: boolean;
    },
  ) => void;
  updateGrowthSource: (
    sourceId: string,
    input: {
      title: string;
      type: GrowthSourceType;
      url?: string;
      notes?: string;
      role?: "teacher" | "material";
      teaching?: string;
      weekLesson?: string;
      primary?: boolean;
    },
  ) => void;
  removeGrowthSource: (sourceId: string) => void;
  setPrimaryTeacher: (sourceId: string) => void;
  addObstacle: (input: {
    dreamId?: string;
    stageId?: string;
    description: string;
  }) => void;
  updateObstacle: (id: string, description: string) => void;
  removeObstacle: (id: string) => void;
  addIntention: (input: {
    dreamId?: string;
    stageId?: string;
    obstacleId?: string;
    ifCondition: string;
    thenAction: string;
  }) => void;
  updateIntention: (
    id: string,
    input: { ifCondition: string; thenAction: string },
  ) => void;
  removeIntention: (id: string) => void;
  saveReview: (input: {
    dreamId: string;
    worked: string;
    blocked: string;
    nextChange: string;
    learningUsed?: string;
    learningWindows?: LearningWindowStatus;
    weekLessonTouch?: WeekLessonTouch;
    weekLessonSnapshot?: string;
  }) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

function persist(updater: (prev: AppData) => AppData) {
  return (prev: AppData) => {
    const next = updater(prev);
    saveData(next);
    return next;
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(EMPTY_DATA);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setData(loadData());
    } catch (err) {
      console.error("Singularity: failed to load local data", err);
    } finally {
      setReady(true);
    }
  }, []);

  const focusDream = getFocusDream(data);

  const exportBackup = useCallback(() => {
    downloadBackup(data);
  }, [data]);

  const importBackupFile = useCallback(async (file: File) => {
    const text = await file.text();
    const imported = parseBackup(text);
    saveData(imported);
    setData(imported);
  }, []);

  const createDream: AppContextValue["createDream"] = useCallback((input) => {
    const id = createId("dream");
    const ts = nowISO();
    setData(
      persist((prev) => ({
        ...prev,
        dreams: [
          ...prev.dreams.map((d) =>
            d.status === "active" ? { ...d, status: "paused" as const } : d,
          ),
          {
            id,
            title: input.title.trim(),
            why: input.why.trim(),
            outcomeVision: input.outcomeVision.trim(),
            horizon: input.horizon.trim(),
            context: input.context?.trim() || undefined,
            status: "active",
            createdAt: ts,
            updatedAt: ts,
          },
        ],
      })),
    );
    return id;
  }, []);

  const setFocusDream: AppContextValue["setFocusDream"] = useCallback(
    (dreamId) => {
      const ts = nowISO();
      setData(
        persist((prev) => {
          if (!prev.dreams.some((d) => d.id === dreamId)) return prev;
          return {
            ...prev,
            dreams: prev.dreams.map((d) => {
              if (d.id === dreamId) {
                return { ...d, status: "active" as const, updatedAt: ts };
              }
              if (d.status === "active") {
                return { ...d, status: "paused" as const, updatedAt: ts };
              }
              return d;
            }),
          };
        }),
      );
    },
    [],
  );

  const updateDream: AppContextValue["updateDream"] = useCallback(
    (dreamId, patch) => {
      setData(
        persist((prev) => ({
          ...prev,
          dreams: prev.dreams.map((d) =>
            d.id === dreamId
              ? {
                  ...d,
                  ...patch,
                  updatedAt: nowISO(),
                }
              : d,
          ),
        })),
      );
    },
    [],
  );

  const savePointA: AppContextValue["savePointA"] = useCallback(
    (dreamId, input) => {
      setData(
        persist((prev) => {
          const latest = prev.pointAs
            .filter((p) => p.dreamId === dreamId)
            .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt))[0];
          const next = {
            skills: input.skills.trim(),
            resources: input.resources.trim(),
            constraints: input.constraints.trim(),
            notes: input.notes?.trim() || undefined,
          };
          if (
            latest &&
            latest.skills === next.skills &&
            latest.resources === next.resources &&
            latest.constraints === next.constraints &&
            (latest.notes ?? "") === (next.notes ?? "")
          ) {
            return prev;
          }
          return {
            ...prev,
            pointAs: [
              ...prev.pointAs,
              {
                id: createId("pointa"),
                dreamId,
                ...next,
                capturedAt: nowISO(),
              },
            ],
          };
        }),
      );
    },
    [],
  );

  const replaceStages: AppContextValue["replaceStages"] = useCallback(
    (dreamId, stages, activeIndex) => {
      const ts = nowISO();
      setData(
        persist((prev) => {
          const safeActiveIndex = prev.profile?.strictLadder
            ? 0
            : activeIndex;
          const oldStageIds = prev.stages
            .filter((s) => s.dreamId === dreamId)
            .map((s) => s.id);
          const nextStages = stages.map((s, i) => ({
            id: createId("stage"),
            dreamId,
            order: i + 1,
            title: s.title.trim(),
            objective: s.objective.trim(),
            exitCriteria: s.exitCriteria.trim(),
            status:
              i === safeActiveIndex
                ? ("active" as const)
                : ("planned" as const),
            createdAt: ts,
            updatedAt: ts,
          }));
          return {
            ...prev,
            stages: [
              ...prev.stages.filter((s) => s.dreamId !== dreamId),
              ...nextStages,
            ],
            milestones: prev.milestones.filter(
              (m) => !oldStageIds.includes(m.stageId),
            ),
            practices: prev.practices.filter(
              (p) => !oldStageIds.includes(p.stageId),
            ),
            growthSources: prev.growthSources.filter(
              (g) => !oldStageIds.includes(g.stageId),
            ),
          };
        }),
      );
    },
    [],
  );

  const updateStage: AppContextValue["updateStage"] = useCallback(
    (stageId, patch) => {
      setData(
        persist((prev) => ({
          ...prev,
          stages: prev.stages.map((s) =>
            s.id === stageId
              ? {
                  ...s,
                  title: patch.title.trim(),
                  objective: patch.objective.trim(),
                  exitCriteria: patch.exitCriteria.trim(),
                  updatedAt: nowISO(),
                }
              : s,
          ),
        })),
      );
    },
    [],
  );

  const addStage: AppContextValue["addStage"] = useCallback(
    (dreamId, input) => {
      const ts = nowISO();
      setData(
        persist((prev) => {
          const existing = getStagesForDream(prev, dreamId);
          if (existing.length >= 5) return prev;
          const order = existing.length + 1;
          const makeActive = existing.length === 0;
          return {
            ...prev,
            stages: [
              ...prev.stages.map((s) =>
                makeActive && s.dreamId === dreamId && s.status === "active"
                  ? { ...s, status: "planned" as const, updatedAt: ts }
                  : s,
              ),
              {
                id: createId("stage"),
                dreamId,
                order,
                title: input.title.trim(),
                objective: input.objective.trim(),
                exitCriteria: input.exitCriteria.trim(),
                status: makeActive ? ("active" as const) : ("planned" as const),
                createdAt: ts,
                updatedAt: ts,
              },
            ],
          };
        }),
      );
    },
    [],
  );

  const removeStage: AppContextValue["removeStage"] = useCallback(
    (stageId) => {
      setData(
        persist((prev) => {
          const stage = prev.stages.find((s) => s.id === stageId);
          if (!stage) return prev;
          const siblings = getStagesForDream(prev, stage.dreamId);
          if (siblings.length <= 2) return prev;

          const remaining = siblings
            .filter((s) => s.id !== stageId)
            .map((s, i) => ({ ...s, order: i + 1, updatedAt: nowISO() }));

          let nextActiveId: string | undefined;
          if (stage.status === "active") {
            nextActiveId =
              remaining.find((s) => s.status === "planned")?.id ??
              remaining[0]?.id;
          }

          const nextStages = remaining.map((s) =>
            nextActiveId && s.id === nextActiveId
              ? { ...s, status: "active" as const }
              : s,
          );

          return {
            ...prev,
            stages: [
              ...prev.stages.filter((s) => s.dreamId !== stage.dreamId),
              ...nextStages,
            ],
            milestones: prev.milestones.filter((m) => m.stageId !== stageId),
            practices: prev.practices.filter((p) => p.stageId !== stageId),
            growthSources: prev.growthSources.filter(
              (g) => g.stageId !== stageId,
            ),
          };
        }),
      );
    },
    [],
  );

  const moveStage: AppContextValue["moveStage"] = useCallback(
    (stageId, direction) => {
      setData(
        persist((prev) => {
          const stage = prev.stages.find((s) => s.id === stageId);
          if (!stage) return prev;
          const siblings = getStagesForDream(prev, stage.dreamId);
          const index = siblings.findIndex((s) => s.id === stageId);
          if (index < 0) return prev;
          const swapWith = direction === "up" ? index - 1 : index + 1;
          if (swapWith < 0 || swapWith >= siblings.length) return prev;

          const reordered = [...siblings];
          const [moved] = reordered.splice(index, 1);
          reordered.splice(swapWith, 0, moved);
          const ts = nowISO();
          const nextForDream = reordered.map((s, i) => ({
            ...s,
            order: i + 1,
            updatedAt: ts,
          }));

          return {
            ...prev,
            stages: [
              ...prev.stages.filter((s) => s.dreamId !== stage.dreamId),
              ...nextForDream,
            ],
          };
        }),
      );
    },
    [],
  );

  const setActiveStage: AppContextValue["setActiveStage"] = useCallback(
    (dreamId, stageId) => {
      setData(
        persist((prev) => {
          if (!canActivateStage(prev, dreamId, stageId).ok) return prev;
          return {
            ...prev,
            stages: prev.stages.map((s) => {
              if (s.dreamId !== dreamId) return s;
              return {
                ...s,
                status:
                  s.id === stageId
                    ? "active"
                    : s.status === "completed"
                      ? "completed"
                      : "planned",
                updatedAt: nowISO(),
              };
            }),
          };
        }),
      );
    },
    [],
  );

  const completeStage: AppContextValue["completeStage"] = useCallback(
    (stageId) => {
      setData(
        persist((prev) => {
          const stage = prev.stages.find((s) => s.id === stageId);
          if (!stage) return prev;
          const siblings = getStagesForDream(prev, stage.dreamId);
          const next = siblings.find((s) => s.order === stage.order + 1);
          return {
            ...prev,
            stages: prev.stages.map((s) => {
              if (s.id === stageId) {
                return { ...s, status: "completed", updatedAt: nowISO() };
              }
              if (next && s.id === next.id) {
                return { ...s, status: "active", updatedAt: nowISO() };
              }
              return s;
            }),
          };
        }),
      );
    },
    [],
  );

  const addMilestone: AppContextValue["addMilestone"] = useCallback(
    (stageId, input) => {
      setData(
        persist((prev) => {
          const order = prev.milestones.filter((m) => m.stageId === stageId)
            .length;
          return {
            ...prev,
            milestones: [
              ...prev.milestones,
              {
                id: createId("ms"),
                stageId,
                title: input.title.trim(),
                successMetric: input.successMetric.trim(),
                dueAt: input.dueAt || undefined,
                status: "open",
                order,
              },
            ],
          };
        }),
      );
    },
    [],
  );

  const toggleMilestone: AppContextValue["toggleMilestone"] = useCallback(
    (milestoneId) => {
      setData(
        persist((prev) => ({
          ...prev,
          milestones: prev.milestones.map((m) => {
            if (m.id !== milestoneId) return m;
            const done = m.status !== "done";
            return {
              ...m,
              status: done ? "done" : "open",
              completedAt: done ? nowISO() : undefined,
            };
          }),
        })),
      );
    },
    [],
  );

  const updateMilestone: AppContextValue["updateMilestone"] = useCallback(
    (milestoneId, input) => {
      setData(
        persist((prev) => ({
          ...prev,
          milestones: prev.milestones.map((m) =>
            m.id === milestoneId
              ? {
                  ...m,
                  title: input.title.trim(),
                  successMetric: input.successMetric.trim(),
                  dueAt: input.dueAt || undefined,
                }
              : m,
          ),
        })),
      );
    },
    [],
  );

  const removeMilestone: AppContextValue["removeMilestone"] = useCallback(
    (milestoneId) => {
      setData(
        persist((prev) => ({
          ...prev,
          milestones: prev.milestones.filter((m) => m.id !== milestoneId),
          checkIns: prev.checkIns.filter((c) => c.milestoneId !== milestoneId),
        })),
      );
    },
    [],
  );

  const addPractice: AppContextValue["addPractice"] = useCallback(
    (stageId, input) => {
      const tags = parseTags(input.tags ?? "");
      const minMinutes = parseMinMinutes(input.minMinutes ?? "");
      setData(
        persist((prev) => ({
          ...prev,
          practices: [
            ...prev.practices,
            {
              id: createId("practice"),
              stageId,
              title: input.title.trim(),
              frequency: input.frequency,
              cue: input.cue?.trim() || undefined,
              focus: input.focus?.trim() || undefined,
              whyForStage: input.whyForStage?.trim() || undefined,
              courseCheck: input.courseCheck,
              tags: tags.length ? tags : undefined,
              minMinutes,
              status: "active",
              createdAt: nowISO(),
            },
          ],
        })),
      );
    },
    [],
  );

  const updatePractice: AppContextValue["updatePractice"] = useCallback(
    (practiceId, input) => {
      const tags = parseTags(input.tags ?? "");
      const minMinutes = parseMinMinutes(input.minMinutes ?? "");
      setData(
        persist((prev) => ({
          ...prev,
          practices: prev.practices.map((p) =>
            p.id === practiceId
              ? {
                  ...p,
                  title: input.title.trim(),
                  frequency: input.frequency,
                  cue: input.cue?.trim() || undefined,
                  focus: input.focus?.trim() || undefined,
                  whyForStage: input.whyForStage?.trim() || undefined,
                  courseCheck: input.courseCheck,
                  tags: tags.length ? tags : undefined,
                  minMinutes,
                }
              : p,
          ),
        })),
      );
    },
    [],
  );

  const removePractice: AppContextValue["removePractice"] = useCallback(
    (practiceId) => {
      setData(
        persist((prev) => ({
          ...prev,
          practices: prev.practices.filter((p) => p.id !== practiceId),
          checkIns: prev.checkIns.filter((c) => c.practiceId !== practiceId),
          practiceTimers: (prev.practiceTimers ?? []).filter(
            (t) => t.practiceId !== practiceId,
          ),
        })),
      );
    },
    [],
  );

  const startPracticeTimer: AppContextValue["startPracticeTimer"] = useCallback(
    (practiceId) => {
      const ts = nowISO();
      setData(
        persist((prev) => {
          const practice = prev.practices.find((p) => p.id === practiceId);
          if (!practice) return prev;
          const periodKey = getPracticePeriodKey(practice);
          const timers = prev.practiceTimers ?? [];
          // Only one running timer: pause others.
          const pausedOthers = timers.map((t) => {
            if (t.practiceId === practiceId || !t.runningSince) return t;
            return {
              ...t,
              accumulatedMs: getTimerElapsedMs(t),
              runningSince: null,
            };
          });
          const existing = pausedOthers.find((t) => t.practiceId === practiceId);
          if (existing) {
            if (existing.runningSince) return prev;
            return {
              ...prev,
              practiceTimers: pausedOthers.map((t) =>
                t.practiceId === practiceId
                  ? {
                      ...t,
                      runningSince: ts,
                      periodKey: t.periodKey ?? periodKey,
                    }
                  : t,
              ),
            };
          }
          return {
            ...prev,
            practiceTimers: [
              ...pausedOthers,
              {
                practiceId,
                accumulatedMs: 0,
                runningSince: ts,
                periodKey,
              },
            ],
          };
        }),
      );
    },
    [],
  );

  const pausePracticeTimer: AppContextValue["pausePracticeTimer"] = useCallback(
    (practiceId) => {
      setData(
        persist((prev) => {
          const timers = prev.practiceTimers ?? [];
          const existing = timers.find((t) => t.practiceId === practiceId);
          if (!existing?.runningSince) return prev;
          return {
            ...prev,
            practiceTimers: timers.map((t) =>
              t.practiceId === practiceId
                ? {
                    ...t,
                    accumulatedMs: getTimerElapsedMs(t),
                    runningSince: null,
                  }
                : t,
            ),
          };
        }),
      );
    },
    [],
  );

  const resetPracticeTimer: AppContextValue["resetPracticeTimer"] = useCallback(
    (practiceId) => {
      setData(
        persist((prev) => ({
          ...prev,
          practiceTimers: (prev.practiceTimers ?? []).filter(
            (t) => t.practiceId !== practiceId,
          ),
        })),
      );
    },
    [],
  );

  const setPracticeTimerMinutes: AppContextValue["setPracticeTimerMinutes"] =
    useCallback((practiceId, minutes) => {
      const safe = Math.max(0, Math.min(24 * 60, Math.round(minutes)));
      setData(
        persist((prev) => {
          const practice = prev.practices.find((p) => p.id === practiceId);
          if (!practice) return prev;
          const periodKey = getPracticePeriodKey(practice);
          const existing = (prev.practiceTimers ?? []).find(
            (t) => t.practiceId === practiceId,
          );
          const others = (prev.practiceTimers ?? []).filter(
            (t) => t.practiceId !== practiceId,
          );
          if (safe === 0) {
            return { ...prev, practiceTimers: others };
          }
          return {
            ...prev,
            practiceTimers: [
              ...others,
              {
                practiceId,
                accumulatedMs: safe * 60_000,
                runningSince: null,
                periodKey: existing?.periodKey ?? periodKey,
                momentsShown: existing?.momentsShown,
                lastCheckpointElapsedMs: existing?.lastCheckpointElapsedMs,
              },
            ],
          };
        }),
      );
    }, []);

  const markPracticeMoments: AppContextValue["markPracticeMoments"] =
    useCallback((practiceId, kinds, options) => {
      setData(
        persist((prev) => {
          const practice = prev.practices.find((p) => p.id === practiceId);
          if (!practice) return prev;
          const timers = prev.practiceTimers ?? [];
          const existing = timers.find((t) => t.practiceId === practiceId);
          const merged =
            kinds.length > 0
              ? (Array.from(
                  new Set([...(existing?.momentsShown ?? []), ...kinds]),
                ) as PracticeMomentKind[])
              : existing?.momentsShown;
          const checkpointElapsedMs =
            options?.checkpointElapsedMs ?? existing?.lastCheckpointElapsedMs;
          const pendingMoment =
            options && "pendingMoment" in options
              ? options.pendingMoment
              : existing?.pendingMoment;
          const longRunReviewed =
            options?.longRunReviewed ?? existing?.longRunReviewed;

          const patch = {
            momentsShown: merged,
            lastCheckpointElapsedMs: checkpointElapsedMs,
            pendingMoment: pendingMoment ?? null,
            longRunReviewed: Boolean(longRunReviewed),
          };

          if (existing) {
            return {
              ...prev,
              practiceTimers: timers.map((t) =>
                t.practiceId === practiceId ? { ...t, ...patch } : t,
              ),
            };
          }

          // No live session — don't spawn a zero-time timer just to store flags.
          return prev;
        }),
      );
    }, []);

  const clearPracticeMoments: AppContextValue["clearPracticeMoments"] =
    useCallback((practiceId) => {
      setData(
        persist((prev) => ({
          ...prev,
          practiceTimers: (prev.practiceTimers ?? []).map((t) =>
            t.practiceId === practiceId
              ? {
                  ...t,
                  momentsShown: [],
                  lastCheckpointElapsedMs: undefined,
                }
              : t,
          ),
        })),
      );
    }, []);

  const setPracticeMinMinutes: AppContextValue["setPracticeMinMinutes"] =
    useCallback((practiceId, minMinutes) => {
      const safe = Math.max(1, Math.min(24 * 60, Math.round(minMinutes)));
      setData(
        persist((prev) => ({
          ...prev,
          practices: prev.practices.map((p) =>
            p.id === practiceId ? { ...p, minMinutes: safe } : p,
          ),
        })),
      );
    }, []);

  const completePracticeWithTimer: AppContextValue["completePracticeWithTimer"] =
    useCallback((practiceId, frequency) => {
      const ref = new Date();
      const periodKey =
        frequency === "weekly" ? weekStartISO(ref) : todayISO();
      const weekStart = weekStartISO(ref);
      const weekEnd = weekEndISO(ref);
      let minutesSpent = 0;
      let status: CheckInStatus = "partial";
      let minMinutes: number | undefined;
      let practiceTitle = "Практика";
      let reward = null as ReturnType<typeof rewardFromDataChange>;

      setData(
        persist((prev) => {
          const session = (prev.practiceTimers ?? []).find(
            (t) => t.practiceId === practiceId,
          );
          const practice = prev.practices.find((p) => p.id === practiceId);
          minutesSpent = elapsedToMinutes(getTimerElapsedMs(session));
          status = resolveEffortStatus(practice, minutesSpent);
          minMinutes = practice?.minMinutes;
          practiceTitle = practice?.title?.trim() || practiceTitle;

          const withoutPeriod = prev.checkIns.filter((c) => {
            if (c.practiceId !== practiceId) return true;
            if (frequency === "daily") return c.date !== periodKey;
            return !(c.date >= weekStart && c.date <= weekEnd);
          });

          const next: AppData = {
            ...prev,
            checkIns: [
              ...withoutPeriod,
              {
                id: createId("checkin"),
                practiceId,
                date: periodKey,
                status,
                minutesSpent: minutesSpent > 0 ? minutesSpent : undefined,
                createdAt: nowISO(),
              },
            ],
            practiceTimers: (prev.practiceTimers ?? []).filter(
              (t) => t.practiceId !== practiceId,
            ),
          };
          reward = rewardFromDataChange(prev, next, {
            practiceTitle,
            status,
            minutesSpent,
            minMinutes,
          });
          return next;
        }),
      );

      if (reward) {
        pushSessionReward(reward);
      } else {
        pushToast(
          motivationCopy(
            status,
            minutesSpent,
            minMinutes,
            xpForCheckInStatus(status),
          ),
        );
      }
      return { minutesSpent, status };
    }, []);

  const claimPracticeWithoutTimer: AppContextValue["claimPracticeWithoutTimer"] =
    useCallback((practiceId, frequency) => {
      const ref = new Date();
      const periodKey =
        frequency === "weekly" ? weekStartISO(ref) : todayISO();
      const weekStart = weekStartISO(ref);
      const weekEnd = weekEndISO(ref);
      const result: { status: CheckInStatus } = { status: "done" };
      let practiceTitle = "Практика";
      let reward = null as ReturnType<typeof rewardFromDataChange>;

      setData(
        persist((prev) => {
          const practice = prev.practices.find((p) => p.id === practiceId);
          result.status = resolveClaimWithoutTimer(practice);
          practiceTitle = practice?.title?.trim() || practiceTitle;
          const withoutPeriod = prev.checkIns.filter((c) => {
            if (c.practiceId !== practiceId) return true;
            if (frequency === "daily") return c.date !== periodKey;
            return !(c.date >= weekStart && c.date <= weekEnd);
          });
          const next: AppData = {
            ...prev,
            checkIns: [
              ...withoutPeriod,
              {
                id: createId("checkin"),
                practiceId,
                date: periodKey,
                status: result.status,
                createdAt: nowISO(),
              },
            ],
            practiceTimers: (prev.practiceTimers ?? []).filter(
              (t) => t.practiceId !== practiceId,
            ),
          };
          reward = rewardFromDataChange(prev, next, {
            practiceTitle,
            status: result.status,
            minMinutes: practice?.minMinutes,
          });
          return next;
        }),
      );

      if (reward) {
        pushSessionReward(reward);
      } else {
        pushToast(
          result.status === "partial"
            ? "Частично без таймера — минимум не подтверждён временем"
            : `Сделано без таймера · +${xpForCheckInStatus(result.status)} XP`,
        );
      }
      return result.status;
    }, []);

  const settlePracticeTimers: AppContextValue["settlePracticeTimers"] =
    useCallback(() => {
      setData(
        persist((prev) => {
          const { data: next, messages } = settleExpiredTimers(prev);
          for (const msg of messages) pushToast(msg);
          return next;
        }),
      );
    }, []);

  const updateProfile: AppContextValue["updateProfile"] = useCallback(
    (patch) => {
      setData(
        persist((prev) => ({
          ...prev,
          profile: {
            name:
              patch.name !== undefined
                ? patch.name.trim()
                : (prev.profile?.name ?? ""),
            presentation:
              patch.presentation !== undefined
                ? patch.presentation
                : prev.profile?.presentation,
            skinId:
              patch.skinId !== undefined
                ? patch.skinId
                : prev.profile?.skinId,
            reminders:
              patch.reminders !== undefined
                ? normalizeReminders(patch.reminders)
                : normalizeReminders(prev.profile?.reminders),
            strictLadder:
              patch.strictLadder !== undefined
                ? patch.strictLadder
                : Boolean(prev.profile?.strictLadder),
          },
        })),
      );
    },
    [],
  );

  const markReminderSent: AppContextValue["markReminderSent"] = useCallback(
    (dateISO) => {
      setData(
        persist((prev) => {
          const reminders = normalizeReminders(prev.profile?.reminders);
          return {
            ...prev,
            profile: {
              ...prev.profile,
              name: prev.profile?.name ?? "",
              reminders: { ...reminders, lastSentDate: dateISO },
            },
          };
        }),
      );
    },
    [],
  );

  const setCheckIn: AppContextValue["setCheckIn"] = useCallback(
    (practiceId, date, status) => {
      setData(
        persist((prev) => {
          const existing = prev.checkIns.find(
            (c) => c.practiceId === practiceId && c.date === date,
          );
          if (existing) {
            return {
              ...prev,
              checkIns: prev.checkIns.map((c) =>
                c.id === existing.id ? { ...c, status } : c,
              ),
            };
          }
          return {
            ...prev,
            checkIns: [
              ...prev.checkIns,
              {
                id: createId("checkin"),
                practiceId,
                date,
                status,
                createdAt: nowISO(),
              },
            ],
          };
        }),
      );
    },
    [],
  );

  const clearCheckIn: AppContextValue["clearCheckIn"] = useCallback(
    (practiceId, date) => {
      setData(
        persist((prev) => ({
          ...prev,
          checkIns: prev.checkIns.filter(
            (c) => !(c.practiceId === practiceId && c.date === date),
          ),
        })),
      );
    },
    [],
  );

  const setPracticePeriodCheckIn: AppContextValue["setPracticePeriodCheckIn"] =
    useCallback((practiceId, frequency, status, minutesSpent) => {
      const ref = new Date();
      const periodKey =
        frequency === "weekly" ? weekStartISO(ref) : todayISO();
      const weekStart = weekStartISO(ref);
      const weekEnd = weekEndISO(ref);

      setData(
        persist((prev) => {
          const withoutPeriod = prev.checkIns.filter((c) => {
            if (c.practiceId !== practiceId) return true;
            if (frequency === "daily") return c.date !== periodKey;
            return !(c.date >= weekStart && c.date <= weekEnd);
          });
          return {
            ...prev,
            checkIns: [
              ...withoutPeriod,
              {
                id: createId("checkin"),
                practiceId,
                date: periodKey,
                status,
                minutesSpent:
                  minutesSpent && minutesSpent > 0 ? minutesSpent : undefined,
                createdAt: nowISO(),
              },
            ],
            practiceTimers: (prev.practiceTimers ?? []).filter(
              (t) => t.practiceId !== practiceId,
            ),
          };
        }),
      );
    }, []);

  const clearPracticePeriodCheckIn: AppContextValue["clearPracticePeriodCheckIn"] =
    useCallback((practiceId, frequency) => {
      const ref = new Date();
      const periodKey =
        frequency === "weekly" ? weekStartISO(ref) : todayISO();
      const weekStart = weekStartISO(ref);
      const weekEnd = weekEndISO(ref);

      setData(
        persist((prev) => ({
          ...prev,
          checkIns: prev.checkIns.filter((c) => {
            if (c.practiceId !== practiceId) return true;
            if (frequency === "daily") return c.date !== periodKey;
            return !(c.date >= weekStart && c.date <= weekEnd);
          }),
        })),
      );
    }, []);

  const addGrowthSource: AppContextValue["addGrowthSource"] = useCallback(
    (stageId, input) => {
      const role = input.role ?? "material";
      setData(
        persist((prev) => {
          const stageTeachers = prev.growthSources.filter(
            (g) =>
              g.stageId === stageId && (g.role ?? "material") === "teacher",
          );
          const makePrimary =
            role === "teacher" &&
            (input.primary || stageTeachers.length === 0);
          const cleared = makePrimary
            ? prev.growthSources.map((g) =>
                g.stageId === stageId && (g.role ?? "material") === "teacher"
                  ? { ...g, primary: false }
                  : g,
              )
            : prev.growthSources;
          return {
            ...prev,
            growthSources: [
              ...cleared,
              {
                id: createId("source"),
                stageId,
                title: input.title.trim(),
                type: input.type,
                url: input.url?.trim() || undefined,
                notes: input.notes?.trim() || undefined,
                role,
                primary: makePrimary || undefined,
                teaching:
                  role === "teacher"
                    ? input.teaching?.trim() || undefined
                    : undefined,
                weekLesson:
                  role === "teacher"
                    ? input.weekLesson?.trim() || undefined
                    : undefined,
              },
            ],
          };
        }),
      );
    },
    [],
  );

  const updateGrowthSource: AppContextValue["updateGrowthSource"] = useCallback(
    (sourceId, input) => {
      setData(
        persist((prev) => {
          const current = prev.growthSources.find((g) => g.id === sourceId);
          if (!current) return prev;
          const role = input.role ?? current.role ?? "material";
          const makePrimary =
            role === "teacher" && Boolean(input.primary);
          return {
            ...prev,
            growthSources: prev.growthSources.map((g) => {
              if (
                makePrimary &&
                g.stageId === current.stageId &&
                (g.role ?? "material") === "teacher" &&
                g.id !== sourceId
              ) {
                return { ...g, primary: false };
              }
              if (g.id !== sourceId) return g;
              return {
                ...g,
                title: input.title.trim(),
                type: input.type,
                url: input.url?.trim() || undefined,
                notes: input.notes?.trim() || undefined,
                role,
                primary:
                  role === "teacher"
                    ? makePrimary || g.primary || undefined
                    : undefined,
                teaching:
                  role === "teacher"
                    ? input.teaching?.trim() || undefined
                    : undefined,
                weekLesson:
                  role === "teacher"
                    ? input.weekLesson?.trim() || undefined
                    : undefined,
              };
            }),
          };
        }),
      );
    },
    [],
  );

  const removeGrowthSource: AppContextValue["removeGrowthSource"] = useCallback(
    (sourceId) => {
      setData(
        persist((prev) => ({
          ...prev,
          growthSources: prev.growthSources.filter((g) => g.id !== sourceId),
        })),
      );
    },
    [],
  );

  const setPrimaryTeacher: AppContextValue["setPrimaryTeacher"] = useCallback(
    (sourceId) => {
      setData(
        persist((prev) => {
          const target = prev.growthSources.find((g) => g.id === sourceId);
          if (!target || (target.role ?? "material") !== "teacher") {
            return prev;
          }
          return {
            ...prev,
            growthSources: prev.growthSources.map((g) => {
              if (g.stageId !== target.stageId) return g;
              if ((g.role ?? "material") !== "teacher") return g;
              return {
                ...g,
                primary: g.id === sourceId,
              };
            }),
          };
        }),
      );
    },
    [],
  );

  const addObstacle: AppContextValue["addObstacle"] = useCallback((input) => {
    setData(
      persist((prev) => ({
        ...prev,
        obstacles: [
          ...prev.obstacles,
          {
            id: createId("obstacle"),
            dreamId: input.dreamId,
            stageId: input.stageId,
            description: input.description.trim(),
          },
        ],
      })),
    );
  }, []);

  const updateObstacle: AppContextValue["updateObstacle"] = useCallback(
    (id, description) => {
      setData(
        persist((prev) => ({
          ...prev,
          obstacles: prev.obstacles.map((o) =>
            o.id === id ? { ...o, description: description.trim() } : o,
          ),
        })),
      );
    },
    [],
  );

  const removeObstacle: AppContextValue["removeObstacle"] = useCallback(
    (id) => {
      setData(
        persist((prev) => ({
          ...prev,
          obstacles: prev.obstacles.filter((o) => o.id !== id),
          // Планы живут на ветке препятствия — удаляем вместе с ним
          intentions: prev.intentions.filter((i) => i.obstacleId !== id),
        })),
      );
    },
    [],
  );

  const addIntention: AppContextValue["addIntention"] = useCallback((input) => {
    setData(
      persist((prev) => ({
        ...prev,
        intentions: [
          ...prev.intentions,
          {
            id: createId("intent"),
            dreamId: input.dreamId,
            stageId: input.stageId,
            obstacleId: input.obstacleId,
            ifCondition: input.ifCondition.trim(),
            thenAction: input.thenAction.trim(),
          },
        ],
      })),
    );
  }, []);

  const updateIntention: AppContextValue["updateIntention"] = useCallback(
    (id, input) => {
      setData(
        persist((prev) => ({
          ...prev,
          intentions: prev.intentions.map((i) =>
            i.id === id
              ? {
                  ...i,
                  ifCondition: input.ifCondition.trim(),
                  thenAction: input.thenAction.trim(),
                }
              : i,
          ),
        })),
      );
    },
    [],
  );

  const removeIntention: AppContextValue["removeIntention"] = useCallback(
    (id) => {
      setData(
        persist((prev) => ({
          ...prev,
          intentions: prev.intentions.filter((i) => i.id !== id),
        })),
      );
    },
    [],
  );

  const saveReview: AppContextValue["saveReview"] = useCallback((input) => {
    const weekStart = weekStartISO();
    const dateFrom = weekStart;
    const today = todayISO();
    setData(
      persist((prev) => {
        const stage = getActiveStage(prev, input.dreamId);
        const stagePractices = stage
          ? getPractices(prev, stage.id).map((p) => p.id)
          : [];
        const checkInsDone = prev.checkIns.filter(
          (c) =>
            (c.status === "done" || c.status === "strong") &&
            c.date >= dateFrom &&
            c.date <= today &&
            c.practiceId &&
            stagePractices.includes(c.practiceId),
        ).length;
        const milestonesDone = stage
          ? getMilestones(prev, stage.id).filter(
              (m) =>
                m.status === "done" &&
                m.completedAt &&
                m.completedAt.slice(0, 10) >= dateFrom,
            ).length
          : 0;

        const existing = prev.reviews.find(
          (r) => r.dreamId === input.dreamId && r.weekStart === weekStart,
        );
        const payload = {
          worked: input.worked.trim(),
          blocked: input.blocked.trim(),
          nextChange: input.nextChange.trim(),
          learningUsed: input.learningUsed?.trim() || undefined,
          learningWindows: input.learningWindows,
          weekLessonTouch: input.weekLessonTouch,
          weekLessonSnapshot: input.weekLessonSnapshot?.trim() || undefined,
          statsSnapshot: { checkInsDone, milestonesDone },
          createdAt: nowISO(),
        };

        if (existing) {
          return {
            ...prev,
            reviews: prev.reviews.map((r) =>
              r.id === existing.id ? { ...r, ...payload } : r,
            ),
          };
        }

        return {
          ...prev,
          reviews: [
            ...prev.reviews,
            {
              id: createId("review"),
              dreamId: input.dreamId,
              weekStart,
              ...payload,
            },
          ],
        };
      }),
    );
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      ready,
      data,
      focusDreamId: focusDream?.id,
      exportBackup,
      importBackupFile,
      createDream,
      setFocusDream,
      updateDream,
      savePointA,
      replaceStages,
      updateStage,
      addStage,
      removeStage,
      moveStage,
      setActiveStage,
      completeStage,
      addMilestone,
      toggleMilestone,
      updateMilestone,
      removeMilestone,
      addPractice,
      updatePractice,
      removePractice,
      startPracticeTimer,
      pausePracticeTimer,
      resetPracticeTimer,
      setPracticeTimerMinutes,
      markPracticeMoments,
      clearPracticeMoments,
      setPracticeMinMinutes,
      completePracticeWithTimer,
      claimPracticeWithoutTimer,
      settlePracticeTimers,
      updateProfile,
      markReminderSent,
      setCheckIn,
      clearCheckIn,
      setPracticePeriodCheckIn,
      clearPracticePeriodCheckIn,
      addGrowthSource,
      updateGrowthSource,
      removeGrowthSource,
      setPrimaryTeacher,
      addObstacle,
      updateObstacle,
      removeObstacle,
      addIntention,
      updateIntention,
      removeIntention,
      saveReview,
    }),
    [
      ready,
      data,
      focusDream?.id,
      exportBackup,
      importBackupFile,
      createDream,
      setFocusDream,
      updateDream,
      savePointA,
      replaceStages,
      updateStage,
      addStage,
      removeStage,
      moveStage,
      setActiveStage,
      completeStage,
      addMilestone,
      toggleMilestone,
      updateMilestone,
      removeMilestone,
      addPractice,
      updatePractice,
      removePractice,
      startPracticeTimer,
      pausePracticeTimer,
      resetPracticeTimer,
      setPracticeTimerMinutes,
      markPracticeMoments,
      clearPracticeMoments,
      setPracticeMinMinutes,
      completePracticeWithTimer,
      claimPracticeWithoutTimer,
      settlePracticeTimers,
      updateProfile,
      markReminderSent,
      setCheckIn,
      clearCheckIn,
      setPracticePeriodCheckIn,
      clearPracticePeriodCheckIn,
      addGrowthSource,
      updateGrowthSource,
      removeGrowthSource,
      setPrimaryTeacher,
      addObstacle,
      updateObstacle,
      removeObstacle,
      addIntention,
      updateIntention,
      removeIntention,
      saveReview,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
