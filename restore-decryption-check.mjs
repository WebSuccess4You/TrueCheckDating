import { createDecipheriv, createHmac, timingSafeEqual } from "node:crypto";

// Read-only verification of the specific restored project; never logs content or keys.
async function main() {
  const url = process.env.RESTORE_TEST_SUPABASE_URL;
  const token = process.env.RESTORE_TEST_SERVICE_ROLE_KEY;
  const encoded = process.env.CHAT_CONTENT_ENCRYPTION_KEY;
  if (url !== "https://iuwqyzlidluuygbmhyuw.supabase.co")
    throw new Error("Target must be TestProject2.");
  if (!token || token.includes(" ") || token.includes("PASTE_"))
    throw new Error(
      "Restore-test service role key is missing or still a placeholder.",
    );
  const key = Buffer.from(encoded || "", "base64");
  if (key.length !== 32)
    throw new Error("Original chat encryption key must decode to 32 bytes.");
  const endpoint = new URL("/rest/v1/chat_submissions", url);
  endpoint.searchParams.set(
    "select",
    "content_ciphertext,content_iv,content_hash,content_character_count,encryption_version",
  );
  endpoint.searchParams.set(
    "case_id",
    "eq.be198723-bdc4-4b93-991f-889fd0f1f25a",
  );
  const response = await fetch(endpoint, {
    method: "GET",
    headers: { apikey: token, Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok)
    throw new Error(`Restored database read failed (HTTP ${response.status}).`);
  const rows = await response.json();
  if (!Array.isArray(rows) || rows.length !== 1)
    throw new Error("Expected exactly one restored submission.");
  const row = rows[0];
  if (row.encryption_version !== "aes-256-gcm-v1")
    throw new Error("Unexpected encryption version.");
  const packed = Buffer.from(row.content_ciphertext, "base64");
  const iv = Buffer.from(row.content_iv, "base64");
  if (iv.length !== 12 || packed.length <= 16)
    throw new Error("Malformed encrypted content.");
  const decipher = createDecipheriv("aes-256-gcm", key, iv, {
    authTagLength: 16,
  });
  decipher.setAuthTag(packed.subarray(-16));
  let plaintext;
  try {
    plaintext = Buffer.concat([
      decipher.update(packed.subarray(0, -16)),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw new Error(
      "Decryption failed: verify the original chat encryption key.",
    );
  }
  const calculated = createHmac("sha256", key)
    .update(plaintext, "utf8")
    .digest();
  const stored = Buffer.from(row.content_hash, "hex");
  if (
    stored.length !== calculated.length ||
    !timingSafeEqual(stored, calculated)
  )
    throw new Error("Content integrity check failed.");
  if (plaintext.length !== row.content_character_count)
    throw new Error("Character count check failed.");
  console.log(
    `Restored chat decryption: PASS; submissions=1, characters=${plaintext.length}, authentication=verified, content hash=verified`,
  );
  console.log(
    "Read-only test complete. No conversation text sent to OpenAI; no database records changed.",
  );
}
main().catch((error) => {
  const safe = error instanceof Error ? error.message : "Verification failed.";
  console.error(
    safe === "fetch failed"
      ? "Database connection failed. Check connectivity and TestProject2 availability."
      : safe,
  );
  process.exitCode = 1;
});
