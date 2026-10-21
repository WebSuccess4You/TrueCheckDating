import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/202610120003_build17_atomic_membership_analyses.sql",
  ),
  "utf8",
);
const action = readFileSync(
  join(process.cwd(), "src/app/analysis-actions.ts"),
  "utf8",
);
describe("Build 17 monthly analysis reservations", () => {
  it("reserves monthly analysis capacity without consuming report capacity", () => {
    expect(migration).toContain("analysis_reserved = analysis_reserved + 1");
    expect(migration).toContain(
      "v_usage.analysis_count + v_usage.analysis_reserved >= v_usage.analysis_limit",
    );
    expect(migration).not.toMatch(/\breport_count\s*=/);
  });

  it("consumes successful analyses and releases unsuccessful reservations", () => {
    expect(migration).toContain("analysis_reserved = analysis_reserved - 1");
    expect(migration).toContain(
      "when p_final_status = 'completed' then 1 else 0",
    );
    expect(migration).toContain(
      "when p_final_status = 'completed' then 'consumed'",
    );
    expect(migration).toContain("else 'released'");
    expect(migration).toContain(
      "if v_reservation.id is not null and v_reservation.status <> 'reserved' then",
    );
  });

  it("preserves hourly limits before starting an OpenAI request", () => {
    expect(migration).toContain("if v_count >= p_hourly_limit then");
    expect(action.indexOf('"start_chat_analysis_with_limit"')).toBeLessThan(
      action.indexOf("runOpenAIChatAnalysis({"),
    );
  });
});
