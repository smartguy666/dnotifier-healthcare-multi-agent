// packages/shared/types/workflowState.ts
import type { TriageResult, SymptomsAnalysis, KnowledgeResult, AppointmentOption } from "./domain";

export interface HealthcareWorkflowState {
  triage?: TriageResult;
  symptomsAnalysis?: SymptomsAnalysis;
  knowledgeResult?: KnowledgeResult;
  appointments?: AppointmentOption[];
}