export type DreamStatus = "draft" | "active" | "paused" | "achieved" | "abandoned";
export type StageStatus = "planned" | "active" | "completed";
export type MilestoneStatus = "open" | "done";
export type PracticeStatus = "active" | "paused" | "retired";
export type PracticeFrequency = "daily" | "weekly";
export type CheckInStatus = "done" | "skipped";
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
  createdAt: string;
};

export type GrowthSource = {
  id: string;
  stageId: string;
  title: string;
  type: GrowthSourceType;
  url?: string;
  notes?: string;
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

export type Review = {
  id: string;
  dreamId: string;
  weekStart: string;
  worked: string;
  blocked: string;
  nextChange: string;
  learningUsed?: string;
  statsSnapshot?: {
    checkInsDone: number;
    milestonesDone: number;
  };
  createdAt: string;
};

export type AppData = {
  version: 1;
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
};

export const EMPTY_DATA: AppData = {
  version: 1,
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
};
