// dnotifier/httpClient.ts
import { DNotifier } from "@dnotifier-realtime/dnotifier";
import { DNOTIFIER_APP_ID, DNOTIFIER_SECRET, ORCHESTRATOR_USER_ID } from "./env.js";
import type { DNotifierIncomingMessage, DNotifierDisconnectInfo } from "./types.js";

export const httpNotifier = new DNotifier({
  appId: DNOTIFIER_APP_ID,
  secret: DNOTIFIER_SECRET,
  transport: "http",
  userId: ORCHESTRATOR_USER_ID,
  url: undefined,            // required key per installed .d.ts; not used for http transport
  WebSocketImpl: undefined,  // required key per installed .d.ts; not used for http transport
  onConnected: (): void => console.log("[http] connected"),
  onMessage: (msg: DNotifierIncomingMessage): void => {},
  onDisconnected: (info: DNotifierDisconnectInfo): void => console.log("[http] disconnected", info),
});