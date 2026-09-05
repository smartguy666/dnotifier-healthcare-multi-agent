// db/repositories/conversationRepository.ts
import { Conversation } from "../models/Conversation.js";

export async function appendMessage(
  sessionId: string,
  role: "patient" | "assistant",
  text: string
): Promise<void> {
  await Conversation.updateOne(
    { sessionId },
    { $push: { messages: { role, text, timestamp: new Date() } } },
    { upsert: true } 
    
  );
}

export async function getConversation(sessionId: string) {
  return Conversation.findOne({ sessionId }).lean();
}