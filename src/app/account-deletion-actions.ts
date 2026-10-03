"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/user";
import { CANCELLABLE_SUBSCRIPTION_STATUSES } from "@/lib/account-deletion/constants";
import { processAccountDeletion } from "@/lib/account-deletion/service";
import {
  createDeletionStatusToken,
  hashAccountEmail,
  hashDeletionStatusToken,
} from "@/lib/account-deletion/tokens";
import type { AccountDeletionActionState } from "@/lib/account-deletion/types";
import { accountDeletionSchema } from "@/lib/account-deletion/validation";
import { getStripeClient } from "@/lib/payments/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function value(formData: FormData, key: string): string {
  const entry = formData.get(key);
  return typeof entry === "string" ? entry : "";
}

function firstFieldErrors(error: import("zod").ZodError) {
  return error.flatten().fieldErrors;
}

export async function deleteAccountAction(
  _previousState: AccountDeletionActionState,
  formData: FormData,
): Promise<AccountDeletionActionState> {
  const parsed = accountDeletionSchema.safeParse({
    currentPassword: value(formData, "currentPassword"),
    confirmation: value(formData, "confirmation"),
    consequencesAcknowledged: value(formData, "consequencesAcknowledged"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Correct the highlighted fields before deleting the account.",
      fieldErrors: firstFieldErrors(parsed.error),
    };
  }

  const user = await requireUser();
  if (!user.email) {
    return {
      status: "error",
      message: "This account cannot be reauthenticated by email and password.",
    };
  }

  const supabase = await createClient();
  const reauthentication = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });
  if (reauthentication.error) {
    return {
      status: "error",
      message: "The current password was not accepted.",
      fieldErrors: { currentPassword: ["Enter the current account password."] },
    };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("user_profiles")
    .select("id,account_status")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!profile || profile.account_status !== "active") {
    await supabase.auth.signOut();
    return {
      status: "error",
      message:
        "This account is not in an active state and cannot be deleted here.",
    };
  }

  const statusToken = createDeletionStatusToken();
  const { data: request, error: requestError } = await admin
    .from("account_deletion_requests")
    .insert({
      auth_user_id: user.id,
      profile_id: profile.id,
      email_hash: hashAccountEmail(user.email),
      status_token_hash: hashDeletionStatusToken(statusToken),
      status: "queued",
      purge_after: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (requestError || !request) {
    return {
      status: "error",
      message: "The deletion request could not be queued. No data was deleted.",
    };
  }

  await admin.from("audit_events").insert({
    actor_user_id: user.id,
    target_user_id: user.id,
    event_type: "account_deletion_requested",
    metadata: { deletion_request_id: request.id },
  });

  try {
    await processAccountDeletion({
      markProcessing: async () => {
        const now = new Date().toISOString();
        const { error } = await admin
          .from("account_deletion_requests")
          .update({ status: "processing", processing_started_at: now })
          .eq("id", request.id);
        if (error) throw new Error("Could not start the deletion purge.");

        const profileUpdate = await admin
          .from("user_profiles")
          .update({ account_status: "deletion_pending" })
          .eq("auth_user_id", user.id);
        if (profileUpdate.error) {
          throw new Error("Could not lock the account for deletion.");
        }
      },
      cancelMemberships: async () => {
        const { data: subscriptions, error } = await admin
          .from("subscriptions")
          .select("provider_subscription_id,status")
          .eq("user_id", user.id)
          .in("status", [...CANCELLABLE_SUBSCRIPTION_STATUSES]);
        if (error) throw new Error("Could not inspect active memberships.");
        if (!subscriptions?.length) return 0;

        const stripe = getStripeClient();
        let count = 0;
        for (const subscription of subscriptions) {
          await stripe.subscriptions.cancel(
            subscription.provider_subscription_id,
          );
          count += 1;
        }
        return count;
      },
      revokeEntitlements: async () => {
        const { error } = await admin
          .from("entitlements")
          .update({ status: "revoked", updated_at: new Date().toISOString() })
          .eq("user_id", user.id)
          .eq("status", "active");
        if (error) throw new Error("Could not revoke account access.");
      },
      deleteAuthenticationUser: async () => {
        const { error } = await admin.auth.admin.deleteUser(user.id);
        if (error) throw new Error("Could not remove the authentication user.");
      },
      markCompleted: async (membershipCancellationCount) => {
        const now = new Date().toISOString();
        const { error } = await admin
          .from("account_deletion_requests")
          .update({
            status: "completed",
            completed_at: now,
            membership_cancellation_count: membershipCancellationCount,
            failure_code: null,
          })
          .eq("id", request.id);
        if (error) throw new Error("Could not finalize deletion status.");

        await admin.from("audit_events").insert({
          actor_user_id: null,
          target_user_id: null,
          event_type: "account_deletion_completed",
          metadata: {
            deletion_request_id: request.id,
            membership_cancellation_count: membershipCancellationCount,
          },
        });
      },
      markFailed: async (failureCode) => {
        const now = new Date().toISOString();
        await admin
          .from("account_deletion_requests")
          .update({
            status: "failed",
            failed_at: now,
            failure_code: failureCode,
          })
          .eq("id", request.id);
        await admin
          .from("user_profiles")
          .update({ account_status: "active" })
          .eq("auth_user_id", user.id);
        await admin.from("audit_events").insert({
          actor_user_id: user.id,
          target_user_id: user.id,
          event_type: "account_deletion_failed",
          metadata: {
            deletion_request_id: request.id,
            failure_code: failureCode,
          },
        });
      },
    });
  } catch {
    return {
      status: "error",
      message:
        "The deletion could not be completed safely. Your request was recorded without exposing private details. Try again or contact support.",
    };
  }

  await supabase.auth.signOut();
  redirect(`/account-deletion-status?token=${encodeURIComponent(statusToken)}`);
}
