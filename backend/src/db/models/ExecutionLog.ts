// db/models/ExecutionLog.ts
import mongoose from "mongoose";

interface ExecutionLogDocument {
  sessionId: string;
  executionId?: string;
  result: unknown;
  state: Record<string, unknown>;
  createdAt: Date;
}

const executionLogSchema = new mongoose.Schema<ExecutionLogDocument>(
  {
    sessionId: { type: String, required: true, index: true },
    executionId: { type: String, index: true },
    result: { type: mongoose.Schema.Types.Mixed, required: true },
    state: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const ExecutionLog =
  mongoose.models.ExecutionLog ?? mongoose.model<ExecutionLogDocument>("ExecutionLog", executionLogSchema);