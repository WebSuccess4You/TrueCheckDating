import { describe, expect, it } from "vitest";

import { buildFinalReportBody } from "./build";

const caseRecord = {
  id: "case-1",
  owner_profile_id: "profile-1",
  auth_user_id: "user-1",
  private_nickname: "Sample case",
  communication_platform: "Example",
  claimed_name_or_alias: null,
  claimed_location: null,
  communication_started_on: null,
  status: "active" as const,
  completion_percent: 100,
  latest_concern_level: "High",
  latest_risk_score: 70,
  lawful_use_acknowledged_at: "2026-06-18T00:00:00Z",
  archived_at: null,
  created_at: "2026-06-18T00:00:00Z",
  updated_at: "2026-06-18T00:00:00Z",
};
const assessment = {
  id: "assessment-1",
  case_id: "case-1",
  auth_user_id: "user-1",
  status: "preliminary" as const,
  overall_score: 70,
  concern_level: "High" as const,
  confidence_score: 65,
  confidence_level: "Moderate" as const,
  evidence_completeness: 80,
  evidence_completeness_level: "High" as const,
  available_weight: 100,
  component_scores: [],
  completed_sources: ["Chat Analyzer"],
  missing_sources: [],
  source_fingerprints: {},
  scoring_version: "test",
  limitations: ["Not proof."],
  created_at: "2026-06-18T00:00:00Z",
};
const chatAnalysis = {
  id: "chat-1",
  case_id: "case-1",
  chat_submission_id: "submission-1",
  auth_user_id: "user-1",
  status: "completed" as const,
  risk_score: 75,
  concern_level: "high" as const,
  confidence_score: 70,
  confidence_level: "high" as const,
  evidence_completeness: 80,
  summary:
    "A fictional conversation contains pressure and an urgent financial request.",
  category_scores: {
    communication_manipulation: 70,
    financial_pressure: 90,
    identity_consistency: 30,
    verification_behavior: 50,
    urgency_and_isolation: 80,
  },
  red_flags: [
    {
      category: "financial_pressure" as const,
      severity: "high" as const,
      evidence_excerpt: "Send the money today",
      observation: "An urgent money request appears.",
      why_it_matters: "Urgency can prevent careful verification.",
    },
  ],
  protective_signals: [],
  recommended_actions: [
    {
      priority: "high" as const,
      action: "Do not send money yet.",
      reason: "Verify the request independently.",
    },
  ],
  limitations: ["Text cannot establish identity."],
  prompt_version: "prompt-1",
  model_identifier: "model-1",
  schema_version: "1.0",
  input_token_count: 10,
  output_token_count: 10,
  provider_response_id: null,
  request_id: "request-1",
  error_code: null,
  created_at: "2026-06-18T00:00:00Z",
  completed_at: "2026-06-18T00:00:00Z",
};

describe("buildFinalReportBody", () => {
  it("separates evidence, observation, interpretation, and limitations", () => {
    const report = buildFinalReportBody({
      caseRecord,
      assessment,
      chatAnalysis,
      profileCheck: null,
      videoCheck: null,
      imageCheck: null,
      generatedAt: "2026-06-18T01:00:00Z",
    });
    expect(report.warningSigns[0]).toMatchObject({
      evidence: "Send the money today",
      observation: "An urgent money request appears.",
    });
    expect(report.summary).not.toContain(chatAnalysis.summary);
    expect(report.summary).toContain("Review the quoted findings");
    expect(report.limitations.join(" ")).toContain(
      "not establish legal identity",
    );
    expect(report.disclaimer).toContain("not a background check");
  });

  it("excludes hidden identifiers, raw notes, and full transcript content", () => {
    const report = buildFinalReportBody({
      caseRecord,
      assessment,
      chatAnalysis,
      profileCheck: null,
      videoCheck: null,
      imageCheck: null,
      generatedAt: "2026-06-18T01:00:00Z",
    });
    const serialized = JSON.stringify(report);
    expect(serialized).not.toContain("user-1");
    expect(serialized).not.toContain("profile-1");
    expect(serialized).not.toContain("provider_response_id");
    expect(serialized).not.toContain("CHAT_CONTENT_ENCRYPTION_KEY");
  });
});
