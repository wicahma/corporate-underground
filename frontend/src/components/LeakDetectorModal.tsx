"use client";

import { type LeakResult } from "@/lib/api";
import { AlertTriangle, ShieldCheck, X } from "lucide-react";

export function LeakDetectorModal({
  leak,
  onConfirm,
  onCancel,
}: {
  leak: LeakResult;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const isHigh = leak.risk === "HIGH";

  return (
    <div className="fixed inset-0 bg-ink/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card max-w-lg w-full p-6 border-line bg-panel shadow-2xl relative">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-dim hover:text-fg"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div
            className={`p-2 border ${
              isHigh
                ? "border-danger text-danger bg-danger/10"
                : "border-amber-500 text-amber-400 bg-amber-500/10"
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-fg">
              Identity Leak Warning
            </h3>
            <p className="label">
              RISK LEVEL: {leak.risk} (SCORE {leak.score}/100)
            </p>
          </div>
        </div>

        <p className="text-xs text-dim leading-relaxed mb-4 font-mono">
          Our client-side and server-side privacy heuristics detected potential
          identifying patterns in your draft. Publishing these specific markers
          may allow coworkers or managers to deduce your real identity.
        </p>

        {leak.flags && leak.flags.length > 0 && (
          <div className="card bg-panel2 p-3 border-line mb-5 space-y-1.5">
            <div className="label">Detected Risk Patterns:</div>
            <ul className="text-xs space-y-1">
              {leak.flags.map((flag, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between text-fg font-mono text-[11px]"
                >
                  <span className="text-danger">"{flag.keyword}"</span>
                  <span className="text-dim text-[10px]">
                    SEVERITY {flag.severity}/10
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button onClick={onCancel} className="btn text-xs">
            Edit Draft
          </button>
          <button
            onClick={onConfirm}
            className="btn btn-primary text-xs flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Proceed & Publish
          </button>
        </div>
      </div>
    </div>
  );
}