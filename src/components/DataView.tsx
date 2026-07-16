"use client";

import { useRef, useState } from "react";
import { useApp } from "@/store/AppProvider";
import { Button, Section } from "./ui";

export function DataView() {
  const { ready, data, exportBackup, importBackupFile } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!ready) {
    return <p className="text-sm text-[var(--muted)]">Загрузка…</p>;
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
          Это бэкап твоих данных в приложении (мечты, этапы, отметки), не кода
          проекта. Хранится в браузере; JSON — твоя копия на диске.
        </p>
      </div>

      <Section title="Где сейчас лежат данные">
        <div className="rounded-md border border-[var(--line)] bg-[var(--panel)] p-4 text-sm text-[var(--muted)]">
          <p>
            Браузерное хранилище <code className="text-[var(--ink)]">localStorage</code>{" "}
            на этом компьютере и в этом браузере.
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
                  err instanceof Error ? err.message : "Не удалось импортировать",
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
    </div>
  );
}
