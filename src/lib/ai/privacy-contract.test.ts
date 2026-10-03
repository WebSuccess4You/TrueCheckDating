import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const actionSource = readFileSync(
  join(process.cwd(), "src/app/analysis-actions.ts"),
  "utf8",
);
const providerSource = readFileSync(
  join(process.cwd(), "src/lib/ai/openai.ts"),
  "utf8",
);
const adminSource = readFileSync(
  join(process.cwd(), "src/lib/supabase/admin.ts"),
  "utf8",
);

describe("Build 06 privacy and server-boundary contract", () => {
  it("never logs the transcript or provider request", () => {
    expect(actionSource).not.toMatch(/console\.(log|info|debug|warn|error)/);
    expect(providerSource).not.toMatch(/console\.(log|info|debug|warn|error)/);
  });

  it("records only sanitized failure categories for invalid output", () => {
    expect(actionSource).toContain('"invalid_output_evidence"');
    expect(providerSource).toContain('"invalid_output_structure"');
    expect(actionSource).toContain("providerMessage(providerError.code)");
    expect(actionSource).toContain("providerError.ownerVisibleEvidence");
    expect(actionSource).not.toContain(
      "sanitized_message: providerError.message",
    );
  });

  it("decrypts only on the server and sends through the server-only provider module", () => {
    expect(actionSource).toContain("decryptChatContent(");
    expect(providerSource).toContain('import "server-only"');
    expect(providerSource).toContain("client.responses.parse");
  });

  it("asks OpenAI not to store the response", () => {
    expect(providerSource).toContain("store: false");
  });

  it("uses a server-only Supabase service role for protected analysis writes", () => {
    expect(adminSource).toContain('import "server-only"');
    expect(adminSource).toContain("serviceRoleKey");
    expect(actionSource).toContain("createAdminClient()");
  });

  it("does not expose secret keys through NEXT_PUBLIC names", () => {
    expect(actionSource).not.toContain("NEXT_PUBLIC_OPENAI");
    expect(providerSource).not.toContain("NEXT_PUBLIC_OPENAI");
    expect(adminSource).not.toContain("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY");
  });
});
