/**
 * Server-side runtime configuration.
 * Never import this from client components — it reads secrets from process.env.
 */
import "server-only";

export interface RuntimeConfig {
  useMockData: boolean;
  attentionProvider: "mock" | "attention_insight" | "feng_gui";
  attentionInsight: {
    apiKey: string | null;
    baseUrl: string;
    /** `general` unlocks focus + clarity_score for single packs; `packaging` only supports focus. */
    singlePackStudyType: string;
    shelfStudyType: string;
    pollIntervalMs: number;
    pollTimeoutMs: number;
  };
  openai: {
    apiKey: string | null;
    model: string;
    imageModel: string;
    imageQuality: string;
  };
  fengGui: {
    apiKey: string | null;
    serviceUrl: string;
    username: string | null;
  };
}

function bool(value: string | undefined, fallback: boolean) {
  if (value === undefined || value === "") return fallback;
  return !["false", "0", "no", "off"].includes(value.trim().toLowerCase());
}

function str(value: string | undefined) {
  const v = value?.trim();
  return v ? v : null;
}

export function getConfig(): RuntimeConfig {
  const attentionKey = str(process.env.ATTENTION_INSIGHT_API_KEY);
  const fengKey = str(process.env.FENG_GUI_API_KEY);
  const requestedProvider = (str(process.env.ATTENTION_PROVIDER) ?? "attention_insight") as RuntimeConfig["attentionProvider"];

  // Mock is the default. Live mode also silently falls back to mock when no provider key exists,
  // so a missing key never crashes the app.
  const explicitMock = bool(process.env.USE_MOCK_DATA, true);
  const providerHasKey = requestedProvider === "feng_gui" ? Boolean(fengKey) : Boolean(attentionKey);
  const useMockData = explicitMock || !providerHasKey;

  return {
    useMockData,
    attentionProvider: useMockData ? "mock" : requestedProvider,
    attentionInsight: {
      apiKey: attentionKey,
      baseUrl: str(process.env.ATTENTION_INSIGHT_BASE_URL) ?? "https://ext-api.attentioninsight.com/api/v2",
      singlePackStudyType: str(process.env.ATTENTION_INSIGHT_SINGLE_STUDY_TYPE) ?? "general",
      shelfStudyType: str(process.env.ATTENTION_INSIGHT_SHELF_STUDY_TYPE) ?? "shelves",
      pollIntervalMs: Number(process.env.ATTENTION_INSIGHT_POLL_INTERVAL_MS ?? 4000),
      pollTimeoutMs: Number(process.env.ATTENTION_INSIGHT_POLL_TIMEOUT_MS ?? 150000),
    },
    openai: {
      apiKey: str(process.env.OPENAI_API_KEY),
      model: str(process.env.OPENAI_MODEL) ?? "gpt-4.1-mini",
      imageModel: str(process.env.OPENAI_IMAGE_MODEL) ?? "gpt-image-1",
      imageQuality: str(process.env.OPENAI_IMAGE_QUALITY) ?? "medium",
    },
    fengGui: {
      apiKey: fengKey,
      serviceUrl: str(process.env.FENG_GUI_SERVICE_URL) ?? "https://service.feng-gui.com",
      username: str(process.env.FENG_GUI_USERNAME),
    },
  };
}

/** Safe, secret-free description of the runtime for the UI status badge. */
export function getPublicStatus() {
  const c = getConfig();
  return {
    mode: c.useMockData ? ("mock" as const) : ("live" as const),
    attentionProvider: c.attentionProvider,
    attentionKeyConfigured: Boolean(c.attentionInsight.apiKey),
    openaiConfigured: Boolean(c.openai.apiKey),
    imageGenerationConfigured: Boolean(c.openai.apiKey),
  };
}

export type PublicStatus = ReturnType<typeof getPublicStatus>;
