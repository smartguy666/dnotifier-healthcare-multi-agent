// hooks/useDNotifierRealtime.ts
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { ActivityPayload } from "../types/activityPayloads";

interface UseDNotifierRealtimeResult {
  messages: ActivityPayload[];
  isConnected: boolean;
}

const INITIAL_RETRY_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 15000;

export function useDNotifierRealtime(sessionId: string | null): UseDNotifierRealtimeResult {
  const [messages, setMessages] = useState<ActivityPayload[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const retryDelayRef = useRef(INITIAL_RETRY_DELAY_MS);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

   const connect = useCallback((sessionId: string) => {
    let cancelled = false;

    const wsHost = process.env.NEXT_PUBLIC_BACKEND_WS_URL ?? "ws://localhost:3001";
    const socket = new WebSocket(`${wsHost}/realtime?sessionId=${encodeURIComponent(sessionId)}`);
    socketRef.current = socket;

    socket.onopen = () => {
      setIsConnected(true);
      retryDelayRef.current = INITIAL_RETRY_DELAY_MS;
    };

    socket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as ActivityPayload;
        setMessages((prev) => [...prev, parsed]);
      } catch (err) {
        console.error("[useDNotifierRealtime] failed to parse message:", err);
      }
    };

    socket.onclose = () => {
      setIsConnected(false);
      if (socketRef.current === socket) socketRef.current = null;
      if (cancelled) return;

      retryTimerRef.current = setTimeout(() => {
        retryDelayRef.current = Math.min(retryDelayRef.current * 2, MAX_RETRY_DELAY_MS);
        connect(sessionId);
      }, retryDelayRef.current);
    };

    socket.onerror = (err) => {
      if (cancelled) return;
      console.error("[useDNotifierRealtime] socket error:", err);
    };

    return () => {
      cancelled = true;
      if (socket.readyState === WebSocket.CONNECTING) {
        socket.addEventListener("open", () => socket.close(), { once: true });
      } else {
        socket.close();
      }
    };
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    retryDelayRef.current = INITIAL_RETRY_DELAY_MS;
    const cleanupSocket = connect(sessionId);

    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      cleanupSocket();
    };
  }, [sessionId, connect]);

  return { messages, isConnected };
}