import "server-only";
import type { ImageAsset, OptimizedDesignBrief } from "@/lib/types";
import { getConfig } from "@/lib/config";
import { assetToBuffer, bufferToAsset, createMockOptimizedPack, normalizePack } from "@/lib/image/processing";

export interface GeneratedDesign {
  image: ImageAsset;
  generator: { name: "mock_placeholder" | "openai_image_edit"; model?: string; isMock: boolean; note: string };
}

/**
 * Produce exactly ONE optimized design.
 * - Live: OpenAI Images edit endpoint with the original pack as the reference image, so silhouette,
 *   logo and brand colour are preserved and only the brief's changes are applied.
 * - Mock / no key / failure: a clearly badged placeholder derived from the original, so the
 *   re-test loop can still be exercised end-to-end.
 */
export async function generateOptimizedDesign(original: ImageAsset, brief: OptimizedDesignBrief): Promise<GeneratedDesign> {
  const config = getConfig();
  if (config.useMockData || !config.openai.apiKey) {
    return {
      image: await createMockOptimizedPack(original),
      generator: {
        name: "mock_placeholder",
        isMock: true,
        note: config.openai.apiKey
          ? "Mock modu açık: gerçek görsel üretimi yapılmadı, orijinal tasarımın işaretli bir simülasyonu kullanıldı."
          : "OPENAI_API_KEY tanımlı olmadığı için gerçek görsel üretimi yapılmadı; orijinal tasarımın işaretli bir simülasyonu kullanıldı.",
      },
    };
  }

  try {
    const form = new FormData();
    form.append("model", config.openai.imageModel);
    form.append("prompt", brief.imageGenerationPrompt.slice(0, 4000));
    form.append("size", "1024x1024");
    form.append("quality", config.openai.imageQuality);
    form.append("n", "1");
    const buffer = assetToBuffer(original);
    form.append("image[]", new Blob([new Uint8Array(buffer)], { type: original.mime }), "original.jpg");

    const res = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${config.openai.apiKey}` },
      body: form,
    });
    if (!res.ok) throw new Error(`OpenAI images ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const payload = (await res.json()) as { data?: Array<{ b64_json?: string; url?: string }> };
    const first = payload.data?.[0];
    let imageBuffer: Buffer | null = null;
    if (first?.b64_json) imageBuffer = Buffer.from(first.b64_json, "base64");
    else if (first?.url) imageBuffer = Buffer.from(await (await fetch(first.url)).arrayBuffer());
    if (!imageBuffer) throw new Error("Görsel verisi dönmedi.");

    const normalized = await normalizePack(imageBuffer);
    return {
      image: normalized,
      generator: { name: "openai_image_edit", model: config.openai.imageModel, isMock: false, note: "Orijinal ambalaj referans alınarak tek optimize tasarım üretildi." },
    };
  } catch (error) {
    console.error("[5SE] image generation failed, using placeholder:", error);
    const fallback = await createMockOptimizedPack(original);
    return {
      image: await bufferToAsset(assetToBuffer(fallback), "image/jpeg"),
      generator: { name: "mock_placeholder", isMock: true, note: `Görsel üretimi başarısız oldu (${error instanceof Error ? error.message : "hata"}); işaretli simülasyon gösteriliyor.` },
    };
  }
}
