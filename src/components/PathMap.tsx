"use client";

import Link from "next/link";
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

  const nodes: MapNode[] = [];

  // Climb upward: dump → stages → dream (rendered bottom-to-top visually via column-reverse? 
  // Easier: list top-to-bottom as ascent story: dump first, dream last)
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

  // If dump was marked here but we have active stage, dump is done
  if (active && nodes[0]) {
    nodes[0] = { ...nodes[0], state: "done" };
  }

  const hereLabel =
    character != null
      ? `${character.name || "Путник"} · ур. ${character.level}`
      : "В пути";

  return (
    <div className="panel-frame rounded-md p-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--accent)]">
            Карта пути
          </p>
          <p className="font-display text-xl text-[var(--ink)]">
            Старт → этапы → мечта
          </p>
          {!compact ? (
            <p className="mt-1 text-xs text-[var(--muted)]">
              Маршрут от сегодняшней реальности к цели. Ежедневные практики — на
              экране «Сегодня», не на карте.
            </p>
          ) : null}
        </div>
        <Badge tone="metal">{hereLabel}</Badge>
      </div>

      <ol className="path-map mt-5">
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
                <p className="mt-1 font-medium text-[var(--ink)]">{node.title}</p>
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
  );
}
