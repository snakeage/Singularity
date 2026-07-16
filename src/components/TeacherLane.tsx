"use client";

import Link from "next/link";
import { getPrimaryTeacher } from "@/lib/selectors";
import { useApp } from "@/store/AppProvider";
import { Badge, Button, Hint } from "./ui";

/** Lacuna-lane: who teaches you on the active stage. */
export function TeacherLane({ stageId }: { stageId: string }) {
  const { data } = useApp();
  const teacher = getPrimaryTeacher(data, stageId);

  if (!teacher) {
    return (
      <section className="rounded-md border border-dashed border-[var(--metal)]/40 bg-[var(--wash-2)]/25 px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-[0.1em] text-[var(--metal)]">
          Учитель этапа
        </p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Как у Ника с Лакуной: на ступени нужен тот, у кого уже брать умение —
          ментор, курс, книга-мастер или ИИ как ускоритель, не автопилот.
        </p>
        <Link href="/stage" className="mt-2 inline-block">
          <Button type="button" variant="ghost">
            Назначить учителя на Этапе
          </Button>
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-md border border-[var(--metal)]/35 bg-[var(--wash-2)]/30 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.1em] text-[var(--metal)]">
          Учитель этапа
        </p>
        <Badge tone="metal">линия наставника</Badge>
      </div>
      <p className="mt-1 font-display text-xl text-[var(--ink)]">
        {teacher.title}
      </p>
      {teacher.teaching ? (
        <p className="mt-1 text-sm text-[var(--muted)]">
          Эпик / рамка этапа: {teacher.teaching}
        </p>
      ) : null}
      {teacher.weekLesson ? (
        <div className="mt-2 rounded-md bg-[var(--panel)]/80 px-3 py-2">
          <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--faint)]">
            Урок этой недели · узкий кусок эпика
          </p>
          <p className="text-sm text-[var(--ink)]">{teacher.weekLesson}</p>
        </div>
      ) : (
        <Hint title="Разбей эпик на неделю">
          <p>
            Если наставник сказал крупно («пиши легенду») — на Этапе задай{" "}
            <strong>урок недели</strong>: один узкий кусок. ИИ может помочь
            выбрать кусок, практика — сделать его руками.
          </p>
        </Hint>
      )}
      <Link href="/stage" className="mt-2 inline-block">
        <Button type="button" variant="ghost">
          Изменить на Этапе
        </Button>
      </Link>
    </section>
  );
}
