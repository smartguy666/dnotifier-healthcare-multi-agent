// api/routes/message.ts
import { Router } from "express";
import { httpNotifier } from "../../dnotifier/httpClient.js";
import { healthcareWorkflow } from "../../dnotifier/workflow.js";
import { appendMessage } from "../../db/repositories/conversationRepository.js";
import { logExecution } from "../../db/repositories/executionLogRepository.js";
import type { WorkflowRunResult } from "../../dnotifier/types.js";

export const messageRouter = Router();

messageRouter.post("/api/message", async (req, res) => {
  const { sessionId, message } = req.body ?? {};

  if (!sessionId || !message) {
    return res.status(400).json({ error: "sessionId and message are required" });
  }

  try {
    await appendMessage(sessionId, "patient", message);

    const run = (await httpNotifier.runWorkflow({
      workflow: healthcareWorkflow,
      input: { sessionId, message },
      senderId: sessionId,
    })) as WorkflowRunResult;

    const reply = run.result?.reply ?? "Sorry, something went wrong on my end.";
    await appendMessage(sessionId, "assistant", reply);
    await logExecution(sessionId, run.result, run.state, run.executionId);

    res.json({ reply, appointment: run.result?.appointment ?? null, executionId: run.executionId });
  } catch (err) {
    console.error("[api/message] workflow failed:", err);
    res.status(500).json({ error: "Workflow execution failed" });
  }
});