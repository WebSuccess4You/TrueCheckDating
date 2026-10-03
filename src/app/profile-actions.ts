"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/user";
import { getOwnedCase } from "@/lib/cases/queries";
import {
  PROFILE_CHECK_VERSION,
  profileQuestions,
} from "@/lib/profile/constants";
import { scoreProfileCheck } from "@/lib/profile/scoring";
import type {
  ProfileAnswers,
  ProfileCheckActionState,
} from "@/lib/profile/types";
import {
  firstFieldErrors,
  profileCheckFormSchema,
} from "@/lib/profile/validation";
import { createAdminClient } from "@/lib/supabase/admin";

function value(formData: FormData, key: string): string {
  const item = formData.get(key);
  return typeof item === "string" ? item : "";
}

function queryMessage(message: string): string {
  return encodeURIComponent(message);
}

export async function saveProfileCheckAction(
  _previousState: ProfileCheckActionState,
  formData: FormData,
): Promise<ProfileCheckActionState> {
  const rawAnswers = Object.fromEntries(
    profileQuestions.map((question) => [
      question.key,
      value(formData, question.key),
    ]),
  );

  const parsed = profileCheckFormSchema.safeParse({
    caseId: value(formData, "caseId"),
    intent: value(formData, "intent"),
    ...rawAnswers,
    notes: value(formData, "notes"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message:
        value(formData, "intent") === "complete"
          ? "Answer each question or choose ‘Unknown,’ then try again."
          : "Correct the highlighted fields and try again.",
      fieldErrors: firstFieldErrors(parsed.error),
    };
  }

  const user = await requireUser();
  const caseRecord = await getOwnedCase(user.id, parsed.data.caseId);

  if (!caseRecord) {
    return {
      status: "error",
      message: "The case was not found or does not belong to this account.",
    };
  }

  if (caseRecord.status !== "active") {
    return {
      status: "error",
      message: "Restore this archived case before changing the profile check.",
    };
  }

  const answers: ProfileAnswers = {};
  const parsedAnswers = parsed.data as Record<string, unknown>;
  for (const question of profileQuestions) {
    const answer = parsedAnswers[question.key];
    if (typeof answer === "string") answers[question.key] = answer;
  }
  if (parsed.data.notes) answers.notes = parsed.data.notes;

  const score = scoreProfileCheck(answers);
  const isComplete = parsed.data.intent === "complete";
  const now = new Date().toISOString();

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return {
      status: "error",
      message:
        "Profile-check storage is not configured yet. Add the server-only Supabase key described in README.md, then try again.",
    };
  }

  const { error } = await admin.from("profile_checks").upsert(
    {
      case_id: caseRecord.id,
      owner_profile_id: caseRecord.owner_profile_id,
      auth_user_id: user.id,
      status: isComplete ? "completed" : "in_progress",
      answers,
      contradictions: score.contradictions,
      protective_signals: score.protectiveSignals,
      component_score: score.componentScore,
      evidence_completeness: score.evidenceCompleteness,
      summary: isComplete ? score.summary : null,
      version: PROFILE_CHECK_VERSION,
      completed_at: isComplete ? now : null,
      updated_at: now,
    },
    { onConflict: "case_id" },
  );

  if (error) {
    return {
      status: "error",
      message:
        "The profile check could not be saved. Make sure the Build 07 migration has been applied, then try again.",
    };
  }

  if (isComplete) {
    await admin
      .from("cases")
      .update({
        completion_percent: Math.max(caseRecord.completion_percent, 50),
        updated_at: now,
      })
      .eq("id", caseRecord.id)
      .eq("auth_user_id", user.id);
  }

  revalidatePath(`/cases/${caseRecord.id}`);
  revalidatePath(`/cases/${caseRecord.id}/profile`);
  revalidatePath("/dashboard");

  redirect(
    `/cases/${caseRecord.id}/profile?message=${queryMessage(
      isComplete
        ? "Profile consistency check completed."
        : "Profile check progress saved privately.",
    )}`,
  );
}
