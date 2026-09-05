// agents/appointmentAgent.ts
import { DNotifier } from "@dnotifier-realtime/dnotifier";
import { getAvailableAppointments } from "../data/appointments.js";
import { broadcastActivity } from "../dnotifier/activityBroadcaster.js";
import type { TriageResult, AppointmentOption } from "../../../packages/shared/types/domain.js";
import type { HealthcareWorkflowState } from "../../../packages/shared/types/workflowState.js";

export const appointmentAgent = DNotifier.defineAgent({
  name: "appointment-agent",
  async run(ctx) {
    const sessionId = ctx.senderId; 
    const triage = ctx.input as TriageResult;

    await broadcastActivity(sessionId, {
      type: "agent.status",
      agent: "appointment-agent",
      status: "started",
      timestamp: Date.now(),
    });

    if (!triage) {
      await broadcastActivity(sessionId, {
        type: "agent.status",
        agent: "appointment-agent",
        status: "failed",
        timestamp: Date.now(),
      });
      throw new DNotifier.WorkflowError("appointment-agent: no triage result provided", {
        agentName: "appointment-agent",
      });
    }

    const allSlots: AppointmentOption[] = getAvailableAppointments();
    const appointments = triage.urgency === "high" ? allSlots : allSlots.slice(0, 2);

    await ctx.recordStep({
      label: "Appointment availability lookup",
      input: { urgency: triage.urgency },
      output: { appointments },
      status: "ok",
      type: "custom",
    });

    (ctx.state as HealthcareWorkflowState).appointments = appointments;

    await broadcastActivity(sessionId, {
      type: "agent.status",
      agent: "appointment-agent",
      status: "completed",
      data: { appointments },
      timestamp: Date.now(),
    });

    return { appointments };
  },
});