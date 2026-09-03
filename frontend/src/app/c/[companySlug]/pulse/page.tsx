"use client";

import { use, useEffect, useState, useCallback } from "react";
import {
  companiesApi,
  type Company,
  type Pulse,
} from "@/lib/api";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TemperatureCheckIn } from "@/components/TemperatureCheckIn";
import {
  Radio,
  Thermometer,
  Users,
  TrendingUp,
  ShieldAlert,
  RefreshCw,
} from "lucide-react";

const MOOD_META: Record<string, { label: string; tick: string; tone: string }> = {
  GREAT: { label: "GREAT", tick: "++", tone: "text-emerald-300 border-emerald-500/40" },
  SURVIVING: { label: "SURVIVING", tick: "0", tone: "text-zinc-300 border-zinc-500/40" },
  CHAOS: { label: "CHAOS", tick: "--", tone: "text-rose-300 border-rose-500/40" },
  MEETING_AGAIN: { label: "MEETING AGAIN", tick: "x", tone: "text-amber-300 border-amber-500/40" },
};

function temperatureLabel(t: number | null): string {
  if (t === null) return "LOCKED";
  if (t >= 75) return "OVERHEATED";
  if (t >= 55) return "WARM";
  if (t >= 40) return "TEPID";
  if (t >= 25) return "COLD";
  return "FROZEN";
}

export default function PulsePage({
  params,
}: {
  params: Promise<{ companySlug: string }>;
}) {
  const { companySlug } = use(params);

  const [company, setCompany] = useState<Company | null>(null);
  const [pulse, setPulse] = useState<Pulse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [c, p] = await Promise.all([
        companiesApi.bySlug(companySlug).catch(() => ({
          id: "",
          name: companySlug.toUpperCase(),
          slug: companySlug,
          allowedDomains: [],
          logoUrl: null,
          members: 0,
        })),
        companiesApi.pulse(companySlug),
      ]);
      setCompany(c);
      setPulse(p);
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to load pulse.");
    } finally {
      setLoading(false);
    }
  }, [companySlug]);

  useEffect(() => {
    const t = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(t);
  }, [load]);

  const effectiveThreshold = pulse?.threshold ?? 5;
  const locked = (pulse?.activeUsers ?? 0) < effectiveThreshold;
  const moodsTotal =
    Object.values(pulse?.moods ?? {}).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="flex min-h-screen flex-col">
      <Header companySlug={companySlug} companyName={company?.name} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-line">
          <div>
            <div className="label mb-1">// UNDERGROUND PULSE</div>
            <h1 className="text-xl font-bold tracking-tight text-fg uppercase">
              OFFICE TEMPERATURE
            </h1>
            <p className="text-[11px] text-dim font-mono mt-1">
              {company?.name ?? companySlug} · T-{pulse?.checkInCount ?? 0}{" "}
              CHECK-INS
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => void load()} className="btn p-2" title="Refresh">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {error && (
          <div className="card p-6 border-danger/40 bg-danger/5 mb-6">
            <div className="flex items-center gap-3 text-danger text-xs mb-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span className="font-semibold">Pulse unreachable</span>
            </div>
            <p className="text-[11px] text-dim font-mono">{error}</p>
          </div>
        )}

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="card p-5 border-line">
            <div className="flex items-center gap-2 text-dim mb-3">
              <Thermometer className="w-4 h-4" />
              <span className="label">Temperature</span>
            </div>
            {locked ? (
              <div>
                <div className="text-3xl font-bold text-dim font-mono">
                  ████
                </div>
                <p className="text-[10px] text-dim font-mono mt-2">
                  LOCKED — requires {effectiveThreshold}+ active members (below{" "}
                  {pulse?.activeUsers ?? 0} now).
                </p>
              </div>
            ) : (
              <div>
                <div className="text-4xl font-bold text-fg font-mono">
                  {pulse?.temperature ?? "--"}°
                </div>
                <p className="text-[10px] text-dim font-mono mt-2 uppercase tracking-widest">
                  {temperatureLabel(pulse?.temperature ?? null)}
                </p>
              </div>
            )}
          </div>

          <div className="card p-5 border-line">
            <div className="flex items-center gap-2 text-dim mb-3">
              <Users className="w-4 h-4" />
              <span className="label">Active Members</span>
            </div>
            <div className="text-4xl font-bold text-fg font-mono">
              {pulse?.activeUsers ?? 0}
            </div>
            <p className="text-[10px] text-dim font-mono mt-2">
              OF {pulse?.totalMembers ?? 0} VERIFIED TOTAL
            </p>
          </div>

          <div className="card p-5 border-line">
            <div className="flex items-center gap-2 text-dim mb-3">
              <TrendingUp className="w-4 h-4" />
              <span className="label">Trending Topics</span>
            </div>
            {pulse?.trendingTopics?.length ? (
              <ul className="space-y-1.5">
                {pulse.trendingTopics.slice(0, 4).map((t) => (
                  <li
                    key={t.name}
                    className="flex items-center justify-between text-[11px] font-mono"
                  >
                    <span className="text-fg uppercase tracking-wide">
                      #{t.name}
                    </span>
                    <span className="text-dim">{t.postCount}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[10px] text-dim font-mono">NO SIGNAL YET</p>
            )}
          </div>
        </div>

        {/* Mood distribution */}
        <div className="card p-6 border-line mb-8">
          <div className="label mb-5">MOOD DISTRIBUTION</div>
          {Object.keys(pulse?.moods ?? {}).length === 0 ? (
            <p className="text-[11px] text-dim font-mono">
              No check-ins recorded. The floor is quiet.
            </p>
          ) : (
            <div className="space-y-4">
              {(
                Object.entries(pulse?.moods ?? {}) as [string, number][]
              ).map(([key, count]) => {
                const meta = MOOD_META[key] ?? {
                  label: key,
                  tick: "?",
                  tone: "text-dim border-line",
                };
                const pct = Math.round((count / moodsTotal) * 100);
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                      <span className={`uppercase tracking-wider ${meta.tone.split(" ")[0]}`}>
                        {meta.label} <span className="text-dim">({meta.tick})</span>
                      </span>
                      <span className="text-dim">
                        {count} · {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-panel2 border border-line overflow-hidden">
                      <div
                        className="h-full bg-fg transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <TemperatureCheckIn
          companySlug={companySlug}
          onChecked={() => void load()}
        />
      </main>

      <Footer />
    </div>
  );
}