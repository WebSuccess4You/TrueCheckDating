import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const action = readFileSync(
  join(process.cwd(), "src/app/image-actions.ts"),
  "utf8",
);
const page = readFileSync(
  join(process.cwd(), "src/app/cases/[caseId]/image/page.tsx"),
  "utf8",
);

describe("Build 08 privacy and safety contract", () => {
  it("encrypts private notes before storage", () => {
    expect(action).toContain("encryptChatContent");
    expect(action).toContain("notes_ciphertext");
    expect(action).not.toContain("console.log");
  });

  it("includes explicit anti-harassment and not-proof guidance", () => {
    expect(page).toContain("Do not contact or");
    expect(page).toContain("not proof");
  });
});
