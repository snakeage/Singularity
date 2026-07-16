import type { LearningWindowStatus, WeekLessonTouch } from "@/lib/types";

export const LEARNING_WINDOW_LABEL: Record<LearningWindowStatus, string> = {
  none: "Окон не было",
  missed: "Были — сжёг",
  used: "Были — вложил",
};

export const LEARNING_WINDOW_HINT: Record<LearningWindowStatus, string> = {
  none: "Неделя без свободных окон — тоже честный ответ.",
  missed: "Время было, но ушло мимо учёбы под этап.",
  used: "Окно пошло в урок / книгу / ментора / ИИ под текущий этап.",
};

export function learningWindowTone(
  status: LearningWindowStatus,
): "muted" | "skip" | "accent" {
  if (status === "used") return "accent";
  if (status === "missed") return "skip";
  return "muted";
}

export const WEEK_LESSON_TOUCH_LABEL: Record<WeekLessonTouch, string> = {
  no_lesson: "Урока не было",
  missed: "Мимо урока",
  touched: "Задел урок",
  done: "Закрыл урок",
};

export function weekLessonTouchTone(
  touch: WeekLessonTouch,
): "muted" | "skip" | "partial" | "strong" {
  if (touch === "done") return "strong";
  if (touch === "touched") return "partial";
  if (touch === "missed") return "skip";
  return "muted";
}
