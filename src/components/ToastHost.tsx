"use client";

import { useEffect, useState } from "react";
import { subscribeToast } from "@/lib/toastBus";

export function ToastHost() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    return subscribeToast((text) => {
      setMessage(text);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setMessage(null), 4200);
    });
  }, []);

  if (!message) return null;

  return (
    <div
      role="status"
      className="pointer-events-none fixed bottom-5 left-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2 rounded-md border border-[var(--accent)]/30 bg-[var(--ink)] px-4 py-3 text-sm text-[var(--accent-ink)] shadow-lg"
    >
      {message}
    </div>
  );
}
