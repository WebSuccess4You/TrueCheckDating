// Run locally: node --env-file=.env.local tests/manual/chat-rate-limit-concurrency.mjs <disposable-user-id>
// Calls the database reservation function only. No text is decrypted or sent to OpenAI.
import { randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

const userId = process.argv[2];
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const limit = Number(process.env.OPENAI_CHAT_MAX_REQUESTS_PER_HOUR || 5);
if (!userId || !/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(userId)) {
  throw new Error("Supply the disposable account's internal user ID.");
}
if (!url || !key)
  throw new Error("Supabase server credentials are unavailable.");
if (!Number.isInteger(limit) || limit < 1 || limit > 20) {
  throw new Error(
    "Set a whole-number hourly limit between 1 and 20 for this test.",
  );
}

const db = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const created = { caseId: null, submissionIds: [], analysisIds: [] };

function unwrap(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

let failure;
try {
  const profile = unwrap(
    await db
      .from("user_profiles")
      .select("id,role,account_status")
      .eq("auth_user_id", userId)
      .single(),
    "Find disposable account",
  );
  if (profile.role !== "user" || profile.account_status !== "active") {
    throw new Error("The target must be an active disposable user account.");
  }
  const existingCases = unwrap(
    await db.from("cases").select("id").eq("auth_user_id", userId).limit(1),
    "Check existing cases",
  );
  const existingAnalyses = unwrap(
    await db
      .from("chat_analyses")
      .select("id")
      .eq("auth_user_id", userId)
      .limit(1),
    "Check existing analyses",
  );
  if (existingCases.length || existingAnalyses.length) {
    throw new Error(
      "The disposable account has existing case or analysis data.",
    );
  }

  const testCase = unwrap(
    await db
      .from("cases")
      .insert({
        owner_profile_id: profile.id,
        auth_user_id: userId,
        private_nickname: "Build 15 disposable rate limit",
        lawful_use_acknowledged_at: new Date().toISOString(),
      })
      .select("id")
      .single(),
    "Create disposable case",
  );
  created.caseId = testCase.id;

  const requestCount = limit + 7;
  for (let i = 0; i < requestCount; i++) {
    const submission = unwrap(
      await db
        .from("chat_submissions")
        .insert({
          case_id: testCase.id,
          owner_profile_id: profile.id,
          auth_user_id: userId,
          content_ciphertext: "disposable-test-placeholder-ciphertext",
          content_iv: "disposable-iv",
          content_character_count: 80,
          content_hash: "0".repeat(64),
          consent_version: "build15-disposable-test",
          consent_acknowledged_at: new Date().toISOString(),
        })
        .select("id")
        .single(),
      "Create disposable submission",
    );
    created.submissionIds.push(submission.id);
  }

  const responses = await Promise.all(
    created.submissionIds.map((submissionId) =>
      db.rpc("start_chat_analysis_with_limit", {
        p_user_id: userId,
        p_case_id: testCase.id,
        p_submission_id: submissionId,
        p_owner_profile_id: profile.id,
        p_request_id: randomUUID(),
        p_prompt_version: "build15-disposable-test",
        p_model_identifier: "no-openai-request",
        p_schema_version: "1.0",
        p_hourly_limit: limit,
      }),
    ),
  );
  const outcomes = responses.map(
    (response) => unwrap(response, "Rate-limit request")[0],
  );
  const started = outcomes.filter((item) => item?.outcome === "started");
  const limited = outcomes.filter((item) => item?.outcome === "limited");
  created.analysisIds = started.map((item) => item.analysis_id);
  const analyses = unwrap(
    await db.from("chat_analyses").select("id").eq("case_id", testCase.id),
    "Read test analyses",
  );
  const passed =
    started.length === limit &&
    limited.length === 7 &&
    analyses.length === limit &&
    outcomes.every((item) => ["started", "limited"].includes(item?.outcome));
  console.log(
    `Concurrent chat starts: ${passed ? "PASS" : "FAIL"}; started=${started.length}, limited=${limited.length}, records=${analyses.length}, hourly limit=${limit}`,
  );
  if (!passed)
    throw new Error("Concurrent requests exceeded the expected limit.");
} catch (error) {
  failure = error;
  console.error(`TEST FAILED: ${error.message}`);
} finally {
  try {
    if (created.caseId) {
      unwrap(
        await db.from("chat_analyses").delete().eq("case_id", created.caseId),
        "Delete test analyses",
      );
      unwrap(
        await db
          .from("chat_submissions")
          .delete()
          .eq("case_id", created.caseId),
        "Delete test submissions",
      );
      unwrap(
        await db.from("cases").delete().eq("id", created.caseId),
        "Delete test case",
      );
    }
    console.log("Disposable chat analyses, submissions, and case removed.");
  } catch (error) {
    console.error(`CLEANUP FAILED: ${error.message}`);
    console.error(`Test case ID for manual cleanup: ${created.caseId}`);
    failure ||= error;
  }
}
if (failure) process.exitCode = 1;
