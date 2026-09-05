// dnotifier/workflow.ts
import { DNotifier } from "@dnotifier-realtime/dnotifier";
import { receptionistAgent } from "../agents/receptionistAgent.js";
import { appointmentAgent } from "../agents/appointmentAgent.js";
import { notificationAgent } from "../agents/notificationAgent.js";

interface WorkflowInput {
  sessionId: string;
  message: string;
}

export const healthcareWorkflow = new DNotifier.Workflow({
  name: "healthcare-receptionist-workflow",
  description: "Conversational receptionist using DNotifier KB, with real appointment/notification tools",
  observability: true,
  async entry(ctx) {
    const input = ctx.input as WorkflowInput;
    return ctx.runAgent("receptionist-agent", { input });
  },
}).registerAgents({
  "receptionist-agent": receptionistAgent,
  "appointment-agent": appointmentAgent,
  "notification-agent": notificationAgent,
});