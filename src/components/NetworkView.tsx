"use client";

import Link from "next/link";
import {
  DEFAULT_PRESENTATION,
  getSkin,
  resolvePresentation,
  resolveSkinId,
} from "@/lib/characterSkins";
import { LEVEL_LABEL } from "@/lib/practiceLevels";
import {
  getStageNetwork,
  NETWORK_NODE_LABEL,
  type NetworkNodeState,
} from "@/lib/networkNodes";
import { useApp } from "@/store/AppProvider";
import { PortraitAvatar } from "./PortraitAvatar";
import {
  Badge,
  Button,
  EmptyState,
  Hint,
  Section,
} from "./ui";

function nodeTone(
  state: NetworkNodeState,
): "muted" | "accent" | "metal" | "partial" | "strong" | "skip" {
  switch (state) {
    case "certified":
      return "strong";
    case "upgraded":
      return "accent";
    case "holding":
      return "metal";
    case "drilling":
      return "partial";
    case "installed":
      return "accent";
    default:
      return "muted";
  }
}

export function NetworkView() {
  const { ready, data } = useApp();

  if (!ready) {
    return <p className="text-sm text-[var(--muted)]">Загрузка…</p>;
  }

  const network = getStageNetwork(data);

  if (!network) {
    return (
      <EmptyState
        title="Сеть ещё не развернута"
        body="Нужны мечта и активный этап — тогда практики станут узлами канала."
        action={
          <Link href="/dream">
            <Button type="button">К мечте</Button>
          </Link>
        }
      />
    );
  }

  const presentation =
    resolvePresentation(data.profile) ?? DEFAULT_PRESENTATION;
  const skinId = resolveSkinId(data.profile);
  const hasPortrait = resolvePresentation(data.profile) != null;

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-start gap-4">
        {hasPortrait ? (
          <PortraitAvatar
            presentation={presentation}
            skinId={skinId}
            size="lg"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--accent)]">
            Сеть
            {hasPortrait ? ` · ${getSkin(skinId).title}` : ""}
          </p>
          <h1 className="font-display text-3xl tracking-tight text-[var(--ink)]">
            {network.channelLabel}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Этап «{network.stageTitle}» · мечта «{network.dreamTitle}»
            {network.teacherName ? ` · наставник ${network.teacherName}` : ""}
          </p>
        </div>
      </div>

      <Hint title="Как читать узлы">
        <p>
          База = состояние практики: слот → установлена (первая норма) → закалка
          → держится / усилена → подтверждена (рубеж этапа). Без валюты и без
          военных веток — см. мифологию сети.
        </p>
      </Hint>

      <Section
        title="Канал"
        hint="Уровень канала растёт с XP, установленными базами и подтверждёнными рубежами."
      >
        <div className="flex flex-wrap gap-2">
          <Badge tone="metal">{network.channelLabel}</Badge>
          <Badge>
            установлено {network.installedCount}/{network.nodes.length}
          </Badge>
          <Badge tone="strong">
            подтверждено {network.certifiedCount}
          </Badge>
        </div>
      </Section>

      <Section
        title="Узлы этапа"
        hint="Карта баз текущего этапа. Качать — на Сегодня; править — на Этапе."
      >
        {network.nodes.length === 0 ? (
          <EmptyState
            title="Нет практик на этапе"
            body="Добавь практики на Этапе — они появятся здесь как слоты сети."
            action={
              <Link href="/stage">
                <Button type="button">К этапу</Button>
              </Link>
            }
          />
        ) : (
          <ul className="space-y-2">
            {network.nodes.map((node, index) => (
              <li
                key={node.practiceId}
                className="network-node rounded-md border border-[var(--line)] bg-[var(--panel)] p-3"
                data-state={node.state}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--faint)]">
                    узел {index + 1}
                  </span>
                  <Badge tone={nodeTone(node.state)}>
                    {NETWORK_NODE_LABEL[node.state]}
                  </Badge>
                  <Badge>
                    {node.frequency === "daily" ? "ежедневно" : "еженедельно"}
                  </Badge>
                  {node.minMinutes ? (
                    <span className="text-xs text-[var(--faint)]">
                      план {node.minMinutes} мин
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 font-medium text-[var(--ink)]">
                  {node.title}
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Полных закрытий: {node.fullCreditCount}
                  {node.holdingDays > 0
                    ? ` · серия норм ${node.holdingDays} дн`
                    : ""}
                  {node.lastStatus
                    ? ` · последний статус: ${LEVEL_LABEL[node.lastStatus]}`
                    : " · ещё без отметок"}
                </p>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap gap-2">
          <Link href="/">
            <Button type="button">Капсула / Сегодня</Button>
          </Link>
          <Link href="/stage">
            <Button type="button" variant="ghost">
              Настроить на Этапе
            </Button>
          </Link>
        </div>
      </Section>
    </div>
  );
}
