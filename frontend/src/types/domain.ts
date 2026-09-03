// frontend/src/types/domain.ts
// Local copy of packages/shared/types/domain.ts — duplicated intentionally
// since Next.js 15's experimental.externalDir is confirmed broken for this
// exact cross-folder import case, and we're not using workspaces. Keep this
// in sync manually if the backend's version changes.

export type UrgencyLevel = "low" | "moderate" | "high";

export interface TriageResult {
  urgency: UrgencyLevel;
  symptoms: string[];
  requiresMedicalReview: boolean;
}

export interface SymptomsAnalysis {
  symptoms: string[];
  duration: string;
  severity: string;
}

export interface KnowledgeResult {
  information: string[];
  requiresClinicianReview: boolean;
}

export interface AppointmentOption {
  doctor: string;
  time: string;
}

export interface NotificationPayload {
  sessionId: string;
  channel: "in-app" | "console";
  message: string;
}