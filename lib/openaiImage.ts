import type { FiveSeAnalysisResult, ProjectMeta } from "@/lib/types";

type OpenAiImagePayload = {
  data?: Array<{
    b64_json?: string;
    url?: string;
    revised_prompt?: string;
  }>;
  error?: {
    message?: string;
  };
};

export type OptimizedDesignResult = {
  optimizedImageUrl: string;
  prompt: string;
  model: string;
  quality: string;
  revisedPrompt: string | null;
};

function getOpenAiKey() {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error("OpenAI API anahtarı tanımlı değil.");
  }
  return key;
}

function getImageModel() {
  return process.env.OPENAI_IMAGE_MODEL?.trim() || "gpt-image-1";
}

function getImageQuality() {
  return process.env.OPENAI_IMAGE_QUALITY?.trim() || "medium";
}

function listItems(items: string[]) {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : "- Veri yok";
}

export function buildOptimizedDesignPrompt(project: ProjectMeta, analysis: FiveSeAnalysisResult) {
  return `You are a senior FMCG packaging designer.

Create one optimized packaging design concept by editing only the graphic design on the uploaded main pack image.

Product context:
- Category: ${project.category}
- Brand: ${project.brandName}
- Product: ${project.productName}
- Competitor 1: ${project.competitor1BrandName}
- Competitor 2: ${project.competitor2BrandName}

Current 5SE diagnosis:
- Overall 5SE score: ${analysis.scores.overall5seScore}/100
- Uniqueness: ${analysis.scores.uniqueness}/100
- Product clarity: ${analysis.scores.productClarity}/100
- Single pack attention: ${analysis.scores.singlePackAttention}/100
- Attention & stand-out: ${analysis.scores.attentionStandout}/100
- Consumer distance clarity: ${analysis.scores.consumerDistanceClarity}/100

Critical issues:
${listItems(analysis.criticalIssues)}

Important issues:
${listItems(analysis.importantIssues)}

Improvement recommendations:
${listItems(analysis.recommendations)}

Design task:
- Preserve the existing brand identity, brand name, product category, main pack format, and recognizable visual assets.
- Preserve the exact physical packaging structure: bottle/can/box shape, silhouette, proportions, cap/closure, container material impression, perspective, and front-facing pack boundaries.
- Do not change the bottle ratio, box ratio, package shape, container height/width, cap size, label area geometry, or general pack construction.
- Only improve graphic design elements on the existing pack surface: label layout, color hierarchy, typography scale, claim visibility, contrast, visual clutter, and message hierarchy.
- Do not create a completely new brand or unrelated product.
- Improve the pack according to the diagnosis: clearer product promise, stronger logo/brand visibility, cleaner message hierarchy, reduced visual clutter, and stronger shelf impact.
- Keep the design commercially realistic for a packaging concept.
- Make the front face clean, readable, and suitable for another attention test.
- If small regulatory text, barcode, or micro-copy is unclear, represent it as realistic placeholder detail rather than inventing legal claims.
- Output only the optimized graphic design applied to the same packaging structure on a clean neutral background.`;
}

export async function generateOptimizedPackDesign(
  image: File,
  project: ProjectMeta,
  analysis: FiveSeAnalysisResult,
): Promise<OptimizedDesignResult> {
  const model = getImageModel();
  const quality = getImageQuality();
  const prompt = buildOptimizedDesignPrompt(project, analysis);
  const body = new FormData();

  body.append("model", model);
  body.append("image", image);
  body.append("prompt", prompt);
  body.append("size", "1024x1536");
  body.append("quality", quality);
  body.append("output_format", "png");

  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getOpenAiKey()}`,
    },
    body,
  });
  const payload = await response.json().catch(() => null) as OpenAiImagePayload | null;

  if (!response.ok) {
    throw new Error(payload?.error?.message || `OpenAI görsel API hatası: ${response.status}`);
  }

  const imageData = payload?.data?.[0];
  if (!imageData?.b64_json) {
    throw new Error("OpenAI optimize tasarım görseli döndürmedi.");
  }

  return {
    optimizedImageUrl: `data:image/png;base64,${imageData.b64_json}`,
    prompt,
    model,
    quality,
    revisedPrompt: imageData.revised_prompt ?? null,
  };
}
