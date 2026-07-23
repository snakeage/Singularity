import { doc, getDoc, setDoc } from "firebase/firestore";
import { parseBackup } from "./backup";
import { getFirebase } from "./firebase";
import type { AppData } from "./types";

export const CLOUD_META_KEY = "singularity.cloudMeta.v1";

export type CloudSaveDoc = {
  kind: "singularity-character-backup";
  savedAt: string;
  data: AppData;
};

export type CloudMeta = {
  /** Last time we wrote to localStorage while signed in / synced. */
  localSavedAt: string | null;
  /** Last cloud savedAt we applied or pushed. */
  cloudSavedAt: string | null;
};

export function readCloudMeta(): CloudMeta {
  if (typeof window === "undefined") {
    return { localSavedAt: null, cloudSavedAt: null };
  }
  try {
    const raw = localStorage.getItem(CLOUD_META_KEY);
    if (!raw) return { localSavedAt: null, cloudSavedAt: null };
    const parsed = JSON.parse(raw) as CloudMeta;
    return {
      localSavedAt: parsed.localSavedAt ?? null,
      cloudSavedAt: parsed.cloudSavedAt ?? null,
    };
  } catch {
    return { localSavedAt: null, cloudSavedAt: null };
  }
}

export function writeCloudMeta(patch: Partial<CloudMeta>): CloudMeta {
  const next = { ...readCloudMeta(), ...patch };
  if (typeof window !== "undefined") {
    localStorage.setItem(CLOUD_META_KEY, JSON.stringify(next));
  }
  return next;
}

function userDocRef(uid: string) {
  const fb = getFirebase();
  if (!fb) throw new Error("Firebase не настроен");
  return doc(fb.db, "users", uid);
}

export async function pullCloudSave(
  uid: string,
): Promise<CloudSaveDoc | null> {
  const snap = await getDoc(userDocRef(uid));
  if (!snap.exists()) return null;
  const raw = snap.data() as CloudSaveDoc;
  if (!raw?.data || raw.kind !== "singularity-character-backup") return null;
  // Re-normalize through parseBackup for safety.
  const data = parseBackup(JSON.stringify(raw));
  return {
    kind: "singularity-character-backup",
    savedAt: raw.savedAt || new Date(0).toISOString(),
    data,
  };
}

export async function pushCloudSave(
  uid: string,
  data: AppData,
  savedAt = new Date().toISOString(),
): Promise<string> {
  const payload: CloudSaveDoc = {
    kind: "singularity-character-backup",
    savedAt,
    data,
  };
  await setDoc(userDocRef(uid), payload, { merge: false });
  writeCloudMeta({ localSavedAt: savedAt, cloudSavedAt: savedAt });
  return savedAt;
}

/**
 * Last-write-wins by savedAt.
 * Returns which side won and the data to keep locally.
 */
export function resolveCloudConflict(
  local: AppData,
  localSavedAt: string | null,
  cloud: CloudSaveDoc | null,
): {
  data: AppData;
  source: "local" | "cloud" | "local-empty" | "cloud-empty";
  savedAt: string;
  shouldPush: boolean;
} {
  const localEmpty = !local.dreams.length;
  const now = new Date().toISOString();

  if (!cloud) {
    return {
      data: local,
      source: localEmpty ? "local-empty" : "local",
      savedAt: localSavedAt || now,
      shouldPush: !localEmpty,
    };
  }

  if (localEmpty) {
    return {
      data: cloud.data,
      source: "cloud",
      savedAt: cloud.savedAt,
      shouldPush: false,
    };
  }

  const localTs = localSavedAt ? Date.parse(localSavedAt) : 0;
  const cloudTs = Date.parse(cloud.savedAt) || 0;

  if (cloudTs > localTs) {
    return {
      data: cloud.data,
      source: "cloud",
      savedAt: cloud.savedAt,
      shouldPush: false,
    };
  }

  return {
    data: local,
    source: "local",
    savedAt: localSavedAt && localTs >= cloudTs ? localSavedAt : now,
    shouldPush: true,
  };
}
