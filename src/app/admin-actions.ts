"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireStaff } from "@/lib/admin/access";
import {
  accountStatusChangeSchema,
  resolveSystemErrorSchema,
} from "@/lib/admin/validation";
import { createAdminClient } from "@/lib/supabase/admin";

function value(formData: FormData, key: string): string {
  const entry = formData.get(key);
  return typeof entry === "string" ? entry : "";
}

function message(valueToEncode: string): string {
  return encodeURIComponent(valueToEncode);
}

export async function setAccountStatusAction(
  formData: FormData,
): Promise<void> {
  const staff = await requireStaff(["admin"]);
  const parsed = accountStatusChangeSchema.safeParse({
    targetUserId: value(formData, "targetUserId"),
    nextStatus: value(formData, "nextStatus"),
    reasonCode: value(formData, "reasonCode"),
  });

  if (!parsed.success) {
    redirect(
      `/admin/support?error=${message("The account action was invalid.")}`,
    );
  }

  const admin = createAdminClient();
  const { data: changed, error: updateError } = await admin.rpc(
    "change_account_status_audited",
    {
      p_actor_user_id: staff.authUserId,
      p_target_user_id: parsed.data.targetUserId,
      p_next_status: parsed.data.nextStatus,
      p_reason_code: parsed.data.reasonCode,
    },
  );

  if (updateError || changed !== true) {
    redirect(
      `/admin/support?userId=${encodeURIComponent(parsed.data.targetUserId)}&error=${message(
        "The account status could not be changed or was already set.",
      )}`,
    );
  }

  revalidatePath("/admin");
  revalidatePath("/admin/support");
  redirect(
    `/admin/support?userId=${encodeURIComponent(parsed.data.targetUserId)}&message=${message(
      `Account status changed to ${parsed.data.nextStatus}.`,
    )}`,
  );
}

export async function resolveSystemErrorAction(
  formData: FormData,
): Promise<void> {
  const staff = await requireStaff(["admin"]);
  const parsed = resolveSystemErrorSchema.safeParse({
    errorId: value(formData, "errorId"),
  });

  if (!parsed.success) {
    redirect(
      `/admin/failures?error=${message("The system-error action was invalid.")}`,
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("resolve_system_error_audited", {
    p_actor_user_id: staff.authUserId,
    p_error_id: parsed.data.errorId,
  });

  if (error || data !== true) {
    redirect(
      `/admin/failures?error=${message("The error was already resolved or could not be updated.")}`,
    );
  }

  revalidatePath("/admin");
  revalidatePath("/admin/failures");
  redirect(
    `/admin/failures?message=${message("System error marked resolved.")}`,
  );
}
