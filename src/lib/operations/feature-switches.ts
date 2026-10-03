/** Server-side emergency switches. An absent setting keeps existing behavior. */
export function featureEnabled(value: string | undefined): boolean {
  return value === undefined || value.trim().toLowerCase() === "true";
}

export function chatAnalysisEnabled(): boolean {
  return featureEnabled(process.env.CHAT_ANALYSIS_ENABLED);
}

export function checkoutEnabled(): boolean {
  return featureEnabled(process.env.CHECKOUT_ENABLED);
}
