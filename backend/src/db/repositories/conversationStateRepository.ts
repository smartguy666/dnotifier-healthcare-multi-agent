// db/repositories/conversationStateRepository.ts
import { ConversationState } from "../models/ConversationState.js";

export async function getState(sessionId: string) {
  const doc = await ConversationState.findOne({ sessionId }).lean();
  return doc ?? { sessionId, mode: "idle" as const, collected: {}, confirmedAppointment: null };
}

export async function saveState(
  sessionId: string,
  update: { mode?: string; collected?: Record<string, unknown>; confirmedAppointment?: unknown }
) {
  await ConversationState.updateOne({ sessionId }, { $set: update }, { upsert: true });
}