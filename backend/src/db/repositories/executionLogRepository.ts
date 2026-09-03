// db/repositories/executionLogRepository.ts
import { ExecutionLog } from "../models/ExecutionLog.js";

export async function logExecution(
  sessionId: string,
  result: unknown,
  state: Record<string, unknown>,
  executionId?: string
): Promise<void> {
  await ExecutionLog.create({ sessionId, executionId, result, state });
}