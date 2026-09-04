"use client";

import { useState } from "react";
import { type PollOption, communityApi } from "@/lib/api";
import { CheckSquare } from "lucide-react";

export function PollWidget({
  companySlug,
  postId,
  options,
}: {
  companySlug: string;
  postId: string;
  options: PollOption[];
}) {
  const [opts, setOpts] = useState(options);
  const [votedId, setVotedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const total = opts.reduce((acc, cur) => acc + cur.voteCount, 0);

  const handleVote = async (optionId: string) => {
    if (votedId || submitting) return;
    setSubmitting(true);
    try {
      await communityApi.vote(companySlug, postId, optionId);
      setVotedId(optionId);
      setOpts((prev) =>
        prev.map((o) =>
          o.id === optionId ? { ...o, voteCount: o.voteCount + 1 } : o,
        ),
      );
    } catch {
      /* no-op on failure */
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-panel2 border border-line rounded-2xl p-3.5 space-y-2">
      <div className="flex items-center justify-between text-[10px] text-dim uppercase tracking-wider mb-1">
        <span className="flex items-center gap-1.5">
          <CheckSquare className="w-3 h-3" /> Anonymous Poll
        </span>
        <span className="font-mono">{total} votes</span>
      </div>

      <div className="space-y-2">
        {opts.map((opt) => {
          const pct = total > 0 ? Math.round((opt.voteCount / total) * 100) : 0;
          const isSelected = votedId === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => handleVote(opt.id)}
              disabled={Boolean(votedId) || submitting}
              className={`w-full text-left relative p-3 rounded-xl border text-sm transition-colors overflow-hidden ${
                isSelected
                  ? "border-fg bg-fg/10 text-fg"
                  : "border-line bg-panel hover:border-fg/40 text-fg/90"
              }`}
            >
              <div
                className="absolute inset-y-0 left-0 bg-fg/10 pointer-events-none transition-all duration-300 rounded-l-xl"
                style={{ width: `${pct}%` }}
              />
              <div className="relative flex items-center justify-between gap-3">
                <span className="font-medium text-[13px]">{opt.text}</span>
                <span className="text-[11px] text-dim shrink-0">
                  {pct}% ({opt.voteCount})
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}