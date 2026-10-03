import { describe, expect, it } from "vitest";

import { parsePublicEnvironment } from "./env";

describe("parsePublicEnvironment", () => {
  it("uses safe local defaults when public values are absent", () => {
    expect(parsePublicEnvironment({})).toEqual({
      NEXT_PUBLIC_APP_NAME: "TrueCheckDating.com",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    });
  });

  it("rejects an invalid public application URL", () => {
    expect(() =>
      parsePublicEnvironment({ NEXT_PUBLIC_APP_URL: "not-a-url" }),
    ).toThrow();
  });
});
