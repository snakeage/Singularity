import type { GrowthSource, Practice } from "@/lib/types";

export type MomentKind = "norma" | "strong";

export const FALLBACK_SPEAKER = "Голос учителя";

export function momentSpeaker(teacher?: GrowthSource | null): string {
  const name = teacher?.title?.trim();
  return name || FALLBACK_SPEAKER;
}

export function momentBody(
  kind: MomentKind,
  practice: Practice,
  minutes: number,
  speaker: string,
  teacher?: GrowthSource | null,
): string {
  const title = practice.title;
  const lesson = teacher?.weekLesson?.trim();

  if (kind === "norma") {
    if (lesson) {
      return `${speaker}: норма по «${title}» закрыта · ${minutes} мин. Урок недели — «${lesson}». Можно продолжить к сильному заходу или закрыть практику.`;
    }
    return `${speaker}: норма по «${title}» закрыта · ${minutes} мин. На ступени так и растут — делом. Продолжай или закрой практику.`;
  }

  if (lesson) {
    return `${speaker}: сильный заход по «${title}» · ${minutes} мин. Запас доказан. Можно продолжить, закрыть или поднять планку — плавно (+ступень) или подкалибровать, если минимум был занижен.`;
  }
  return `${speaker}: сильный заход по «${title}» · ${minutes} мин. Запас есть. Продолжай, закрой или подними норму (плавно / подкалибровка).`;
}

export const MOMENT_IMAGE: Record<MomentKind, string> = {
  norma: "/moments/norma.jpg",
  strong: "/moments/strong.jpg",
};
