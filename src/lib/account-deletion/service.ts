export type AccountDeletionDependencies = {
  markProcessing: () => Promise<void>;
  cancelMemberships: () => Promise<number>;
  revokeEntitlements: () => Promise<void>;
  deleteAuthenticationUser: () => Promise<void>;
  markCompleted: (membershipCancellationCount: number) => Promise<void>;
  markFailed: (failureCode: string) => Promise<void>;
};

export async function processAccountDeletion(
  dependencies: AccountDeletionDependencies,
): Promise<number> {
  await dependencies.markProcessing();

  try {
    const cancellationCount = await dependencies.cancelMemberships();
    await dependencies.revokeEntitlements();
    await dependencies.deleteAuthenticationUser();
    await dependencies.markCompleted(cancellationCount);
    return cancellationCount;
  } catch (error) {
    const failureCode =
      error instanceof Error && error.name === "StripeError"
        ? "membership_cancellation_failed"
        : "account_purge_failed";
    await dependencies.markFailed(failureCode);
    throw error;
  }
}
