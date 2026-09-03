// packages/shared/types/activityPayloads.ts
import type { TriageResult, SymptomsAnalysis, KnowledgeResult, AppointmentOption, NotificationPayload } from "./domain";

// Contract for data pushed via wsNotifier.send({ data: ... }) from backend
// agents/workflow, relayed to a browser session by realtime/browserRelay.ts.
// Covers the three real message shapes verified end-to-end in Phase 6/Option B testing.

export type AgentName =
  | "triage-agent"
  | "symptoms-agent"
  | "medical-knowledge-agent"
  | "appointment-agent"
  | "notification-agent";

export type AgentStatus = "started" | "completed" | "failed";

export interface AgentStatusPayload {
  type: "agent.status";
  sessionId: string; // present on every relayed message (added by broadcastActivity)
  agent: AgentName;
  status: AgentStatus;
  data?: TriageResult | SymptomsAnalysis | KnowledgeResult | { appointments: AppointmentOption[] } | NotificationPayload;
  timestamp: number;
}

export type WorkflowStage = "received" | "triaged" | "fanned-out" | "notified" | "completed";

export interface WorkflowStagePayload {
  type: "workflow.stage";
  sessionId: string;
  stage: WorkflowStage;
  timestamp: number;
}

// Sent directly by notificationAgent.ts via wsNotifier.send({ data: { type: "notification", ...payload } }),
// NOT via broadcastActivity — so it does not carry a `timestamp` field, only NotificationPayload's own fields.
export interface NotificationBroadcastPayload extends NotificationPayload {
  type: "notification";
}

export type ActivityPayload = AgentStatusPayload | WorkflowStagePayload | NotificationBroadcastPayload;

export type BroadcastableActivityPayload =
  | Omit<AgentStatusPayload, "sessionId">
  | Omit<WorkflowStagePayload, "sessionId">;