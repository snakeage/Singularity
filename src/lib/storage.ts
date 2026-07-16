import { normalizeReminders } from "./reminders";
import { EMPTY_DATA, type AppData } from "./types";

export const STORAGE_KEY = "singularity.appData.v1";

export function loadData(): AppData {
  if (typeof window === "undefined") return EMPTY_DATA;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_DATA;
    const parsed = JSON.parse(raw) as AppData;
    if (parsed?.version !== 1 || !Array.isArray(parsed.dreams)) {
      return EMPTY_DATA;
    }
    return {
      ...EMPTY_DATA,
      ...parsed,
      profile: {
        name: parsed.profile?.name?.trim() ?? "",
        reminders: normalizeReminders(parsed.profile?.reminders),
        strictLadder: Boolean(parsed.profile?.strictLadder),
      },
      practiceTimers: Array.isArray(parsed.practiceTimers)
        ? parsed.practiceTimers
        : [],
      version: 1,
    };
  } catch {
    return EMPTY_DATA;
  }
}

export function saveData(data: AppData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
