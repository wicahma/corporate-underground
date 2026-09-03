"use client";

import { useState } from "react";
import { type PostType, communityApi, privacyApi, type LeakResult, type Post } from "@/lib/api";
import { LeakDetectorModal } from "./LeakDetectorModal";
import { Send, AlertCircle, Plus, Trash2 } from "lucide-react";

export function PostCreator({
  companySlug,
  onCreated,
}: {
  companySlug: string;
  onCreated: (post: Post) => void;
}) {
  const [type, setType] = useState<PostType>("NORMAL");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [leakResult, setLeakResult] = useState<LeakResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddPollOption = () => {
    if (pollOptions.length < 6) setPollOptions([...pollOptions, ""]);
  };

  const handleUpdatePollOption = (idx: number, val: string) => {
    const updated = [...pollOptions];
    updated[idx] = val;
    setPollOptions(updated);
  };

  const handleRemovePollOption = (idx: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== idx));
    }
  };

  const runPublish = async (consent = false) => {
    if (!content.trim()) return;
    setLoading(true);
    setError(null);
    try {
      if (!consent) {
        // Privacy Leak Check
        try {
          const leak = await privacyApi.checkLeak(
            `${title} ${content} ${pollOptions.join(" ")}`,
          );
          if (leak && (leak.risk === "HIGH" || leak.risk === "MEDIUM")) {
            setLeakResult(leak);
            setLoading(false);
            return;
          }
        } catch {
          // Heuristic fallback if privacy API offline
          const lower = `${title} ${content}`.toLowerCase();
          const suspicious = ["my name is", "i am the lead of", "my desk is", "in room "];
          const hit = suspicious.find((k) => lower.includes(k));
          if (hit) {
            setLeakResult({
              score: 75,
              risk: "HIGH",
              flags: [{ keyword: hit, severity: 8 }],
            });
            setLoading(false);
            return;
          }
        }
      }

      const validOptions =
        type === "POLL" ? pollOptions.filter((o) => o.trim().length > 0) : undefined;

      const created = await communityApi.createPost(companySlug, {
        type,
        title: title.trim() || undefined,
        content: content.trim(),
        options: validOptions,
        leakCheckConsent: consent,
      });

      setTitle("");
      setContent("");
      setPollOptions(["", ""]);
      setType("NORMAL");
      setLeakResult(null);
      onCreated(created);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || "Failed to publish post. Ensure you are verified.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-5 mb-8 border-line bg-panel">
      {leakResult && (
        <LeakDetectorModal
          leak={leakResult}
          onConfirm={() => {
            setLeakResult(null);
            void runPublish(true);
          }}
          onCancel={() => setLeakResult(null)}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-line">
        <span className="label">Post Anonymously</span>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ["NORMAL", "Note"],
              ["HOT_TAKE", "Hot Take"],
              ["CONFESSION", "Confession"],
              ["POLL", "Poll"],
            ] as [PostType, string][]
          ).map(([t, label]) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`tab ${type === t ? "tab-active" : ""}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 border border-danger bg-danger/10 text-danger text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-3">
        <input
          type="text"
          placeholder="Subject / Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input text-xs font-semibold"
          maxLength={120}
        />

        <textarea
          placeholder={
            type === "HOT_TAKE"
              ? "Drop an unfiltered truth. No holding back..."
              : type === "CONFESSION"
                ? "Confess something about this company without fear..."
                : "Type your observation, leak, or feedback anonymously..."
          }
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="input resize-y text-xs font-mono font-light leading-relaxed"
        />

        {type === "POLL" && (
          <div className="p-3 bg-panel2 border border-line space-y-2">
            <div className="label">Poll Options</div>
            {pollOptions.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Option ${idx + 1}`}
                  value={opt}
                  onChange={(e) => handleUpdatePollOption(idx, e.target.value)}
                  className="input text-xs"
                />
                {pollOptions.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePollOption(idx)}
                    className="text-dim hover:text-danger p-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            {pollOptions.length < 6 && (
              <button
                type="button"
                onClick={handleAddPollOption}
                className="btn text-[10px] py-1 px-2.5 flex items-center gap-1 mt-1"
              >
                <Plus className="w-3 h-3" /> Add Option
              </button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="text-[10px] text-dim font-mono">
            Identity Leak Filter Active
          </div>
          <button
            type="button"
            disabled={!content.trim() || loading}
            onClick={() => void runPublish(false)}
            className="btn btn-primary text-xs flex items-center gap-2"
          >
            <Send className="w-3 h-3" />
            {loading ? "CHECKING..." : "PUBLISH ANONYMOUSLY"}
          </button>
        </div>
      </div>
    </div>
  );
}