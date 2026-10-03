import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
} from "node:crypto";

import { CHAT_ENCRYPTION_VERSION } from "./constants";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

export type EncryptedChatContent = {
  ciphertext: string;
  iv: string;
  hash: string;
  encryptionVersion: typeof CHAT_ENCRYPTION_VERSION;
};

export function parseChatEncryptionKey(encodedKey: string): Buffer {
  let key: Buffer;
  try {
    key = Buffer.from(encodedKey, "base64");
  } catch {
    throw new Error("CHAT_CONTENT_ENCRYPTION_KEY must be valid base64.");
  }

  if (key.length !== 32) {
    throw new Error(
      "CHAT_CONTENT_ENCRYPTION_KEY must decode to exactly 32 bytes.",
    );
  }

  return key;
}

export function encryptChatContent(
  plaintext: string,
  encodedKey: string,
): EncryptedChatContent {
  const key = parseChatEncryptionKey(encodedKey);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  const packed = Buffer.concat([encrypted, authTag]);

  return {
    ciphertext: packed.toString("base64"),
    iv: iv.toString("base64"),
    hash: createHmac("sha256", key).update(plaintext, "utf8").digest("hex"),
    encryptionVersion: CHAT_ENCRYPTION_VERSION,
  };
}

export function decryptChatContent(
  ciphertext: string,
  ivValue: string,
  encodedKey: string,
): string {
  const key = parseChatEncryptionKey(encodedKey);
  const iv = Buffer.from(ivValue, "base64");
  const packed = Buffer.from(ciphertext, "base64");

  if (iv.length !== IV_LENGTH || packed.length <= AUTH_TAG_LENGTH) {
    throw new Error("The encrypted chat content is malformed.");
  }

  const encrypted = packed.subarray(0, packed.length - AUTH_TAG_LENGTH);
  const authTag = packed.subarray(packed.length - AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
    "utf8",
  );
}
