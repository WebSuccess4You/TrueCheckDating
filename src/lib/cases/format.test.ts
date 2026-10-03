import { describe, expect, it } from "vitest";

import { formatCaseDate, readableCaseStatus } from "./format";

describe("case formatting", () => {
  it("formats a calendar date without shifting the day", () => {
    expect(formatCaseDate("2026-06-17")).toContain("Jun");
    expect(formatCaseDate("2026-06-17")).toContain("17");
  });

  it("handles missing values", () => {
    expect(formatCaseDate(null)).toBe("Not provided");
  });

  it("uses readable status labels", () => {
    expect(readableCaseStatus("active")).toBe("Active");
    expect(readableCaseStatus("archived")).toBe("Archived");
  });
});
