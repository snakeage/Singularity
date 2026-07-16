"use client";

import { useState, type FormEvent } from "react";
import type { Stage } from "@/lib/types";
import { useFlashMessage } from "@/lib/useFlashMessage";
import { useApp } from "@/store/AppProvider";
import {
  Badge,
  Button,
  Field,
  Hint,
  Input,
  SaveNotice,
  Section,
  Textarea,
} from "./ui";

type StageDraft = {
  title: string;
  objective: string;
  exitCriteria: string;
};

const emptyStage = (): StageDraft => ({
  title: "",
  objective: "",
  exitCriteria: "",
});

type Props = {
  dreamId: string;
  stages: Stage[];
};

export function StagesEditor({ dreamId, stages }: Props) {
  const {
    replaceStages,
    updateStage,
    addStage,
    removeStage,
    setActiveStage,
  } = useApp();

  const createFlash = useFlashMessage();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<StageDraft>(emptyStage());
  const [adding, setAdding] = useState(false);
  const [addDraft, setAddDraft] = useState<StageDraft>(emptyStage());

  const [stageDrafts, setStageDrafts] = useState<StageDraft[]>([
    emptyStage(),
    emptyStage(),
  ]);
  const [activeIndex, setActiveIndex] = useState(0);

  function startEdit(stage: Stage) {
    setEditingId(stage.id);
    setEditDraft({
      title: stage.title,
      objective: stage.objective,
      exitCriteria: stage.exitCriteria,
    });
    setAdding(false);
  }

  function onCreateAll(e: FormEvent) {
    e.preventDefault();
    const cleaned = stageDrafts.filter((s) => s.title.trim());
    if (cleaned.length < 2 || cleaned.length > 5) {
      createFlash.flash("Нужно от 2 до 5 этапов с названиями");
      return;
    }
    replaceStages(
      dreamId,
      cleaned,
      Math.min(activeIndex, cleaned.length - 1),
    );
    createFlash.flash("Этапы сохранены");
  }

  if (stages.length === 0) {
    return (
      <Section
        title="Этапы пути"
        hint="2–5 ступеней. Активен один — не распыляйся на все сразу."
      >
        <Hint title="Как дробить мечту">
          <p>
            Каждый этап — кусок пути, который нужно закрыть, прежде чем идти
            дальше. Не перескакивай через ступень.
          </p>
          <p>
            У этапа: <strong>куда вырасти</strong> +{" "}
            <strong>как поймёшь, что вырос</strong> (критерии выхода).
          </p>
        </Hint>
        <form
          onSubmit={onCreateAll}
          className="space-y-4 rounded-md border border-[var(--line)] bg-[var(--panel)] p-4"
        >
          {stageDrafts.map((draft, index) => (
            <div
              key={index}
              className="space-y-2 border-t border-[var(--line)] pt-3 first:border-t-0 first:pt-0"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Этап {index + 1}</p>
                <label className="flex items-center gap-2 text-xs text-[var(--muted)]">
                  <input
                    type="radio"
                    name="activeStage"
                    checked={activeIndex === index}
                    onChange={() => setActiveIndex(index)}
                  />
                  Активный
                </label>
              </div>
              <Field label="Название">
                <Input
                  value={draft.title}
                  onChange={(e) =>
                    setStageDrafts((list) =>
                      list.map((s, i) =>
                        i === index ? { ...s, title: e.target.value } : s,
                      ),
                    )
                  }
                  required={index < 2}
                />
              </Field>
              <Field label="Результат этапа">
                <Textarea
                  value={draft.objective}
                  onChange={(e) =>
                    setStageDrafts((list) =>
                      list.map((s, i) =>
                        i === index
                          ? { ...s, objective: e.target.value }
                          : s,
                      ),
                    )
                  }
                  required={index < 2}
                />
              </Field>
              <Field label="Критерии выхода">
                <Textarea
                  value={draft.exitCriteria}
                  onChange={(e) =>
                    setStageDrafts((list) =>
                      list.map((s, i) =>
                        i === index
                          ? { ...s, exitCriteria: e.target.value }
                          : s,
                      ),
                    )
                  }
                  required={index < 2}
                />
              </Field>
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={stageDrafts.length >= 5}
              onClick={() =>
                setStageDrafts((list) => [...list, emptyStage()])
              }
            >
              + этап
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={stageDrafts.length <= 2}
              onClick={() => setStageDrafts((list) => list.slice(0, -1))}
            >
              − этап
            </Button>
            <Button type="submit">
              {createFlash.message ? "Сохранено ✓" : "Сохранить этапы"}
            </Button>
          </div>
          <SaveNotice message={createFlash.message} />
        </form>
      </Section>
    );
  }

  return (
    <Section
      title="Этапы пути"
      hint="Можно менять тексты, делать этап активным, добавлять и удалять (минимум 2, максимум 5)."
    >
      <ul className="space-y-3">
        {stages.map((stage) => {
          const isEditing = editingId === stage.id;
          return (
            <li
              key={stage.id}
              className={`rounded-md border p-4 ${
                stage.status === "active"
                  ? "border-[var(--accent)] bg-[var(--panel)]"
                  : "border-[var(--line)] bg-[var(--panel)]/70"
              }`}
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge tone={stage.status === "active" ? "accent" : "muted"}>
                  Этап {stage.order}
                </Badge>
                {stage.status === "active" ? (
                  <Badge tone="metal">текущий</Badge>
                ) : null}
                {stage.status === "completed" ? (
                  <Badge>пройден</Badge>
                ) : null}
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  <Field label="Название">
                    <Input
                      value={editDraft.title}
                      onChange={(e) =>
                        setEditDraft((d) => ({ ...d, title: e.target.value }))
                      }
                    />
                  </Field>
                  <Field label="Результат этапа">
                    <Textarea
                      value={editDraft.objective}
                      onChange={(e) =>
                        setEditDraft((d) => ({
                          ...d,
                          objective: e.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="Критерии выхода">
                    <Textarea
                      value={editDraft.exitCriteria}
                      onChange={(e) =>
                        setEditDraft((d) => ({
                          ...d,
                          exitCriteria: e.target.value,
                        }))
                      }
                    />
                  </Field>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      onClick={() => {
                        if (!editDraft.title.trim()) return;
                        updateStage(stage.id, editDraft);
                        setEditingId(null);
                      }}
                    >
                      Сохранить
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setEditingId(null)}
                    >
                      Отмена
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="font-medium text-[var(--ink)]">{stage.title}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {stage.objective}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Выход: {stage.exitCriteria}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => startEdit(stage)}
                    >
                      Изменить
                    </Button>
                    {stage.status !== "active" ? (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setActiveStage(dreamId, stage.id)}
                      >
                        Сделать активным
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="danger"
                      disabled={stages.length <= 2}
                      onClick={() => {
                        if (stages.length <= 2) return;
                        if (
                          !window.confirm(
                            "Удалить этап вместе с его рубежами, практиками и источниками?",
                          )
                        ) {
                          return;
                        }
                        removeStage(stage.id);
                        if (editingId === stage.id) setEditingId(null);
                      }}
                    >
                      Удалить
                    </Button>
                  </div>
                </>
              )}
            </li>
          );
        })}
      </ul>

      {stages.length < 5 ? (
        <div className="mt-3">
          {adding ? (
            <div className="space-y-3 rounded-md border border-dashed border-[var(--line)] bg-[var(--panel)] p-4">
              <p className="text-sm font-medium text-[var(--ink)]">
                Новый этап {stages.length + 1}
              </p>
              <Field label="Название">
                <Input
                  value={addDraft.title}
                  onChange={(e) =>
                    setAddDraft((d) => ({ ...d, title: e.target.value }))
                  }
                  placeholder="Куда вырасти на этой ступени"
                />
              </Field>
              <Field label="Результат этапа">
                <Textarea
                  value={addDraft.objective}
                  onChange={(e) =>
                    setAddDraft((d) => ({ ...d, objective: e.target.value }))
                  }
                />
              </Field>
              <Field label="Критерии выхода">
                <Textarea
                  value={addDraft.exitCriteria}
                  onChange={(e) =>
                    setAddDraft((d) => ({
                      ...d,
                      exitCriteria: e.target.value,
                    }))
                  }
                />
              </Field>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() => {
                    if (!addDraft.title.trim()) return;
                    addStage(dreamId, addDraft);
                    setAddDraft(emptyStage());
                    setAdding(false);
                  }}
                >
                  Добавить этап
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setAdding(false);
                    setAddDraft(emptyStage());
                  }}
                >
                  Отмена
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setAdding(true);
                setEditingId(null);
              }}
            >
              + Добавить этап
            </Button>
          )}
        </div>
      ) : (
        <p className="mt-2 text-xs text-[var(--faint)]">
          Максимум 5 этапов — чтобы путь оставался обозримым.
        </p>
      )}
    </Section>
  );
}
