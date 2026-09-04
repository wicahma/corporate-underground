"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import type { Post, CommunityEvent } from "@/lib/api";

type Handler = (event: CommunityEvent) => void;

export function useCommunitySSE(
  companySlug: string,
  onEvent: Handler,
) {
  const { user } = useAuth();
  const handlerRef = useRef<Handler>(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    if (!user || !companySlug) return;

    const es = new EventSource(
      `/api/community/${companySlug}/events`,
      { withCredentials: true },
    );

    es.onmessage = (e) => {
      try {
        const event: CommunityEvent = JSON.parse(e.data);
        handlerRef.current(event);
      } catch (err) {
        console.error("SSE parse error", err);
      }
    };

    es.onerror = () => {
      console.warn("SSE connection lost, reconnecting...");
    };

    return () => {
      es.close();
    };
  }, [user, companySlug]);
}