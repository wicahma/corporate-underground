"use client";

import { type LeakResult } from "@/lib/api";
import { AlertTriangle, X, ShieldAlert } from "lucide-react";

export function LeakDetectorModal({
  leak,
  onClose,
}: {
  leak: LeakResult;
  onClose: () => void;
}) {
  const percentage = Math.round((leak.confidence ?? 0) * 100);

  return (
    <div className="fixed inset-0 bg-[#101010]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="card max-w-md w-full p-6 border-[#262626] bg-[#181818] rounded-2xl relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#777777] hover:text-[#f3f5f7] p-1.5 rounded-full hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-full border border-red-500/30 bg-red-500/10 text-red-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#f3f5f7]">
              Indikasi Kebocoran Identitas
            </h3>
            <span className="text-xs font-mono text-red-400">
              Confidence Level: {percentage}%
            </span>
          </div>
        </div>

        {/* Warning banner */}
        <div className="mb-4 p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-[#f3f5f7] flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed font-medium">
            Ada indikasi data leak, pastikan terlebih dahulu bahwa pesanmu aman untuk di post.
          </p>
        </div>

        {leak.reason && (
          <div className="border border-[#262626] rounded-xl p-3.5 bg-[#101010]/60 mb-5">
            <div className="text-[11px] font-semibold text-[#777777] uppercase tracking-wider mb-1">
              Catatan AI:
            </div>
            <p className="text-xs text-[#c7c7cc] leading-relaxed">
              {leak.reason}
            </p>
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-full bg-white text-black text-xs font-semibold hover:bg-white/90 transition-colors"
          >
            Ganti Pesan Threads
          </button>
        </div>
      </div>
    </div>
  );
}