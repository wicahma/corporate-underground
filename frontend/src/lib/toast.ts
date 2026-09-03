"use client";

type ToastType = "info" | "success" | "error" | "warning";

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

export function showToast(message: string, type: ToastType = "info") {
  if (typeof window === "undefined") return;
  const event = new CustomEvent("app:toast", {
    detail: { id: Math.random().toString(36).slice(2), message, type },
  });
  window.dispatchEvent(event);
}
