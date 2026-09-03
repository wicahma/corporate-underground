"use client";

import { useState } from "react";
import { communityApi } from "@/lib/api";
import { Thermometer } from "lucide-react";

const MOODS = [
  { key: "GREAT", label: "GREAT", tick: "++" },
  { key: "SURVIVING", label: "SURVIVING", tick: "0" },
  { key: "CHAOS", label: "CHAOS", tick: "--" },
  { key: "MEETING_AGAIN", label: "MEETING AGAIN", tick: "x" },
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
    } catch {
      setError("Check-in failed. Server offline or unverified.");
    }
  };

  return (
    <div className="card p-5 border-line">
      <div className="flex items-center gap-2.5 mb-4">
        <Thermometer className="w-4 h-4 text-dim" />
        <span className="label">Temperature Check-In</span>
      </div>

      {mood ? (
        <div className="text-xs text-fg py-2">
          CHECKED IN: {MOODS.find((m) => m.key === mood)?.label ?? mood}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {MOODS.map((m) => (
              <button
                key={m.key}
                onClick={() => void checkin(m.key)}
                className="btn h-16 flex flex-col text-center gap-1 hover:border-fg"
              >
                <span className="font-mono text-[10px]">{m.tick}</span>
                <span className="text-[10px] tracking-wider uppercase">
                  {m.label}
                </span>
              </button>
            ))}
          </div>
          {error && <p className="mt-3 text-[10px] text-danger">{error}</p>}
        </>
      )}
    </div>
  );
}