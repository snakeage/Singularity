"use client";

import { useEffect } from "react";
import { useApp } from "@/store/AppProvider";

/** Settles timers whose day/week already ended (also after app was closed). */
export function TimerSettleHost() {
  const { ready, settlePracticeTimers } = useApp();

  useEffect(() => {
    if (!ready) return;
    settlePracticeTimers();
    const id = window.setInterval(() => settlePracticeTimers(), 60_000);
    return () => window.clearInterval(id);
  }, [ready, settlePracticeTimers]);

  return null;
}
