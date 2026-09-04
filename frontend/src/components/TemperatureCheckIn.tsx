"use client";

import { useState } from "react";
import { communityApi } from "@/lib/api";
import { Thermometer } from "lucide-react";

const MOODS = [
  { key: "GREAT", label: "Great", tick: "++" },
  { key: "SURVIVING", label: "Surviving", tick: "0" },
  { key: "CHAOS", label: "Chaos", tick: "--" },
  { key: "MEETING_AGAIN", label: "Meeting Again", tick: "x" },
];

export function TemperatureCheckIn({
  companySlug,
  onChecked,
}: {
  companySlug: string;
  onChecked?: () => void;
}) {
  const [mood, setMood] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkin = async (key: string) => {
    setError(null);
    try {
      await communityApi.checkin(companySlug, key);
      setMood(key);
      onChecked?.();
    } catch (err: unknown) {
      setError((err as Error).message || "Check-in failed.");
    }
  };

  return (
    <div className="card p-5 border-line">
      <div className="flex items-center gap-2.5 mb-4">
        <Thermometer className="w-4 h-4 text-dim" />
        <span className="label">Temperature Check-In</span>
      </div>

      {mood && (
        <div className="text-xs text-fg py-2 mb-3 bg-panel2 rounded-xl px-3 border border-line">
          Checked in: {MOODS.find((m) => m.key === mood)?.label ?? mood} — tap
          again to change
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {MOODS.map((m) => (
          <button
            key={m.key}
            onClick={() => void checkin(m.key)}
            className={`rounded-xl h-16 flex flex-col text-center gap-1 transition-all border ${
              mood === m.key
                ? "border-fg bg-fg/10 text-fg"
                : "border-line bg-panel hover:border-fg/40 hover:bg-white/5"
            }`}
          >
            <span className="font-mono text-[10px] text-dim">{m.tick}</span>
            <span className="text-[10px] tracking-wider uppercase font-semibold">
              {m.label}
            </span>
          </button>
        ))}
      </div>
      {error && <p className="mt-3 text-xs text-danger">{error}</p>}
    </div>
  );
}