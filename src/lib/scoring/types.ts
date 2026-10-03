import type { CombinedComponentKey } from "./constants";

export type CombinedConcernLevel = "Low" | "Moderate" | "High" | "Critical";
export type CombinedConfidenceLevel = "Low" | "Moderate" | "High";
export type AssessmentStatus = "not_ready" | "preliminary";

export type CompletedCheckInput = {
  completed: boolean;
  score: number | null;
  evidenceCompleteness: number;
  sourceId: string | null;
  sourceVersion: string | null;
  sourceUpdatedAt: string | null;
};

export type CombinedScoringInput = {
  chat: {
    completed: boolean;
    communicationManipulationScore: number | null;
    financialPressureScore: number | null;
    urgencyIsolationScore: number | null;
    confidenceScore: number | null;
    evidenceCompleteness: number;
    sourceId: string | null;
    promptVersion: string | null;
    modelIdentifier: string | null;
    sourceCompletedAt: string | null;
  };
  profile: CompletedCheckInput;
  video: CompletedCheckInput;
  image: CompletedCheckInput;
};

export type ComponentAssessment = {
  key: CombinedComponentKey;
  label: string;
  score: number | null;
  weight: number;
  included: boolean;
  source: "chat" | "profile" | "video" | "image";
};

export type SourceFingerprint = {
  id: string | null;
  version: string | null;
  updatedAt: string | null;
};

export type CombinedScoreResult = {
  status: AssessmentStatus;
  ready: boolean;
  overallScore: number | null;
  concernLevel: CombinedConcernLevel | null;
  confidenceScore: number;
  confidenceLevel: CombinedConfidenceLevel;
  evidenceCompleteness: number;
  evidenceCompletenessLevel: CombinedConfidenceLevel;
  availableWeight: number;
  components: ComponentAssessment[];
  completedSources: string[];
  missingSources: string[];
  sourceFingerprints: Record<string, SourceFingerprint>;
  limitations: string[];
};

export type CaseAssessmentRecord = {
  id: string;
  case_id: string;
  auth_user_id: string;
  status: AssessmentStatus;
  overall_score: number | null;
  concern_level: CombinedConcernLevel | null;
  confidence_score: number;
  confidence_level: CombinedConfidenceLevel;
  evidence_completeness: number;
  evidence_completeness_level: CombinedConfidenceLevel;
  available_weight: number;
  component_scores: ComponentAssessment[];
  completed_sources: string[];
  missing_sources: string[];
  source_fingerprints: Record<string, SourceFingerprint>;
  scoring_version: string;
  limitations: string[];
  created_at: string;
};

export type GenerateAssessmentActionState = {
  status: "idle" | "error" | "success";
  message?: string;
};

export const initialGenerateAssessmentActionState: GenerateAssessmentActionState =
  {
    status: "idle",
  };
