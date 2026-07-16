"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  getActiveStage,
  getFocusDream,
  getMilestones,
  getPractices,
  stageProgress,
} from "@/lib/selectors";
import { XP_HINTS } from "@/lib/gamification";
import {
  collectPracticeTags,
  formatTags,
  practiceMatchesQuery,
} from "@/lib/tags";
import type { GrowthSourceType, PracticeFrequency } from "@/lib/types";
import { useApp } from "@/store/AppProvider";
import {
  Badge,
  Button,
  EmptyState,
  Field,
  FieldHint,
  Hint,
  Input,
  LadderChain,
  ProgressBar,
  Section,
  Select,
  Textarea,
} from "./ui";

const sourceTypes: { value: GrowthSourceType; label: string }[] = [
  { value: "book", label: "Книга" },
  { value: "course", label: "Курс" },
  { value: "mentor", label: "Ментор" },
  { value: "ai", label: "ИИ (прокачка из сети)" },
  { value: "practice", label: "Тренажёр" },
  { value: "other", label: "Другое" },
];

export function StageView() {
  const {
    ready,
    data,
    addMilestone,
    toggleMilestone,
    updateMilestone,
    removeMilestone,
    addPractice,
    updatePractice,
    removePractice,
    addGrowthSource,
    updateGrowthSource,
    removeGrowthSource,
    completeStage,
  } = useApp();

  const [msTitle, setMsTitle] = useState("");
  const [msMetric, setMsMetric] = useState("");
  const [msDue, setMsDue] = useState("");
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(
    null,
  );
  const [msEditTitle, setMsEditTitle] = useState("");
  const [msEditMetric, setMsEditMetric] = useState("");
  const [msEditDue, setMsEditDue] = useState("");

  const [pTitle, setPTitle] = useState("");
  const [pFreq, setPFreq] = useState<PracticeFrequency>("daily");
  const [pCue, setPCue] = useState("");
  const [pWhy, setPWhy] = useState("");
  const [pFocus, setPFocus] = useState("");
  const [pTags, setPTags] = useState("");
  const [pMinMinutes, setPMinMinutes] = useState("");
  const [practiceQuery, setPracticeQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [editingPracticeId, setEditingPracticeId] = useState<string | null>(
    null,
  );
  const [pEditTitle, setPEditTitle] = useState("");
  const [pEditFreq, setPEditFreq] = useState<PracticeFrequency>("daily");
  const [pEditCue, setPEditCue] = useState("");
  const [pEditWhy, setPEditWhy] = useState("");
  const [pEditFocus, setPEditFocus] = useState("");
  const [pEditTags, setPEditTags] = useState("");
  const [pEditMinMinutes, setPEditMinMinutes] = useState("");

  const [sTitle, setSTitle] = useState("");
  const [sType, setSType] = useState<GrowthSourceType>("ai");
  const [sUrl, setSUrl] = useState("");
  const [sNotes, setSNotes] = useState("");
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [sEditTitle, setSEditTitle] = useState("");
  const [sEditType, setSEditType] = useState<GrowthSourceType>("ai");
  const [sEditUrl, setSEditUrl] = useState("");
  const [sEditNotes, setSEditNotes] = useState("");

  if (!ready) {
    return <p className="text-sm text-[var(--muted)]">Загрузка…</p>;
  }

  const dream = getFocusDream(data);
  if (!dream) {
    return (
      <EmptyState
        title="Сначала мечта"
        body="Без ориентира этап строить рано."
        action={
          <Link href="/dream">
            <Button type="button">К мечте</Button>
          </Link>
        }
      />
    );
  }

  const stage = getActiveStage(data, dream.id);
  if (!stage) {
    return (
      <EmptyState
        title="Нет активного этапа"
        body="Создай 2–5 ступеней на экране мечты и выбери текущую."
        action={
          <Link href="/dream">
            <Button type="button">Настроить этапы</Button>
          </Link>
        }
      />
    );
  }

  const milestones = getMilestones(data, stage.id);
  const practices = getPractices(data, stage.id);
  const practiceTags = collectPracticeTags(practices);
  const filteredPractices = practices.filter((p) =>
    practiceMatchesQuery(p, practiceQuery, activeTag),
  );
  const sources = data.growthSources.filter((g) => g.stageId === stage.id);
  const progress = stageProgress(data, stage.id);

  function onAddMilestone(e: FormEvent) {
    e.preventDefault();
    if (!msTitle.trim() || !msMetric.trim()) return;
    addMilestone(stage!.id, {
      title: msTitle,
      successMetric: msMetric,
      dueAt: msDue || undefined,
    });
    setMsTitle("");
    setMsMetric("");
    setMsDue("");
  }

  function onAddPractice(e: FormEvent) {
    e.preventDefault();
    if (!pTitle.trim()) return;
    addPractice(stage!.id, {
      title: pTitle,
      frequency: pFreq,
      cue: pCue,
      whyForStage: pWhy,
      focus: pFocus,
      tags: pTags,
      minMinutes: pMinMinutes,
    });
    setPTitle("");
    setPCue("");
    setPWhy("");
    setPFocus("");
    setPTags("");
    setPMinMinutes("");
  }

  function onAddSource(e: FormEvent) {
    e.preventDefault();
    if (!sTitle.trim()) return;
    addGrowthSource(stage!.id, {
      title: sTitle,
      type: sType,
      url: sUrl,
      notes: sNotes,
    });
    setSTitle("");
    setSUrl("");
    setSNotes("");
  }

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--accent)]">
            Текущий этап
          </p>
          <Badge tone="accent">Этап {stage.order}</Badge>
        </div>
        <h1 className="font-display text-3xl tracking-tight text-[var(--ink)]">
          {stage.title}
        </h1>
        <LadderChain dream={dream.title} stage={stage.title} />
        <p className="text-sm text-[var(--muted)]">{stage.objective}</p>
        <p className="text-xs text-[var(--muted)]">
          Критерии выхода: {stage.exitCriteria}
        </p>
        <div className="space-y-1 pt-2">
          <div className="flex justify-between text-xs text-[var(--muted)]">
            <span>Прогресс рубежей</span>
            <span>
              {progress.done}/{progress.total}
            </span>
          </div>
          <ProgressBar ratio={progress.ratio} />
        </div>
        <div className="pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              if (
                progress.total > 0 &&
                progress.done < progress.total &&
                !window.confirm(
                  "Не все рубежи закрыты. Всё равно отметить этап пройденным и перейти дальше?",
                )
              ) {
                return;
              }
              completeStage(stage.id);
            }}
          >
            Этап пройден → следующий · {XP_HINTS.stage}
          </Button>
        </div>
      </div>

      <Section
        title="Рубежи — доказательства роста"
        hint={`Закрытый рубеж даёт ${XP_HINTS.milestone}. Это не ежедневные дела.`}
      >
        <Hint title="Что такое рубеж?">
          <p>
            <strong>Рубеж</strong> — доказательство роста на этапе («сдал
            экзамен», «сделал демо»). Не ежедневная практика и не «что мешает».
          </p>
          <p>
            Пример: этап «База английского» → практика «20 мин Anki»; рубеж
            «тест A2 на 80%».
          </p>
        </Hint>

        {milestones.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            Пока рубежей нет — добавь 2–4 доказательства ниже. Без них этап
            легко превратить в бесконечную «занятость».
          </p>
        ) : null}

        <ul className="space-y-2">
          {milestones.map((m) => (
            <li
              key={m.id}
              className="rounded-md border border-[var(--line)] bg-[var(--panel)] p-3"
            >
              {editingMilestoneId === m.id ? (
                <div className="space-y-2">
                  <Field label="Рубеж">
                    <Input
                      value={msEditTitle}
                      onChange={(e) => setMsEditTitle(e.target.value)}
                    />
                  </Field>
                  <Field label="Как поймёшь, что готово">
                    <Input
                      value={msEditMetric}
                      onChange={(e) => setMsEditMetric(e.target.value)}
                    />
                  </Field>
                  <Field label="Срок">
                    <Input
                      type="date"
                      value={msEditDue}
                      onChange={(e) => setMsEditDue(e.target.value)}
                    />
                  </Field>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      onClick={() => {
                        if (!msEditTitle.trim() || !msEditMetric.trim()) return;
                        updateMilestone(m.id, {
                          title: msEditTitle,
                          successMetric: msEditMetric,
                          dueAt: msEditDue || undefined,
                        });
                        setEditingMilestoneId(null);
                      }}
                    >
                      Сохранить
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setEditingMilestoneId(null)}
                    >
                      Отмена
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p
                      className={`font-medium ${
                        m.status === "done"
                          ? "text-[var(--muted)] line-through"
                          : "text-[var(--ink)]"
                      }`}
                    >
                      {m.title}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {m.successMetric}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => toggleMilestone(m.id)}
                    >
                      {m.status === "done"
                        ? "Открыть"
                        : `Готово · ${XP_HINTS.milestone}`}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setEditingMilestoneId(m.id);
                        setMsEditTitle(m.title);
                        setMsEditMetric(m.successMetric);
                        setMsEditDue(m.dueAt?.slice(0, 10) ?? "");
                      }}
                    >
                      Изменить
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => {
                        if (window.confirm("Удалить этот рубеж?")) {
                          removeMilestone(m.id);
                        }
                      }}
                    >
                      Удалить
                    </Button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
        <form
          onSubmit={onAddMilestone}
          className="space-y-3 rounded-md border border-[var(--line)] bg-[var(--panel)] p-4"
        >
          <Field label="Рубеж (что докажешь)">
            <Input
              value={msTitle}
              onChange={(e) => setMsTitle(e.target.value)}
              placeholder="Например: собрал и показал демо друзьям"
              required
            />
            <FieldHint>
              Формулируй как результат, который можно проверить — не как
              «заниматься чаще».
            </FieldHint>
          </Field>
          <Field label="Как поймёшь, что готово">
            <Input
              value={msMetric}
              onChange={(e) => setMsMetric(e.target.value)}
              placeholder="Например: 3 человека попользовались и дали фидбек"
              required
            />
            <FieldHint>
              Конкретный критерий: число, артефакт, навык без шпаргалки.
            </FieldHint>
          </Field>
          <Field label="Срок (опционально)">
            <Input
              type="date"
              value={msDue}
              onChange={(e) => setMsDue(e.target.value)}
            />
          </Field>
          <Button type="submit">Добавить рубеж</Button>
        </form>
      </Section>

      <Section
        title="Практики"
        hint="Ежедневные действия внутри этого этапа — не путай с самими этапами пути."
      >
        <Hint title="Подсказка">
          <p>
            <strong>Практика</strong> живёт внутри этапа. Сделай её маленькой —
            почти стыдно не выполнить. Без практик рубеж («экзамен») не закрыть.
          </p>
        </Hint>

        {practices.length > 0 ? (
          <div className="space-y-2 rounded-md border border-[var(--line)] bg-[var(--panel)] p-3">
            <Field label="Поиск">
              <Input
                value={practiceQuery}
                onChange={(e) => setPracticeQuery(e.target.value)}
                placeholder="Название, фокус, тег…"
              />
            </Field>
            {practiceTags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setActiveTag(null)}
                >
                  Все
                </Button>
                {practiceTags.map((tag) => (
                  <Button
                    key={tag}
                    type="button"
                    variant={activeTag === tag ? "primary" : "ghost"}
                    onClick={() =>
                      setActiveTag((prev) => (prev === tag ? null : tag))
                    }
                  >
                    #{tag}
                  </Button>
                ))}
              </div>
            ) : null}
            {filteredPractices.length === 0 ? (
              <p className="text-xs text-[var(--muted)]">
                Ничего не найдено — сбрось поиск или тег.
              </p>
            ) : null}
          </div>
        ) : null}

        <ul className="mb-3 space-y-2 text-sm">
          {filteredPractices.map((p) => (
            <li key={p.id} className="practice-card rounded-md p-3">
              {editingPracticeId === p.id ? (
                <div className="space-y-2">
                  <Field label="Практика">
                    <Input
                      value={pEditTitle}
                      onChange={(e) => setPEditTitle(e.target.value)}
                    />
                  </Field>
                  <Field label="Частота">
                    <Select
                      value={pEditFreq}
                      onChange={(e) =>
                        setPEditFreq(e.target.value as PracticeFrequency)
                      }
                    >
                      <option value="daily">Ежедневно</option>
                      <option value="weekly">Еженедельно</option>
                    </Select>
                  </Field>
                  <Field label="Когда / где">
                    <Input
                      value={pEditCue}
                      onChange={(e) => setPEditCue(e.target.value)}
                    />
                  </Field>
                  <Field label="Как это двигает этап?">
                    <Textarea
                      value={pEditWhy}
                      onChange={(e) => setPEditWhy(e.target.value)}
                    />
                  </Field>
                  <Field label="Фокус">
                    <Input
                      value={pEditFocus}
                      onChange={(e) => setPEditFocus(e.target.value)}
                    />
                  </Field>
                  <Field label="Теги">
                    <Input
                      value={pEditTags}
                      onChange={(e) => setPEditTags(e.target.value)}
                      placeholder="сила, учёба"
                    />
                  </Field>
                  <Field label="Минимум минут">
                    <Input
                      type="number"
                      min={1}
                      max={1440}
                      value={pEditMinMinutes}
                      onChange={(e) => setPEditMinMinutes(e.target.value)}
                      placeholder="например: 25"
                    />
                  </Field>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      onClick={() => {
                        if (!pEditTitle.trim()) return;
                        updatePractice(p.id, {
                          title: pEditTitle,
                          frequency: pEditFreq,
                          cue: pEditCue,
                          whyForStage: pEditWhy,
                          focus: pEditFocus,
                          tags: pEditTags,
                          minMinutes: pEditMinMinutes,
                        });
                        setEditingPracticeId(null);
                      }}
                    >
                      Сохранить
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setEditingPracticeId(null)}
                    >
                      Отмена
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge tone="metal">Практика</Badge>
                    <span className="text-xs text-[var(--faint)]">
                      {p.frequency === "daily"
                        ? "каждый день"
                        : "каждую неделю"}
                    </span>
                    {p.minMinutes ? (
                      <span className="text-xs text-[var(--faint)]">
                        ≥ {p.minMinutes} мин
                      </span>
                    ) : null}
                    {(p.tags ?? []).map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--accent)]"
                        onClick={() => setActiveTag(tag)}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                  <p className="font-medium text-[var(--ink)]">{p.title}</p>
                  {p.whyForStage ? (
                    <p className="text-xs text-[var(--muted)]">
                      Зачем этапу: {p.whyForStage}
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setEditingPracticeId(p.id);
                        setPEditTitle(p.title);
                        setPEditFreq(p.frequency);
                        setPEditCue(p.cue ?? "");
                        setPEditWhy(p.whyForStage ?? "");
                        setPEditFocus(p.focus ?? "");
                        setPEditTags(formatTags(p.tags));
                        setPEditMinMinutes(
                          p.minMinutes != null ? String(p.minMinutes) : "",
                        );
                      }}
                    >
                      Изменить
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => {
                        if (
                          window.confirm(
                            "Удалить практику и её отметки за дни?",
                          )
                        ) {
                          removePractice(p.id);
                        }
                      }}
                    >
                      Удалить
                    </Button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
        <form
          onSubmit={onAddPractice}
          className="space-y-3 rounded-md border border-[var(--line)] bg-[var(--panel)] p-4"
        >
          <Field label="Практика (ежедневное действие)">
            <Input
              value={pTitle}
              onChange={(e) => setPTitle(e.target.value)}
              placeholder="Например: 25 минут кода после ужина"
              required
            />
            <FieldHint>
              Это не новый этап. Это действие внутри этапа «{stage.title}».
            </FieldHint>
          </Field>
          <Field label="Частота">
            <Select
              value={pFreq}
              onChange={(e) =>
                setPFreq(e.target.value as PracticeFrequency)
              }
            >
              <option value="daily">Ежедневно</option>
              <option value="weekly">Еженедельно</option>
            </Select>
          </Field>
          <Field label="Когда / где">
            <Input
              value={pCue}
              onChange={(e) => setPCue(e.target.value)}
              placeholder="После ужина, за столом, таймер 25 мин"
            />
            <FieldHint>
              Привязка к месту/времени помогает не забывать (Atomic Habits).
            </FieldHint>
          </Field>
          <Field label="Как это двигает этап? (фильтр курса)">
            <Textarea
              value={pWhy}
              onChange={(e) => setPWhy(e.target.value)}
              placeholder="Если не можешь ответить — возможно, это отклонение"
            />
          </Field>
          <Field label="Фокус практики">
            <Input
              value={pFocus}
              onChange={(e) => setPFocus(e.target.value)}
              placeholder="Что именно тренирую сегодня"
            />
          </Field>
          <Field label="Теги">
            <Input
              value={pTags}
              onChange={(e) => setPTags(e.target.value)}
              placeholder="сила, учёба, речь"
            />
            <FieldHint>
              Через запятую или пробел. Нужны для фильтра, когда практик много.
            </FieldHint>
          </Field>
          <Field label="Минимум минут (для таймера)">
            <Input
              type="number"
              min={1}
              max={1440}
              value={pMinMinutes}
              onChange={(e) => setPMinMinutes(e.target.value)}
              placeholder="например: 25"
            />
            <FieldHint>
              На «Сегодня» можно запустить таймер, ставить на паузу и отметить
              практику с фактическим временем. Пусто = без минимума.
            </FieldHint>
          </Field>
          <Button type="submit">Добавить практику</Button>
        </form>
      </Section>

      <Section
        title="Источники роста"
        hint="Учителя и знания. ИИ — современная «прокачка из сети», не автопилот."
      >
        <ul className="mb-3 space-y-2 text-sm">
          {sources.map((s) => (
            <li
              key={s.id}
              className="rounded-md border border-[var(--line)] bg-[var(--panel)] p-3"
            >
              {editingSourceId === s.id ? (
                <div className="space-y-2">
                  <Field label="Название">
                    <Input
                      value={sEditTitle}
                      onChange={(e) => setSEditTitle(e.target.value)}
                    />
                  </Field>
                  <Field label="Тип">
                    <Select
                      value={sEditType}
                      onChange={(e) =>
                        setSEditType(e.target.value as GrowthSourceType)
                      }
                    >
                      {sourceTypes.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Ссылка">
                    <Input
                      value={sEditUrl}
                      onChange={(e) => setSEditUrl(e.target.value)}
                    />
                  </Field>
                  <Field label="Заметки">
                    <Textarea
                      value={sEditNotes}
                      onChange={(e) => setSEditNotes(e.target.value)}
                    />
                  </Field>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      onClick={() => {
                        if (!sEditTitle.trim()) return;
                        updateGrowthSource(s.id, {
                          title: sEditTitle,
                          type: sEditType,
                          url: sEditUrl,
                          notes: sEditNotes,
                        });
                        setEditingSourceId(null);
                      }}
                    >
                      Сохранить
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setEditingSourceId(null)}
                    >
                      Отмена
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="font-medium text-[var(--ink)]">{s.title}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {sourceTypes.find((t) => t.value === s.type)?.label ??
                      s.type}
                    {s.url ? ` · ${s.url}` : ""}
                  </p>
                  {s.notes ? (
                    <p className="mt-1 text-xs text-[var(--muted)]">{s.notes}</p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setEditingSourceId(s.id);
                        setSEditTitle(s.title);
                        setSEditType(s.type);
                        setSEditUrl(s.url ?? "");
                        setSEditNotes(s.notes ?? "");
                      }}
                    >
                      Изменить
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => {
                        if (window.confirm("Удалить этот источник роста?")) {
                          removeGrowthSource(s.id);
                          if (editingSourceId === s.id) {
                            setEditingSourceId(null);
                          }
                        }
                      }}
                    >
                      Удалить
                    </Button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
        <form
          onSubmit={onAddSource}
          className="space-y-3 rounded-md border border-[var(--line)] bg-[var(--panel)] p-4"
        >
          <Field label="Название">
            <Input
              value={sTitle}
              onChange={(e) => setSTitle(e.target.value)}
              required
            />
          </Field>
          <Field label="Тип">
            <Select
              value={sType}
              onChange={(e) =>
                setSType(e.target.value as GrowthSourceType)
              }
            >
              {sourceTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Ссылка">
            <Input value={sUrl} onChange={(e) => setSUrl(e.target.value)} />
          </Field>
          <Field label="Заметки">
            <Textarea
              value={sNotes}
              onChange={(e) => setSNotes(e.target.value)}
            />
          </Field>
          <Button type="submit">Добавить источник</Button>
        </form>
      </Section>

    </div>
  );
}
