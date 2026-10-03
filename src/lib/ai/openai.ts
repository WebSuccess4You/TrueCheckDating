import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import { getOpenAIEnvironment } from "@/lib/server-env";

import { CHAT_ANALYZER_SYSTEM_PROMPT } from "./prompt";
import { chatAnalysisOutputSchema, type ChatAnalysisOutput } from "./schema";

export type RunChatAnalysisInput = {
  transcript: string;
  userInput: string;
};

export type RunChatAnalysisResult = {
  output: ChatAnalysisOutput;
  model: string;
  providerResponseId: string;
  inputTokens: number | null;
  outputTokens: number | null;
};

export class ChatAnalysisProviderError extends Error {
  constructor(
    public readonly code:
      | "not_configured"
      | "timeout"
      | "rate_limited"
      | "provider_error"
      | "refused"
      | "invalid_output_structure"
      | "invalid_output_evidence",
    message: string,
    public readonly ownerVisibleEvidence?: string,
  ) {
    super(message);
    this.name = "ChatAnalysisProviderError";
  }
}

export async function runOpenAIChatAnalysis({
  userInput,
}: RunChatAnalysisInput): Promise<RunChatAnalysisResult> {
  let environment;
  try {
    environment = getOpenAIEnvironment();
  } catch {
    throw new ChatAnalysisProviderError(
      "not_configured",
      "OpenAI analysis is not configured.",
    );
  }

  const client = new OpenAI({
    apiKey: environment.apiKey,
    maxRetries: 1,
    timeout: environment.timeoutMs,
  });

  try {
    const response = await client.responses.parse({
      model: environment.model,
      store: false,
      max_output_tokens: environment.maxOutputTokens,
      input: [
        { role: "system", content: CHAT_ANALYZER_SYSTEM_PROMPT },
        { role: "user", content: userInput },
      ],
      text: {
        format: zodTextFormat(chatAnalysisOutputSchema, "chat_analysis"),
      },
    });

    if (!response.output_parsed) {
      const wasRefused = response.output.some(
        (item) =>
          item.type === "message" &&
          item.content.some((content) => content.type === "refusal"),
      );
      throw new ChatAnalysisProviderError(
        wasRefused ? "refused" : "invalid_output_structure",
        wasRefused
          ? "The analysis request was declined by the model."
          : "The model did not return a valid structured result.",
      );
    }

    return {
      output: response.output_parsed,
      model: environment.model,
      providerResponseId: response.id,
      inputTokens: response.usage?.input_tokens ?? null,
      outputTokens: response.usage?.output_tokens ?? null,
    };
  } catch (error) {
    if (error instanceof ChatAnalysisProviderError) throw error;

    if (error instanceof OpenAI.APIError) {
      if (error.status === 429) {
        throw new ChatAnalysisProviderError(
          "rate_limited",
          "The AI provider is temporarily rate limited.",
        );
      }
      if (error.status === 408 || error.status === 504) {
        throw new ChatAnalysisProviderError(
          "timeout",
          "The AI provider did not respond in time.",
        );
      }
      throw new ChatAnalysisProviderError(
        "provider_error",
        "The AI provider could not complete the request.",
      );
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new ChatAnalysisProviderError(
        "timeout",
        "The AI provider did not respond in time.",
      );
    }

    throw new ChatAnalysisProviderError(
      "provider_error",
      "The AI provider could not complete the request.",
    );
  }
}
