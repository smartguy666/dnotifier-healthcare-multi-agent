// agents/medicalKnowledgeAgent.ts
import { DNotifier } from "@dnotifier-realtime/dnotifier";
import { lookup } from "../data/knowledgeRepository.js";
import { broadcastActivity } from "../dnotifier/activityBroadcaster.js";
import type { TriageResult, KnowledgeResult } from "../../../packages/shared/types/domain.js";
import type { HealthcareWorkflowState } from "../../../packages/shared/types/workflowState.js";

export const medicalKnowledgeAgent = DNotifier.defineAgent({
  name: "medical-knowledge-agent",
  async run(ctx) {
    const sessionId = ctx.senderId; // propagated unchanged from runWorkflow({ senderId: sessionId })
    const triage = ctx.input as TriageResult;

    await broadcastActivity(sessionId, {
      type: "agent.status",
      agent: "medical-knowledge-agent",
      status: "started",
      timestamp: Date.now(),
    });

    if (!triage?.symptoms?.length) {
      await broadcastActivity(sessionId, {
        type: "agent.status",
        agent: "medical-knowledge-agent",
        status: "failed",
        timestamp: Date.now(),
      });
      throw new DNotifier.WorkflowError("medical-knowledge-agent: no symptoms provided by triage", {
        agentName: "medical-knowledge-agent",
      });
    }

    const result: KnowledgeResult = lookup(triage.symptoms);

    if (triage.urgency === "high") {
      result.requiresClinicianReview = true;
    }

    await ctx.recordStep({
      label: "Medical knowledge lookup",
      input: { symptoms: triage.symptoms },
      output: result,
      status: "ok",
      type: "custom",
    });

    (ctx.state as HealthcareWorkflowState).knowledgeResult = result;

    await broadcastActivity(sessionId, {
      type: "agent.status",
      agent: "medical-knowledge-agent",
      status: "completed",
      data: result,
      timestamp: Date.now(),
    });

    return result;
  },
});