"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  DEFAULT_PRESENTATION,
  DEFAULT_SKIN_ID,
  PRESENTATION_LABEL,
  getSkin,
  isSkinArchetypeId,
  resolvePresentation,
  resolveSkinId,
  type Presentation,
  type SkinArchetypeId,
} from "@/lib/characterSkins";
import { resetOnboarding } from "@/lib/onboarding";
import {
  DEFAULT_REMINDERS,
  normalizeReminders,
  requestNotificationPermission,
} from "@/lib/reminders";
import { useApp } from "@/store/AppProvider";
import { PortraitAvatar } from "./PortraitAvatar";
import { SkinPicker } from "./SkinPicker";
import { Badge, Button, Field, FieldHint, Input, Section } from "./ui";

export function DataView() {
  const { ready, data, exportBackup, importBackupFile, updateProfile } =
    useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [presentation, setPresentation] =
    useState<Presentation>(DEFAULT_PRESENTATION);
  const [skinId, setSkinId] = useState<SkinArchetypeId>(DEFAULT_SKIN_ID);
  const [remindOn, setRemindOn] = useState(false);
  const [remindTime, setRemindTime] = useState(DEFAULT_REMINDERS.time);

  useEffect(() => {
    setName(data.profile?.name ?? "");
    setPresentation(resolvePresentation(data.profile) ?? DEFAULT_PRESENTATION);
    setSkinId(resolveSkinId(data.profile));
    const reminders = normalizeReminders(data.profile?.reminders);
    setRemindOn(reminders.enabled);
    setRemindTime(reminders.time);
  }, [
    data.profile?.name,
    data.profile?.presentation,
    data.profile?.skinId,
    data.profile?.reminders,
  ]);

  if (!ready) {
    return <p className="text-sm text-[var(--muted)]">Загрузка…</p>;
  }

  const savedReminders = normalizeReminders(data.profile?.reminders);
  const savedPresentation = resolvePresentation(data.profile);
  const savedSkinId = resolveSkinId(data.profile);
  const nameDirty = name.trim() !== (data.profile?.name ?? "").trim();
  const portraitDirty =
    presentation !== (savedPresentation ?? DEFAULT_PRESENTATION) ||
    skinId !== savedSkinId ||
    savedPresentation == null;
  const remindDirty =
    remindOn !== savedReminders.enabled || remindTime !== savedReminders.time;

  function onSaveName(e: FormEvent) {
    e.preventDefault();
    updateProfile({ name });
    setMessage("Имя персонажа сохранено");
    setError(null);
  }

  function onSavePortrait(e: FormEvent) {
    e.preventDefault();
    if (!isSkinArchetypeId(skinId)) return;
    updateProfile({ presentation, skinId });
    setMessage("Портрет сохранён");
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
        hint="Имя и портрет — косметика. Титул растёт от XP и этапов; скин не даёт бонусов."
      >
        <form
          onSubmit={onSaveName}
          className="space-y-3 rounded-md border border-[var(--line)] bg-[var(--panel)] p-4"
        >
          <div className="flex items-center gap-3">
            <PortraitAvatar
              presentation={presentation}
              skinId={skinId}
              size="lg"
            />
            <div>
              <p className="font-medium text-[var(--ink)]">
                {name.trim() || "Путник"}
              </p>
              <p className="text-xs text-[var(--muted)]">
                {PRESENTATION_LABEL[presentation]} · {getSkin(skinId).title}
              </p>
            </div>
          </div>
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

        <form
          onSubmit={onSavePortrait}
          className="space-y-3 rounded-md border border-[var(--line)] bg-[var(--panel)] p-4"
        >
          <Field label="Представление">
            <div className="grid grid-cols-2 gap-2">
              {(["male", "female"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPresentation(p)}
                  className={`rounded-md border px-3 py-2 text-sm transition ${
                    presentation === p
                      ? "border-[var(--accent)] bg-[var(--wash)]"
                      : "border-[var(--line)] bg-[var(--panel-2)]/40"
                  }`}
                  aria-pressed={presentation === p}
                >
                  {PRESENTATION_LABEL[p]}
                </button>
              ))}
            </div>
            <FieldHint>
              После смены пола показывается свой каталог портретов.
            </FieldHint>
          </Field>
          <Field label="Портрет">
            <SkinPicker
              presentation={presentation}
              skinId={skinId}
              onSelect={setSkinId}
            />
          </Field>
          <div className="flex flex-wrap items-center gap-3">
            {portraitDirty ? (
              <Button type="submit">Сохранить портрет</Button>
            ) : (
              <Badge tone="accent">Портрет сохранён</Badge>
            )}
          </div>
        </form>
      </Section>

      <Section
        title="Правила пути"
        hint="Как у Ника: не перескакивать ступень, пока не закрыл текущую."
      >
        <div className="rounded-md border border-[var(--line)] bg-[var(--panel)] p-4">
          <label className="flex items-start gap-2 text-sm text-[var(--ink)]">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={Boolean(data.profile?.strictLadder)}
              onChange={(e) => {
                updateProfile({ strictLadder: e.target.checked });
                setMessage(
                  e.target.checked
                    ? "Строгий режим включён: нельзя прыгать через незакрытые этапы."
                    : "Строгий режим выключен.",
                );
                setError(null);
              }}
            />
            <span>
              <span className="font-medium">Не перепрыгивать этапы</span>
              <span className="mt-0.5 block text-xs text-[var(--muted)]">
                Активным можно сделать только следующий незакрытый этап. Закрытие
                текущего открывает следующий.
              </span>
            </span>
          </label>
        </div>
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

      <Section
        title="Обучение"
        hint="Снова открыть мастер создания персонажа (пол → портрет → имя → мечта)."
      >
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
