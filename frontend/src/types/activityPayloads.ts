// frontend/src/types/activityPayloads.ts
// Local copy of packages/shared/types/activityPayloads.ts — see domain.ts note.

import type { TriageResult, SymptomsAnalysis, KnowledgeResult, AppointmentOption, NotificationPayload } from "./domain";

export type AgentName =
  | "triage-agent"
  | "symptoms-agent"
  | "medical-knowledge-agent"
  | "appointment-agent"
  | "notification-agent";

export type AgentStatus = "started" | "completed" | "failed";

export interface AgentStatusPayload {
  type: "agent.status";
  sessionId: string;
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

export interface NotificationBroadcastPayload extends NotificationPayload {
  type: "notification";
}

export type ActivityPayload = AgentStatusPayload | WorkflowStagePayload | NotificationBroadcastPayload;