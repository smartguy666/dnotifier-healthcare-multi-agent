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
let reconnecting = false; 

export const wsNotifier = new DNotifier({
  appId: DNOTIFIER_APP_ID,
  secret: DNOTIFIER_SECRET,
  transport: "ws",
  userId: ORCHESTRATOR_USER_ID,
  url: undefined,
  WebSocketImpl: WebSocket,
  onConnected: (): void => {
    console.log("[ws] connected");
    reconnecting = false;
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
    console.error("[ws] disconnected:", info);

    if (reconnecting) {
      console.log("[ws] reconnect already in progress, skipping duplicate attempt");
      return;
    }
    reconnecting = true;

    wsReady = new Promise<void>((resolve) => {
      resolveWsReady = resolve;
    });

    setTimeout(async () => {
      try {
        await wsNotifier.connect();
      } catch (err) {
        console.error("[ws] reconnect attempt failed:", err);
        reconnecting = false; 
      }
    }, RECONNECT_DELAY_MS);
  },
});