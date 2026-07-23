"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  DEFAULT_PRESENTATION,
  getSkin,
  resolvePresentation,
  resolveSkinId,
} from "@/lib/characterSkins";
import { getCharacterProgress } from "@/lib/gamification";
import { useApp } from "@/store/AppProvider";
import { OnboardingHost } from "./Onboarding";
import { ActiveSessionBar } from "./ActiveSessionBar";
import { PortraitAvatar } from "./PortraitAvatar";
import { ProgressHud } from "./ProgressHud";
import { ReminderHost } from "./ReminderHost";
import { SessionRewardHost } from "./SessionRewardHost";
import { TimerSettleHost } from "./TimerSettleHost";
import { ToastHost } from "./ToastHost";

const nav = [
  { href: "/", label: "Сегодня" },
  { href: "/drill", label: "Разучивание" },
  { href: "/network", label: "Сеть" },
  { href: "/map", label: "Карта" },
  { href: "/dream", label: "Мечта" },
  { href: "/stage", label: "Этап" },
  { href: "/review", label: "Обзор" },
  { href: "/data", label: "Данные" },
] as const;

function BrandMark() {
  const { ready, data } = useApp();
  const progress = ready ? getCharacterProgress(data) : null;
  const presentation =
    resolvePresentation(data.profile) ?? DEFAULT_PRESENTATION;
  const skinId = resolveSkinId(data.profile);
  const hasPortrait = resolvePresentation(data.profile) != null;
  const displayName = progress?.name?.trim() || "Путник";
  const skin = getSkin(skinId);

  return (
    <Link href={hasPortrait ? "/data" : "/"} className="app-brand group flex items-center gap-3">
      {hasPortrait ? (
        <span className="app-brand__portrait relative shrink-0">
          <PortraitAvatar
            presentation={presentation}
            skinId={skinId}
            size="md"
            className="ring-2 ring-[var(--panel)] transition group-hover:ring-[var(--accent)]/35"
          />
        </span>
      ) : null}
      <span className="min-w-0">
        <span className="font-display text-2xl leading-none tracking-tight text-[var(--ink)] sm:text-[1.75rem]">
          Singularity
        </span>
        <span className="mt-1 block truncate text-xs text-[var(--muted)]">
          {hasPortrait ? (
            <>
              {displayName}
              <span className="text-[var(--faint)]"> · {skin.title}</span>
              {progress ? (
                <span className="text-[var(--faint)]">
                  {" "}
                  · ур. {progress.level}
                </span>
              ) : null}
            </>
          ) : (
            "Цель по этапам · данные в браузере"
          )}
        </span>
      </span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="app-shell relative flex min-h-full flex-col">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-[var(--wash)] blur-3xl" />
        <div className="absolute -right-16 bottom-20 h-80 w-80 rounded-full bg-[var(--wash-2)] blur-3xl" />
      </div>

      <header className="app-shell__header relative z-10">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-3.5 sm:py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <BrandMark />
            <ProgressHud compact showPortrait={false} />
          </div>

          <nav className="app-nav flex flex-wrap gap-0.5" aria-label="Разделы">
            {nav.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`app-nav__link ${active ? "app-nav__link--active" : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <ActiveSessionBar />

      <main className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        {children}
      </main>
      <OnboardingHost />
      <ReminderHost />
      <TimerSettleHost />
      <SessionRewardHost />
      <ToastHost />
    </div>
  );
}
