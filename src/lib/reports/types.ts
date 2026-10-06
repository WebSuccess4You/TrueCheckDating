import type {
  CombinedConcernLevel,
  CombinedConfidenceLevel,
  ComponentAssessment,
  SourceFingerprint,
} from "@/lib/scoring/types";

export type ReportPriority = "low" | "moderate" | "high" | "immediate";
export type ReportSeverity = "low" | "moderate" | "high" | "critical";

export type ReportEvidenceItem = {
  source:
    | "Chat Analyzer"
    | "Profile Consistency Check"
    | "Video Call Verifier"
    | "Guided Reverse Image Checker";
  status: "Reviewed" | "Completed — excluded from scoring" | "Not available";
  reviewedAt: string | null;
  version: string | null;
  description: string;
};

export type ReportFinding = {
  source: string;
  category: string;
  severity: ReportSeverity;
  evidence: string;
  observation: string;
  interpretation: string;
};

export type ReportProtectiveSignal = {
  source: string;
  evidence: string;
  observation: string;
};

export type ReportRecommendation = {
  priority: ReportPriority;
  action: string;
  reason: string;
};

export type FinalReportBody = {
  schemaVersion: string;
  contentVersion: string;
  caseLabel: string;
  generatedAt: string;
  summary: string;
  evidenceReviewed: ReportEvidenceItem[];
  warningSigns: ReportFinding[];
  protectiveSignals: ReportProtectiveSignal[];
  componentBreakdown: ComponentAssessment[];
  recommendations: ReportRecommendation[];
  limitations: string[];
  disclaimer: string;
};

export type ReportSnapshotRecord = {
  id: string;
  case_id: string;
  auth_user_id: string;
  case_assessment_id: string;
  report_version_number: number;
  report_schema_version: string;
  report_content_version: string;
  scoring_version: string;
  prompt_version: string | null;
  model_identifier: string | null;
  overall_score: number;
  concern_level: CombinedConcernLevel;
  confidence_score: number;
  confidence_level: CombinedConfidenceLevel;
  evidence_completeness: number;
  evidence_completeness_level: CombinedConfidenceLevel;
  component_scores: ComponentAssessment[];
  report_body: FinalReportBody;
  source_fingerprints: Record<string, SourceFingerprint>;
  generated_at: string;
};

export type GenerateReportActionState = {
  status: "idle" | "error" | "success";
  message?: string;
};

export const initialGenerateReportActionState: GenerateReportActionState = {
  status: "idle",
};
