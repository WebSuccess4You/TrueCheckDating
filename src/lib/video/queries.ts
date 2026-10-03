import "server-only";

import { decryptChatContent } from "@/lib/chat/crypto";
import { requireChatEncryptionKey } from "@/lib/server-env";
import { createClient } from "@/lib/supabase/server";

import type { VideoCheckRecord } from "./types";

type RawVideoCheckRecord = Omit<VideoCheckRecord, "notes"> & {
  notes_ciphertext: string | null;
  notes_iv: string | null;
};

const videoCheckColumns = [
  "id",
  "case_id",
  "auth_user_id",
  "status",
  "answers",
  "notes_ciphertext",
  "notes_iv",
  "avoidance_patterns",
  "protective_signals",
  "component_score",
  "evidence_completeness",
  "summary",
  "version",
  "safety_acknowledged_at",
  "completed_at",
  "created_at",
  "updated_at",
].join(",");

export async function getOwnedVideoCheck(
  authUserId: string,
  caseId: string,
): Promise<VideoCheckRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("video_checks")
    .select(videoCheckColumns)
    .eq("case_id", caseId)
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (error) {
    throw new Error("The video-call verification check could not be loaded.");
  }

  if (!data) return null;

  const record = data as unknown as RawVideoCheckRecord;
  let notes: string | null = null;
  if (record.notes_ciphertext && record.notes_iv) {
    notes = decryptChatContent(
      record.notes_ciphertext,
      record.notes_iv,
      requireChatEncryptionKey(),
    );
  }

  return {
    id: record.id,
    case_id: record.case_id,
    auth_user_id: record.auth_user_id,
    status: record.status,
    answers: record.answers ?? {},
    notes,
    avoidance_patterns: record.avoidance_patterns ?? [],
    protective_signals: record.protective_signals ?? [],
    component_score: record.component_score,
    evidence_completeness: record.evidence_completeness,
    summary: record.summary,
    version: record.version,
    safety_acknowledged_at: record.safety_acknowledged_at,
    completed_at: record.completed_at,
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
}
