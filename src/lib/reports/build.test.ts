import { describe, expect, it } from "vitest";
import type { ProfileCheckRecord } from "@/lib/profile/types";
import type { VideoCheckRecord } from "@/lib/video/types";
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
describe("report evidence labels for Profile and Video checks", () => {
  const completedAt = "2026-06-18T00:00:00Z";

  const profileCheck: ProfileCheckRecord = {
    id: "profile-check-1",
    case_id: "case-1",
    auth_user_id: "user-1",
    status: "completed",
    answers: {},
    contradictions: [],
    protective_signals: [],
    component_score: null,
    evidence_completeness: 0,
    summary: "Insufficient evidence for scoring.",
    version: "profile-test-1",
    completed_at: completedAt,
    created_at: completedAt,
    updated_at: completedAt,
  };

  const videoCheck: VideoCheckRecord = {
    id: "video-check-1",
    case_id: "case-1",
    auth_user_id: "user-1",
    status: "completed",
    answers: {},
    notes: null,
    avoidance_patterns: [],
    protective_signals: [],
    component_score: null,
    evidence_completeness: 0,
    summary: "Insufficient evidence for scoring.",
    version: "video-test-1",
    safety_acknowledged_at: completedAt,
    completed_at: completedAt,
    created_at: completedAt,
    updated_at: completedAt,
  };
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

  it.each([
    {
      source: "Profile Consistency Check",
      componentSource: "profile" as const,
      key: "profile_consistency" as const,
      weight: 20,
    },
    {
      source: "Video Call Verifier",
      componentSource: "video" as const,
      key: "video_verification" as const,
      weight: 15,
    },
  ])(
    "uses the assessment inclusion flag for completed $source",
    ({ source, componentSource, key, weight }) => {
      for (const included of [true, false]) {
        const component = {
          key,
          label: source,
          score: included ? 40 : null,
          weight,
          included,
          source: componentSource,
        };

        const report = buildFinalReportBody({
          caseRecord,
          assessment: {
            ...assessment,
            component_scores: [component],
          },
          chatAnalysis,
          profileCheck: {
            ...profileCheck,
            component_score: 40,
            evidence_completeness: 80,
          },
          videoCheck: {
            ...videoCheck,
            component_score: 40,
            evidence_completeness: 80,
          },
          imageCheck: null,
          generatedAt: "2026-06-18T01:00:00Z",
        });

        expect(
          report.evidenceReviewed.find((item) => item.source === source),
        ).toMatchObject({
          status: included ? "Reviewed" : "Completed — excluded from scoring",
          reviewedAt: completedAt,
        });
        expect(report.componentBreakdown).toEqual([component]);

        const otherSource =
          componentSource === "profile"
            ? "Video Call Verifier"
            : "Profile Consistency Check";

        expect(
          report.evidenceReviewed.find((item) => item.source === otherSource),
        ).toMatchObject({
          status: "Completed — excluded from scoring",
        });
      }
    },
  );
  it.each([
    {
      source: "Profile Consistency Check",
      version: "profile-test-1",
    },
    {
      source: "Video Call Verifier",
      version: "video-test-1",
    },
  ])(
    "labels completed $source as excluded and preserves its metadata",
    ({ source, version }) => {
      const report = buildFinalReportBody({
        caseRecord,
        assessment,
        chatAnalysis,
        profileCheck,
        videoCheck,
        imageCheck: null,
        generatedAt: "2026-06-18T01:00:00Z",
      });

      expect(
        report.evidenceReviewed.find((item) => item.source === source),
      ).toMatchObject({
        status: "Completed — excluded from scoring",
        reviewedAt: completedAt,
        version,
      });
      expect(report.componentBreakdown).toEqual([]);
    },
  );

  it.each(["Profile Consistency Check", "Video Call Verifier"])(
    "labels unfinished %s as unavailable",
    (source) => {
      const report = buildFinalReportBody({
        caseRecord,
        assessment,
        chatAnalysis,
        profileCheck: {
          ...profileCheck,
          status: "in_progress",
          completed_at: null,
        },
        videoCheck: {
          ...videoCheck,
          status: "in_progress",
          completed_at: null,
        },
        imageCheck: null,
        generatedAt: "2026-06-18T01:00:00Z",
      });

      expect(
        report.evidenceReviewed.find((item) => item.source === source),
      ).toMatchObject({
        status: "Not available",
        reviewedAt: null,
      });
    },
  );

  it.each(["Profile Consistency Check", "Video Call Verifier"])(
    "labels missing %s as unavailable",
    (source) => {
      const report = buildFinalReportBody({
        caseRecord,
        assessment,
        chatAnalysis,
        profileCheck: null,
        videoCheck: null,
        imageCheck: null,
        generatedAt: "2026-06-18T01:00:00Z",
      });

      expect(
        report.evidenceReviewed.find((item) => item.source === source),
      ).toMatchObject({
        status: "Not available",
        reviewedAt: null,
        version: null,
      });
    },
  );
});
describe("report recommendation priorities", () => {
  it("presents generic precautions at moderate priority without AI recommendations", () => {
    const report = buildFinalReportBody({
      caseRecord,
      assessment,
      chatAnalysis: null,
      profileCheck: null,
      videoCheck: null,
      imageCheck: null,
      generatedAt: "2026-06-18T01:00:00Z",
    });

    expect(report.recommendations).toHaveLength(3);
    for (const recommendation of report.recommendations) {
      expect(recommendation.priority).toBe("moderate");
      expect(recommendation.reason).toMatch(/^General precaution:/);
    }
  });

  it("preserves high priority for a case-specific AI recommendation", () => {
    const report = buildFinalReportBody({
      caseRecord,
      assessment,
      chatAnalysis,
      profileCheck: null,
      videoCheck: null,
      imageCheck: null,
      generatedAt: "2026-06-18T01:00:00Z",
    });

    expect(report.recommendations).toHaveLength(4);
    expect(report.recommendations[0]).toEqual({
      priority: "high",
      action: "Do not send money yet.",
      reason: "Verify the request independently.",
    });

    for (const recommendation of report.recommendations.slice(1)) {
      expect(recommendation.priority).toBe("moderate");
      expect(recommendation.reason).toMatch(/^General precaution:/);
    }
  });
});
