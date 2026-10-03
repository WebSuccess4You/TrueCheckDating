// Run locally: node --env-file=.env.local tests/manual/report-concurrency.mjs <disposable-user-id>
// Uses a service-role key only in this server-side process. Never print it.
import { createClient } from "@supabase/supabase-js";

const userId = process.argv[2];
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!userId || !/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(userId)) {
  throw new Error("Supply the disposable account's internal user ID.");
}
if (!url || !key)
  throw new Error("Supabase server credentials are unavailable.");

const db = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const created = { cases: [], assessments: [], entitlements: [] };

function unwrap(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

async function fixture(profileId, label, entitlementType = "case_full_report") {
  const caseRow = unwrap(
    await db
      .from("cases")
      .insert({
        owner_profile_id: profileId,
        auth_user_id: userId,
        private_nickname: `Build 15 disposable concurrency ${label}`,
        lawful_use_acknowledged_at: new Date().toISOString(),
      })
      .select("id")
      .single(),
    "Create disposable case",
  );
  created.cases.push(caseRow.id);

  const assessment = unwrap(
    await db
      .from("case_assessments")
      .insert({
        case_id: caseRow.id,
        owner_profile_id: profileId,
        auth_user_id: userId,
        status: "preliminary",
        overall_score: 0,
        concern_level: "Low",
        confidence_score: 0,
        confidence_level: "Low",
        evidence_completeness: 0,
        evidence_completeness_level: "Low",
        available_weight: 0,
        component_scores: {},
        completed_sources: [],
        missing_sources: [],
        source_fingerprints: {},
        scoring_version: "build15-disposable-test",
        limitations: [],
      })
      .select("id")
      .single(),
    "Create disposable preliminary assessment",
  );
  created.assessments.push(assessment.id);
  return { caseId: caseRow.id, assessmentId: assessment.id, entitlementType };
}

async function entitlement(caseId, type) {
  const row = unwrap(
    await db
      .from("entitlements")
      .insert({
        user_id: userId,
        case_id: type === "membership" ? null : caseId,
        entitlement_type: type,
        source_type: "manual",
        usage_limit: 1,
        usage_count: 0,
        status: "active",
        metadata: { purpose: "build15_disposable_concurrency_test" },
      })
      .select("id")
      .single(),
    "Create disposable allowance",
  );
  created.entitlements.push(row.id);
  return row.id;
}

function request(testCase) {
  return db.rpc("create_report_with_allowance", {
    p_user_id: userId,
    p_case_id: testCase.caseId,
    p_assessment_id: testCase.assessmentId,
    p_snapshot: {
      report_schema_version: "1.0",
      report_content_version: "build15-disposable-test",
      component_scores: {},
      report_body: {
        purpose: "Disposable concurrency test; no private case content",
      },
      generated_at: new Date().toISOString(),
    },
  });
}

async function verify(label, requests, cases, entitlementId) {
  const responses = await Promise.all(requests.map(request));
  const outcomes = responses.map(
    (response) => unwrap(response, `${label} request`)[0],
  );
  const createdCount = outcomes.filter(
    (row) => row?.outcome === "created",
  ).length;
  const limitedCount = outcomes.filter(
    (row) => row?.outcome === "limited",
  ).length;
  const reportRows = unwrap(
    await db
      .from("reports")
      .select("id,case_id,report_version_number")
      .in(
        "case_id",
        cases.map((row) => row.caseId),
      ),
    `${label} reports`,
  );
  const usageRows = unwrap(
    await db
      .from("usage_events")
      .select("id")
      .eq("entitlement_id", entitlementId)
      .eq("event_type", "final_report_generated"),
    `${label} usage events`,
  );
  const usage = unwrap(
    await db
      .from("entitlements")
      .select("usage_count")
      .eq("id", entitlementId)
      .single(),
    `${label} allowance`,
  );
  const passed =
    createdCount === 1 &&
    limitedCount === requests.length - 1 &&
    reportRows.length === 1 &&
    usageRows.length === 1 &&
    usage.usage_count === 1 &&
    reportRows[0].report_version_number === 1;
  console.log(
    `${label}: ${passed ? "PASS" : "FAIL"}; created=${createdCount}, limited=${limitedCount}, reports=${reportRows.length}, usage=${usage.usage_count}, events=${usageRows.length}`,
  );
  if (!passed) throw new Error(`${label} did not meet its expected counts.`);
}

async function cleanup() {
  for (const table of ["usage_events", "reports"]) {
    const filter = table === "reports" ? "case_id" : "entitlement_id";
    const ids = table === "reports" ? created.cases : created.entitlements;
    if (ids.length)
      unwrap(
        await db.from(table).delete().in(filter, ids),
        `Delete test ${table}`,
      );
  }
  for (const [table, ids] of [
    ["entitlements", created.entitlements],
    ["case_assessments", created.assessments],
    ["cases", created.cases],
  ]) {
    if (ids.length)
      unwrap(
        await db.from(table).delete().in("id", ids),
        `Delete test ${table}`,
      );
  }
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
  if (existingCases.length) {
    throw new Error(
      "The disposable account already has a case; choose an unused account.",
    );
  }
  const existingEntitlements = unwrap(
    await db
      .from("entitlements")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "active")
      .limit(1),
    "Check existing report access",
  );
  if (existingEntitlements.length) {
    throw new Error(
      "The disposable account already has an active entitlement; choose an unused account.",
    );
  }
  const single = await fixture(profile.id, "one-case");
  const firstAllowance = await entitlement(single.caseId, "case_full_report");
  await verify(
    "Same-case concurrent requests",
    Array(8).fill(single),
    [single],
    firstAllowance,
  );

  const left = await fixture(profile.id, "membership-left");
  const right = await fixture(profile.id, "membership-right");
  const membershipAllowance = await entitlement(null, "membership");
  await verify(
    "Two-case membership requests",
    [left, right],
    [left, right],
    membershipAllowance,
  );
} catch (error) {
  failure = error;
  console.error(`TEST FAILED: ${error.message}`);
} finally {
  try {
    await cleanup();
    console.log(
      "Disposable cases, assessments, entitlements, reports, and usage events removed.",
    );
  } catch (error) {
    console.error(`CLEANUP FAILED: ${error.message}`);
    console.error(
      `Test case IDs for manual cleanup: ${created.cases.join(", ")}`,
    );
    failure ||= error;
  }
}
if (failure) process.exitCode = 1;
