// dnotifier/activityBroadcaster.ts
import { wsNotifier, wsReady } from "./wsClient.js";
import { ORCHESTRATOR_USER_ID } from "./env.js";
import type { BroadcastableActivityPayload } from "../../../packages/shared/types/activityPayloads.js";

export async function broadcastActivity(sessionId: string, payload: BroadcastableActivityPayload): Promise<void> {
  try {
    await wsReady;
    await wsNotifier.send({
      senderId: ORCHESTRATOR_USER_ID,
      receiverId: ORCHESTRATOR_USER_ID,
      receiverIds: undefined,
      data: { sessionId, ...payload },
      saveHistory: false,
    });
  } catch (err) {
    console.error(`[activityBroadcaster] failed to send for session ${sessionId}:`, err);
  }
}