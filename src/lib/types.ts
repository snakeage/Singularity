export type DreamStatus = "draft" | "active" | "paused" | "achieved" | "abandoned";
export type StageStatus = "planned" | "active" | "completed";
export type MilestoneStatus = "open" | "done";
export type PracticeStatus = "active" | "paused" | "retired";
export type PracticeFrequency = "daily" | "weekly";
/** Keeps practices from drifting into side quests (Zemlyanin course filter). */
export type CourseCheck = "on_course" | "unsure" | "side_quest";
/** Effort level for a practice period — not just binary done/skip. */
export type CheckInStatus = "skipped" | "partial" | "done" | "strong";
export type GrowthSourceType =
  | "book"
  | "course"
  | "mentor"
  | "practice"
  | "ai"
  | "other";

export type Dream = {
  id: string;
  title: string;
  why: string;
  outcomeVision: string;
  horizon: string;
  context?: string;
  status: DreamStatus;
  createdAt: string;
  updatedAt: string;
};

export type PointA = {
  id: string;
  dreamId: string;
  skills: string;
  resources: string;
  constraints: string;
  notes?: string;
  capturedAt: string;
};

export type Stage = {
  id: string;
  dreamId: string;
  order: number;
  title: string;
  objective: string;
  exitCriteria: string;
  status: StageStatus;
  createdAt: string;
  updatedAt: string;
};

export type Milestone = {
  id: string;
  stageId: string;
  title: string;
  successMetric: string;
  dueAt?: string;
  status: MilestoneStatus;
  completedAt?: string;
  order?: number;
};

export type Practice = {
  id: string;
  stageId: string;
  title: string;
  frequency: PracticeFrequency;
  cue?: string;
  focus?: string;
  whyForStage?: string;
  /** Explicit course filter answer when the practice was added/edited. */
  courseCheck?: CourseCheck;
  /** Short labels for filter/search, e.g. "сила", "учёба" */
  tags?: string[];
  /** Minimum focused minutes for a done mark (optional). */
  minMinutes?: number;
  status: PracticeStatus;
  createdAt: string;
};

export type CheckIn = {
  id: string;
  practiceId?: string;
  milestoneId?: string;
  date: string;
  status: CheckInStatus;
  note?: string;
  /** Minutes actually spent (from timer or manual). */
  minutesSpent?: number;
  createdAt: string;
};

/** Pause/resume session for a practice timer. */
export type PracticeMomentKind = "norma" | "strong";

export type PracticeTimerSession = {
  practiceId: string;
  accumulatedMs: number;
  /** ISO timestamp while running; null when paused. */
  runningSince: string | null;
  /** Day ISO or week-start ISO this session belongs to. */
  periodKey?: string;
  /** Threshold dialogs already shown this period. */
  momentsShown?: PracticeMomentKind[];
};

/** material = book/course/etc; teacher = mentor figure for the stage (Lacuna-lane). */
export type GrowthSourceRole = "teacher" | "material";

export type GrowthSource = {
  id: string;
  stageId: string;
  title: string;
  type: GrowthSourceType;
  url?: string;
  notes?: string;
  /** Defaults to material when missing (legacy data). */
  role?: GrowthSourceRole;
  /** At most one primary teacher per stage. */
  primary?: boolean;
  /** What this teacher trains you for on this stage. */
  teaching?: string;
  /** Current week focus / lesson from the teacher. */
  weekLesson?: string;
};

export type Obstacle = {
  id: string;
  dreamId?: string;
  stageId?: string;
  description: string;
};

export type ImplementationIntention = {
  id: string;
  dreamId?: string;
  stageId?: string;
  ifCondition: string;
  thenAction: string;
  obstacleId?: string;
};

/** Weekly review: free time appeared → used for learning under the stage? */
export type LearningWindowStatus = "none" | "missed" | "used";
/** Did you move the teacher's week lesson this week? */
export type WeekLessonTouch = "no_lesson" | "missed" | "touched" | "done";

export type Review = {
  id: string;
  dreamId: string;
  weekStart: string;
  worked: string;
  blocked: string;
  nextChange: string;
  /** Free-text: what the learning windows went into. */
  learningUsed?: string;
  /** Structured answer for the Zemlyanin "learn in windows" rule. */
  learningWindows?: LearningWindowStatus;
  /** Progress on the primary teacher's week lesson. */
  weekLessonTouch?: WeekLessonTouch;
  /** Snapshot of the week lesson at review save (for history). */
  weekLessonSnapshot?: string;
  statsSnapshot?: {
    checkInsDone: number;
    milestonesDone: number;
  };
  createdAt: string;
};

export type Reminders = {
  enabled: boolean;
  /** Local time HH:MM */
  time: string;
  /** ISO date (YYYY-MM-DD) of last fired reminder */
  lastSentDate?: string;
};

export type Profile = {
  name: string;
  reminders?: Reminders;
  /** Block activating a stage while earlier ones are unfinished. */
  strictLadder?: boolean;
};

export type AppData = {
  version: 1;
  profile: Profile;
  dreams: Dream[];
  pointAs: PointA[];
  stages: Stage[];
  milestones: Milestone[];
  practices: Practice[];
  checkIns: CheckIn[];
  growthSources: GrowthSource[];
  obstacles: Obstacle[];
  intentions: ImplementationIntention[];
  reviews: Review[];
  practiceTimers: PracticeTimerSession[];
};

export const EMPTY_DATA: AppData = {
  version: 1,
  profile: { name: "" },
  dreams: [],
  pointAs: [],
  stages: [],
  milestones: [],
  practices: [],
  checkIns: [],
  growthSources: [],
  obstacles: [],
  intentions: [],
  reviews: [],
  practiceTimers: [],
};
