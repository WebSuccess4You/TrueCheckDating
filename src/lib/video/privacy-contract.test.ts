import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const actionSource = readFileSync(
  join(process.cwd(), "src/app/video-actions.ts"),
  "utf8",
);
const pageSource = readFileSync(
  join(process.cwd(), "src/app/cases/[caseId]/video/page.tsx"),
  "utf8",
);

describe("Build 09 privacy contract", () => {
  it("verifies ownership before trusted writes", () => {
    expect(actionSource).toContain("getOwnedCase(user.id, caseId)");
    expect(actionSource).toContain("createAdminClient()");
    expect(actionSource).toContain('.eq("auth_user_id", user.id)');
  });

  it("encrypts private notes before database storage", () => {
    expect(actionSource).toContain("encryptChatContent(notes");
    expect(actionSource).toContain("notes_ciphertext");
    expect(actionSource).not.toContain("notes: notes");
  });

  it("does not add recording capability", () => {
    expect(pageSource).toContain("does not watch, record, identify");
    expect(pageSource).toContain("No secret recording");
    expect(pageSource).not.toContain("MediaRecorder");
    expect(pageSource).not.toContain("getUserMedia");
  });
});
