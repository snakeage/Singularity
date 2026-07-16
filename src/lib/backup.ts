import { normalizeReminders } from "./reminders";
import type { AppData } from "./types";
import { EMPTY_DATA } from "./types";

export type BackupFile = {
  kind: "singularity-character-backup";
  exportedAt: string;
  data: AppData;
};

export function buildBackup(data: AppData): BackupFile {
  return {
    kind: "singularity-character-backup",
    exportedAt: new Date().toISOString(),
    data,
  };
}

export function parseBackup(raw: string): AppData {
  const parsed = JSON.parse(raw) as BackupFile | AppData;

  if (
    parsed &&
    typeof parsed === "object" &&
    "kind" in parsed &&
    parsed.kind === "singularity-character-backup" &&
    parsed.data?.version === 1
  ) {
    return {
      ...EMPTY_DATA,
      ...parsed.data,
      profile: {
        name: parsed.data.profile?.name?.trim() ?? "",
        reminders: normalizeReminders(parsed.data.profile?.reminders),
      },
      version: 1,
    };
  }

  if (
    parsed &&
    typeof parsed === "object" &&
    "version" in parsed &&
    parsed.version === 1 &&
    Array.isArray((parsed as AppData).dreams)
  ) {
    const data = parsed as AppData;
    return {
      ...EMPTY_DATA,
      ...data,
      profile: {
        name: data.profile?.name?.trim() ?? "",
        reminders: normalizeReminders(data.profile?.reminders),
      },
      version: 1,
    };
  }

  throw new Error("Неверный формат бэкапа");
}

export function downloadBackup(data: AppData): void {
  const backup = buildBackup(data);
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `singularity-character-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
