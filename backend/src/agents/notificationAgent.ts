// agents/notificationAgent.ts
import { DNotifier } from "@dnotifier-realtime/dnotifier";
import { wsNotifier } from "../dnotifier/wsClient.js";
import { ORCHESTRATOR_USER_ID } from "../dnotifier/env.js";
import { broadcastActivity } from "../dnotifier/activityBroadcaster.js";
import type { TriageResult, AppointmentOption, NotificationPayload } from "../../../packages/shared/types/domain.js";

interface NotificationAgentInput {
  sessionId: string;
  triage: TriageResult;
  appointments: { appointments: AppointmentOption[] };
}

export const notificationAgent = DNotifier.defineAgent({
  name: "notification-agent",
  async run(ctx) {
    const input = ctx.input as NotificationAgentInput;

    // input.sessionId is already explicit here (unlike the other four agents,
    // which fall back to ctx.senderId) — this agent's caller always passes it
    // directly, so we use that rather than reaching for ctx.senderId.
    const sessionId = input?.sessionId;

    await broadcastActivity(sessionId, {
      type: "agent.status",
      agent: "notification-agent",
      status: "started",
      timestamp: Date.now(),
    });

    if (!sessionId) {
      throw new DNotifier.WorkflowError("notification-agent: sessionId is required", {
        agentName: "notification-agent",
      });
    }

    const message =
      input.triage.urgency === "high"
        ? "Your symptoms indicate this needs prompt clinician review. Please see the recommended appointments."
        : "New appointment options are available based on your triage results.";

    const payload: NotificationPayload = {
      sessionId,
      channel: "in-app",
      message,
    };

          try {
      await wsNotifier.send({
        senderId: ORCHESTRATOR_USER_ID,
        receiverId: ORCHESTRATOR_USER_ID,
        receiverIds: undefined,
        data: { type: "notification", ...payload }, // payload already includes sessionId
      });
    } catch (err) {
      console.error("[notification-agent] send() failed:", err);
    }
    console.log(`[notification-agent] ${sessionId}: ${message}`);

    await ctx.recordStep({
      label: "Notification sent",
      input: { sessionId, urgency: input.triage.urgency },
      output: payload,
      status: "ok",
      type: "custom",
    });

    await broadcastActivity(sessionId, {
      type: "agent.status",
      agent: "notification-agent",
      status: "completed",
      data: payload,
      timestamp: Date.now(),
    });

    return { sent: true, ...payload };
  },
});