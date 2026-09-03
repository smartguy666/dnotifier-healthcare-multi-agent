// agents/triageAgent.ts
import { DNotifier } from "@dnotifier-realtime/dnotifier";
import { broadcastActivity } from "../dnotifier/activityBroadcaster.js";
import type { TriageResult, UrgencyLevel } from "../../../packages/shared/types/domain.js";
import type { HealthcareWorkflowState } from "../../../packages/shared/types/workflowState.js";

const VALID_URGENCY: UrgencyLevel[] = ["low", "moderate", "high"];

function parseTriageContent(raw: unknown): { urgency?: string; symptoms?: string[] } {
  const content = (raw as any)?.data?.content ?? (raw as any)?.content ?? raw;

  if (typeof content === "object" && content !== null) {
    return content as { urgency?: string; symptoms?: string[] };
  }

  try {
    return JSON.parse(String(content));
  } catch {
    return {};
  }
}

export const triageAgent = DNotifier.defineAgent({
  name: "triage-agent",
  async run(ctx) {
    const sessionId = ctx.senderId; // propagated unchanged from runWorkflow({ senderId: sessionId }), confirmed from source
    const message = typeof ctx.input === "string" ? ctx.input : ctx.input?.message ?? "";

    await broadcastActivity(sessionId, {
      type: "agent.status",
      agent: "triage-agent",
      status: "started",
      timestamp: Date.now(),
    });

    if (!String(message).trim()) {
      await broadcastActivity(sessionId, {
        type: "agent.status",
        agent: "triage-agent",
        status: "failed",
        timestamp: Date.now(),
      });
      throw new DNotifier.WorkflowError("triage-agent: empty patient message", {
        agentName: "triage-agent",
      });
    }

    const aiResponse = await ctx.sendAI({
      message: {
        useKnowledgeBase: false,
        messages: [
          {
            role: "system",
            content:
              "You are a triage classification assistant for a healthcare decision-support demo. " +
              "You do NOT diagnose, prescribe, or give medical advice — you only classify urgency and extract " +
              'reported symptoms as structured data. Reply JSON only, in this exact shape: ' +
              '{"urgency":"low"|"moderate"|"high","symptoms":["..."]}',
          },
          { role: "user", content: String(message) },
        ],
      },
      saveHistory: false,
      label: "Triage classification",
    });

    const parsed = parseTriageContent(aiResponse);

    const urgency: UrgencyLevel = VALID_URGENCY.includes(parsed.urgency as UrgencyLevel)
      ? (parsed.urgency as UrgencyLevel)
      : "moderate";

    const symptoms = Array.isArray(parsed.symptoms) ? parsed.symptoms.map(String) : [];

    const result: TriageResult = {
      urgency,
      symptoms,
      requiresMedicalReview: urgency !== "low",
    };

    (ctx.state as HealthcareWorkflowState).triage = result;

    await broadcastActivity(sessionId, {
      type: "agent.status",
      agent: "triage-agent",
      status: "completed",
      data: result,
      timestamp: Date.now(),
    });

    return result;
  },
});