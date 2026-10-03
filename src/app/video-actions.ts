"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/user";
import { getOwnedCase } from "@/lib/cases/queries";
import { encryptChatContent } from "@/lib/chat/crypto";
import { requireChatEncryptionKey } from "@/lib/server-env";
import { createAdminClient } from "@/lib/supabase/admin";
import { VIDEO_CHECK_VERSION, videoQuestions } from "@/lib/video/constants";
import { scoreVideoCheck } from "@/lib/video/scoring";
import type { VideoAnswers, VideoCheckActionState } from "@/lib/video/types";
import { firstFieldErrors, videoCheckFormSchema } from "@/lib/video/validation";

function value(formData: FormData, key: string): string {
  const item = formData.get(key);
  return typeof item === "string" ? item : "";
}

function queryMessage(message: string): string {
  return encodeURIComponent(message);
}

export async function saveVideoCheckAction(
  _previousState: VideoCheckActionState,
  formData: FormData,
): Promise<VideoCheckActionState> {
  const rawAnswers = Object.fromEntries(
    videoQuestions.map((question) => [
      question.key,
      value(formData, question.key),
    ]),
  );

  const parsed = videoCheckFormSchema.safeParse({
    caseId: value(formData, "caseId"),
    intent: value(formData, "intent"),
    ...rawAnswers,
    notes: value(formData, "notes"),
    safetyAcknowledged: formData.get("safetyAcknowledged"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message:
        value(formData, "intent") === "complete"
          ? "Answer each item or choose ‘Unknown,’ then confirm the safety statement."
          : "Correct the highlighted fields and try again.",
      fieldErrors: firstFieldErrors(parsed.error),
    };
  }

  const parsedValues = parsed.data as Record<string, unknown>;
  const caseId = parsedValues.caseId as string;
  const intent = parsedValues.intent as "save" | "complete";
  const notes =
    typeof parsedValues.notes === "string" ? parsedValues.notes : null;
  const safetyAcknowledged = parsedValues.safetyAcknowledged === true;

  const user = await requireUser();
  const caseRecord = await getOwnedCase(user.id, caseId);

  if (!caseRecord) {
    return {
      status: "error",
      message: "The case was not found or does not belong to this account.",
    };
  }

  if (caseRecord.status !== "active") {
    return {
      status: "error",
      message: "Restore this archived case before changing the video check.",
    };
  }

  const answers: VideoAnswers = {};
  for (const question of videoQuestions) {
    const answer = parsedValues[question.key];
    if (typeof answer === "string") answers[question.key] = answer;
  }
  if (notes) answers.notes = notes;

  const score = scoreVideoCheck(answers);
  const isComplete = intent === "complete";
  const now = new Date().toISOString();

  let encryptedNotes: ReturnType<typeof encryptChatContent> | null = null;
  if (notes) {
    try {
      encryptedNotes = encryptChatContent(notes, requireChatEncryptionKey());
    } catch {
      return {
        status: "error",
        message:
          "Private note encryption is not configured. Add the encryption key described in README.md, then try again.",
      };
    }
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return {
      status: "error",
      message:
        "Video-check storage is not configured yet. Add the server-only Supabase key described in README.md, then try again.",
    };
  }

  const answersWithoutNotes = { ...answers };
  delete answersWithoutNotes.notes;

  const { error } = await admin.from("video_checks").upsert(
    {
      case_id: caseRecord.id,
      owner_profile_id: caseRecord.owner_profile_id,
      auth_user_id: user.id,
      status: isComplete ? "completed" : "in_progress",
      answers: answersWithoutNotes,
      notes_ciphertext: encryptedNotes?.ciphertext ?? null,
      notes_iv: encryptedNotes?.iv ?? null,
      notes_hash: encryptedNotes?.hash ?? null,
      encryption_version: encryptedNotes?.encryptionVersion ?? null,
      avoidance_patterns: score.avoidancePatterns,
      protective_signals: score.protectiveSignals,
      component_score: score.componentScore,
      evidence_completeness: score.evidenceCompleteness,
      summary: isComplete ? score.summary : null,
      version: VIDEO_CHECK_VERSION,
      safety_acknowledged_at: isComplete && safetyAcknowledged ? now : null,
      completed_at: isComplete ? now : null,
      updated_at: now,
    },
    { onConflict: "case_id" },
  );

  if (error) {
    return {
      status: "error",
      message:
        "The video-call check could not be saved. Make sure the Build 09 migration has been applied, then try again.",
    };
  }

  if (isComplete) {
    await admin
      .from("cases")
      .update({
        completion_percent: Math.max(caseRecord.completion_percent, 90),
        updated_at: now,
      })
      .eq("id", caseRecord.id)
      .eq("auth_user_id", user.id);
  }

  revalidatePath(`/cases/${caseRecord.id}`);
  revalidatePath(`/cases/${caseRecord.id}/video`);
  revalidatePath("/dashboard");

  redirect(
    `/cases/${caseRecord.id}/video?message=${queryMessage(
      isComplete
        ? "Video Call Verifier completed."
        : "Video-call check progress saved privately.",
    )}`,
  );
}
