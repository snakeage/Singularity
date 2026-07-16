"use client";

import { useEffect } from "react";
import { todayISO } from "@/lib/dates";
import {
  countOpenDailyPractices,
  normalizeReminders,
  shouldSendReminder,
  showPracticeReminder,
} from "@/lib/reminders";
import { useApp } from "@/store/AppProvider";

/** Fires at most once per day while the app tab is open. */
export function ReminderHost() {
  const { ready, data, markReminderSent } = useApp();

  useEffect(() => {
    if (!ready) return;

    const tick = () => {
      const reminders = normalizeReminders(data.profile?.reminders);
      const openCount = countOpenDailyPractices(data);
      if (!shouldSendReminder(reminders, openCount)) return;
      showPracticeReminder(openCount);
      markReminderSent(todayISO());
    };

    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [ready, data, markReminderSent]);

  return null;
}
