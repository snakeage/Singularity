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
import { nowISO, todayISO, weekStartISO } from "@/lib/dates";
import { createId } from "@/lib/id";
import {
  getActiveStage,
  getFocusDream,
  getMilestones,
  getPractices,
  getStagesForDream,
} from "@/lib/selectors";
import { loadData, saveData } from "@/lib/storage";
import {
  EMPTY_DATA,
  type AppData,
  type CheckInStatus,
  type GrowthSourceType,
  type PracticeFrequency,
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
  setActiveStage: (dreamId: string, stageId: string) => void;
  completeStage: (stageId: string) => void;
  addMilestone: (
    stageId: string,
    input: { title: string; successMetric: string; dueAt?: string },
  ) => void;
  toggleMilestone: (milestoneId: string) => void;
  addPractice: (
    stageId: string,
    input: {
      title: string;
      frequency: PracticeFrequency;
      cue?: string;
      focus?: string;
      whyForStage?: string;
    },
  ) => void;
  setCheckIn: (
    practiceId: string,
    date: string,
    status: CheckInStatus,
  ) => void;
  addGrowthSource: (
    stageId: string,
    input: {
      title: string;
      type: GrowthSourceType;
      url?: string;
      notes?: string;
    },
  ) => void;
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
    setData(loadData());
    setReady(true);
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
          const existing = prev.pointAs.find((p) => p.dreamId === dreamId);
          if (existing) {
            return {
              ...prev,
              pointAs: prev.pointAs.map((p) =>
                p.dreamId === dreamId
                  ? {
                      ...p,
                      skills: input.skills,
                      resources: input.resources,
                      constraints: input.constraints,
                      notes: input.notes,
                      capturedAt: nowISO(),
                    }
                  : p,
              ),
            };
          }
          return {
            ...prev,
            pointAs: [
              ...prev.pointAs,
              {
                id: createId("pointa"),
                dreamId,
                skills: input.skills,
                resources: input.resources,
                constraints: input.constraints,
                notes: input.notes,
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
              i === activeIndex
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

  const setActiveStage: AppContextValue["setActiveStage"] = useCallback(
    (dreamId, stageId) => {
      setData(
        persist((prev) => ({
          ...prev,
          stages: prev.stages.map((s) => {
            if (s.dreamId !== dreamId) return s;
            return {
              ...s,
              status: s.id === stageId ? "active" : s.status === "completed" ? "completed" : "planned",
              updatedAt: nowISO(),
            };
          }),
        })),
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

  const addPractice: AppContextValue["addPractice"] = useCallback(
    (stageId, input) => {
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
              status: "active",
              createdAt: nowISO(),
            },
          ],
        })),
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

  const addGrowthSource: AppContextValue["addGrowthSource"] = useCallback(
    (stageId, input) => {
      setData(
        persist((prev) => ({
          ...prev,
          growthSources: [
            ...prev.growthSources,
            {
              id: createId("source"),
              stageId,
              title: input.title.trim(),
              type: input.type,
              url: input.url?.trim() || undefined,
              notes: input.notes?.trim() || undefined,
            },
          ],
        })),
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
            c.status === "done" &&
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
      updateDream,
      savePointA,
      replaceStages,
      setActiveStage,
      completeStage,
      addMilestone,
      toggleMilestone,
      addPractice,
      setCheckIn,
      addGrowthSource,
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
      updateDream,
      savePointA,
      replaceStages,
      setActiveStage,
      completeStage,
      addMilestone,
      toggleMilestone,
      addPractice,
      setCheckIn,
      addGrowthSource,
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
