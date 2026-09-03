"use client";

import { X } from "lucide-react";

export function LogoutModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-ink/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card max-w-sm w-full p-6 border-line bg-panel relative">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-dim hover:text-fg"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="label mb-2">// CONFIRM EXIT</div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-fg mb-4">
          Terminate Session?
        </h3>
        <p className="text-[11px] text-dim font-mono leading-relaxed mb-6">
          Your anonymous session will be destroyed. You will need to sign in
          again to access the underground.
        </p>
        <div className="flex items-center justify-end gap-3">
          <button onClick={onCancel} className="btn text-xs">
            Cancel
          </button>
          <button onClick={onConfirm} className="btn btn-danger text-xs">
            Confirm Exit
          </button>
        </div>
      </div>
    </div>
  );
}