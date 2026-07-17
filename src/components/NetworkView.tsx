"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import {
  LOCALE_LABEL,
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
        title="Пока нечего показать"
        body="Нужны мечта и активный этап — практики этапа появятся здесь как узлы прогресса."
        action={
          <Link href="/dream">
            <Button type="button">К мечте</Button>
          </Link>
        }
      />
    );
  }

  const skinId = resolveSkinId(data.profile);
  const skin = getSkin(skinId);
  const hasPortrait = resolvePresentation(data.profile) != null;

  return (
    <div className="space-y-8">
      <section
        className="network-hero relative overflow-hidden rounded-2xl border border-[var(--line)]"
        style={
          {
            "--today-accent": skin.accent,
            "--today-soft": skin.accentSoft,
          } as CSSProperties
        }
      >
        <div className="today-hero__wash absolute inset-0" aria-hidden />
        <div className="relative z-10 p-5 sm:p-6">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--accent)]">
            Сеть этапа
            {hasPortrait ? (
              <span className="text-[var(--muted)]">
                {" "}
                · {LOCALE_LABEL[skin.locale]}
              </span>
            ) : null}
          </p>
          <h1 className="mt-1 font-display text-3xl tracking-tight text-[var(--ink)]">
            {network.channelLabel}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Этап «{network.stageTitle}» · мечта «{network.dreamTitle}»
            {network.teacherName
              ? ` · наставник ${network.teacherName}`
              : ""}
          </p>
        </div>
      </section>

      <div className="flex flex-wrap gap-2 rounded-xl border border-[var(--line)] bg-[var(--panel)] px-3 py-2.5">
        <Badge tone="metal">{network.channelLabel}</Badge>
        <Badge>
          в работе {network.installedCount}/{network.nodes.length}
        </Badge>
        <Badge tone="strong">с рубежом {network.certifiedCount}</Badge>
      </div>

      <Hint title="Как читать">
        <p>
          Каждый узел — практика этапа: от «ещё не начинал» до устойчивой нормы
          и подтверждения рубежом. Качать на «Сегодня», настраивать на «Этапе».
        </p>
      </Hint>

      <Section
        title="Практики этапа"
        hint="Состояние повторов по текущему этапу."
      >
        {network.nodes.length === 0 ? (
          <EmptyState
            title="Нет практик на этапе"
            body="Добавь практики на Этапе — они появятся здесь."
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
                className="network-node rounded-xl border border-[var(--line)] bg-[var(--panel)] p-3.5"
                data-state={node.state}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--faint)]">
                    {index + 1}
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
                <p className="mt-1.5 font-medium text-[var(--ink)]">
                  {node.title}
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Полных закрытий: {node.fullCreditCount}
                  {node.holdingDays > 0
                    ? ` · серия ${node.holdingDays} дн`
                    : ""}
                  {node.lastStatus
                    ? ` · последний: ${LEVEL_LABEL[node.lastStatus]}`
                    : " · ещё без отметок"}
                </p>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap gap-2">
          <Link href="/">
            <Button type="button">На Сегодня</Button>
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
