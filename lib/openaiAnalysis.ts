import type { FiveSeAnalysisResult, ProjectMeta } from "./types";

type OpenAiEnhancement = {
  summary: string;
  strengths: string[];
  criticalIssues: string[];
  importantIssues: string[];
  opportunities: string[];
  recommendations: string[];
};

type OpenAiResponsesPayload = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

const DEFAULT_MODEL = "gpt-4o-mini";

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    strengths: { type: "array", items: { type: "string" } },
    criticalIssues: { type: "array", items: { type: "string" } },
    importantIssues: { type: "array", items: { type: "string" } },
    opportunities: { type: "array", items: { type: "string" } },
    recommendations: { type: "array", items: { type: "string" } },
  },
  required: [
    "summary",
    "strengths",
    "criticalIssues",
    "importantIssues",
    "opportunities",
    "recommendations",
  ],
};

function getOpenAiKey() {
  return process.env.OPENAI_API_KEY?.trim();
}

function getModel() {
  return process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;
}

function extractOutputText(payload: OpenAiResponsesPayload) {
  if (payload.output_text) return payload.output_text;

  return payload.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text)
    .filter(Boolean)
    .join("\n");
}

function keepList(items: string[], fallback: string[], max = 5) {
  const clean = items.map((item) => item.trim()).filter(Boolean);
  return clean.length ? clean.slice(0, max) : fallback.slice(0, max);
}

function mergeEnhancement(
  result: FiveSeAnalysisResult,
  enhancement: OpenAiEnhancement,
  model: string,
): FiveSeAnalysisResult {
  return {
    ...result,
    aiEnhanced: true,
    aiModel: model,
    summary: enhancement.summary.trim() || result.summary,
    strengths: keepList(enhancement.strengths, result.strengths, 4),
    criticalIssues: keepList(enhancement.criticalIssues, result.criticalIssues, 4),
    importantIssues: keepList(enhancement.importantIssues, result.importantIssues, 4),
    opportunities: keepList(enhancement.opportunities, result.opportunities, 4),
    recommendations: keepList(enhancement.recommendations, result.recommendations, 5),
  };
}

export async function enhanceAnalysisWithOpenAI(
  project: ProjectMeta,
  fileNames: string[],
  result: FiveSeAnalysisResult,
) {
  const apiKey = getOpenAiKey();
  if (!apiKey) return result;

  const model = getModel();
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      store: false,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: [
                "Sen kıdemli bir ambalaj stratejisti ve 5SE analiz motorusun.",
                "Feng-GUI skorlarını, 5SE skorlarını ve kategori bilgisini birlikte yorumla.",
                "Veri uydurma; sadece verilen sayılara ve proje bilgisine dayan.",
                "Türkçe, kısa, ticari olarak faydalı ve net yaz.",
              ].join(" "),
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify({
                project,
                fileNames,
                scores: result.scores,
                fengGui: result.singlePackAttention,
                currentDiagnosis: {
                  summary: result.summary,
                  strengths: result.strengths,
                  criticalIssues: result.criticalIssues,
                  importantIssues: result.importantIssues,
                  opportunities: result.opportunities,
                  recommendations: result.recommendations,
                },
              }),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "five_se_analysis_enhancement",
          strict: true,
          schema,
        },
      },
    }),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(`OpenAI API ${response.status} hatası: ${message || "cevap okunamadı"}`);
  }

  const payload = await response.json() as OpenAiResponsesPayload;
  const outputText = extractOutputText(payload);
  if (!outputText) throw new Error("OpenAI boş analiz cevabı döndürdü.");

  const enhancement = JSON.parse(outputText) as OpenAiEnhancement;
  return mergeEnhancement(result, enhancement, model);
}
