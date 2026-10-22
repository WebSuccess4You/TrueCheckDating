import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  provider: vi.fn(),
  requireUser: vi.fn(),
  ownedCase: vi.fn(),
  ownedSubmission: vi.fn(),
}));

vi.mock("@/lib/auth/user", () => ({
  requireUser: mocks.requireUser,
}));
vi.mock("@/lib/cases/queries", () => ({
  getOwnedCase: mocks.ownedCase,
}));
vi.mock("@/lib/chat/queries", () => ({
  getOwnedChatSubmission: mocks.ownedSubmission,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc: mocks.rpc }),
}));
vi.mock("@/lib/chat/crypto", () => ({
  decryptChatContent: () => "Synthetic conversation",
}));
vi.mock("@/lib/server-env", () => ({
  requireChatEncryptionKey: () => "synthetic-key",
  getOpenAIEnvironment: () => ({
    model: "synthetic-model",
    maxRequestsPerHour: 5,
  }),
}));
vi.mock("@/lib/operations/feature-switches", () => ({
  chatAnalysisEnabled: () => true,
}));
vi.mock("@/lib/operations/alerts.mjs", () => ({
  notifyOperationalAlert: vi.fn(),
}));
vi.mock("@/lib/ai/openai", () => ({
  runOpenAIChatAnalysis: mocks.provider,
  ChatAnalysisProviderError: class extends Error {},
}));
vi.mock("@/lib/ai/evidence", () => ({
  validateEvidenceExcerpts: vi.fn(),
  validateScoreEvidence: vi.fn(),
}));
vi.mock("@/lib/ai/prompt", () => ({
  buildChatAnalyzerUserInput: vi.fn(),
}));
vi.mock("@/lib/ai/format", () => ({
  readableConcernLevel: vi.fn(),
}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

import { analyzeChatSubmissionAction } from "@/app/analysis-actions";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.requireUser.mockResolvedValue({ id: "authenticated-user" });
  mocks.ownedCase.mockResolvedValue({ status: "active" });
  mocks.ownedSubmission.mockResolvedValue({
    owner_profile_id: "owned-profile",
    content_ciphertext: "synthetic",
    content_iv: "synthetic",
  });
});

function runAction() {
  const form = new FormData();
  form.set("caseId", "owned-case");
  form.set("submissionId", "owned-submission");
  form.set("userId", "untrusted-user");
  const previous = {
    status: "idle",
  } as Parameters<typeof analyzeChatSubmissionAction>[0];
  return analyzeChatSubmissionAction(previous, form);
}

describe("analysis action recovery integration", () => {
  it.each([0, 1])(
    "recovers for the authenticated user before starting when recovery returns %i",
    async (recovered) => {
      mocks.rpc
        .mockResolvedValueOnce({ data: recovered, error: null })
        .mockResolvedValueOnce({
          data: [{ outcome: "limited", analysis_id: null }],
          error: null,
        });

      const result = await runAction();

      expect(mocks.rpc).toHaveBeenCalledTimes(2);
      expect(mocks.rpc).toHaveBeenNthCalledWith(
        1,
        "recover_expired_membership_analysis_reservations",
        { p_user_id: "authenticated-user" },
      );
      expect(mocks.rpc).toHaveBeenNthCalledWith(
        2,
        "start_chat_analysis_with_limit",
        expect.objectContaining({
          p_user_id: "authenticated-user",
          p_case_id: "owned-case",
          p_submission_id: "owned-submission",
        }),
      );
      expect(result.status).toBe("error");
      expect(result.message).toContain("limited to 5 analyses per hour");
      expect(mocks.provider).not.toHaveBeenCalled();
    },
  );

  it.each(["returned", "thrown"])(
    "stops before reservation and OpenAI on a %s recovery error",
    async (failure) => {
      if (failure === "returned") {
        mocks.rpc.mockResolvedValueOnce({
          data: null,
          error: { message: "private database detail" },
        });
      } else {
        mocks.rpc.mockRejectedValueOnce(new Error("private connection detail"));
      }

      const result = await runAction();

      expect(mocks.rpc).toHaveBeenCalledTimes(1);
      expect(mocks.rpc).toHaveBeenCalledWith(
        "recover_expired_membership_analysis_reservations",
        { p_user_id: "authenticated-user" },
      );
      expect(result).toEqual({
        status: "error",
        message:
          "The analyzer could not prepare your analysis allowance. Please try again shortly.",
      });
      expect(mocks.provider).not.toHaveBeenCalled();
    },
  );
});
