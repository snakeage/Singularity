"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import {
  LOCALE_LABEL,
  getSkin,
  resolvePresentation,
  resolveSkinId,
} from "@/lib/characterSkins";
import { getCharacterProgress } from "@/lib/gamification";
import {
  getActiveStage,
  getFocusDream,
  getStagesForDream,
  stageProgress,
} from "@/lib/selectors";
import { useApp } from "@/store/AppProvider";
import { Badge, Button, ProgressBar } from "./ui";

type NodeKind = "dump" | "stage" | "dream";

type MapNode = {
  id: string;
  kind: NodeKind;
  title: string;
  subtitle: string;
  state: "done" | "here" | "ahead" | "locked";
  href?: string;
  progressRatio?: number;
  progressLabel?: string;
};

export function PathMap({ compact = false }: { compact?: boolean }) {
  const { ready, data } = useApp();
  if (!ready) return null;

  const dream = getFocusDream(data);
  if (!dream) return null;

  const stages = getStagesForDream(data, dream.id);
  const pointA = data.pointAs.find((p) => p.dreamId === dream.id);
  const active = getActiveStage(data, dream.id);
  const character = getCharacterProgress(data);
  const allStagesDone =
    stages.length > 0 && stages.every((s) => s.status === "completed");
  const skinId = resolveSkinId(data.profile);
  const skin = getSkin(skinId);
  const hasPortrait = resolvePresentation(data.profile) != null;

  const nodes: MapNode[] = [];

  nodes.push({
    id: "dump",
    kind: "dump",
    title: "Старт · где я сейчас",
    subtitle: pointA
      ? "Честное описание старта сохранено"
      : "Опиши, с чего начинаешь — на экране Мечта",
    state: pointA ? "done" : active || stages.length > 0 ? "done" : "here",
    href: "/dream",
  });

  if (stages.length === 0) {
    nodes.push({
      id: "stages-empty",
      kind: "stage",
      title: "Этапы пути",
      subtitle: "Разложи мечту на 2–5 ступеней",
      state: "here",
      href: "/dream",
    });
  } else {
    for (const stage of stages) {
      const progress = stageProgress(data, stage.id);
      const isHere = stage.status === "active";
      const isDone = stage.status === "completed";
      nodes.push({
        id: stage.id,
        kind: "stage",
        title: `Этап ${stage.order}: ${stage.title}`,
        subtitle: isDone
          ? "Пройден"
          : isHere
            ? "Ты здесь — практики и рубежи"
            : "Ещё впереди",
        state: isDone ? "done" : isHere ? "here" : "ahead",
        href: isHere ? "/stage" : "/dream",
        progressRatio: isHere ? progress.ratio : undefined,
        progressLabel:
          isHere && progress.total > 0
            ? `Рубежи ${progress.done}/${progress.total}`
            : undefined,
      });
    }
  }

  nodes.push({
    id: "dream",
    kind: "dream",
    title: dream.title,
    subtitle: allStagesDone
      ? "Все этапы пройдены — сверка с мечтой"
      : "Главная цель · ориентир на горизонте",
    state: allStagesDone ? "here" : "ahead",
    href: "/dream",
  });

  if (active && nodes[0]) {
    nodes[0] = { ...nodes[0], state: "done" };
  }

  const hereLabel =
    character != null
      ? `${character.name || "Путник"} · ур. ${character.level}`
      : "В пути";

  return (
    <div
      className="path-map-shell overflow-hidden rounded-2xl border border-[var(--line)]"
      style={
        {
          "--today-accent": skin.accent,
          "--today-soft": skin.accentSoft,
        } as CSSProperties
      }
    >
      <div className="relative overflow-hidden border-b border-[var(--line)]">
        <div className="today-hero__wash absolute inset-0" aria-hidden />
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-2 p-4 sm:p-5">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--accent)]">
              Карта пути
              {hasPortrait ? (
                <span className="text-[var(--muted)]">
                  {" "}
                  · {LOCALE_LABEL[skin.locale]}
                </span>
              ) : null}
            </p>
            <p className="mt-1 font-display text-xl text-[var(--ink)] sm:text-2xl">
              Старт → этапы → мечта
            </p>
            {!compact ? (
              <p className="mt-1 max-w-md text-xs text-[var(--muted)]">
                Маршрут от сегодняшней реальности к цели. Дневные шаги — на
                «Сегодня».
              </p>
            ) : null}
          </div>
          <Badge tone="metal">{hereLabel}</Badge>
        </div>
      </div>

      <div className="bg-[var(--panel)] p-4 sm:p-5">
        <ol className="path-map">
          {nodes.map((node, index) => (
            <li key={node.id} className="path-map__item">
              {index < nodes.length - 1 ? (
                <span className="path-map__rail" aria-hidden />
              ) : null}
              <div
                className={`path-map__node path-map__node--${node.state} path-map__node--${node.kind}`}
              >
                <div className="path-map__marker" aria-hidden>
                  {node.state === "done"
                    ? "✓"
                    : node.state === "here"
                      ? "●"
                      : node.kind === "dream"
                        ? "★"
                        : index}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      tone={
                        node.state === "here"
                          ? "metal"
                          : node.state === "done"
                            ? "accent"
                            : "muted"
                      }
                    >
                      {node.state === "here"
                        ? "ты здесь"
                        : node.state === "done"
                          ? "пройдено"
                          : node.kind === "dream"
                            ? "мечта"
                            : "впереди"}
                    </Badge>
                    {node.kind === "dump" ? <Badge>начало</Badge> : null}
                  </div>
                  <p className="mt-1 font-medium text-[var(--ink)]">
                    {node.title}
                  </p>
                  <p className="text-xs text-[var(--muted)]">{node.subtitle}</p>
                  {node.progressRatio != null && node.progressLabel ? (
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-[10px] text-[var(--faint)]">
                        <span>{node.progressLabel}</span>
                      </div>
                      <ProgressBar ratio={node.progressRatio} />
                    </div>
                  ) : null}
                  {node.href && node.state === "here" ? (
                    <div className="mt-2">
                      <Link href={node.href}>
                        <Button type="button" variant="ghost">
                          Открыть
                        </Button>
                      </Link>
                    </div>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ol>

        {!compact && stages.length > 0 ? (
          <p className="mt-4 text-xs text-[var(--faint)]">
            Закрывай рубежи на текущем этапе — и двигайся по карте ближе к мечте.
          </p>
        ) : null}
      </div>
    </div>
  );
}
