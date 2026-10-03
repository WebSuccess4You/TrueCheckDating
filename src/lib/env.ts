import { z } from "zod";

const publicEnvironmentSchema = z
  .object({
    NEXT_PUBLIC_APP_NAME: z
      .string()
      .trim()
      .min(1)
      .default("TrueCheckDating.com"),
    NEXT_PUBLIC_APP_URL: z
      .string()
      .trim()
      .url()
      .default("http://localhost:3000"),
    NEXT_PUBLIC_SUPABASE_URL: z.string().trim().url().optional(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().trim().min(20).optional(),
  })
  .superRefine((value, context) => {
    const hasUrl = Boolean(value.NEXT_PUBLIC_SUPABASE_URL);
    const hasKey = Boolean(value.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

    if (hasUrl !== hasKey) {
      context.addIssue({
        code: "custom",
        message:
          "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be configured together.",
        path: hasUrl
          ? ["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"]
          : ["NEXT_PUBLIC_SUPABASE_URL"],
      });
    }
  });

export type PublicEnvironment = z.infer<typeof publicEnvironmentSchema>;

export function parsePublicEnvironment(
  environment: Record<string, string | undefined>,
): PublicEnvironment {
  return publicEnvironmentSchema.parse({
    NEXT_PUBLIC_APP_NAME: environment.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_URL: environment.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: environment.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}

export const publicEnvironment = parsePublicEnvironment(process.env);

export function isSupabaseConfigured(): boolean {
  return Boolean(
    publicEnvironment.NEXT_PUBLIC_SUPABASE_URL &&
    publicEnvironment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function requireSupabaseEnvironment(): {
  url: string;
  publishableKey: string;
} {
  if (
    !publicEnvironment.NEXT_PUBLIC_SUPABASE_URL ||
    !publicEnvironment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local.",
    );
  }

  return {
    url: publicEnvironment.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: publicEnvironment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };
}
