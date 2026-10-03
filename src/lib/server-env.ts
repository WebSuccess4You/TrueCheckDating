import "server-only";

import { z } from "zod";

import {
  DEFAULT_ANALYSES_PER_HOUR,
  DEFAULT_OPENAI_CHAT_MODEL,
  DEFAULT_OPENAI_MAX_OUTPUT_TOKENS,
  DEFAULT_OPENAI_TIMEOUT_MS,
} from "./ai/constants";

const optionalPositiveInteger = (fallback: number) =>
  z.coerce.number().int().positive().default(fallback);

const serverEnvironmentSchema = z.object({
  CHAT_CONTENT_ENCRYPTION_KEY: z.string().trim().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().trim().min(20).optional(),
  OPENAI_API_KEY: z.string().trim().min(20).optional(),
  OPENAI_CHAT_MODEL: z
    .string()
    .trim()
    .min(1)
    .default(DEFAULT_OPENAI_CHAT_MODEL),
  OPENAI_CHAT_TIMEOUT_MS: optionalPositiveInteger(DEFAULT_OPENAI_TIMEOUT_MS),
  OPENAI_CHAT_MAX_OUTPUT_TOKENS: optionalPositiveInteger(
    DEFAULT_OPENAI_MAX_OUTPUT_TOKENS,
  ),
  OPENAI_CHAT_MAX_REQUESTS_PER_HOUR: optionalPositiveInteger(
    DEFAULT_ANALYSES_PER_HOUR,
  ),
  STRIPE_SECRET_KEY: z.string().trim().min(20).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().trim().min(20).optional(),
  STRIPE_ONE_TIME_REPORT_PRICE_ID: z.string().trim().min(5).optional(),
  STRIPE_MONTHLY_MEMBERSHIP_PRICE_ID: z.string().trim().min(5).optional(),
});

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;

export function parseServerEnvironment(
  environment: Record<string, string | undefined>,
): ServerEnvironment {
  return serverEnvironmentSchema.parse({
    CHAT_CONTENT_ENCRYPTION_KEY: environment.CHAT_CONTENT_ENCRYPTION_KEY,
    SUPABASE_SERVICE_ROLE_KEY: environment.SUPABASE_SERVICE_ROLE_KEY,
    OPENAI_API_KEY: environment.OPENAI_API_KEY,
    OPENAI_CHAT_MODEL: environment.OPENAI_CHAT_MODEL,
    OPENAI_CHAT_TIMEOUT_MS: environment.OPENAI_CHAT_TIMEOUT_MS,
    OPENAI_CHAT_MAX_OUTPUT_TOKENS: environment.OPENAI_CHAT_MAX_OUTPUT_TOKENS,
    OPENAI_CHAT_MAX_REQUESTS_PER_HOUR:
      environment.OPENAI_CHAT_MAX_REQUESTS_PER_HOUR,
    STRIPE_SECRET_KEY: environment.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: environment.STRIPE_WEBHOOK_SECRET,
    STRIPE_ONE_TIME_REPORT_PRICE_ID:
      environment.STRIPE_ONE_TIME_REPORT_PRICE_ID,
    STRIPE_MONTHLY_MEMBERSHIP_PRICE_ID:
      environment.STRIPE_MONTHLY_MEMBERSHIP_PRICE_ID,
  });
}

export function requireChatEncryptionKey(): string {
  const parsed = parseServerEnvironment(process.env);
  if (!parsed.CHAT_CONTENT_ENCRYPTION_KEY) {
    throw new Error(
      "Chat encryption is not configured. Add CHAT_CONTENT_ENCRYPTION_KEY to .env.local.",
    );
  }
  return parsed.CHAT_CONTENT_ENCRYPTION_KEY;
}

export function requireSupabaseAdminEnvironment(): {
  url: string;
  serviceRoleKey: string;
} {
  const parsed = parseServerEnvironment(process.env);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url || !parsed.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Supabase server administration is not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local.",
    );
  }
  return { url, serviceRoleKey: parsed.SUPABASE_SERVICE_ROLE_KEY };
}

export function getOpenAIEnvironment(): {
  apiKey: string;
  model: string;
  timeoutMs: number;
  maxOutputTokens: number;
  maxRequestsPerHour: number;
} {
  const parsed = parseServerEnvironment(process.env);
  if (!parsed.OPENAI_API_KEY) {
    throw new Error(
      "OpenAI is not configured. Add OPENAI_API_KEY to .env.local.",
    );
  }
  return {
    apiKey: parsed.OPENAI_API_KEY,
    model: parsed.OPENAI_CHAT_MODEL,
    timeoutMs: parsed.OPENAI_CHAT_TIMEOUT_MS,
    maxOutputTokens: parsed.OPENAI_CHAT_MAX_OUTPUT_TOKENS,
    maxRequestsPerHour: parsed.OPENAI_CHAT_MAX_REQUESTS_PER_HOUR,
  };
}

export function getStripeEnvironment(): {
  secretKey: string;
  webhookSecret: string;
  oneTimeReportPriceId: string;
  monthlyMembershipPriceId: string;
} {
  const parsed = parseServerEnvironment(process.env);
  if (
    !parsed.STRIPE_SECRET_KEY ||
    !parsed.STRIPE_WEBHOOK_SECRET ||
    !parsed.STRIPE_ONE_TIME_REPORT_PRICE_ID ||
    !parsed.STRIPE_MONTHLY_MEMBERSHIP_PRICE_ID
  ) {
    throw new Error(
      "Stripe is not configured. Add the four server-only Stripe values described in README.md.",
    );
  }
  return {
    secretKey: parsed.STRIPE_SECRET_KEY,
    webhookSecret: parsed.STRIPE_WEBHOOK_SECRET,
    oneTimeReportPriceId: parsed.STRIPE_ONE_TIME_REPORT_PRICE_ID,
    monthlyMembershipPriceId: parsed.STRIPE_MONTHLY_MEMBERSHIP_PRICE_ID,
  };
}
