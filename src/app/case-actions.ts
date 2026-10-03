"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/user";
import type { CaseActionState } from "@/lib/cases/types";
import {
  caseStatusActionSchema,
  createCaseSchema,
  deleteCaseSchema,
  firstFieldErrors,
  updateCaseSchema,
} from "@/lib/cases/validation";
import { createClient } from "@/lib/supabase/server";

function value(formData: FormData, key: string): string {
  const item = formData.get(key);
  return typeof item === "string" ? item : "";
}

function queryMessage(message: string): string {
  return encodeURIComponent(message);
}

const genericSaveError: CaseActionState = {
  status: "error",
  message: "The case could not be saved. Please try again.",
};

export async function createCaseAction(
  _previousState: CaseActionState,
  formData: FormData,
): Promise<CaseActionState> {
  const parsed = createCaseSchema.safeParse({
    privateNickname: value(formData, "privateNickname"),
    communicationPlatform: value(formData, "communicationPlatform"),
    claimedNameOrAlias: value(formData, "claimedNameOrAlias"),
    claimedLocation: value(formData, "claimedLocation"),
    communicationStartedOn: value(formData, "communicationStartedOn"),
    lawfulUseAcknowledged: value(formData, "lawfulUseAcknowledged"),
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

  const { data: profileData, error: profileError } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  const profile = profileData as { id: string } | null;
  if (profileError || !profile) {
    return {
      status: "error",
      message:
        "Your account profile is not ready. Apply the Build 03 and Build 04 database migrations, then try again.",
    };
  }

  const { data, error } = await supabase
    .from("cases")
    .insert({
      owner_profile_id: profile.id,
      auth_user_id: user.id,
      private_nickname: parsed.data.privateNickname,
      communication_platform: parsed.data.communicationPlatform ?? null,
      claimed_name_or_alias: parsed.data.claimedNameOrAlias ?? null,
      claimed_location: parsed.data.claimedLocation ?? null,
      communication_started_on: parsed.data.communicationStartedOn ?? null,
      lawful_use_acknowledged_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  const createdCase = data as { id: string } | null;
  if (error || !createdCase) return genericSaveError;

  revalidatePath("/dashboard");
  redirect(
    `/cases/${createdCase.id}?message=${queryMessage("Private case created.")}`,
  );
}

export async function updateCaseAction(
  _previousState: CaseActionState,
  formData: FormData,
): Promise<CaseActionState> {
  const parsed = updateCaseSchema.safeParse({
    caseId: value(formData, "caseId"),
    privateNickname: value(formData, "privateNickname"),
    communicationPlatform: value(formData, "communicationPlatform"),
    claimedNameOrAlias: value(formData, "claimedNameOrAlias"),
    claimedLocation: value(formData, "claimedLocation"),
    communicationStartedOn: value(formData, "communicationStartedOn"),
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
  const { data, error } = await supabase
    .from("cases")
    .update({
      private_nickname: parsed.data.privateNickname,
      communication_platform: parsed.data.communicationPlatform ?? null,
      claimed_name_or_alias: parsed.data.claimedNameOrAlias ?? null,
      claimed_location: parsed.data.claimedLocation ?? null,
      communication_started_on: parsed.data.communicationStartedOn ?? null,
    })
    .eq("id", parsed.data.caseId)
    .eq("auth_user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) return genericSaveError;
  if (!data) {
    return {
      status: "error",
      message: "The case was not found or does not belong to this account.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/cases/${parsed.data.caseId}`);
  redirect(
    `/cases/${parsed.data.caseId}?message=${queryMessage("Case details updated.")}`,
  );
}

export async function setCaseStatusAction(formData: FormData): Promise<void> {
  const parsed = caseStatusActionSchema.safeParse({
    caseId: value(formData, "caseId"),
    status: value(formData, "status"),
  });

  if (!parsed.success) {
    redirect(
      `/dashboard?error=${queryMessage("The case action was invalid.")}`,
    );
  }

  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cases")
    .update({
      status: parsed.data.status,
      archived_at:
        parsed.data.status === "archived" ? new Date().toISOString() : null,
    })
    .eq("id", parsed.data.caseId)
    .eq("auth_user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    redirect(
      `/dashboard?error=${queryMessage("The case status could not be changed.")}`,
    );
  }

  revalidatePath("/dashboard");
  revalidatePath(`/cases/${parsed.data.caseId}`);
  redirect(
    `/dashboard?message=${queryMessage(
      parsed.data.status === "archived"
        ? "Case archived."
        : "Case returned to active cases.",
    )}`,
  );
}

export async function deleteCaseAction(formData: FormData): Promise<void> {
  const parsed = deleteCaseSchema.safeParse({
    caseId: value(formData, "caseId"),
  });

  if (!parsed.success) {
    redirect(
      `/dashboard?error=${queryMessage("The case identifier was invalid.")}`,
    );
  }

  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("delete_owned_case", {
    target_case_id: parsed.data.caseId,
  });

  if (error || data !== true) {
    redirect(
      `/dashboard?error=${queryMessage(
        "The case was not found, did not belong to this account, or could not be deleted.",
      )}`,
    );
  }

  revalidatePath("/dashboard");
  redirect(`/dashboard?message=${queryMessage("Case permanently deleted.")}`);
}
