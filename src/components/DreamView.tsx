"use client";

import { useEffect, useState, type FormEvent } from "react";
import { getFocusDream, getStagesForDream } from "@/lib/selectors";
import { useFlashMessage } from "@/lib/useFlashMessage";
import { useApp } from "@/store/AppProvider";
import { WoopBlock } from "./WoopBlock";
import {
  Badge,
  Button,
  Field,
  FieldHint,
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

export function DreamView() {
  const {
    ready,
    data,
    createDream,
    updateDream,
    savePointA,
    replaceStages,
    setActiveStage,
  } = useApp();

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

  const [stageDrafts, setStageDrafts] = useState<StageDraft[]>([
    emptyStage(),
    emptyStage(),
  ]);
  const [activeIndex, setActiveIndex] = useState(0);

  const stagesFlash = useFlashMessage();

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

  function onSaveStages(e: FormEvent) {
    e.preventDefault();
    if (!dream) return;
    const cleaned = stageDrafts.filter((s) => s.title.trim());
    if (cleaned.length < 2 || cleaned.length > 5) {
      stagesFlash.flash("Нужно от 2 до 5 этапов с названиями");
      return;
    }
    replaceStages(
      dream.id,
      cleaned,
      Math.min(activeIndex, cleaned.length - 1),
    );
    stagesFlash.flash("Этапы сохранены");
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
          {dream ? dream.title : "Новый курс"}
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
              Как «правила мира» у Ника: сначала понять систему, потом играть в
              неё умело.
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
                <strong>как поймёшь, что вырос</strong> (критерии выхода). Рубежи
                внутри этапа — отдельные доказательства; их добавишь на экране
                «Этап».
              </p>
            </Hint>
            {stages.length > 0 ? (
              <ul className="space-y-2">
                {stages.map((stage) => (
                  <li
                    key={stage.id}
                    className={`rounded-md border p-4 ${
                      stage.status === "active"
                        ? "border-[var(--accent)] bg-[var(--panel)]"
                        : "border-[var(--line)] bg-[var(--panel)]/70"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-xs text-[var(--muted)]">
                          Этап {stage.order}
                          {stage.status === "active" ? " · текущий" : ""}
                          {stage.status === "completed" ? " · пройден" : ""}
                        </p>
                        <p className="font-medium text-[var(--ink)]">
                          {stage.title}
                        </p>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {stage.objective}
                        </p>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          Выход: {stage.exitCriteria}
                        </p>
                      </div>
                      {stage.status !== "active" &&
                      stage.status !== "completed" ? (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setActiveStage(dream.id, stage.id)}
                        >
                          Сделать активным
                        </Button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <form
                onSubmit={onSaveStages}
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
                              i === index
                                ? { ...s, title: e.target.value }
                                : s,
                            ),
                          )
                        }
                        required={index < 2}
                      />
                    </Field>
                    <Field label="Результат этапа (objective)">
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
                    onClick={() =>
                      setStageDrafts((list) => list.slice(0, -1))
                    }
                  >
                    − этап
                  </Button>
                  <Button type="submit">
                    {stagesFlash.message ? "Сохранено ✓" : "Сохранить этапы"}
                  </Button>
                </div>
                <SaveNotice message={stagesFlash.message} />
              </form>
            )}
          </Section>

          <WoopBlock dreamId={dream.id} />
        </>
      ) : null}
    </div>
  );
}
