"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth";

export const DEFAULT_EMERGENCY_URL = "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing";

export function PanicButtonHandler() {
  const { user } = useAuth();
  const [showButton, setShowButton] = useState(true);
  const lastEscTime = useRef<number>(0);

  const getTargetUrl = useCallback(() => {
    if (user?.emergencyUrl && user.emergencyUrl.trim()) {
      return user.emergencyUrl.trim();
    }
    const local = typeof window !== "undefined" ? localStorage.getItem("cu_emergency_url") : null;
    if (local && local.trim()) return local.trim();
    return DEFAULT_EMERGENCY_URL;
  }, [user]);

  const triggerPanic = useCallback(() => {
    const url = getTargetUrl();
    // Gunakan replace agar history tidak bisa ditekan back
    window.location.replace(url);
  }, [getTargetUrl]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shortcut 1: Double tap Escape dalam kurun waktu 400ms
      if (e.key === "Escape") {
        const now = Date.now();
        if (now - lastEscTime.current <= 400) {
          triggerPanic();
        }
        lastEscTime.current = now;
      }

      // Shortcut 2: Alt + X
      if (e.altKey && (e.key === "x" || e.key === "X")) {
        e.preventDefault();
        triggerPanic();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [triggerPanic]);

  if (!showButton) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 bg-[#12141a]/90 backdrop-blur-md border border-line rounded-full px-3 py-1.5 shadow-2xl hover:border-red-500/50 transition-all text-xs select-none">
      <button
        type="button"
        onClick={triggerPanic}
        title="Tombol Panik Darurat (Double ESC / Alt+X) — Langsung switch ke tab kerja"
        className="flex items-center gap-1.5 text-red-400 font-medium hover:text-red-300 transition-colors"
      >
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span>PANIC</span>
      </button>
      <span className="text-secondary/40 text-[10px]">|</span>
      <span className="text-[10px] text-secondary font-mono">ESC×2</span>
      <button
        type="button"
        onClick={() => setShowButton(false)}
        className="text-secondary/50 hover:text-secondary text-[11px] ml-1"
        title="Sembunyikan tombol (shortcut tetap aktif)"
      >
        ✕
      </button>
    </div>
  );
}
