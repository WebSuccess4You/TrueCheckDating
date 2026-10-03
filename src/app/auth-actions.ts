"use server";

import { redirect } from "next/navigation";

import { isSupabaseConfigured, publicEnvironment } from "@/lib/env";
import { CURRENT_PRIVACY_VERSION, CURRENT_TERMS_VERSION } from "@/lib/legal";
import { safeNextPath } from "@/lib/auth/redirects";
import type { AuthActionState } from "@/lib/auth/types";
import {
  firstFieldErrors,
  loginSchema,
  passwordResetRequestSchema,
  signupSchema,
  updatePasswordSchema,
} from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/server";

const notConfigured: AuthActionState = {
  status: "error",
  message:
    "Authentication is ready in the code but Supabase has not been connected yet. Follow the Build 03 setup steps in README.md.",
};

function value(formData: FormData, key: string): string {
  const item = formData.get(key);
  return typeof item === "string" ? item : "";
}

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: value(formData, "email"),
    password: value(formData, "password"),
    next: value(formData, "next"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Correct the highlighted fields and try again.",
      fieldErrors: firstFieldErrors(parsed.error),
    };
  }

  if (!isSupabaseConfigured()) return notConfigured;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    return {
      status: "error",
      message: "The email or password was not recognized.",
    };
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("account_status")
    .eq("auth_user_id", data.user.id)
    .maybeSingle();

  if (profile && profile.account_status !== "active") {
    await supabase.auth.signOut();
    return {
      status: "error",
      message:
        "This account is unavailable. Contact support if this is unexpected.",
    };
  }

  redirect(safeNextPath(parsed.data.next));
}

export async function signupAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signupSchema.safeParse({
    email: value(formData, "email"),
    password: value(formData, "password"),
    confirmPassword: value(formData, "confirmPassword"),
    adultConfirmed: value(formData, "adultConfirmed"),
    termsAccepted: value(formData, "termsAccepted"),
    privacyAccepted: value(formData, "privacyAccepted"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Correct the highlighted fields and try again.",
      fieldErrors: firstFieldErrors(parsed.error),
    };
  }

  if (!isSupabaseConfigured()) return notConfigured;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${publicEnvironment.NEXT_PUBLIC_APP_URL}/auth/callback?next=/dashboard`,
      data: {
        adult_confirmed: true,
        adult_confirmed_at: new Date().toISOString(),
        terms_accepted: true,
        terms_version: CURRENT_TERMS_VERSION,
        privacy_accepted: true,
        privacy_version: CURRENT_PRIVACY_VERSION,
      },
    },
  });

  if (error) {
    return {
      status: "error",
      message:
        "We could not create the account. Check the entries and try again.",
    };
  }

  if (data.session) {
    redirect("/dashboard");
  }

  return {
    status: "success",
    message:
      "Check your email for the confirmation link. For privacy, this message is shown even when an address is already registered.",
  };
}

export async function requestPasswordResetAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = passwordResetRequestSchema.safeParse({
    email: value(formData, "email"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Enter a valid email address.",
      fieldErrors: firstFieldErrors(parsed.error),
    };
  }

  if (!isSupabaseConfigured()) return notConfigured;

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${publicEnvironment.NEXT_PUBLIC_APP_URL}/auth/callback?next=/reset-password`,
  });

  return {
    status: "success",
    message:
      "If an account exists for that address, a password-reset link will arrive by email.",
  };
}

export async function updatePasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = updatePasswordSchema.safeParse({
    password: value(formData, "password"),
    confirmPassword: value(formData, "confirmPassword"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Correct the highlighted fields and try again.",
      fieldErrors: firstFieldErrors(parsed.error),
    };
  }

  if (!isSupabaseConfigured()) return notConfigured;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: "error",
      message: "The reset session expired. Request a new password-reset link.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return {
      status: "error",
      message: "The password could not be updated. Request a new reset link.",
    };
  }

  redirect("/account?message=Password%20updated%20successfully.");
}

export async function logoutAction(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/login?message=You%20have%20been%20logged%20out.");
}
