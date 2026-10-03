"use server";

import { randomUUID } from "node:crypto";

import { notifyOperationalAlert } from "@/lib/operations/alerts.mjs";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/user";
import {
  CHAT_ANALYZER_PROMPT_VERSION,
  CHAT_ANALYZER_SCHEMA_VERSION,
} from "@/lib/ai/constants";
import { validateEvidenceExcerpts } from "@/lib/ai/evidence";
import { readableConcernLevel } from "@/lib/ai/format";
import {
  ChatAnalysisProviderError,
  runOpenAIChatAnalysis,
} from "@/lib/ai/openai";
import { buildChatAnalyzerUserInput } from "@/lib/ai/prompt";
import type { ChatAnalysisActionState } from "@/lib/ai/types";
import { decryptChatContent } from "@/lib/chat/crypto";
import { getOwnedChatSubmission } from "@/lib/chat/queries";
import { getOwnedCase } from "@/lib/cases/queries";
import { chatAnalysisEnabled } from "@/lib/operations/feature-switches";
import {
  getOpenAIEnvironment,
  requireChatEncryptionKey,
} from "@/lib/server-env";
import { createAdminClient } from "@/lib/supabase/admin";

function value(formData: FormData, key: string): string {
  const item = formData.get(key);
  return typeof item === "string" ? item : "";
}

function setupMessage(): ChatAnalysisActionState {
  return {
    status: "error",
    message:
      "AI analysis is not configured yet. Add the server-only Supabase and OpenAI keys described in README.md, then try again.",
  };
}

function providerMessage(code: ChatAnalysisProviderError["code"]): string {
  const messages: Record<ChatAnalysisProviderError["code"], string> = {
    not_configured:
      "OpenAI analysis is not configured yet. Add OPENAI_API_KEY to the server environment.",
    timeout:
      "The analyzer took too long to respond. Your encrypted conversation remains saved; please try again.",
    rate_limited:
      "The AI service is temporarily busy. Your encrypted conversation remains saved; please try again shortly.",
    provider_error:
      "The AI service could not complete this analysis. Your encrypted conversation remains saved; please try again.",
    refused:
      "The AI service could not analyze this submission. Review the text for unsupported or unsafe material and try a relevant excerpt.",
    invalid_output_structure:
      "The analyzer did not return a complete structured result. No new assessment was saved.",
    invalid_output_evidence:
      "An analyzer evidence quote did not match the saved conversation. No new assessment was saved.",
  };
  return messages[code];
}

export async function analyzeChatSubmissionAction(
  _previousState: ChatAnalysisActionState,
  formData: FormData,
): Promise<ChatAnalysisActionState> {
  const caseId = value(formData, "caseId");
  const submissionId = value(formData, "submissionId");

  if (!caseId || !submissionId) {
    return {
      status: "error",
      message: "The case or conversation submission is missing.",
    };
  }

  const user = await requireUser();
  const [caseRecord, submission] = await Promise.all([
    getOwnedCase(user.id, caseId),
    getOwnedChatSubmission(user.id, caseId, submissionId),
  ]);

  if (!caseRecord || !submission) {
    return {
      status: "error",
      message: "The saved conversation was not found or is not yours.",
    };
  }

  if (caseRecord.status !== "active") {
    return {
      status: "error",
      message: "Restore this archived case before running an analysis.",
    };
  }

  if (!chatAnalysisEnabled()) {
    return {
      status: "error",
      message:
        "New AI analyses are temporarily unavailable. Your saved conversation remains private and encrypted; please try again later.",
    };
  }

  let transcript: string;
  let admin;
  let openAIEnvironment;
  try {
    transcript = decryptChatContent(
      submission.content_ciphertext,
      submission.content_iv,
      requireChatEncryptionKey(),
    );
    admin = createAdminClient();
    openAIEnvironment = getOpenAIEnvironment();
  } catch {
    return setupMessage();
  }

  const requestId = randomUUID();
  const { data: started, error: startError } = await admin.rpc(
    "start_chat_analysis_with_limit",
    {
      p_user_id: user.id,
      p_case_id: caseId,
      p_submission_id: submissionId,
      p_owner_profile_id: submission.owner_profile_id,
      p_request_id: requestId,
      p_prompt_version: CHAT_ANALYZER_PROMPT_VERSION,
      p_model_identifier: openAIEnvironment.model,
      p_schema_version: CHAT_ANALYZER_SCHEMA_VERSION,
      p_hourly_limit: openAIEnvironment.maxRequestsPerHour,
    },
  );
  const startResult = (
    started as { outcome: string; analysis_id: string | null }[] | null
  )?.[0];
  if (startError || !startResult) {
    return {
      status: "error",
      message:
        "The analyzer could not be started. Apply the Build 15 rate-limit migration and try again.",
    };
  }

  if (startResult.outcome === "limited") {
    return {
      status: "error",
      message: `For cost and abuse protection, this account is limited to ${openAIEnvironment.maxRequestsPerHour} analyses per hour. Try again later.`,
    };
  }
  if (startResult.outcome === "in_progress") {
    return {
      status: "error",
      message: "This conversation already has an analysis in progress.",
    };
  }
  if (startResult.outcome !== "started" || !startResult.analysis_id) {
    return {
      status: "error",
      message:
        "The saved conversation could not be analyzed. Refresh the case and try again.",
    };
  }
  const createdAnalysis = { id: startResult.analysis_id };

  await admin
    .from("chat_submissions")
    .update({ status: "analysis_processing" })
    .eq("id", submissionId)
    .eq("auth_user_id", user.id);

  try {
    const providerResult = await runOpenAIChatAnalysis({
      transcript,
      userInput: buildChatAnalyzerUserInput(transcript, {
        communicationPlatform: caseRecord.communication_platform,
        claimedLocation: caseRecord.claimed_location,
        relationshipStartedOn: caseRecord.communication_started_on,
      }),
    });

    const evidenceValidation = validateEvidenceExcerpts(
      providerResult.output,
      transcript,
    );
    if (!evidenceValidation.valid) {
      throw new ChatAnalysisProviderError(
        "invalid_output_evidence",
        "An evidence excerpt was not present in the submitted transcript.",
        evidenceValidation.invalidExcerpt,
      );
    }

    const completedAt = new Date().toISOString();
    const result = providerResult.output;
    const { error: updateError } = await admin
      .from("chat_analyses")
      .update({
        status: "completed",
        risk_score: result.risk_score,
        concern_level: result.concern_level,
        confidence_score: result.confidence_score,
        confidence_level: result.confidence_level,
        evidence_completeness: result.evidence_completeness,
        summary: result.summary,
        category_scores: result.category_scores,
        red_flags: result.red_flags,
        protective_signals: result.protective_signals,
        recommended_actions: result.recommended_actions,
        limitations: result.limitations,
        model_identifier: providerResult.model,
        input_token_count: providerResult.inputTokens,
        output_token_count: providerResult.outputTokens,
        provider_response_id: providerResult.providerResponseId,
        completed_at: completedAt,
        error_code: null,
      })
      .eq("id", createdAnalysis.id);

    if (updateError) {
      throw new ChatAnalysisProviderError(
        "provider_error",
        "The validated analysis could not be saved.",
      );
    }

    await Promise.all([
      admin
        .from("chat_submissions")
        .update({ status: "analysis_completed" })
        .eq("id", submissionId)
        .eq("auth_user_id", user.id),
      admin
        .from("cases")
        .update({
          latest_concern_level: readableConcernLevel(result.concern_level),
          latest_risk_score: result.risk_score,
          completion_percent: Math.max(caseRecord.completion_percent, 25),
          updated_at: completedAt,
        })
        .eq("id", caseId)
        .eq("auth_user_id", user.id),
    ]);

    revalidatePath(`/cases/${caseId}`);
    revalidatePath(`/cases/${caseId}/chat`);
    revalidatePath(`/cases/${caseId}/chat/${submissionId}`);
    redirect(
      `/cases/${caseId}/chat/${submissionId}?message=${encodeURIComponent(
        "Conversation analysis completed.",
      )}`,
    );
  } catch (error) {
    if ((error as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }

    const providerError =
      error instanceof ChatAnalysisProviderError
        ? error
        : new ChatAnalysisProviderError(
            "provider_error",
            "The analysis could not be completed.",
          );

    await Promise.all([
      admin
        .from("chat_analyses")
        .update({
          status: providerError.code === "refused" ? "rejected" : "failed",
          error_code: providerError.code,
          completed_at: new Date().toISOString(),
        })
        .eq("id", createdAnalysis.id),
      admin
        .from("chat_submissions")
        .update({ status: "analysis_failed" })
        .eq("id", submissionId)
        .eq("auth_user_id", user.id),
    ]);

    // Build 14 records only sanitized operational metadata. The transcript,
    // prompt, provider body, and private case details are never copied here.
    await admin.from("system_errors").insert({
      request_id: requestId,
      error_class: `chat_analysis_${providerError.code}`,
      sanitized_message: providerMessage(providerError.code),
      service: "openai_chat_analysis",
      severity: providerError.code.startsWith("invalid_output_")
        ? "high"
        : "medium",
      retryable: ["timeout", "rate_limited", "provider_error"].includes(
        providerError.code,
      ),
    });

    await notifyOperationalAlert({
      category: "ai_analysis_failed",
      requestId,
    });

    revalidatePath(`/cases/${caseId}/chat/${submissionId}`);
    return {
      status: "error",
      message: providerError.ownerVisibleEvidence
        ? `${providerMessage(providerError.code)} Rejected quote: “${providerError.ownerVisibleEvidence}”`
        : providerMessage(providerError.code),
    };
  }
}
