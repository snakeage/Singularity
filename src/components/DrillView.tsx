"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  LOCALE_LABEL,
  getSkin,
  resolvePresentation,
  resolveSkinId,
} from "@/lib/characterSkins";
import {
  NETWORK_NODE_LABEL,
  getStageNetwork,
  resolveNetworkNodeState,
  type NetworkNodeState,
} from "@/lib/networkNodes";
import {
  getActiveStage,
  getCheckInForPracticePeriod,
  getFocusDream,
  getMilestones,
  getPractices,
} from "@/lib/selectors";
import { isFullCredit } from "@/lib/practiceLevels";
import type { AppData, Practice } from "@/lib/types";
import { useApp } from "@/store/AppProvider";
import { DrillBay, type DrillBayHandle, type DrillBayMode } from "./DrillBay";
import { PracticeTimer } from "./PracticeTimer";
import { Badge, Button, EmptyState } from "./ui";

const NODE_LEGEND: Record<NetworkNodeState, string> = {
  slot: "База ещё не установлена. Первая норма в капсуле — установка.",
  installed: "База установлена. Дальше — закалка повторами.",
  drilling: "Идёт закалка: держи курс и закрывай нормы.",
  holding: "База держится серией. Можно усиливать планку.",
  upgraded: "База усилена (есть «сильно»). Рубеж подтвердит её полностью.",
  certified: "База подтверждена рубежом этапа. Держи уровень.",
};

function stageHasCertifiedPath(data: AppData, stageId: string) {
  return getMilestones(data, stageId).some((m) => m.status === "done");
}

export function DrillView() {
  const { ready, data } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedId = searchParams.get("id");

  const dream = ready ? getFocusDream(data) : undefined;
  const stage = dream ? getActiveStage(data, dream.id) : undefined;
  const practices = stage ? getPractices(data, stage.id) : [];
  const network = ready ? getStageNetwork(data) : null;

  const skinId = resolveSkinId(data.profile);
  const skin = getSkin(skinId);
  const presentation = resolvePresentation(data.profile);
  const hasPortrait = presentation != null;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const practiceIds = practices.map((p) => p.id).join(",");
  const bayRef = useRef<DrillBayHandle>(null);
  const prevBayMode = useRef<DrillBayMode | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (requestedId && practices.some((p) => p.id === requestedId)) {
      setSelectedId(requestedId);
      return;
    }
    setSelectedId((prev) => {
      if (prev && practices.some((p) => p.id === prev)) return prev;
      const open = practices.find(
        (p) => !getCheckInForPracticePeriod(data, p),
      );
      return open?.id ?? practices[0]?.id ?? null;
    });
  }, [ready, requestedId, practiceIds, data, practices]);

  const selected = useMemo(
    () => practices.find((p) => p.id === selectedId) ?? null,
    [practices, selectedId],
  );

  const certified = stage ? stageHasCertifiedPath(data, stage.id) : false;
  const checkIn = selected
    ? getCheckInForPracticePeriod(data, selected)
    : undefined;
  const timerSession = selected
    ? (data.practiceTimers ?? []).find((t) => t.practiceId === selected.id)
    : undefined;
  const bayMode: DrillBayMode =
    checkIn && isFullCredit(checkIn.status)
      ? "done"
      : timerSession?.runningSince
        ? "live"
        : timerSession
          ? "paused"
          : "idle";

  useEffect(() => {
    const prev = prevBayMode.current;
    prevBayMode.current = bayMode;
    if (prev == null || prev === bayMode) return;
    if (bayMode === "live" && (prev === "idle" || prev === "done")) {
      bayRef.current?.revealEnter();
    }
  }, [bayMode]);

  function selectPractice(practice: Practice) {
    setSelectedId(practice.id);
    router.replace(`/drill?id=${practice.id}`, { scroll: false });
  }

  if (!ready) {
    return <p className="text-sm text-[var(--muted)]">Загрузка…</p>;
  }

  if (!dream) {
    return (
      <EmptyState
        title="Нет мечты для разучивания"
        body="Сначала опиши мечту и этап — тогда появятся базы."
        action={
          <Link href="/dream">
            <Button type="button">К мечте</Button>
          </Link>
        }
      />
    );
  }

  if (!stage) {
    return (
      <EmptyState
        title="Нет активного этапа"
        body="Выбери этап на «Мечте» — в капсулу попадают его практики."
        action={
          <Link href="/dream">
            <Button type="button">К мечте</Button>
          </Link>
        }
      />
    );
  }

  if (practices.length === 0) {
    return (
      <EmptyState
        title="Нет баз на этапе"
        body="Добавь практики на «Этапе» — они станут базами для разучивания."
        action={
          <Link href="/stage">
            <Button type="button">К этапу</Button>
          </Link>
        }
      />
    );
  }

  const nodeState = selected
    ? resolveNetworkNodeState(data, selected, certified)
    : null;

  return (
    <div
      className="drill-room relative -mx-4 -mb-6 overflow-hidden rounded-t-3xl sm:-mx-4"
      style={
        {
          "--create-accent": skin.accent,
          "--create-soft": skin.accentSoft,
          "--today-accent": skin.accent,
          "--today-soft": skin.accentSoft,
        } as CSSProperties
      }
    >
      <div className="drill-room__veil pointer-events-none absolute inset-0" aria-hidden />
      <div className="drill-room__grain pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-7.5rem)] max-w-3xl flex-col gap-4 px-4 py-5 sm:gap-5 sm:px-5">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--create-soft)]">
              Медкапсула · разучивание базы
              {hasPortrait ? (
                <span className="text-white/45">
                  {" "}
                  · {LOCALE_LABEL[skin.locale]}
                </span>
              ) : null}
            </p>
            <p className="mt-1 text-sm text-white/65">
              Этап «{stage.title}»
              {network ? ` · ${network.channelLabel}` : ""}
            </p>
          </div>
          <Link
            href="/"
            className="text-xs text-white/50 transition hover:text-white/80"
          >
            К Сегодня
          </Link>
        </header>

        <section className="space-y-2">
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
            Базы этапа
          </p>
          <ul className="drill-rail flex gap-2.5 overflow-x-auto pb-1">
            {practices.map((practice, index) => {
              const state = resolveNetworkNodeState(data, practice, certified);
              const active = practice.id === selectedId;
              const done = Boolean(getCheckInForPracticePeriod(data, practice));
              return (
                <li
                  key={practice.id}
                  className="drill-rail__item shrink-0"
                  style={{ animationDelay: `${index * 45}ms` }}
                >
                  <button
                    type="button"
                    onClick={() => selectPractice(practice)}
                    className={`drill-base-card w-[9.5rem] rounded-2xl border p-3 text-left transition ${
                      active
                        ? "border-[var(--create-accent)] bg-white/15 ring-1 ring-[var(--create-accent)]/50"
                        : "border-white/15 bg-black/25 hover:border-white/30"
                    }`}
                    aria-pressed={active}
                  >
                    <span className="block text-[10px] uppercase tracking-[0.1em] text-white/45">
                      {NETWORK_NODE_LABEL[state]}
                      {done ? " · сегодня" : ""}
                    </span>
                    <span className="mt-1 block font-medium leading-snug text-white">
                      {practice.title}
                    </span>
                    <span className="mt-1 block text-[10px] text-white/50">
                      {practice.frequency === "weekly"
                        ? "еженедельно"
                        : "ежедневно"}
                      {practice.minMinutes
                        ? ` · ${practice.minMinutes} мин`
                        : ""}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="drill-focus flex min-h-0 flex-1 flex-col gap-3 sm:gap-4">
          <DrillBay
            key={selected?.id ?? "bay"}
            ref={bayRef}
            skinId={skinId}
            presentation={presentation}
            mode={bayMode}
            accent={skin.accent}
            accentSoft={skin.accentSoft}
          />

          {selected && nodeState ? (
            <section className="drill-capsule flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-white/15 bg-black/40 shadow-2xl backdrop-blur-md">
              <div className="border-b border-white/10 px-4 py-3 sm:px-5 sm:py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="metal">{NETWORK_NODE_LABEL[nodeState]}</Badge>
                  <Badge>
                    {selected.frequency === "weekly"
                      ? "на неделю"
                      : "на сегодня"}
                  </Badge>
                  {nodeState === "slot" ? (
                    <Badge tone="accent">установка базы</Badge>
                  ) : null}
                  {bayMode === "live" ? (
                    <Badge tone="accent">идёт сессия</Badge>
                  ) : null}
                </div>
                <h1 className="mt-2 font-display text-2xl text-white sm:text-3xl">
                  {selected.title}
                </h1>
                <p className="mt-1.5 text-sm leading-relaxed text-white/70">
                  {NODE_LEGEND[nodeState]}
                </p>
                {selected.whyForStage ? (
                  <p className="mt-1.5 text-sm text-white/60">
                    Зачем этапу: {selected.whyForStage}
                  </p>
                ) : null}
                {selected.cue ? (
                  <p className="mt-1 text-xs text-white/45">
                    Когда/где: {selected.cue}
                  </p>
                ) : null}
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto px-4 py-3 sm:px-5 sm:py-4">
                {checkIn?.status === "skipped" ? (
                  <p className="text-sm text-white/65">
                    На этот период отмечен пропуск. Сними пропуск на «Сегодня»
                    или выбери другую базу.
                  </p>
                ) : (
                  <div className="drill-timer rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4">
                    <PracticeTimer practice={selected} checkIn={checkIn} />
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 border-t border-white/10 px-4 py-3 sm:px-5">
                <Link href="/network">
                  <Button type="button" variant="ghost" className="!text-white/80 hover:!bg-white/10">
                    К сети этапа
                  </Button>
                </Link>
                <Link href="/stage">
                  <Button type="button" variant="ghost" className="!text-white/80 hover:!bg-white/10">
                    Настроить на Этапе
                  </Button>
                </Link>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
