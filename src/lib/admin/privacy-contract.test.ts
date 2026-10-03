import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const queries = readFileSync(
  join(process.cwd(), "src/lib/admin/queries.ts"),
  "utf8",
);
const supportPage = readFileSync(
  join(process.cwd(), "src/app/admin/support/page.tsx"),
  "utf8",
);
const failurePage = readFileSync(
  join(process.cwd(), "src/app/admin/failures/page.tsx"),
  "utf8",
);
const analysisActions = readFileSync(
  join(process.cwd(), "src/app/analysis-actions.ts"),
  "utf8",
);

describe("Build 14 private-content boundary", () => {
  it("does not select encrypted transcripts, notes, or report bodies", () => {
    for (const forbidden of [
      "content_ciphertext",
      "content_iv",
      "notes_ciphertext",
      "notes_encrypted",
      "report_body_json",
      "red_flags,protective_signals",
    ]) {
      expect(queries).not.toContain(forbidden);
    }
  });

  it("states the support and failure-review content boundary", () => {
    expect(supportPage).toContain("Content remains hidden");
    expect(supportPage).toContain("transcripts");
    expect(failurePage).toContain(
      "Conversation text is deliberately unavailable",
    );
  });

  it("records AI failures with sanitized metadata instead of transcript content", () => {
    const systemErrorInsert = analysisActions.slice(
      analysisActions.indexOf('.from("system_errors")'),
      analysisActions.indexOf(
        "revalidatePath",
        analysisActions.indexOf('.from("system_errors")'),
      ),
    );
    expect(systemErrorInsert).toContain("providerMessage(providerError.code)");
    expect(systemErrorInsert).toContain("request_id: requestId");
    expect(systemErrorInsert).not.toContain("transcript");
    expect(systemErrorInsert).not.toContain("userInput");
  });
});
