export type UserRole = "user" | "support" | "admin";
export type StaffRole = Exclude<UserRole, "user">;

export type StaffContext = {
  authUserId: string;
  profileId: string;
  email: string | null;
  role: StaffRole;
};

export type AdminMetrics = {
  registeredUsers: number;
  activeUsers: number;
  totalCases: number;
  totalAnalyses: number;
  failedAnalyses: number;
  paidReports: number;
  activeMemberships: number;
  generatedReports: number;
  unresolvedSystemErrors: number;
};

export type FailedAnalysisSummary = {
  id: string;
  requestId: string;
  status: "failed" | "rejected";
  errorCode: string | null;
  modelIdentifier: string;
  promptVersion: string;
  schemaVersion: string;
  createdAt: string;
  completedAt: string | null;
};

export type SystemErrorSummary = {
  id: string;
  requestId: string | null;
  errorClass: string;
  sanitizedMessage: string;
  service: string;
  severity: "low" | "medium" | "high" | "critical";
  retryable: boolean;
  resolvedAt: string | null;
  createdAt: string;
};

export type SupportAccountSummary = {
  authUserId: string;
  profileId: string;
  email: string;
  role: UserRole;
  accountStatus: string;
  createdAt: string;
  updatedAt: string;
  counts: {
    cases: number;
    completedAnalyses: number;
    payments: number;
    activeEntitlements: number;
  };
  latestPaymentStatus: string | null;
  latestSubscriptionStatus: string | null;
  latestSubscriptionPeriodEnd: string | null;
};

export type AuditEventSummary = {
  id: string;
  actorUserId: string | null;
  targetUserId: string | null;
  caseId: string | null;
  eventType: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};
