import { createHash, randomBytes } from "node:crypto";

import { ACCOUNT_DELETION_STATUS_TOKEN_BYTES } from "./constants";

export function createDeletionStatusToken(): string {
  return randomBytes(ACCOUNT_DELETION_STATUS_TOKEN_BYTES).toString("base64url");
}

export function hashDeletionStatusToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function hashAccountEmail(email: string): string {
  return createHash("sha256")
    .update(email.trim().toLowerCase(), "utf8")
    .digest("hex");
}
