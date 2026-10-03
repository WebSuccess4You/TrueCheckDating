const DEFAULT_PATH = "/dashboard";

export function safeNextPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_PATH;
  }

  try {
    const parsed = new URL(value, "https://truecheck.invalid");
    if (parsed.origin !== "https://truecheck.invalid") {
      return DEFAULT_PATH;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return DEFAULT_PATH;
  }
}
