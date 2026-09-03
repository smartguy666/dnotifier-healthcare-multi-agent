// packages/shared/types/domain.ts
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