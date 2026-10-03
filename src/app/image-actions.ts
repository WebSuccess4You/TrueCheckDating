"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/user";
import { getOwnedCase } from "@/lib/cases/queries";
import { encryptChatContent } from "@/lib/chat/crypto";
import {
  IMAGE_CHECK_VERSION,
  IMAGE_SOURCE_LINK_LIMIT,
} from "@/lib/image/constants";
import { scoreImageCheck } from "@/lib/image/scoring";
import type { ImageCheckActionState } from "@/lib/image/types";
import { firstFieldErrors, imageCheckFormSchema } from "@/lib/image/validation";
import { requireChatEncryptionKey } from "@/lib/server-env";
import { createAdminClient } from "@/lib/supabase/admin";

function value(formData: FormData, key: string): string {
  const item = formData.get(key);
  return typeof item === "string" ? item : "";
}

function queryMessage(message: string): string {
  return encodeURIComponent(message);
}

export async function saveImageCheckAction(
  _previousState: ImageCheckActionState,
  formData: FormData,
): Promise<ImageCheckActionState> {
  const parsed = imageCheckFormSchema.safeParse({
    caseId: value(formData, "caseId"),
    intent: value(formData, "intent"),
    resultCategory:
      value(formData, "intent") === "unavailable"
        ? ""
        : value(formData, "resultCategory"),
    sourceLink1:
      value(formData, "intent") === "unavailable"
        ? ""
        : value(formData, "sourceLink1"),
    sourceLink2:
      value(formData, "intent") === "unavailable"
        ? ""
        : value(formData, "sourceLink2"),
    sourceLink3:
      value(formData, "intent") === "unavailable"
        ? ""
        : value(formData, "sourceLink3"),
    notes:
      value(formData, "intent") === "unavailable"
        ? ""
        : value(formData, "notes"),
    safetyAcknowledged: formData.get("safetyAcknowledged"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message:
        value(formData, "intent") === "complete"
          ? "Choose a result, review any source links, and confirm the safety statement."
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
      message:
        "Restore this archived case before changing the reverse image check.",
    };
  }

  const unavailable = parsed.data.intent === "unavailable";
  const sourceLinks = (
    unavailable
      ? []
      : [
          parsed.data.sourceLink1,
          parsed.data.sourceLink2,
          parsed.data.sourceLink3,
        ]
  )
    .filter((item): item is string => Boolean(item))
    .slice(0, IMAGE_SOURCE_LINK_LIMIT);
  const notes = unavailable ? null : (parsed.data.notes ?? null);
  const resultCategory = unavailable
    ? null
    : (parsed.data.resultCategory ?? null);
  const score = scoreImageCheck(resultCategory, sourceLinks, notes);
  // An inconclusive search supplies no identity signal. Keep it out of the
  // combined score until a substantive finding is recorded.
  const isComplete =
    parsed.data.intent === "complete" && resultCategory !== "unclear";
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
        "Image-check storage is not configured yet. Add the server-only Supabase key described in README.md, then try again.",
    };
  }

  const { error } = await admin.from("image_checks").upsert(
    {
      case_id: caseRecord.id,
      owner_profile_id: caseRecord.owner_profile_id,
      auth_user_id: user.id,
      status: isComplete ? "completed" : "in_progress",
      result_category: resultCategory,
      source_links: sourceLinks,
      notes_ciphertext: encryptedNotes?.ciphertext ?? null,
      notes_iv: encryptedNotes?.iv ?? null,
      notes_hash: encryptedNotes?.hash ?? null,
      encryption_version: encryptedNotes?.encryptionVersion ?? null,
      component_score: score.componentScore,
      evidence_completeness: score.evidenceCompleteness,
      summary: isComplete ? score.summary : null,
      version: IMAGE_CHECK_VERSION,
      safety_acknowledged_at:
        isComplete && parsed.data.safetyAcknowledged ? now : null,
      completed_at: isComplete ? now : null,
      updated_at: now,
    },
    { onConflict: "case_id" },
  );

  if (error) {
    return {
      status: "error",
      message:
        "The reverse image check could not be saved. Make sure the Build 08 migration has been applied, then try again.",
    };
  }

  if (isComplete) {
    await admin
      .from("cases")
      .update({
        completion_percent: Math.max(caseRecord.completion_percent, 75),
        updated_at: now,
      })
      .eq("id", caseRecord.id)
      .eq("auth_user_id", user.id);
  }

  revalidatePath(`/cases/${caseRecord.id}`);
  revalidatePath(`/cases/${caseRecord.id}/image`);
  revalidatePath("/dashboard");

  redirect(
    `/cases/${caseRecord.id}/image?message=${queryMessage(
      isComplete
        ? "Guided reverse image check completed."
        : unavailable
          ? "No image search was performed; the image check is excluded from scoring."
          : resultCategory === "unclear"
            ? "Inconclusive image finding saved; it is excluded from scoring."
            : "Reverse image check progress saved privately.",
    )}`,
  );
}
