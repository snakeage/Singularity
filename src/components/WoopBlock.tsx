"use client";

import { useState } from "react";
import type { ImplementationIntention, Obstacle } from "@/lib/types";
import { useApp } from "@/store/AppProvider";
import { Badge, Button, Field, FieldHint, Hint, Input, Section } from "./ui";

type Props = {
  dreamId: string;
};

export function WoopBlock({ dreamId }: Props) {
  const {
    data,
    addObstacle,
    updateObstacle,
    removeObstacle,
    addIntention,
    updateIntention,
    removeIntention,
  } = useApp();

  const [newObstacle, setNewObstacle] = useState("");
  const [addingPlanFor, setAddingPlanFor] = useState<string | null>(null);
  const [planIf, setPlanIf] = useState("");
  const [planThen, setPlanThen] = useState("");

  const [editingObstacleId, setEditingObstacleId] = useState<string | null>(
    null,
  );
  const [obstacleDraft, setObstacleDraft] = useState("");
  const [editingIntentionId, setEditingIntentionId] = useState<string | null>(
    null,
  );
  const [intentionDraft, setIntentionDraft] = useState({
    ifCondition: "",
    thenAction: "",
  });

  const obstacles = data.obstacles.filter((o) => o.dreamId === dreamId);
  const intentions = data.intentions.filter((i) => i.dreamId === dreamId);

  const orphans = intentions.filter(
    (i) => !i.obstacleId || !obstacles.some((o) => o.id === i.obstacleId),
  );

  function plansFor(obstacleId: string) {
    return intentions.filter((i) => i.obstacleId === obstacleId);
  }

  function startEditObstacle(item: Obstacle) {
    setEditingObstacleId(item.id);
    setObstacleDraft(item.description);
  }

  function startEditIntention(item: ImplementationIntention) {
    setEditingIntentionId(item.id);
    setIntentionDraft({
      ifCondition: item.ifCondition,
      thenAction: item.thenAction,
    });
  }

  function openPlanForm(obstacle: Obstacle) {
    setAddingPlanFor(obstacle.id);
    setPlanIf(obstacle.description);
    setPlanThen("");
  }

  return (
    <Section
      title="Что мешает и что делать при срыве"
      hint="Сначала препятствие — потом планы на него. На одно препятствие можно несколько планов."
    >
      <Hint title="Как это связано">
        <p>
          Это не два независимых списка, а <strong>дерево</strong>:
        </p>
        <pre className="mt-2 overflow-x-auto rounded-md bg-[var(--panel-2)]/60 px-3 py-2 font-mono text-xs leading-relaxed text-[var(--ink)]">
{`Препятствие: «вечером нет сил»
 ├─ План: если нет сил → то 10 мин практики
 └─ План: если совсем выдохся → то только подготовка к завтра`}
        </pre>
        <p className="mt-2">
          <strong>Препятствие</strong> — корень (что сбивает).{" "}
          <strong>План</strong> — ветка ответа. Разные ситуации → разные планы
          на одно и то же препятствие.
        </p>
      </Hint>

      <div className="rounded-md border border-[var(--line)] bg-[var(--panel)] p-4 space-y-3">
        <p className="text-sm font-medium text-[var(--ink)]">
          Добавить препятствие (корень ветки)
        </p>
        <Field label="Что может сбить с курса">
          <Input
            value={newObstacle}
            onChange={(e) => setNewObstacle(e.target.value)}
            placeholder="Например: вечером залипаю в телефон"
          />
          <FieldHint>
            Сначала сохрани препятствие — планы добавишь уже на его карточке.
          </FieldHint>
        </Field>
        <Button
          type="button"
          onClick={() => {
            if (!newObstacle.trim()) return;
            addObstacle({ dreamId, description: newObstacle });
            setNewObstacle("");
          }}
        >
          Добавить препятствие
        </Button>
      </div>

      {obstacles.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">
          Пока веток нет. Добавь первое препятствие — от него вырастут планы.
        </p>
      ) : (
        <ul className="space-y-4">
          {obstacles.map((o) => {
            const plans = plansFor(o.id);
            return (
              <li
                key={o.id}
                className="rounded-md border border-[var(--line)] bg-[var(--panel)] overflow-hidden"
              >
                <div className="border-l-[3px] border-l-[var(--accent)] px-3 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="accent">Препятствие</Badge>
                    <span className="text-xs text-[var(--faint)]">
                      {plans.length === 0
                        ? "планов пока нет"
                        : `планов: ${plans.length}`}
                    </span>
                  </div>

                  {editingObstacleId === o.id ? (
                    <div className="mt-2 space-y-2">
                      <Input
                        value={obstacleDraft}
                        onChange={(e) => setObstacleDraft(e.target.value)}
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          onClick={() => {
                            if (!obstacleDraft.trim()) return;
                            updateObstacle(o.id, obstacleDraft);
                            setEditingObstacleId(null);
                          }}
                        >
                          Сохранить
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setEditingObstacleId(null)}
                        >
                          Отмена
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="mt-1.5 text-base font-medium text-[var(--ink)]">
                        {o.description}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => openPlanForm(o)}
                        >
                          + План к этому препятствию
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => startEditObstacle(o)}
                        >
                          Изменить
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          onClick={() => {
                            if (
                              window.confirm(
                                plans.length > 0
                                  ? "Удалить препятствие и все его планы?"
                                  : "Удалить это препятствие?",
                              )
                            ) {
                              removeObstacle(o.id);
                              if (addingPlanFor === o.id) setAddingPlanFor(null);
                            }
                          }}
                        >
                          Удалить
                        </Button>
                      </div>
                    </>
                  )}
                </div>

                {/* Tree branches */}
                <div className="relative ml-5 border-l border-[var(--line)] pb-1 pl-4">
                  {plans.map((plan) => (
                      <div key={plan.id} className="relative py-2">
                        <span
                          className="absolute -left-4 top-5 h-px w-3 bg-[var(--line)]"
                          aria-hidden
                        />
                        <div className="rounded-md border border-[var(--line)] bg-[var(--bg)]/40 px-3 py-2.5">
                          <Badge tone="metal">План</Badge>
                          {editingIntentionId === plan.id ? (
                            <div className="mt-2 space-y-2">
                              <Field label="Если…">
                                <Input
                                  value={intentionDraft.ifCondition}
                                  onChange={(e) =>
                                    setIntentionDraft((d) => ({
                                      ...d,
                                      ifCondition: e.target.value,
                                    }))
                                  }
                                />
                              </Field>
                              <Field label="…то">
                                <Input
                                  value={intentionDraft.thenAction}
                                  onChange={(e) =>
                                    setIntentionDraft((d) => ({
                                      ...d,
                                      thenAction: e.target.value,
                                    }))
                                  }
                                />
                              </Field>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  onClick={() => {
                                    if (
                                      !intentionDraft.ifCondition.trim() ||
                                      !intentionDraft.thenAction.trim()
                                    ) {
                                      return;
                                    }
                                    updateIntention(plan.id, intentionDraft);
                                    setEditingIntentionId(null);
                                  }}
                                >
                                  Сохранить
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  onClick={() => setEditingIntentionId(null)}
                                >
                                  Отмена
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="mt-1.5 space-y-1 text-sm">
                                <p>
                                  <span className="text-[var(--faint)]">
                                    если{" "}
                                  </span>
                                  <span className="text-[var(--ink)]">
                                    {plan.ifCondition}
                                  </span>
                                </p>
                                <p>
                                  <span className="text-[var(--faint)]">
                                    то{" "}
                                  </span>
                                  <span className="text-[var(--ink)]">
                                    {plan.thenAction}
                                  </span>
                                </p>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  onClick={() => startEditIntention(plan)}
                                >
                                  Изменить
                                </Button>
                                <Button
                                  type="button"
                                  variant="danger"
                                  onClick={() => {
                                    if (window.confirm("Удалить этот план?")) {
                                      removeIntention(plan.id);
                                    }
                                  }}
                                >
                                  Удалить
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                  ))}

                  {addingPlanFor === o.id ? (
                    <div className="relative py-2">
                      <span
                        className="absolute -left-4 top-5 h-px w-3 bg-[var(--line)]"
                        aria-hidden
                      />
                      <div className="space-y-2 rounded-md border border-dashed border-[var(--metal)]/50 bg-[var(--wash-2)]/30 px-3 py-3">
                        <p className="text-xs font-medium text-[var(--metal)]">
                          Новый план на это препятствие
                        </p>
                        <Field label="Если…">
                          <Input
                            value={planIf}
                            onChange={(e) => setPlanIf(e.target.value)}
                          />
                        </Field>
                        <Field label="…то я сделаю">
                          <Input
                            value={planThen}
                            onChange={(e) => setPlanThen(e.target.value)}
                            placeholder="Маленькое действие, которое реально сделать"
                          />
                        </Field>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            onClick={() => {
                              if (!planIf.trim() || !planThen.trim()) return;
                              addIntention({
                                dreamId,
                                obstacleId: o.id,
                                ifCondition: planIf,
                                thenAction: planThen,
                              });
                              setAddingPlanFor(null);
                              setPlanIf("");
                              setPlanThen("");
                            }}
                          >
                            Сохранить план
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setAddingPlanFor(null)}
                          >
                            Отмена
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {plans.length === 0 && addingPlanFor !== o.id ? (
                    <p className="py-2 text-xs text-[var(--faint)]">
                      ↓ Нажми «+ План к этому препятствию», чтобы вырастить
                      ветку
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {orphans.length > 0 ? (
        <div className="space-y-2 rounded-md border border-dashed border-[var(--line)] p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
            Планы без ветки (старые)
          </p>
          <p className="text-xs text-[var(--faint)]">
            Созданы до связки с препятствиями. Лучше удалить и завести заново
            под нужным препятствием — или оставить как есть.
          </p>
          <ul className="space-y-2">
            {orphans.map((plan) => (
              <li
                key={plan.id}
                className="rounded-md border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-sm"
              >
                <p>
                  <span className="text-[var(--faint)]">если </span>
                  {plan.ifCondition}
                </p>
                <p>
                  <span className="text-[var(--faint)]">то </span>
                  {plan.thenAction}
                </p>
                <Button
                  type="button"
                  variant="danger"
                  className="mt-2"
                  onClick={() => removeIntention(plan.id)}
                >
                  Удалить
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Section>
  );
}
