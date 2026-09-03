// dnotifier/wsClient.ts
import WebSocket from "ws";
import { DNotifier } from "@dnotifier-realtime/dnotifier";
import { DNOTIFIER_APP_ID, DNOTIFIER_SECRET, ORCHESTRATOR_USER_ID } from "./env.js";
import { forwardToSession } from "../realtime/browserRelay.js";
import type { DNotifierIncomingMessage, DNotifierDisconnectInfo } from "./types.js";

let resolveWsReady: () => void;
export let wsReady = new Promise<void>((resolve) => {
  resolveWsReady = resolve;
});

const RECONNECT_DELAY_MS = 3000;

export const wsNotifier = new DNotifier({
  appId: DNOTIFIER_APP_ID,
  secret: DNOTIFIER_SECRET,
  transport: "ws",
  userId: ORCHESTRATOR_USER_ID,
  url: undefined,
  WebSocketImpl: WebSocket,
  onConnected: (): void => {
    console.log("[ws] connected");
    resolveWsReady();
  },
  onMessage: (msg: DNotifierIncomingMessage): void => {
    const body = msg.payload.toJSON() as { sessionId?: string } | null;
    if (body?.sessionId) {
      forwardToSession(body.sessionId, body);
    } else {
      console.log("[ws] message with no sessionId, dropped:", msg.metadata, body);
    }
  },
  onDisconnected: (info: DNotifierDisconnectInfo): void => {
    console.error("[ws] disconnected, will attempt reconnect:", info);

    // DNotifier's own docs are explicit that it does NOT auto-reconnect —
    // without this, every wsNotifier.send() after any disconnect (idle,
    // network blip, etc.) fails with "Not connected" permanently until the
    // whole process is restarted, which is exactly what we just observed.
    wsReady = new Promise<void>((resolve) => {
      resolveWsReady = resolve;
    });

    setTimeout(async () => {
      try {
        await wsNotifier.connect();
      } catch (err) {
        console.error("[ws] reconnect attempt failed:", err);
      }
    }, RECONNECT_DELAY_MS);
  },
});