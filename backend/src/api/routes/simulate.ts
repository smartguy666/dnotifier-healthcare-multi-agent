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

simulateRouter.post("/api/simulate", async (req, res) => {
  const sessionId = req.body?.sessionId ?? `sim_${randomUUID()}`;

  try {
    await appendMessage(sessionId, "patient", CANNED_MESSAGE);

    const run = (await httpNotifier.runWorkflow({
      workflow: healthcareWorkflow,
      input: { sessionId, message: CANNED_MESSAGE },
      senderId: sessionId,
    })) as WorkflowRunResult;

    const reply = run.result?.reply ?? "Sorry, something went wrong on my end.";
    await appendMessage(sessionId, "assistant", reply);
    await logExecution(sessionId, run.result, run.state, run.executionId);

    res.json({ sessionId, reply, appointment: run.result?.appointment ?? null, executionId: run.executionId });
  } catch (err) {
    console.error("[api/simulate] workflow failed:", err);
    res.status(500).json({ error: "Simulation failed" });
  }
});