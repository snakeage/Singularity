import type { CourseCheck } from "@/lib/types";

export const COURSE_CHECK_LABEL: Record<CourseCheck, string> = {
  on_course: "К этапу",
  unsure: "Не уверен",
  side_quest: "Боковой квест",
};

export const COURSE_CHECK_HINT: Record<CourseCheck, string> = {
  on_course: "Прямо двигает текущий этап и мечту.",
  unsure: "Сохрани, но допиши «зачем этапу» — иначе легко уйти с курса.",
  side_quest: "Осознанное отклонение. Не путай с работой по лестнице.",
};

export function courseCheckTone(
  check: CourseCheck,
): "accent" | "partial" | "skip" {
  if (check === "on_course") return "accent";
  if (check === "unsure") return "partial";
  return "skip";
}
