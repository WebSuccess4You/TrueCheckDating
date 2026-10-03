import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const actionSource = readFileSync(
  join(process.cwd(), "src/app/chat-actions.ts"),
  "utf8",
);
const querySource = readFileSync(
  join(process.cwd(), "src/lib/chat/queries.ts"),
  "utf8",
);

describe("Build 05 privacy contract", () => {
  it("does not log submitted conversation text", () => {
    expect(actionSource).not.toMatch(/console\.(log|info|debug|warn|error)/);
    expect(actionSource).not.toMatch(/JSON\.stringify\(parsed\.data/);
  });

  it("encrypts before inserting and stores only encrypted content fields", () => {
    expect(actionSource).toContain("encryptChatContent(");
    expect(actionSource).toContain("content_ciphertext: encrypted.ciphertext");
    expect(actionSource).not.toContain(
      "content_ciphertext: parsed.data.conversationText",
    );
  });

  it("filters reads by both case and authenticated user", () => {
    expect(querySource).toContain('.eq("case_id", caseId)');
    expect(querySource).toContain('.eq("auth_user_id", authUserId)');
  });
});
