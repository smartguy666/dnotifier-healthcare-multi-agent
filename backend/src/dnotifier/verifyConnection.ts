// dnotifier/verifyConnection.ts
import WebSocket from "ws";
import { DNotifier } from "@dnotifier-realtime/dnotifier";
import { httpNotifier } from "./httpClient.js";
import { wsNotifier } from "./wsClient.js";
import { connectAll } from "./connectAll.js";
import { DNOTIFIER_APP_ID, DNOTIFIER_SECRET, ORCHESTRATOR_USER_ID } from "./env.js";
import type { DNotifierIncomingMessage, DNotifierDisconnectInfo } from "./types.js";

const TEST_RECEIVER_ID = "verify-receiver";

async function verify() {
  await connectAll(); 

  const limits = httpNotifier.getPlanLimits();
  console.log("[verify] plan limits:", limits);

  let resolveReceiverReady: () => void;
  const receiverReady = new Promise<void>((resolve) => {
    resolveReceiverReady = resolve;
  });

  const receiver = new DNotifier({
    appId: DNOTIFIER_APP_ID,
    secret: DNOTIFIER_SECRET,
    transport: "ws",
    userId: TEST_RECEIVER_ID,
    url: undefined,
    WebSocketImpl: WebSocket,
    onConnected: (): void => {
      console.log("[verify] receiver connected");
      resolveReceiverReady();
    },
    onMessage: (msg: DNotifierIncomingMessage): void => {
      console.log("[verify] receiver got:", msg.metadata, msg.payload.toJSON());
    },
    onDisconnected: (info: DNotifierDisconnectInfo): void =>
      console.log("[verify] receiver disconnected", info),
  });

    let sendResult: unknown;
  try {
    sendResult = await wsNotifier.send({
      senderId: ORCHESTRATOR_USER_ID,
      receiverId: undefined,
      receiverIds: [TEST_RECEIVER_ID],
      data: { type: "verify.ping", text: "hello from orchestrator" },
    });
    console.log("[verify] send() returned:", sendResult);
  } catch (err) {
    console.error("[verify] send() threw:", err);
  }

  console.log("[verify] ping sent — check receiver log above for delivery");

  setTimeout(() => {
    console.log("[verify] done, exiting");
    process.exit(0);
  }, 8000); 
}

verify().catch((err) => {
  console.error("[verify] failed:", err);
  process.exit(1);
});