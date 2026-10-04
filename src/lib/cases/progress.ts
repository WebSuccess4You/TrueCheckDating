type CheckStatus = { status: string } | null | undefined;
type ImageStatus =
  { status: string; result_category: string | null } | null | undefined;

export function calculateCheckCompletion(
  chat: CheckStatus,
  profile: CheckStatus,
  image: ImageStatus,
  video: CheckStatus,
): number {
  return (
    [
      chat?.status === "analysis_completed",
      profile?.status === "completed",
      image?.status === "completed" && image.result_category !== "unclear",
      video?.status === "completed",
    ].filter(Boolean).length * 25
  );
}
