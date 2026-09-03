// dnotifier/workflow.ts
import { DNotifier } from "@dnotifier-realtime/dnotifier";
import { triageAgent } from "../agents/triageAgent.js";
import { symptomsAgent } from "../agents/symptomsAgent.js";
import { medicalKnowledgeAgent } from "../agents/medicalKnowledgeAgent.js";
import { appointmentAgent } from "../agents/appointmentAgent.js";
import { notificationAgent } from "../agents/notificationAgent.js";
import { broadcastActivity } from "./activityBroadcaster.js";
import type { HealthcareWorkflowState } from "../../../packages/shared/types/workflowState.js";
import type { TriageResult, SymptomsAnalysis, KnowledgeResult, AppointmentOption } from "../../../packages/shared/types/domain.js";
import type { WorkflowStagePayload } from "../../../packages/shared/types/activityPayloads.js";

interface WorkflowInput {
  sessionId: string;
  message: string;
}

function stagePayload(stage: WorkflowStagePayload["stage"]): Omit<WorkflowStagePayload, "sessionId"> {
  return { type: "workflow.stage", stage, timestamp: Date.now() };
}

export const healthcareWorkflow = new DNotifier.Workflow({
  name: "healthcare-triage-workflow",
  description: "Triage -> parallel symptoms/knowledge/appointment -> conditional notification",
  observability: true,
  async entry(ctx) {
    const input = ctx.input as WorkflowInput;
    const state = ctx.state as HealthcareWorkflowState;
    const { sessionId } = input;

    await broadcastActivity(sessionId, stagePayload("received"));

    const triage: TriageResult = await ctx.runAgent("triage-agent", { input: input.message });
    state.triage = triage;

    await broadcastActivity(sessionId, stagePayload("triaged"));

    const { results } = await ctx.runAgents([
      { name: "symptoms-agent", input: triage },
      { name: "medical-knowledge-agent", input: triage },
      { name: "appointment-agent", input: triage },
    ]);

    const [symptoms, knowledge, appointmentsResult] = results as [
      SymptomsAnalysis,
      KnowledgeResult,
      { appointments: AppointmentOption[] }
    ];

    state.symptomsAnalysis = symptoms;
    state.knowledgeResult = knowledge;
    state.appointments = appointmentsResult.appointments;

    await broadcastActivity(sessionId, stagePayload("fanned-out"));

    let notification = null;
    if (triage.urgency === "high" || appointmentsResult.appointments.length > 0) {
      notification = await ctx.runAgent("notification-agent", {
        input: { sessionId, triage, appointments: appointmentsResult },
      });
      await broadcastActivity(sessionId, stagePayload("notified"));
    }

    await broadcastActivity(sessionId, stagePayload("completed"));

    return {
      triage,
      symptoms,
      knowledge,
      appointments: appointmentsResult,
      notification,
    };
  },
}).registerAgents({
  "triage-agent": triageAgent,
  "symptoms-agent": symptomsAgent,
  "medical-knowledge-agent": medicalKnowledgeAgent,
  "appointment-agent": appointmentAgent,
  "notification-agent": notificationAgent,
});