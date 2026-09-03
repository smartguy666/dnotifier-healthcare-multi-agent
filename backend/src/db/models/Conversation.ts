// db/models/Conversation.ts
import mongoose from "mongoose";

interface ConversationMessage {
  role: "patient" | "assistant";
  text: string;
  timestamp: Date;
}

interface ConversationDocument {
  sessionId: string;
  messages: ConversationMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new mongoose.Schema<ConversationMessage>(
  {
    role: { type: String, enum: ["patient", "assistant"], required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, required: true, default: Date.now },
  },
  { _id: false }
);

const conversationSchema = new mongoose.Schema<ConversationDocument>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    messages: { type: [messageSchema], default: [] },
  },
  { timestamps: true }
);

export const Conversation =
  mongoose.models.Conversation ?? mongoose.model<ConversationDocument>("Conversation", conversationSchema);