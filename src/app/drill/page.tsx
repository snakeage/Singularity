"use client";

import { Suspense } from "react";
import { DrillView } from "@/components/DrillView";

export default function DrillPage() {
  return (
    <Suspense
      fallback={<p className="text-sm text-[var(--muted)]">Загрузка…</p>}
    >
      <DrillView />
    </Suspense>
  );
}
