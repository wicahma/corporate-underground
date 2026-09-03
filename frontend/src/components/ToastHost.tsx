"use client";

import { useEffect, useState } from "react";
import { showToast, type ToastMessage } from "@/lib/toast";

const TYPE_COLORS: Record<ToastMessage["type"], string> = {
  info: "border-fg/50 text-fg",
  success: "border-emerald-500/50 text-emerald-300",
  error: "border-danger/60 text-danger",
  warning: "border-amber-500/50 text-amber-300",
};

export function ToastHost() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const onToast = (e: Event) => {
      const detail = (e as CustomEvent<ToastMessage>).detail;
      setToasts((prev) => [...prev, detail]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== detail.id));
      }, 4000);
    };
    window.addEventListener("app:toast", onToast);
    return () => window.removeEventListener("app:toast", onToast);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`card border px-4 py-3 text-xs font-mono max-w-xs ${TYPE_COLORS[t.type]}`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}