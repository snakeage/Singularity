"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ProgressHud } from "./ProgressHud";

const nav = [
  { href: "/", label: "Сегодня" },
  { href: "/map", label: "Карта" },
  { href: "/dream", label: "Мечта" },
  { href: "/stage", label: "Этап" },
  { href: "/review", label: "Обзор" },
  { href: "/data", label: "Данные" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="relative flex min-h-full flex-col">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-[var(--wash)] blur-3xl" />
        <div className="absolute -right-16 bottom-20 h-80 w-80 rounded-full bg-[var(--wash-2)] blur-3xl" />
      </div>

      <header className="relative z-10 border-b border-[var(--line)] bg-[var(--bg)]/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-1 flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-display text-2xl tracking-tight text-[var(--ink)]">
                Singularity
              </p>
              <p className="text-xs text-[var(--muted)]">
                Цель по этапам · данные в браузере
              </p>
            </div>
            <ProgressHud compact />
          </div>
          <nav className="flex flex-wrap gap-1">
            {nav.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-md px-2.5 py-1.5 text-sm transition ${
                    active
                      ? "bg-[var(--ink)] text-[var(--bg)]"
                      : "text-[var(--muted)] hover:bg-[var(--panel)] hover:text-[var(--ink)]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
