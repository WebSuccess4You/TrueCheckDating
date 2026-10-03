import { describe, expect, it } from "vitest";

import {
  createDeletionStatusToken,
  hashAccountEmail,
  hashDeletionStatusToken,
} from "./tokens";

describe("account deletion receipt tokens", () => {
  it("creates unpredictable receipt tokens and stores only deterministic hashes", () => {
    const first = createDeletionStatusToken();
    const second = createDeletionStatusToken();

    expect(first).not.toBe(second);
    expect(first.length).toBeGreaterThanOrEqual(40);
    expect(hashDeletionStatusToken(first)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashDeletionStatusToken(first)).toBe(hashDeletionStatusToken(first));
  });

  it("normalizes email before one-way hashing", () => {
    expect(hashAccountEmail(" USER@Example.com ")).toBe(
      hashAccountEmail("user@example.com"),
    );
    expect(hashAccountEmail("user@example.com")).not.toContain("user");
  });
});
