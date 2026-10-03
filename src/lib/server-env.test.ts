import { describe, expect, it, vi } from "vitest";

import { parseServerEnvironment } from "./server-env";

vi.mock("server-only", () => ({}));

describe("server environment", () => {
  it("uses safe configurable defaults for Build 06", () => {
    const parsed = parseServerEnvironment({});
    expect(parsed.OPENAI_CHAT_MODEL).toBe("gpt-5.4-mini");
    expect(parsed.OPENAI_CHAT_TIMEOUT_MS).toBe(45_000);
    expect(parsed.OPENAI_CHAT_MAX_OUTPUT_TOKENS).toBe(2_500);
    expect(parsed.OPENAI_CHAT_MAX_REQUESTS_PER_HOUR).toBe(5);
  });

  it("parses positive integer overrides", () => {
    const parsed = parseServerEnvironment({
      OPENAI_CHAT_TIMEOUT_MS: "60000",
      OPENAI_CHAT_MAX_OUTPUT_TOKENS: "1800",
      OPENAI_CHAT_MAX_REQUESTS_PER_HOUR: "3",
    });
    expect(parsed.OPENAI_CHAT_TIMEOUT_MS).toBe(60_000);
    expect(parsed.OPENAI_CHAT_MAX_OUTPUT_TOKENS).toBe(1_800);
    expect(parsed.OPENAI_CHAT_MAX_REQUESTS_PER_HOUR).toBe(3);
  });

  it("rejects invalid non-positive limits", () => {
    expect(() =>
      parseServerEnvironment({ OPENAI_CHAT_MAX_REQUESTS_PER_HOUR: "0" }),
    ).toThrow();
  });
});
