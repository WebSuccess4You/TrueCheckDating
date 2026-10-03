import { describe, expect, it, vi } from "vitest";

import { processAccountDeletion } from "./service";

describe("processAccountDeletion", () => {
  it("queues the destructive work in the required order", async () => {
    const order: string[] = [];
    const markFailed = vi.fn(async () => undefined);

    const count = await processAccountDeletion({
      markProcessing: async () => void order.push("processing"),
      cancelMemberships: async () => {
        order.push("cancel");
        return 2;
      },
      revokeEntitlements: async () => void order.push("revoke"),
      deleteAuthenticationUser: async () => void order.push("delete-user"),
      markCompleted: async (cancellationCount) =>
        void order.push(`completed-${cancellationCount}`),
      markFailed,
    });

    expect(count).toBe(2);
    expect(order).toEqual([
      "processing",
      "cancel",
      "revoke",
      "delete-user",
      "completed-2",
    ]);
    expect(markFailed).not.toHaveBeenCalled();
  });

  it("records a sanitized failure when purge work fails", async () => {
    const markFailed = vi.fn(async () => undefined);

    await expect(
      processAccountDeletion({
        markProcessing: async () => undefined,
        cancelMemberships: async () => 0,
        revokeEntitlements: async () => undefined,
        deleteAuthenticationUser: async () => {
          throw new Error("private provider detail");
        },
        markCompleted: async () => undefined,
        markFailed,
      }),
    ).rejects.toThrow("private provider detail");

    expect(markFailed).toHaveBeenCalledWith("account_purge_failed");
  });
});
