// api/routes/message.ts
import { Router } from "express";
import { httpNotifier } from "../../dnotifier/httpClient.js";
import { healthcareWorkflow } from "../../dnotifier/workflow.js";
import { appendMessage } from "../../db/repositories/conversationRepository.js";
import { logExecution } from "../../db/repositories/executionLogRepository.js";
import type { WorkflowRunResult } from "../../dnotifier/types.js";

export const messageRouter = Router();

function summarize(result: any): string {
  const { triage, appointments, notification } = result;
  const lines = [
    `Triage: ${triage.urgency} urgency (${triage.symptoms.join(", ")}).`,
    triage.requiresMedicalReview ? "This warrants clinician review." : "No clinician review required.",
  ];
  if (appointments?.appointments?.length > 0) {
    const first = appointments.appointments[0];
    lines.push(`Earliest available: ${first.doctor} at ${first.time}.`);
  }
  if (notification) lines.push(notification.message);
  return lines.join(" ");
}

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

    const summary = summarize(run.result);
    await appendMessage(sessionId, "assistant", summary);
    await logExecution(sessionId, run.result, run.state, run.executionId);

    res.json({ result: run.result, state: run.state, executionId: run.executionId });
  } catch (err) {
    console.error("[api/message] workflow failed:", err);
    res.status(500).json({ error: "Workflow execution failed" });
  }
});