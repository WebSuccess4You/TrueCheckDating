"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/user";
import { CHAT_CONSENT_VERSION } from "@/lib/chat/constants";
import { encryptChatContent } from "@/lib/chat/crypto";
import type { ChatSubmissionActionState } from "@/lib/chat/types";
import { chatSubmissionSchema, firstFieldErrors } from "@/lib/chat/validation";
import { requireChatEncryptionKey } from "@/lib/server-env";
import { createClient } from "@/lib/supabase/server";

function value(formData: FormData, key: string): string {
  const item = formData.get(key);
  return typeof item === "string" ? item : "";
}

function queryMessage(message: string): string {
  return encodeURIComponent(message);
}

const genericSaveError: ChatSubmissionActionState = {
  status: "error",
  message: "The conversation could not be saved. Please try again.",
};

export async function createChatSubmissionAction(
  _previousState: ChatSubmissionActionState,
  formData: FormData,
): Promise<ChatSubmissionActionState> {
  const parsed = chatSubmissionSchema.safeParse({
    caseId: value(formData, "caseId"),
    conversationText: value(formData, "conversationText"),
    processingConsentAcknowledged: value(
      formData,
      "processingConsentAcknowledged",
    ),
    sensitiveDataReviewed: value(formData, "sensitiveDataReviewed"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Correct the highlighted fields and try again.",
      fieldErrors: firstFieldErrors(parsed.error),
    };
  }

  const user = await requireUser();
  const supabase = await createClient();

  const { data: caseData, error: caseError } = await supabase
    .from("cases")
    .select("id,owner_profile_id,status")
    .eq("id", parsed.data.caseId)
    .eq("auth_user_id", user.id)
    .maybeSingle();

  const ownedCase = caseData as {
    id: string;
    owner_profile_id: string;
    status: "active" | "archived";
  } | null;

  if (caseError || !ownedCase) {
    return {
      status: "error",
      message: "The case was not found or does not belong to this account.",
    };
  }

  if (ownedCase.status !== "active") {
    return {
      status: "error",
      message: "Restore this archived case before adding conversation text.",
    };
  }

  let encrypted;
  try {
    encrypted = encryptChatContent(
      parsed.data.conversationText,
      requireChatEncryptionKey(),
    );
  } catch {
    return {
      status: "error",
      message:
        "Private chat storage is not configured yet. Add the server-only encryption key described in README.md, then try again.",
    };
  }

  const consentTime = new Date().toISOString();
  const { data, error } = await supabase
    .from("chat_submissions")
    .insert({
      case_id: ownedCase.id,
      owner_profile_id: ownedCase.owner_profile_id,
      auth_user_id: user.id,
      source_type: "pasted_text",
      content_ciphertext: encrypted.ciphertext,
      content_iv: encrypted.iv,
      content_character_count: parsed.data.conversationText.length,
      content_hash: encrypted.hash,
      encryption_version: encrypted.encryptionVersion,
      consent_version: CHAT_CONSENT_VERSION,
      consent_acknowledged_at: consentTime,
    })
    .select("id")
    .single();

  const created = data as { id: string } | null;
  if (error || !created) return genericSaveError;

  revalidatePath(`/cases/${ownedCase.id}`);
  revalidatePath(`/cases/${ownedCase.id}/chat`);
  redirect(
    `/cases/${ownedCase.id}/chat/${created.id}?message=${queryMessage(
      "Conversation saved privately.",
    )}`,
  );
}
