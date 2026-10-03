import { NextResponse } from "next/server";

import { safeNextPath } from "@/lib/auth/redirects";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeNextPath(requestUrl.searchParams.get("next"));

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(
      new URL(
        "/login?message=Authentication%20has%20not%20been%20configured.",
        requestUrl.origin,
      ),
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  return NextResponse.redirect(
    new URL(
      "/login?message=The%20confirmation%20or%20reset%20link%20is%20invalid%20or%20expired.",
      requestUrl.origin,
    ),
  );
}
