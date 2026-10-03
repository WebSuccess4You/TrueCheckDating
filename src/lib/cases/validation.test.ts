import { describe, expect, it } from "vitest";

import {
  caseDetailsSchema,
  createCaseSchema,
  deleteCaseSchema,
  updateCaseSchema,
} from "./validation";

describe("case validation", () => {
  it("accepts and trims a valid case", () => {
    const result = createCaseSchema.parse({
      privateNickname: "  Summer contact  ",
      communicationPlatform: "  Facebook Dating  ",
      claimedNameOrAlias: "  Alex  ",
      claimedLocation: "  Madrid, Spain  ",
      communicationStartedOn: "2026-01-10",
      lawfulUseAcknowledged: "on",
    });

    expect(result.privateNickname).toBe("Summer contact");
    expect(result.communicationPlatform).toBe("Facebook Dating");
  });

  it("converts empty optional values to undefined", () => {
    const result = caseDetailsSchema.parse({
      privateNickname: "Private case",
      communicationPlatform: "",
      claimedNameOrAlias: "",
      claimedLocation: "",
      communicationStartedOn: "",
    });

    expect(result.communicationPlatform).toBeUndefined();
    expect(result.communicationStartedOn).toBeUndefined();
  });

  it("requires the lawful-use acknowledgement", () => {
    const result = createCaseSchema.safeParse({
      privateNickname: "Private case",
      communicationPlatform: "",
      claimedNameOrAlias: "",
      claimedLocation: "",
      communicationStartedOn: "",
      lawfulUseAcknowledged: "",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a future communication date", () => {
    const result = caseDetailsSchema.safeParse({
      privateNickname: "Private case",
      communicationPlatform: "",
      claimedNameOrAlias: "",
      claimedLocation: "",
      communicationStartedOn: "2999-01-01",
    });

    expect(result.success).toBe(false);
  });

  it("rejects impossible calendar dates before database storage", () => {
    for (const date of ["2026-02-30", "2025-02-29", "2026-13-01"]) {
      expect(
        caseDetailsSchema.safeParse({
          privateNickname: "Private case",
          communicationPlatform: "",
          claimedNameOrAlias: "",
          claimedLocation: "",
          communicationStartedOn: date,
        }).success,
        date,
      ).toBe(false);
    }
    expect(
      caseDetailsSchema.safeParse({
        privateNickname: "Private case",
        communicationPlatform: "",
        claimedNameOrAlias: "",
        claimedLocation: "",
        communicationStartedOn: "2024-02-29",
      }).success,
    ).toBe(true);
  });

  it("requires valid UUIDs for update and delete", () => {
    expect(
      updateCaseSchema.safeParse({
        caseId: "not-a-uuid",
        privateNickname: "Private case",
        communicationPlatform: "",
        claimedNameOrAlias: "",
        claimedLocation: "",
        communicationStartedOn: "",
      }).success,
    ).toBe(false);

    expect(deleteCaseSchema.safeParse({ caseId: "not-a-uuid" }).success).toBe(
      false,
    );
  });
});
