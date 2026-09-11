import { FIVE_SE_MASTER_PROMPT } from "./fiveSePrompt";

/**
 * OpenAI adapter placeholder.
 * v0.1 uses mock results. This file exists so the production boundary is already clear.
 */
export async function runFiveSeAnalysis(_payload: unknown) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing.");
  }

  // Live Responses API integration is intentionally deferred to the next sprint.
  // FIVE_SE_MASTER_PROMPT is already versioned separately.
  void FIVE_SE_MASTER_PROMPT;
  throw new Error("OpenAI live adapter is not enabled in MVP v0.1.");
}
