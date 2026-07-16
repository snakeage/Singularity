"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { XP_HINTS } from "@/lib/gamification";
import {
  getActiveStage,
  getFocusDream,
  getMilestones,
  getPractices,
  getStageMaterials,
  getStageTeachers,
  stageProgress,
} from "@/lib/selectors";
import {
  COURSE_CHECK_HINT,
  COURSE_CHECK_LABEL,
  courseCheckTone,
} from "@/lib/courseCheck";
import {
  collectPracticeTags,
  formatTags,
  practiceMatchesQuery,
} from "@/lib/tags";
import type {
  CourseCheck,
  GrowthSourceType,
  PracticeFrequency,
} from "@/lib/types";
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

const COURSE_OPTIONS: CourseCheck[] = ["on_course", "unsure", "side_quest"];

const sourceTypes: { value: GrowthSourceType; label: string }[] = [
  { value: "mentor", label: "Ментор / наставник" },
  { value: "book", label: "Книга" },
  { value: "course", label: "Курс" },
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
    setPrimaryTeacher,
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
  const [pCourseCheck, setPCourseCheck] = useState<CourseCheck | "">("");
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
  const [pEditCourseCheck, setPEditCourseCheck] = useState<CourseCheck | "">(
    "",
  );
  const [pEditFocus, setPEditFocus] = useState("");
  const [pEditTags, setPEditTags] = useState("");
  const [pEditMinMinutes, setPEditMinMinutes] = useState("");

  const [tTitle, setTTitle] = useState("");
  const [tType, setTType] = useState<GrowthSourceType>("mentor");
  const [tUrl, setTUrl] = useState("");
  const [tTeaching, setTTeaching] = useState("");
  const [tWeekLesson, setTWeekLesson] = useState("");
  const [tPrimary, setTPrimary] = useState(true);
  const [mTitle, setMTitle] = useState("");
  const [mType, setMType] = useState<GrowthSourceType>("book");
  const [mUrl, setMUrl] = useState("");
  const [mNotes, setMNotes] = useState("");
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [sEditTitle, setSEditTitle] = useState("");
  const [sEditType, setSEditType] = useState<GrowthSourceType>("mentor");
  const [sEditUrl, setSEditUrl] = useState("");
  const [sEditNotes, setSEditNotes] = useState("");
  const [sEditTeaching, setSEditTeaching] = useState("");
  const [sEditWeekLesson, setSEditWeekLesson] = useState("");
  const [sEditPrimary, setSEditPrimary] = useState(false);

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
  const teachers = getStageTeachers(data, stage.id);
  const materials = getStageMaterials(data, stage.id);
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
    if (!pTitle.trim() || !pCourseCheck) return;
    if (!pWhy.trim()) {
      window.alert(
        "Напиши, как практика двигает этап — иначе легко уйти в боковой квест.",
      );
      return;
    }
    if (
      pCourseCheck === "side_quest" &&
      !window.confirm(
        "Это боковой квест: осознанное отклонение от лестницы. Всё равно добавить?",
      )
    ) {
      return;
    }
    addPractice(stage!.id, {
      title: pTitle,
      frequency: pFreq,
      cue: pCue,
      whyForStage: pWhy,
      courseCheck: pCourseCheck,
      focus: pFocus,
      tags: pTags,
      minMinutes: pMinMinutes,
    });
    setPTitle("");
    setPCue("");
    setPWhy("");
    setPCourseCheck("");
    setPFocus("");
    setPTags("");
    setPMinMinutes("");
  }

  function onAddTeacher(e: FormEvent) {
    e.preventDefault();
    if (!tTitle.trim()) return;
    addGrowthSource(stage!.id, {
      title: tTitle,
      type: tType,
      url: tUrl,
      role: "teacher",
      teaching: tTeaching,
      weekLesson: tWeekLesson,
      primary: tPrimary,
    });
    setTTitle("");
    setTUrl("");
    setTTeaching("");
    setTWeekLesson("");
    setTPrimary(true);
    setTType("mentor");
  }

  function onAddMaterial(e: FormEvent) {
    e.preventDefault();
    if (!mTitle.trim()) return;
    addGrowthSource(stage!.id, {
      title: mTitle,
      type: mType,
      url: mUrl,
      notes: mNotes,
      role: "material",
    });
    setMTitle("");
    setMUrl("");
    setMNotes("");
    setMType("book");
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
                  <Field label="Это к этапу или боковой квест?">
                    <div className="flex flex-wrap gap-3 text-sm text-[var(--ink)]">
                      {COURSE_OPTIONS.map((option) => (
                        <label
                          key={option}
                          className="flex cursor-pointer items-center gap-2"
                        >
                          <input
                            type="radio"
                            name={`course-edit-${p.id}`}
                            checked={pEditCourseCheck === option}
                            onChange={() => setPEditCourseCheck(option)}
                          />
                          {COURSE_CHECK_LABEL[option]}
                        </label>
                      ))}
                    </div>
                    {pEditCourseCheck ? (
                      <FieldHint>{COURSE_CHECK_HINT[pEditCourseCheck]}</FieldHint>
                    ) : (
                      <FieldHint>Выбери один вариант — фильтр курса.</FieldHint>
                    )}
                  </Field>
                  <Field label="Как это двигает этап?">
                    <Textarea
                      value={pEditWhy}
                      onChange={(e) => setPEditWhy(e.target.value)}
                      required
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
                        if (!pEditTitle.trim() || !pEditCourseCheck) return;
                        if (!pEditWhy.trim()) {
                          window.alert(
                            "Напиши, как практика двигает этап — иначе легко уйти в боковой квест.",
                          );
                          return;
                        }
                        if (
                          pEditCourseCheck === "side_quest" &&
                          !window.confirm(
                            "Это боковой квест: осознанное отклонение от лестницы. Всё равно сохранить?",
                          )
                        ) {
                          return;
                        }
                        updatePractice(p.id, {
                          title: pEditTitle,
                          frequency: pEditFreq,
                          cue: pEditCue,
                          whyForStage: pEditWhy,
                          courseCheck: pEditCourseCheck,
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
                    {p.courseCheck ? (
                      <Badge tone={courseCheckTone(p.courseCheck)}>
                        {COURSE_CHECK_LABEL[p.courseCheck]}
                      </Badge>
                    ) : null}
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
                        setPEditCourseCheck(p.courseCheck ?? "");
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
          <Field label="Это к этапу или боковой квест?">
            <div className="flex flex-wrap gap-3 text-sm text-[var(--ink)]">
              {COURSE_OPTIONS.map((option) => (
                <label
                  key={option}
                  className="flex cursor-pointer items-center gap-2"
                >
                  <input
                    type="radio"
                    name="course-add"
                    checked={pCourseCheck === option}
                    onChange={() => setPCourseCheck(option)}
                    required
                  />
                  {COURSE_CHECK_LABEL[option]}
                </label>
              ))}
            </div>
            {pCourseCheck ? (
              <FieldHint>{COURSE_CHECK_HINT[pCourseCheck]}</FieldHint>
            ) : (
              <FieldHint>
                Фильтр курса из канона: не тащи на лестницу то, что её не
                двигает.
              </FieldHint>
            )}
          </Field>
          <Field label="Как это двигает этап?">
            <Textarea
              value={pWhy}
              onChange={(e) => setPWhy(e.target.value)}
              placeholder="Если не можешь ответить — возможно, это отклонение"
              required
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
        title="Учитель этапа"
        hint="Линия Лакуны: на ступени — кто уже умеет то, чему ты учишься. Один главный наставник."
      >
        <Hint title="Эпик ментора → урок недели">
          <p>
            Наставник часто даёт крупно: «пиши легенду». Это поле{" "}
            <strong>чему учит</strong> — рамка всего этапа.{" "}
            <strong>Урок недели</strong> — узкий кусок на эти 7 дней (глава,
            сцена, навык). ИИ может помочь раздробить эпик, но не заменить
            практику.
          </p>
        </Hint>
        <ul className="mb-3 space-y-2 text-sm">
          {teachers.map((s) => (
            <li
              key={s.id}
              className={`rounded-md border p-3 ${
                s.primary
                  ? "border-[var(--metal)] bg-[var(--wash-2)]/30"
                  : "border-[var(--line)] bg-[var(--panel)]"
              }`}
            >
              {editingSourceId === s.id ? (
                <div className="space-y-2">
                  <Field label="Кто (имя / канал / книга-мастер)">
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
                  <Field label="Чему учит (эпик / рамка этапа)">
                    <Textarea
                      value={sEditTeaching}
                      onChange={(e) => setSEditTeaching(e.target.value)}
                      placeholder="Крупное поручение наставника"
                    />
                  </Field>
                  <Field label="Урок этой недели (узкий кусок)">
                    <Textarea
                      value={sEditWeekLesson}
                      onChange={(e) => setSEditWeekLesson(e.target.value)}
                      placeholder="Один конкретный фокус на эти 7 дней"
                    />
                  </Field>
                  <Field label="Ссылка">
                    <Input
                      value={sEditUrl}
                      onChange={(e) => setSEditUrl(e.target.value)}
                    />
                  </Field>
                  <label className="flex items-center gap-2 text-sm text-[var(--ink)]">
                    <input
                      type="checkbox"
                      checked={sEditPrimary}
                      onChange={(e) => setSEditPrimary(e.target.checked)}
                    />
                    Главный учитель этапа
                  </label>
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
                          role: "teacher",
                          teaching: sEditTeaching,
                          weekLesson: sEditWeekLesson,
                          primary: sEditPrimary,
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
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge tone="metal">
                      {s.primary ? "главный учитель" : "учитель"}
                    </Badge>
                    <span className="text-xs text-[var(--faint)]">
                      {sourceTypes.find((t) => t.value === s.type)?.label ??
                        s.type}
                    </span>
                  </div>
                  <p className="font-medium text-[var(--ink)]">{s.title}</p>
                  {s.teaching ? (
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      Эпик / рамка: {s.teaching}
                    </p>
                  ) : null}
                  {s.weekLesson ? (
                    <p className="mt-1 text-xs text-[var(--ink)]">
                      Урок недели: {s.weekLesson}
                    </p>
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
                        setSEditTeaching(s.teaching ?? "");
                        setSEditWeekLesson(s.weekLesson ?? "");
                        setSEditPrimary(Boolean(s.primary));
                      }}
                    >
                      Изменить
                    </Button>
                    {!s.primary ? (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setPrimaryTeacher(s.id)}
                      >
                        Сделать главным
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => {
                        if (window.confirm("Удалить этого учителя?")) {
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
          onSubmit={onAddTeacher}
          className="space-y-3 rounded-md border border-dashed border-[var(--metal)]/40 bg-[var(--panel)] p-4"
        >
          <p className="text-sm font-medium text-[var(--ink)]">
            Добавить учителя
          </p>
          <Field label="Кто">
            <Input
              value={tTitle}
              onChange={(e) => setTTitle(e.target.value)}
              placeholder="Например: Лакуна, ментор Аня, курс X"
              required
            />
          </Field>
          <Field label="Тип">
            <Select
              value={tType}
              onChange={(e) => setTType(e.target.value as GrowthSourceType)}
            >
              {sourceTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Чему учит на этом этапе (эпик / рамка)">
            <Textarea
              value={tTeaching}
              onChange={(e) => setTTeaching(e.target.value)}
              placeholder="Например: собрать легенду мира, голос рассказчика"
            />
            <FieldHint>
              Крупное поручение наставника на весь этап — не обязательно на одну
              неделю.
            </FieldHint>
          </Field>
          <Field label="Урок этой недели (узкий кусок)">
            <Textarea
              value={tWeekLesson}
              onChange={(e) => setTWeekLesson(e.target.value)}
              placeholder="Например: 1 страница происхождения героя"
            />
            <FieldHint>
              Что именно берёшь из эпика ментора (или с ИИ) на эти 7 дней.
            </FieldHint>
          </Field>
          <Field label="Ссылка">
            <Input value={tUrl} onChange={(e) => setTUrl(e.target.value)} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-[var(--ink)]">
            <input
              type="checkbox"
              checked={tPrimary}
              onChange={(e) => setTPrimary(e.target.checked)}
            />
            Главный учитель этапа
          </label>
          <Button type="submit">Добавить учителя</Button>
        </form>
      </Section>

      <Section
        title="Другие источники"
        hint="Материалы без роли «учитель»: статьи, тулзы, заметки."
      >
        <ul className="mb-3 space-y-2 text-sm">
          {materials.map((s) => (
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
                          role: "material",
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
                      variant="ghost"
                      onClick={() => {
                        updateGrowthSource(s.id, {
                          title: s.title,
                          type: s.type,
                          url: s.url,
                          notes: s.notes,
                          role: "teacher",
                          primary: teachers.length === 0,
                        });
                      }}
                    >
                      Сделать учителем
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => {
                        if (window.confirm("Удалить этот источник?")) {
                          removeGrowthSource(s.id);
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
          onSubmit={onAddMaterial}
          className="space-y-3 rounded-md border border-[var(--line)] bg-[var(--panel)] p-4"
        >
          <p className="text-sm font-medium text-[var(--ink)]">
            Добавить материал
          </p>
          <Field label="Название">
            <Input
              value={mTitle}
              onChange={(e) => setMTitle(e.target.value)}
              required
            />
          </Field>
          <Field label="Тип">
            <Select
              value={mType}
              onChange={(e) => setMType(e.target.value as GrowthSourceType)}
            >
              {sourceTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Ссылка">
            <Input value={mUrl} onChange={(e) => setMUrl(e.target.value)} />
          </Field>
          <Field label="Заметки">
            <Textarea
              value={mNotes}
              onChange={(e) => setMNotes(e.target.value)}
            />
          </Field>
          <Button type="submit">Добавить источник</Button>
        </form>
      </Section>
    </div>
  );
}
