"use client";

import { useEffect, useState, type FormEvent } from "react";
import { getFocusDream, getStagesForDream } from "@/lib/selectors";
import { useApp } from "@/store/AppProvider";
import { StagesEditor } from "./StagesEditor";
import { WoopBlock } from "./WoopBlock";
import {
  Badge,
  Button,
  Field,
  FieldHint,
  Hint,
  Input,
  Section,
  Textarea,
} from "./ui";

export function DreamView() {
  const { ready, data, createDream, updateDream, savePointA } = useApp();

  const dream = getFocusDream(data);
  const pointA = dream
    ? data.pointAs.find((p) => p.dreamId === dream.id)
    : undefined;
  const stages = dream ? getStagesForDream(data, dream.id) : [];

  const [dreamForm, setDreamForm] = useState({
    title: "",
    why: "",
    outcomeVision: "",
    horizon: "",
    context: "",
  });

  const [pointForm, setPointForm] = useState({
    skills: "",
    resources: "",
    constraints: "",
    notes: "",
  });

  useEffect(() => {
    if (!dream) return;
    setDreamForm({
      title: dream.title,
      why: dream.why,
      outcomeVision: dream.outcomeVision,
      horizon: dream.horizon,
      context: dream.context ?? "",
    });
  }, [dream]);

  useEffect(() => {
    if (!pointA) return;
    setPointForm({
      skills: pointA.skills,
      resources: pointA.resources,
      constraints: pointA.constraints,
      notes: pointA.notes ?? "",
    });
  }, [pointA]);

  const dreamDirty =
    !dream ||
    dreamForm.title !== dream.title ||
    dreamForm.why !== dream.why ||
    dreamForm.outcomeVision !== dream.outcomeVision ||
    dreamForm.horizon !== dream.horizon ||
    dreamForm.context !== (dream.context ?? "");

  const pointDirty =
    !pointA ||
    pointForm.skills !== pointA.skills ||
    pointForm.resources !== pointA.resources ||
    pointForm.constraints !== pointA.constraints ||
    pointForm.notes !== (pointA.notes ?? "");

  if (!ready) {
    return <p className="text-sm text-[var(--muted)]">Загрузка…</p>;
  }

  function onCreateDream(e: FormEvent) {
    e.preventDefault();
    if (!dreamForm.title.trim()) return;
    createDream(dreamForm);
  }

  function onSaveDream(e: FormEvent) {
    e.preventDefault();
    if (!dream) return;
    updateDream(dream.id, dreamForm);
  }

  function onSavePointA(e: FormEvent) {
    e.preventDefault();
    if (!dream) return;
    savePointA(dream.id, pointForm);
  }

  function formatSavedAt(iso: string): string {
    try {
      return new Date(iso).toLocaleString("ru-RU", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  }

  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--accent)]">
          Мечта
        </p>
        <h1 className="font-display text-3xl tracking-tight text-[var(--ink)]">
          {dream ? dream.title : "Новая цель"}
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Далёкий ориентир. Работаешь на текущем этапе — мечта задаёт вектор.
        </p>
      </div>

      <Hint title="С чего писать">
        <p>
          Мечта — большая цель на горизонте, не список дел на сегодня. Дальше
          разобьём её на этапы, чтобы путь был обозримым.
        </p>
      </Hint>

      <Section title={dream ? "Карточка мечты" : "Создать мечту"}>
        <form
          onSubmit={dream ? onSaveDream : onCreateDream}
          className="space-y-3 rounded-md border border-[var(--line)] bg-[var(--panel)] p-4"
        >
          <Field label="Что (название)">
            <Input
              value={dreamForm.title}
              onChange={(e) =>
                setDreamForm((f) => ({ ...f, title: e.target.value }))
              }
              placeholder="Коротко: кем/чем стану"
              required
            />
          </Field>
          <Field label="Зачем">
            <Textarea
              value={dreamForm.why}
              onChange={(e) =>
                setDreamForm((f) => ({ ...f, why: e.target.value }))
              }
              placeholder="Зачем тебе это лично — чтобы не сбиться с курса"
              required
            />
          </Field>
          <Field label="Образ результата">
            <Textarea
              value={dreamForm.outcomeVision}
              onChange={(e) =>
                setDreamForm((f) => ({
                  ...f,
                  outcomeVision: e.target.value,
                }))
              }
              placeholder="Как выглядит обычный день, когда цель уже достигнута"
              required
            />
          </Field>
          <Field label="Горизонт">
            <Input
              value={dreamForm.horizon}
              onChange={(e) =>
                setDreamForm((f) => ({ ...f, horizon: e.target.value }))
              }
              placeholder="например: 2 года / 2028"
              required
            />
          </Field>
          <Field label="Контекст / правила среды">
            <Textarea
              value={dreamForm.context}
              onChange={(e) =>
                setDreamForm((f) => ({ ...f, context: e.target.value }))
              }
              placeholder="Работа, семья, здоровье, деньги — что ограничивает и что даёт опору"
            />
            <FieldHint>
              Условия вокруг цели: что нужно учесть, чтобы план был реалистичным.
            </FieldHint>
          </Field>
          <div className="flex flex-wrap items-center gap-3">
            {!dream ? (
              <Button type="submit">Создать мечту</Button>
            ) : dreamDirty ? (
              <Button type="submit">Сохранить изменения</Button>
            ) : (
              <Badge tone="accent">
                Мечта сохранена
                {dream.updatedAt
                  ? ` · ${formatSavedAt(dream.updatedAt)}`
                  : ""}
              </Badge>
            )}
          </div>
        </form>
      </Section>

      {dream ? (
        <>
          <Section
            title="Где я сейчас"
            hint="Честный снимок старта — от него строим этапы, а не от красивой фантазии."
          >
            <Hint title="Зачем этот блок">
              <p>
                Реальная точка отсчёта: что умеешь, чем располагаешь, что мешает.
                Без неё легко поставить нереальный первый этап. Пиши как есть.
              </p>
            </Hint>
            <form
              onSubmit={onSavePointA}
              className="space-y-3 rounded-md border border-[var(--line)] bg-[var(--panel)] p-4"
            >
              <Field label="Что уже умею">
                <Textarea
                  value={pointForm.skills}
                  onChange={(e) =>
                    setPointForm((f) => ({ ...f, skills: e.target.value }))
                  }
                  placeholder="Навыки и опыт по теме мечты — даже скромные"
                />
                <FieldHint>
                  Не резюме «на идеал», а правда: что реально можешь сегодня.
                </FieldHint>
              </Field>
              <Field label="Чем располагаю">
                <Textarea
                  value={pointForm.resources}
                  onChange={(e) =>
                    setPointForm((f) => ({ ...f, resources: e.target.value }))
                  }
                  placeholder="Например: 1 час вечером, ноутбук, друг-наставник, небольшая подушка"
                />
                <FieldHint>
                  Время, деньги, люди, инструменты — то, на что можно опереться.
                </FieldHint>
              </Field>
              <Field label="Что мешает / держит на месте">
                <Textarea
                  value={pointForm.constraints}
                  onChange={(e) =>
                    setPointForm((f) => ({
                      ...f,
                      constraints: e.target.value,
                    }))
                  }
                  placeholder="Например: усталость после работы, нет тишины дома, слабый английский, страх начать"
                />
                <FieldHint>
                  Не список оправданий, а условия мира: работа, здоровье, семья,
                  навыки, страх. Это помогает не ставить нереальный первый этап.
                </FieldHint>
              </Field>
              <Field label="Ещё мысли (по желанию)">
                <Textarea
                  value={pointForm.notes}
                  onChange={(e) =>
                    setPointForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  placeholder="Всё, что не легло в поля выше"
                />
              </Field>
              <div className="flex flex-wrap items-center gap-3">
                {!pointA || pointDirty ? (
                  <Button type="submit">
                    {pointA ? "Сохранить изменения" : "Сохранить старт"}
                  </Button>
                ) : (
                  <Badge tone="accent">
                    Старт сохранён · {formatSavedAt(pointA.capturedAt)}
                  </Badge>
                )}
              </div>
            </form>
          </Section>

          <StagesEditor dreamId={dream.id} stages={stages} />
          <WoopBlock dreamId={dream.id} />
        </>
      ) : null}
    </div>
  );
}
