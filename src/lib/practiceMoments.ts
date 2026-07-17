import type { GrowthSource, Practice } from "@/lib/types";

export type MomentKind = "norma" | "strong" | "overwork" | "checkpoint";

/** Minutes after strong before first/next checkpoint card. */
export const CHECKPOINT_EVERY_MINUTES = 25;

/** Overwork fires at this multiple of minMinutes (once per period). */
export const OVERWORK_MIN_MULTIPLIER = 2;

export const FALLBACK_SPEAKER = "Голос учителя";

export function momentSpeaker(teacher?: GrowthSource | null): string {
  const name = teacher?.title?.trim();
  return name || FALLBACK_SPEAKER;
}

export function momentHeading(kind: MomentKind): string {
  switch (kind) {
    case "norma":
      return "Норма закрыта";
    case "strong":
      return "Сильный заход";
    case "overwork":
      return "Далеко за целью";
    case "checkpoint":
      return "Ещё на посту";
  }
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
  const min = practice.minMinutes;

  if (kind === "norma") {
    if (lesson) {
      return `${speaker}: норма по «${title}» закрыта · ${minutes} мин. Урок недели — «${lesson}». Можно продолжить к сильному заходу или закрыть практику.`;
    }
    return `${speaker}: норма по «${title}» закрыта · ${minutes} мин. На ступени так и растут — делом. Продолжай или закрой практику.`;
  }

  if (kind === "strong") {
    if (lesson) {
      return `${speaker}: сильный заход по «${title}» · ${minutes} мин. Запас доказан. Можно продолжить, закрыть или поднять планку — плавно (+ступень) или подкалибровать, если минимум был занижен.`;
    }
    return `${speaker}: сильный заход по «${title}» · ${minutes} мин. Запас есть. Продолжай, закрой или подними норму (плавно / подкалибровка).`;
  }

  if (kind === "overwork") {
    const plan = min ? `план был ${min} мин, сейчас ${minutes}` : `${minutes} мин`;
    return `${speaker}: ты далеко за целью по «${title}» (${plan}). Можно честно закрыть, поправить время или продолжить — но не путай усердие с курсом.`;
  }

  // checkpoint
  return `${speaker}: вахта по «${title}» · уже ${minutes} мин. Сеть и закалка ещё держат — зафиксируй шаг или останься на посту ещё немного.`;
}

export const MOMENT_IMAGE: Record<MomentKind, string> = {
  norma: "/moments/norma.jpg",
  strong: "/moments/strong.jpg",
  overwork: "/moments/overwork.jpg",
  checkpoint: "/moments/checkpoint.jpg",
};
