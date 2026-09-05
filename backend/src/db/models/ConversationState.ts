// db/models/ConversationState.ts
import mongoose from "mongoose";

interface ConversationStateDocument {
  sessionId: string;
  mode: "idle" | "symptom_intake" | "booking" | "faq";
  collected: {
    symptoms?: string[];
    duration?: string;
    severity?: string;
    name?: string;
    contact?: string;
    preferredDoctor?: string;
    preferredTime?: string;
  };
  confirmedAppointment?: { doctor: string; time: string } | null;
  updatedAt: Date;
}

const conversationStateSchema = new mongoose.Schema<ConversationStateDocument>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    mode: { type: String, enum: ["idle", "symptom_intake", "booking", "faq"], default: "idle" },
    collected: { type: mongoose.Schema.Types.Mixed, default: {} },
    confirmedAppointment: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

export const ConversationState =
  mongoose.models.ConversationState ??
  mongoose.model<ConversationStateDocument>("ConversationState", conversationStateSchema);