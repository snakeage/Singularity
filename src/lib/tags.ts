/** Parse free-text tags: comma or space separated, lowercase, unique. */
export function parseTags(raw: string): string[] {
  const parts = raw
    .split(/[,;\n]+|\s+/)
    .map((t) => t.trim().toLowerCase().replace(/^#/, ""))
    .filter(Boolean)
    .map((t) => t.slice(0, 24));
  return [...new Set(parts)].slice(0, 8);
}

export function formatTags(tags?: string[]): string {
  return (tags ?? []).join(", ");
}

export function practiceMatchesQuery(
  practice: {
    title: string;
    cue?: string;
    focus?: string;
    whyForStage?: string;
    tags?: string[];
  },
  query: string,
  activeTag?: string | null,
): boolean {
  if (activeTag && !(practice.tags ?? []).includes(activeTag)) return false;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    practice.title,
    practice.cue ?? "",
    practice.focus ?? "",
    practice.whyForStage ?? "",
    ...(practice.tags ?? []),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export function collectPracticeTags(
  practices: Array<{ tags?: string[] }>,
): string[] {
  const set = new Set<string>();
  for (const p of practices) {
    for (const t of p.tags ?? []) set.add(t);
  }
  return [...set].sort((a, b) => a.localeCompare(b, "ru"));
}
