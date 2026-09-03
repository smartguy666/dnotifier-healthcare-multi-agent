// agents/symptomsAgent.ts
import { DNotifier } from "@dnotifier-realtime/dnotifier";
import { broadcastActivity } from "../dnotifier/activityBroadcaster.js";
import type { TriageResult, SymptomsAnalysis } from "../../../packages/shared/types/domain.js";
import type { HealthcareWorkflowState } from "../../../packages/shared/types/workflowState.js";

function parseSymptomsContent(raw: unknown): { symptoms?: string[]; duration?: string; severity?: string } {
  const content = (raw as any)?.data?.content ?? (raw as any)?.content ?? raw;

  if (typeof content === "object" && content !== null) {
    return content as { symptoms?: string[]; duration?: string; severity?: string };
  }

  try {
    return JSON.parse(String(content));
  } catch {
    return {};
  }
}

export const symptomsAgent = DNotifier.defineAgent({
  name: "symptoms-agent",
  async run(ctx) {
    const sessionId = ctx.senderId; // propagated unchanged from runWorkflow({ senderId: sessionId })
    const triage = ctx.input as TriageResult;

    await broadcastActivity(sessionId, {
      type: "agent.status",
      agent: "symptoms-agent",
      status: "started",
      timestamp: Date.now(),
    });

    if (!triage?.symptoms?.length) {
      await broadcastActivity(sessionId, {
        type: "agent.status",
        agent: "symptoms-agent",
        status: "failed",
        timestamp: Date.now(),
      });
      throw new DNotifier.WorkflowError("symptoms-agent: no symptoms provided by triage", {
        agentName: "symptoms-agent",
      });
    }

    const aiResponse = await ctx.sendAI({
      message: {
        useKnowledgeBase: false,
        messages: [
          {
            role: "system",
            content:
              "You structure previously-triaged patient symptoms into a consistent format. " +
              "You do NOT diagnose, speculate on causes, or suggest treatment — only organize what was reported. " +
              'Reply JSON only, in this exact shape: ' +
              '{"symptoms":["..."],"duration":"...","severity":"mild"|"moderate"|"severe"|"moderate-to-high"}',
          },
          {
            role: "user",
            content: `Reported symptoms: ${triage.symptoms.join(", ")}. Urgency classification: ${triage.urgency}.`,
          },
        ],
      },
      saveHistory: false,
      label: "Symptoms structuring",
    });

    const parsed = parseSymptomsContent(aiResponse);

    const result: SymptomsAnalysis = {
      symptoms: Array.isArray(parsed.symptoms) && parsed.symptoms.length ? parsed.symptoms.map(String) : triage.symptoms,
      duration: typeof parsed.duration === "string" ? parsed.duration : "unspecified",
      severity: typeof parsed.severity === "string" ? parsed.severity : "unspecified",
    };

    (ctx.state as HealthcareWorkflowState).symptomsAnalysis = result;

    await broadcastActivity(sessionId, {
      type: "agent.status",
      agent: "symptoms-agent",
      status: "completed",
      data: result,
      timestamp: Date.now(),
    });

    return result;
  },
});