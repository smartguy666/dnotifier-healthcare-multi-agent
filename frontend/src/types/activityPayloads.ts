// frontend/src/types/activityPayloads.ts
// Local copy of backend's activityPayloads.ts — see domain.ts note.

import type { NotificationPayload } from "./domain";

export type AgentName =
  | "triage-agent"
  | "symptoms-agent"
  | "medical-knowledge-agent"
  | "appointment-agent"
  | "notification-agent"
  | "receptionist-agent";

export type AgentStatus = "started" | "completed" | "failed";

export interface AgentStatusPayload {
  type: "agent.status";
  sessionId: string;
  agent: AgentName;
  status: AgentStatus;
  data?: unknown; // widened to match backend — payload shapes now vary per agent (receptionist turns, triage results, etc.)
  timestamp: number;
}

export type WorkflowStage = "received" | "triaged" | "fanned-out" | "notified" | "completed";

export interface WorkflowStagePayload {
  type: "workflow.stage";
  sessionId: string;
  stage: WorkflowStage;
  timestamp: number;
}

export interface NotificationBroadcastPayload extends NotificationPayload {
  type: "notification";
}

export type ActivityPayload = AgentStatusPayload | WorkflowStagePayload | NotificationBroadcastPayload;