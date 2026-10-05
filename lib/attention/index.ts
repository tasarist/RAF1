import "server-only";
import { getConfig } from "@/lib/config";
import type { AttentionProvider } from "./provider";
import { MockAttentionProvider } from "./providers/mock";
import { AttentionInsightProvider } from "./providers/attentionInsight";
import { FengGuiProvider } from "./providers/fengGui";

/**
 * Provider factory. Selection is driven purely by server-side env vars:
 *   USE_MOCK_DATA=true            → mock (default)
 *   ATTENTION_PROVIDER=attention_insight + ATTENTION_INSIGHT_API_KEY → live Attention Insight
 *   ATTENTION_PROVIDER=feng_gui + FENG_GUI_API_KEY                   → live Feng-GUI
 * If the selected live provider has no key we fall back to mock instead of crashing.
 */
export function getAttentionProvider(): AttentionProvider {
  const config = getConfig();
  if (config.useMockData) return new MockAttentionProvider();

  if (config.attentionProvider === "feng_gui" && config.fengGui.apiKey) {
    return new FengGuiProvider({ apiKey: config.fengGui.apiKey, serviceUrl: config.fengGui.serviceUrl, username: config.fengGui.username });
  }
  if (config.attentionInsight.apiKey) {
    return new AttentionInsightProvider({ ...config.attentionInsight, apiKey: config.attentionInsight.apiKey });
  }
  return new MockAttentionProvider();
}

export type { AttentionProvider } from "./provider";
