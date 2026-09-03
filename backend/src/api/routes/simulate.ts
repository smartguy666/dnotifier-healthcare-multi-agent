// api/routes/simulate.ts
import { Router } from "express";
import { randomUUID } from "crypto";
import { httpNotifier } from "../../dnotifier/httpClient.js";
import { healthcareWorkflow } from "../../dnotifier/workflow.js";
import { appendMessage } from "../../db/repositories/conversationRepository.js";
import { logExecution } from "../../db/repositories/executionLogRepository.js";
import type { WorkflowRunResult } from "../../dnotifier/types.js";

export const simulateRouter = Router();

const CANNED_MESSAGE =
  "I've had a fever and cough for three days and I'm having difficulty breathing.";

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

simulateRouter.post("/api/simulate", async (req, res) => {
  const sessionId = req.body?.sessionId ?? `sim_${randomUUID()}`;

  try {
    await appendMessage(sessionId, "patient", CANNED_MESSAGE);

    const run = (await httpNotifier.runWorkflow({
      workflow: healthcareWorkflow,
      input: { sessionId, message: CANNED_MESSAGE },
      senderId: sessionId,
    })) as WorkflowRunResult;

    const summary = summarize(run.result);
    await appendMessage(sessionId, "assistant", summary);
    await logExecution(sessionId, run.result, run.state, run.executionId);

    res.json({ sessionId, result: run.result, state: run.state, executionId: run.executionId });
  } catch (err) {
    console.error("[api/simulate] workflow failed:", err);
    res.status(500).json({ error: "Simulation failed" });
  }
});