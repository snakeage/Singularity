"use client";

import Link from "next/link";
import { PathMap } from "@/components/PathMap";
import { Button, EmptyState } from "@/components/ui";
import { getFocusDream } from "@/lib/selectors";
import { useApp } from "@/store/AppProvider";

export default function MapPage() {
  const { ready, data } = useApp();

  if (!ready) {
    return <p className="text-sm text-[var(--muted)]">Загрузка…</p>;
  }

  const dream = getFocusDream(data);

  return (
    <div className="space-y-6">
      <div
        className="path-map-page-hero relative overflow-hidden rounded-2xl border border-[var(--line)]"
      >
        <div className="today-hero__wash absolute inset-0 opacity-80" aria-hidden />
        <div className="relative z-10 p-5 sm:p-6">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--accent)]">
            Карта
          </p>
          <h1 className="mt-1 font-display text-3xl tracking-tight text-[var(--ink)]">
            Путь к мечте
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            От «где я сейчас» через этапы — к мечте. Всегда видно, на какой
            ступени ты стоишь.
          </p>
        </div>
      </div>

      {!dream ? (
        <EmptyState
          title="Карта ещё пуста"
          body="Сначала создай мечту и разбей её на этапы — тогда появится маршрут."
          action={
            <Link href="/dream">
              <Button type="button">Создать мечту</Button>
            </Link>
          }
        />
      ) : (
        <PathMap />
      )}
    </div>
  );
}
