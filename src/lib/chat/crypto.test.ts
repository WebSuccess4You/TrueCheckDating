import { randomBytes } from "node:crypto";

import { describe, expect, it } from "vitest";

import { decryptChatContent, encryptChatContent } from "./crypto";

function key(): string {
  return randomBytes(32).toString("base64");
}

describe("chat content encryption", () => {
  it("round-trips Unicode conversation text", () => {
    const secret = key();
    const plaintext = "Me: Hello.\nContact: Привіт — can we talk tomorrow?";
    const encrypted = encryptChatContent(plaintext, secret);

    expect(encrypted.ciphertext).not.toContain(plaintext);
    expect(decryptChatContent(encrypted.ciphertext, encrypted.iv, secret)).toBe(
      plaintext,
    );
    expect(encrypted.hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("uses a fresh IV for equivalent text", () => {
    const secret = key();
    const first = encryptChatContent("same text", secret);
    const second = encryptChatContent("same text", secret);

    expect(first.iv).not.toBe(second.iv);
    expect(first.ciphertext).not.toBe(second.ciphertext);
    expect(first.hash).toBe(second.hash);
  });

  it("rejects a key that is not exactly 32 bytes", () => {
    expect(() => encryptChatContent("text", "dG9vLXNob3J0")).toThrow(
      /32 bytes/,
    );
  });

  it("cannot decrypt with a different key", () => {
    const encrypted = encryptChatContent("private", key());
    expect(() =>
      decryptChatContent(encrypted.ciphertext, encrypted.iv, key()),
    ).toThrow();
  });
});
