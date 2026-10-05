import "server-only";
import type { AreaOfInterest, ImageAsset, ProjectMeta } from "@/lib/types";
import { getConfig } from "@/lib/config";
import type { AoiInput } from "@/lib/attention/provider";

/**
 * Default AOI layout for a front-facing FMCG pack when no vision model is available.
 * Boxes are in percent of the image. Marked `source: "heuristic"` so the report can lower confidence.
 */
export function heuristicPackAois(): AoiInput[] {
  return [
    { id: "logo", name: "Logo", role: "logo", x: 18, y: 6, width: 64, height: 18, source: "heuristic" },
    { id: "product_name", name: "Ürün adı", role: "product_name", x: 14, y: 25, width: 72, height: 13, source: "heuristic" },
    { id: "product_visual", name: "Ürün görseli", role: "product_visual", x: 12, y: 39, width: 76, height: 38, source: "heuristic" },
    { id: "claim", name: "Ana vaat / claim", role: "claim", x: 10, y: 78, width: 80, height: 14, source: "heuristic" },
  ];
}

interface VisionAoiResponse {
  aois: Array<{ role: AreaOfInterest["role"]; name: string; x: number; y: number; width: number; height: number }>;
  observations?: { category_guess?: string; main_claim_text?: string; variant_text?: string; notes?: string };
}

/**
 * Uses an OpenAI vision model to locate logo / product name / claim / product visual / variant.
 * Falls back to the heuristic layout on any failure. Never runs in mock mode.
 */
export async function detectPackAois(image: ImageAsset, project: ProjectMeta): Promise<{ aois: AoiInput[]; observations?: VisionAoiResponse["observations"]; source: "vision_model" | "heuristic" }> {
  const config = getConfig();
  if (config.useMockData || !config.openai.apiKey) return { aois: heuristicPackAois(), source: "heuristic" };

  try {
    const schema = {
      type: "object",
      additionalProperties: false,
      required: ["aois", "observations"],
      properties: {
        aois: {
          type: "array",
          maxItems: 6,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["role", "name", "x", "y", "width", "height"],
            properties: {
              role: { type: "string", enum: ["logo", "product_name", "claim", "product_visual", "variant", "other"] },
              name: { type: "string" },
              x: { type: "number" },
              y: { type: "number" },
              width: { type: "number" },
              height: { type: "number" },
            },
          },
        },
        observations: {
          type: "object",
          additionalProperties: false,
          required: ["category_guess", "main_claim_text", "variant_text", "notes"],
          properties: {
            category_guess: { type: "string" },
            main_claim_text: { type: "string" },
            variant_text: { type: "string" },
            notes: { type: "string" },
          },
        },
      },
    };

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.openai.apiKey}` },
      body: JSON.stringify({
        model: config.openai.model,
        store: false,
        input: [
          {
            role: "system",
            content:
              "You locate packaging design elements. Return bounding boxes in PERCENT of image width/height (x,y = top-left). Only include elements that are actually visible. Do not guess text you cannot read.",
          },
          {
            role: "user",
            content: [
              { type: "input_text", text: `Brand: ${project.brandName}. Product: ${project.productName}. Category: ${project.category}. Locate: logo, product_name, claim (main benefit / purchase message), product_visual, variant (flavour/size) if present.` },
              { type: "input_image", image_url: image.dataUrl, detail: "low" },
            ],
          },
        ],
        text: { format: { type: "json_schema", name: "pack_aois", strict: true, schema } },
      }),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}`);
    const payload = (await res.json()) as { output_text?: string; output?: Array<{ content?: Array<{ type: string; text?: string }> }> };
    const text = payload.output_text ?? payload.output?.flatMap((o) => o.content ?? []).find((c) => c.type === "output_text")?.text;
    if (!text) throw new Error("Boş vision cevabı");
    const parsed = JSON.parse(text) as VisionAoiResponse;
    const aois: AoiInput[] = parsed.aois
      .filter((a) => a.width > 1 && a.height > 1)
      .slice(0, 6)
      .map((a, i) => ({
        id: `${a.role}_${i}`,
        name: a.name,
        role: a.role,
        x: clampPct(a.x),
        y: clampPct(a.y),
        width: clampPct(a.width),
        height: clampPct(a.height),
        source: "vision_model" as const,
      }));
    if (!aois.length) throw new Error("AOI bulunamadı");
    return { aois, observations: parsed.observations, source: "vision_model" };
  } catch (error) {
    console.warn("[5SE] vision AOI detection failed, using heuristic layout:", error instanceof Error ? error.message : error);
    return { aois: heuristicPackAois(), source: "heuristic" };
  }
}

function clampPct(n: number) {
  return Math.min(100, Math.max(0, Math.round(n * 10) / 10));
}
