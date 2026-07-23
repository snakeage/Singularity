"use client";

import { useState, type FormEvent } from "react";
import { useCloudSync } from "@/lib/CloudSyncProvider";
import { Button, Field, Input, Section } from "./ui";

export function CloudSavePanel() {
  const {
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
  } = useCloudSync();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"in" | "up">("in");
  const [busy, setBusy] = useState(false);
  const [localMsg, setLocalMsg] = useState<string | null>(null);

  if (!configured) {
    return (
      <Section
        title="Облачный сейв"
        hint="Firebase не настроен — приложение работает только в localStorage."
      >
        <p className="text-sm text-[var(--muted)]">
          Добавь <code className="text-[var(--ink)]">NEXT_PUBLIC_FIREBASE_*</code>{" "}
          в <code className="text-[var(--ink)]">.env.local</code> и в Vercel →
          Environment Variables. Инструкция:{" "}
          <code className="text-[var(--ink)]">docs/firebase-setup.md</code>.
        </p>
      </Section>
    );
  }

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setLocalMsg(null);
    try {
      await fn();
      setLocalMsg("Ок");
    } catch {
      // error already in cloud context
    } finally {
      setBusy(false);
    }
  }

  async function onEmailSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || password.length < 6) {
      setLocalMsg("Email и пароль (от 6 символов) обязательны.");
      return;
    }
    await run(() =>
      mode === "in"
        ? signInEmail(email, password)
        : signUpEmail(email, password),
    );
  }

  const statusLabel =
    status === "signing-in"
      ? "Вход…"
      : status === "syncing"
        ? "Синхронизация…"
        : status === "synced"
          ? "Синхронизировано"
          : status === "error"
            ? "Ошибка"
            : "Готово";

  return (
    <Section
      title="Облачный сейв"
      hint="Один сейв на телефон и комп. Конфликты: кто позже сохранил — тот и прав."
    >
      {user ? (
        <div className="space-y-3">
          <p className="text-sm text-[var(--ink)]">
            Вошли:{" "}
            <span className="font-medium">
              {user.email || user.displayName || user.uid}
            </span>
          </p>
          <p className="text-xs text-[var(--muted)]">
            Статус: {statusLabel}
            {lastSyncedAt
              ? ` · облако ${new Date(lastSyncedAt).toLocaleString("ru-RU")}`
              : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={busy || status === "syncing"}
              onClick={() => void run(() => syncNow())}
            >
              Синхронизировать сейчас
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => void run(() => signOutCloud())}
            >
              Выйти
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Button
            type="button"
            disabled={busy}
            onClick={() => void run(() => signInGoogle())}
          >
            Войти через Google
          </Button>

          <form onSubmit={onEmailSubmit} className="space-y-3">
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                className={
                  mode === "in"
                    ? "font-medium text-[var(--accent)]"
                    : "text-[var(--muted)] underline-offset-2 hover:underline"
                }
                onClick={() => setMode("in")}
              >
                Вход
              </button>
              <span className="text-[var(--faint)]">·</span>
              <button
                type="button"
                className={
                  mode === "up"
                    ? "font-medium text-[var(--accent)]"
                    : "text-[var(--muted)] underline-offset-2 hover:underline"
                }
                onClick={() => setMode("up")}
              >
                Регистрация
              </button>
            </div>
            <Field label="Email">
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </Field>
            <Field label="Пароль">
              <Input
                type="password"
                autoComplete={
                  mode === "in" ? "current-password" : "new-password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="минимум 6 символов"
              />
            </Field>
            <Button type="submit" disabled={busy}>
              {mode === "in" ? "Войти" : "Создать аккаунт"}
            </Button>
          </form>
        </div>
      )}

      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
      {localMsg && !error ? (
        <p className="mt-2 text-sm text-[var(--accent)]">{localMsg}</p>
      ) : null}
    </Section>
  );
}
