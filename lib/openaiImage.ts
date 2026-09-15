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

function listItems(items: string[], limit = 4) {
  const safeItems = items
    .slice(0, limit)
    .map((item) => item.replace(/[<>]/g, "").trim())
    .filter(Boolean);
  return safeItems.length ? safeItems.map((item) => `- ${item}`).join("\n") : "- Improve brand visibility, message hierarchy, contrast, and readability.";
}

export function buildOptimizedDesignPrompt(project: ProjectMeta, analysis: FiveSeAnalysisResult) {
  return `You are a professional packaging graphic designer.

Create one optimized packaging graphic design concept by editing only the visible 2D label/artwork on the uploaded pack image.

Keep the output canvas square at 1024x1024.

Product context:
- Category: ${project.category}
- Product: ${project.productName}

Improvement recommendations:
${listItems(analysis.recommendations)}

Design task:
- Keep the same package silhouette, container proportions, cap/closure, perspective, shadows, and front-facing pack boundaries.
- Keep the package object in the same approximate position, scale, width, height, and aspect ratio as the uploaded reference image.
- Treat the physical packaging form as locked. Only change the flat graphic surface: label layout, color hierarchy, typography scale, claim visibility, contrast, clutter, and message hierarchy.
- Preserve the existing visible brand/product cues where possible.
- Do not add people, bodies, faces, hands, weapons, medical scenes, controlled substances, political content, sexual content, or violent content.
- Do not create a new product category. Do not turn the package into a different container shape.
- Improve clarity, shelf impact, logo visibility, and purchase-message readability.
- Keep the design commercially realistic for a packaging concept.
- Make the front face clean, readable, and suitable for another attention test.
- Output only the optimized graphic design applied to the exact same packaging structure on a clean neutral background.`;
}

function buildSafeFallbackPrompt() {
  return `Edit the uploaded packaging image as a clean commercial packaging graphic-design concept.

Keep the exact same canvas size, pack silhouette, container proportions, cap/closure, perspective, shadows, and front-facing boundaries.
Only adjust the 2D artwork on the pack surface: cleaner layout, stronger contrast, clearer hierarchy, improved readability, and more organized color blocks.
Keep the product as the same type of packaged consumer good.
Do not add people, bodies, faces, hands, weapons, medical scenes, controlled substances, political content, sexual content, or violent content.
Do not change the bottle/can/box shape or physical structure.
Output a single clean optimized pack concept on a neutral background.`;
}

function isSafetyRejection(message: string) {
  return /safety system|rejected by the safety|safety/i.test(message);
}

async function requestImageEdit(image: File, prompt: string, model: string, quality: string) {
  const body = new FormData();

  body.append("model", model);
  body.append("image", image);
  body.append("prompt", prompt);
  body.append("size", "1024x1024");
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

  return imageData;
}

export async function generateOptimizedPackDesign(
  image: File,
  project: ProjectMeta,
  analysis: FiveSeAnalysisResult,
): Promise<OptimizedDesignResult> {
  const model = getImageModel();
  const quality = getImageQuality();
  const prompt = buildOptimizedDesignPrompt(project, analysis);
  let imageData: NonNullable<OpenAiImagePayload["data"]>[number];
  let usedPrompt = prompt;

  try {
    imageData = await requestImageEdit(image, prompt, model, quality);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!isSafetyRejection(message)) {
      throw error;
    }

    usedPrompt = buildSafeFallbackPrompt();
    try {
      imageData = await requestImageEdit(image, usedPrompt, model, quality);
    } catch (fallbackError) {
      const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : "";
      if (isSafetyRejection(fallbackMessage)) {
        throw new Error("OpenAI güvenlik filtresi bu görseli düzenlemeye izin vermedi. Lütfen üzerindeki metinleri daha sade, nötr ve net görünen 1024×1024 bir ambalaj görseliyle tekrar deneyin.");
      }
      throw fallbackError;
    }
  }

  return {
    optimizedImageUrl: `data:image/png;base64,${imageData.b64_json}`,
    prompt: usedPrompt,
    model,
    quality,
    revisedPrompt: imageData.revised_prompt ?? null,
  };
}
