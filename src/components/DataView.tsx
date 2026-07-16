"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { resetOnboarding } from "@/lib/onboarding";
import {
  DEFAULT_REMINDERS,
  normalizeReminders,
  requestNotificationPermission,
} from "@/lib/reminders";
import { useApp } from "@/store/AppProvider";
import { Badge, Button, Field, FieldHint, Input, Section } from "./ui";

export function DataView() {
  const { ready, data, exportBackup, importBackupFile, updateProfile } =
    useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [remindOn, setRemindOn] = useState(false);
  const [remindTime, setRemindTime] = useState(DEFAULT_REMINDERS.time);

  useEffect(() => {
    setName(data.profile?.name ?? "");
    const reminders = normalizeReminders(data.profile?.reminders);
    setRemindOn(reminders.enabled);
    setRemindTime(reminders.time);
  }, [data.profile?.name, data.profile?.reminders]);

  if (!ready) {
    return <p className="text-sm text-[var(--muted)]">Загрузка…</p>;
  }

  const savedReminders = normalizeReminders(data.profile?.reminders);
  const nameDirty = name.trim() !== (data.profile?.name ?? "").trim();
  const remindDirty =
    remindOn !== savedReminders.enabled || remindTime !== savedReminders.time;

  function onSaveName(e: FormEvent) {
    e.preventDefault();
    updateProfile({ name });
    setMessage("Имя персонажа сохранено");
    setError(null);
  }

  async function onSaveReminders(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (remindOn) {
      const permission = await requestNotificationPermission();
      if (permission === "unsupported") {
        setError("Этот браузер не поддерживает уведомления.");
        return;
      }
      if (permission !== "granted") {
        setError(
          "Нужно разрешить уведомления в браузере — иначе напоминание не придёт.",
        );
        return;
      }
    }

    updateProfile({
      reminders: {
        enabled: remindOn,
        time: remindTime,
        lastSentDate: savedReminders.lastSentDate,
      },
    });
    setMessage(
      remindOn
        ? `Напоминание включено на ${remindTime} (пока вкладка открыта).`
        : "Напоминания выключены.",
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--accent)]">
          Данные
        </p>
        <h1 className="font-display text-3xl tracking-tight text-[var(--ink)]">
          Сейв персонажа
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Имя, бэкап прогресса и обучение. Данные живут в браузере.
        </p>
      </div>

      <Section
        title="Персонаж"
        hint="Лёгкая прокачка: имя твоё, титул растёт от XP и этапов."
      >
        <form
          onSubmit={onSaveName}
          className="space-y-3 rounded-md border border-[var(--line)] bg-[var(--panel)] p-4"
        >
          <Field label="Как тебя зовут на этом пути">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Ник, Алекс, Путник"
              maxLength={40}
            />
            <FieldHint>
              Показывается в шапке и блоке прокачки. Без имени будет «Путник».
            </FieldHint>
          </Field>
          <div className="flex flex-wrap items-center gap-3">
            {nameDirty ? (
              <Button type="submit">Сохранить имя</Button>
            ) : data.profile?.name ? (
              <Badge tone="accent">Имя сохранено</Badge>
            ) : (
              <Badge>Имя ещё не задано</Badge>
            )}
          </div>
        </form>
      </Section>

      <Section
        title="Напоминания"
        hint="Лёгкий пинок по незакрытым ежедневным практикам. Работает, пока открыта вкладка приложения."
      >
        <form
          onSubmit={onSaveReminders}
          className="space-y-3 rounded-md border border-[var(--line)] bg-[var(--panel)] p-4"
        >
          <label className="flex items-center gap-2 text-sm text-[var(--ink)]">
            <input
              type="checkbox"
              checked={remindOn}
              onChange={(e) => setRemindOn(e.target.checked)}
            />
            Напоминать про практики дня
          </label>
          <Field label="Время (локальное)">
            <Input
              type="time"
              value={remindTime}
              onChange={(e) => setRemindTime(e.target.value)}
              disabled={!remindOn}
            />
            <FieldHint>
              Один раз в день, если есть незакрытые ежедневные практики. Без
              service worker фоновые пуши браузер не гарантирует.
            </FieldHint>
          </Field>
          <div className="flex flex-wrap items-center gap-3">
            {remindDirty ? (
              <Button type="submit">Сохранить напоминание</Button>
            ) : savedReminders.enabled ? (
              <Badge tone="accent">Включено · {savedReminders.time}</Badge>
            ) : (
              <Badge>Выключено</Badge>
            )}
          </div>
        </form>
      </Section>

      <Section title="Где сейчас лежат данные">
        <div className="rounded-md border border-[var(--line)] bg-[var(--panel)] p-4 text-sm text-[var(--muted)]">
          <p>
            Браузерное хранилище{" "}
            <code className="text-[var(--ink)]">localStorage</code> на этом
            компьютере и в этом браузере.
          </p>
          <p className="mt-2">
            Мечт: {data.dreams.length}, этапов: {data.stages.length}, отметок:{" "}
            {data.checkIns.length}.
          </p>
        </div>
      </Section>

      <Section
        title="Экспорт / импорт"
        hint="Импорт полностью заменяет текущие данные."
      >
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => exportBackup()}>
            Скачать бэкап JSON
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => inputRef.current?.click()}
          >
            Восстановить из файла
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              if (
                !window.confirm(
                  "Заменить все текущие данные содержимым файла? Это необратимо без предыдущего бэкапа.",
                )
              ) {
                return;
              }
              try {
                await importBackupFile(file);
                setError(null);
                setMessage("Бэкап восстановлен.");
              } catch (err) {
                setMessage(null);
                setError(
                  err instanceof Error
                    ? err.message
                    : "Не удалось импортировать",
                );
              }
            }}
          />
        </div>
        {message ? (
          <p className="text-sm text-[var(--accent)]">{message}</p>
        ) : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
      </Section>

      <Section title="Обучение" hint="Короткий гид: мечта → этапы → практики.">
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            resetOnboarding();
            window.location.href = "/";
          }}
        >
          Показать обучение снова
        </Button>
      </Section>
    </div>
  );
}
