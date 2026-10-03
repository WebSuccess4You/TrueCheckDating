import { describe, expect, it } from "vitest";

import { safeNextPath } from "./redirects";

describe("safeNextPath", () => {
  it("keeps an internal route", () => {
    expect(safeNextPath("/account?tab=privacy")).toBe("/account?tab=privacy");
  });

  it("rejects protocol-relative and external destinations", () => {
    expect(safeNextPath("//attacker.example/path")).toBe("/dashboard");
    expect(safeNextPath("https://attacker.example/path")).toBe("/dashboard");
  });

  it("uses the dashboard when no destination is supplied", () => {
    expect(safeNextPath(undefined)).toBe("/dashboard");
  });
});
