import { z } from "zod";

import {
  CHAT_ANALYZER_SCHEMA_VERSION,
  MAX_EVIDENCE_EXCERPT_CHARACTERS,
} from "./constants";

export const concernLevelSchema = z.enum([
  "low",
  "moderate",
  "high",
  "critical",
]);
export const confidenceLevelSchema = z.enum(["low", "moderate", "high"]);
export const findingSeveritySchema = z.enum([
  "low",
  "moderate",
  "high",
  "critical",
]);

export const analysisCategorySchema = z.enum([
  "communication_manipulation",
  "financial_pressure",
  "identity_consistency",
  "verification_behavior",
  "urgency_and_isolation",
]);

const scoreSchema = z.number().int().min(0).max(100);

const redFlagSchema = z
  .object({
    category: analysisCategorySchema,
    severity: findingSeveritySchema,
    evidence_excerpt: z
      .string()
      .trim()
      .min(1)
      .max(MAX_EVIDENCE_EXCERPT_CHARACTERS),
    observation: z.string().trim().min(1).max(500),
    why_it_matters: z.string().trim().min(1).max(500),
  })
  .strict();

const protectiveSignalSchema = z
  .object({
    category: analysisCategorySchema,
    evidence_excerpt: z
      .string()
      .trim()
      .min(1)
      .max(MAX_EVIDENCE_EXCERPT_CHARACTERS),
    observation: z.string().trim().min(1).max(500),
  })
  .strict();

const recommendedActionSchema = z
  .object({
    priority: z.enum(["low", "moderate", "high", "immediate"]),
    action: z.string().trim().min(1).max(500),
    reason: z.string().trim().min(1).max(500),
  })
  .strict();

export const chatAnalysisOutputSchema = z
  .object({
    schema_version: z.literal(CHAT_ANALYZER_SCHEMA_VERSION),
    risk_score: scoreSchema,
    concern_level: concernLevelSchema,
    confidence_score: scoreSchema,
    confidence_level: confidenceLevelSchema,
    evidence_completeness: scoreSchema,
    summary: z.string().trim().min(20).max(1_000),
    category_scores: z
      .object({
        communication_manipulation: scoreSchema,
        financial_pressure: scoreSchema,
        identity_consistency: scoreSchema,
        verification_behavior: scoreSchema,
        urgency_and_isolation: scoreSchema,
      })
      .strict(),
    red_flags: z.array(redFlagSchema).max(10),
    protective_signals: z.array(protectiveSignalSchema).max(8),
    recommended_actions: z.array(recommendedActionSchema).min(1).max(8),
    limitations: z.array(z.string().trim().min(1).max(400)).min(1).max(8),
  })
  .strict();

export type ChatAnalysisOutput = z.infer<typeof chatAnalysisOutputSchema>;
