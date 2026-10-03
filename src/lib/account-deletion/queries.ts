import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

import { hashDeletionStatusToken } from "./tokens";
import type { AccountDeletionReceipt } from "./types";

export async function getAccountDeletionReceipt(
  token: string,
): Promise<AccountDeletionReceipt | null> {
  if (token.length < 32 || token.length > 128) return null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("account_deletion_requests")
    .select(
      "status,requested_at,completed_at,failed_at,membership_cancellation_count",
    )
    .eq("status_token_hash", hashDeletionStatusToken(token))
    .maybeSingle();

  if (error || !data) return null;

  return {
    status: data.status,
    requestedAt: data.requested_at,
    completedAt: data.completed_at,
    failedAt: data.failed_at,
    membershipCancellationCount: data.membership_cancellation_count ?? 0,
  } as AccountDeletionReceipt;
}
