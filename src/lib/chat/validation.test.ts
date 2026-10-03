import { describe, expect, it } from "vitest";

import { CHAT_MAX_CHARACTERS, CHAT_MIN_CHARACTERS } from "./constants";
import { chatSubmissionSchema } from "./validation";

const validPayload = {
  caseId: "00000000-0000-4000-8000-000000000001",
  conversationText: "A".repeat(CHAT_MIN_CHARACTERS),
  processingConsentAcknowledged: "on",
  sensitiveDataReviewed: "on",
};

describe("chatSubmissionSchema", () => {
  it("accepts a bounded conversation with both confirmations", () => {
    expect(chatSubmissionSchema.safeParse(validPayload).success).toBe(true);
  });

  it("rejects conversation text that is too short after trimming", () => {
    const result = chatSubmissionSchema.safeParse({
      ...validPayload,
      conversationText: `  ${"A".repeat(CHAT_MIN_CHARACTERS - 1)}  `,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an oversized submission on the server", () => {
    const result = chatSubmissionSchema.safeParse({
      ...validPayload,
      conversationText: "A".repeat(CHAT_MAX_CHARACTERS + 1),
    });
    expect(result.success).toBe(false);
  });

  it("requires both privacy and processing confirmations", () => {
    expect(
      chatSubmissionSchema.safeParse({
        ...validPayload,
        processingConsentAcknowledged: "",
      }).success,
    ).toBe(false);
    expect(
      chatSubmissionSchema.safeParse({
        ...validPayload,
        sensitiveDataReviewed: "",
      }).success,
    ).toBe(false);
  });
});
