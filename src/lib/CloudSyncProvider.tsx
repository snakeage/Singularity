"use client";

import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  pushCloudSave,
  pullCloudSave,
  readCloudMeta,
  resolveCloudConflict,
  writeCloudMeta,
} from "@/lib/cloudSave";
import { getFirebase, isFirebaseConfigured } from "@/lib/firebase";
import { saveData } from "@/lib/storage";
import type { AppData } from "@/lib/types";
import { useApp } from "@/store/AppProvider";

type CloudStatus =
  | "off"
  | "idle"
  | "signing-in"
  | "syncing"
  | "synced"
  | "error";

type CloudContextValue = {
  configured: boolean;
  user: User | null;
  status: CloudStatus;
  error: string | null;
  lastSyncedAt: string | null;
  signInGoogle: () => Promise<void>;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (email: string, password: string) => Promise<void>;
  signOutCloud: () => Promise<void>;
  syncNow: () => Promise<void>;
};

const CloudContext = createContext<CloudContextValue | null>(null);

function mapAuthError(err: unknown): string {
  const code =
    err && typeof err === "object" && "code" in err
      ? String((err as { code: string }).code)
      : "";
  if (code === "auth/popup-closed-by-user") return "Окно входа закрыто.";
  if (code === "auth/email-already-in-use") {
    return "Этот email уже зарегистрирован — войди.";
  }
  if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
    return "Неверный email или пароль.";
  }
  if (code === "auth/weak-password") {
    return "Пароль слишком короткий (минимум 6 символов).";
  }
  if (code === "auth/invalid-email") return "Некорректный email.";
  if (code === "auth/too-many-requests") {
    return "Слишком много попыток — подожди немного.";
  }
  if (err instanceof Error && err.message) return err.message;
  return "Не удалось войти.";
}

export function CloudSyncProvider({ children }: { children: ReactNode }) {
  const { ready, data, replaceAllData } = useApp();
  const configured = isFirebaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<CloudStatus>(
    configured ? "idle" : "off",
  );
  const [error, setError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(
    () => readCloudMeta().cloudSavedAt,
  );
  const dataRef = useRef(data);
  dataRef.current = data;
  const pushTimer = useRef<number | undefined>(undefined);
  const bootstrapped = useRef<string | null>(null);
  const syncLock = useRef(false);

  const applyResolved = useCallback(
    async (uid: string, local: AppData) => {
      syncLock.current = true;
      setStatus("syncing");
      setError(null);
      try {
        const meta = readCloudMeta();
        const cloud = await pullCloudSave(uid);
        const resolved = resolveCloudConflict(
          local,
          meta.localSavedAt,
          cloud,
        );
        saveData(resolved.data);
        replaceAllData(resolved.data);
        writeCloudMeta({
          localSavedAt: resolved.savedAt,
          cloudSavedAt: resolved.savedAt,
        });
        if (resolved.shouldPush) {
          await pushCloudSave(uid, resolved.data, resolved.savedAt);
        }
        setLastSyncedAt(resolved.savedAt);
        setStatus("synced");
      } finally {
        syncLock.current = false;
      }
    },
    [replaceAllData],
  );

  useEffect(() => {
    if (!configured || !ready) return;
    const fb = getFirebase();
    if (!fb) return;

    return onAuthStateChanged(fb.auth, (next) => {
      setUser(next);
      if (!next) {
        bootstrapped.current = null;
        setStatus("idle");
        return;
      }
      if (bootstrapped.current === next.uid) return;
      bootstrapped.current = next.uid;
      void applyResolved(next.uid, dataRef.current).catch((err) => {
        setStatus("error");
        setError(mapAuthError(err));
      });
    });
  }, [configured, ready, applyResolved]);

  // Debounced push while signed in.
  useEffect(() => {
    if (!configured || !user || !ready) return;

    if (pushTimer.current != null) window.clearTimeout(pushTimer.current);
    pushTimer.current = window.setTimeout(() => {
      if (syncLock.current) return;
      const savedAt = new Date().toISOString();
      writeCloudMeta({ localSavedAt: savedAt });
      void pushCloudSave(user.uid, dataRef.current, savedAt)
        .then((at) => {
          setLastSyncedAt(at);
          setStatus("synced");
          setError(null);
        })
        .catch((err) => {
          setStatus("error");
          setError(mapAuthError(err));
        });
    }, 1200);

    return () => {
      if (pushTimer.current != null) window.clearTimeout(pushTimer.current);
    };
  }, [configured, user, ready, data]);

  const withAuth = useCallback(async (fn: () => Promise<void>) => {
    setStatus("signing-in");
    setError(null);
    try {
      await fn();
    } catch (err) {
      setStatus("error");
      setError(mapAuthError(err));
      throw err;
    }
  }, []);

  const signInGoogle = useCallback(async () => {
    const fb = getFirebase();
    if (!fb) throw new Error("Firebase не настроен");
    await withAuth(async () => {
      await signInWithPopup(fb.auth, new GoogleAuthProvider());
    });
  }, [withAuth]);

  const signInEmail = useCallback(
    async (email: string, password: string) => {
      const fb = getFirebase();
      if (!fb) throw new Error("Firebase не настроен");
      await withAuth(async () => {
        await signInWithEmailAndPassword(fb.auth, email.trim(), password);
      });
    },
    [withAuth],
  );

  const signUpEmail = useCallback(
    async (email: string, password: string) => {
      const fb = getFirebase();
      if (!fb) throw new Error("Firebase не настроен");
      await withAuth(async () => {
        await createUserWithEmailAndPassword(fb.auth, email.trim(), password);
      });
    },
    [withAuth],
  );

  const signOutCloud = useCallback(async () => {
    const fb = getFirebase();
    if (!fb) return;
    await signOut(fb.auth);
    setStatus("idle");
    setError(null);
  }, []);

  const syncNow = useCallback(async () => {
    if (!user) return;
    await applyResolved(user.uid, dataRef.current);
  }, [user, applyResolved]);

  const value = useMemo<CloudContextValue>(
    () => ({
      configured,
      user,
      status,
      error,
      lastSyncedAt,
      signInGoogle,
      signInEmail,
      signUpEmail,
      signOutCloud,
      syncNow,
    }),
    [
      configured,
      user,
      status,
      error,
      lastSyncedAt,
      signInGoogle,
      signInEmail,
      signUpEmail,
      signOutCloud,
      syncNow,
    ],
  );

  return (
    <CloudContext.Provider value={value}>{children}</CloudContext.Provider>
  );
}

export function useCloudSync(): CloudContextValue {
  const ctx = useContext(CloudContext);
  if (!ctx) {
    throw new Error("useCloudSync must be used within CloudSyncProvider");
  }
  return ctx;
}
