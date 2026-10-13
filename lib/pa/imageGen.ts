import { getEngine } from "./engine";

// YZ ile optimize tasarım üretimi. Anahtar ve prompt loglanmaz.

const GUARD = [
  "Edit only the 2D artwork/label of this packaging image.",
  "Keep the same package silhouette, proportions, closure, perspective and position; square 1024x1024 canvas, clean neutral background.",
  "Keep the brand name and product type. Do not add people, hands or unrelated objects.",
].join(" ");

export function buildPrompt(parts: string[]) {
  return `${GUARD}\n\nApply these improvements:\n${parts.map((p) => `- ${p}`).join("\n")}`;
}

type ImagePayload = { data?: Array<{ b64_json?: string; revised_prompt?: string }>; error?: { message?: string } };

export async function generateOptimized(source: { buf: Buffer; mime: string }, prompt: string, quality?: string) {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw new Error("YZ anahtarı tanımlı değil (OPENAI_API_KEY).");
  if (process.env.AI_MOCK === "1") throw new Error("Örnek modda (AI_MOCK) görsel üretimi kapalı. Revize görsel yükleyin.");

  const p = getEngine().providers;
  const candidates = [process.env.OPENAI_IMAGE_MODEL?.trim() || p.imageModel, p.imageFallbackModel];
  let lastError: Error | null = null;

  for (const model of candidates) {
    const body = new FormData();
    body.append("model", model);
    body.append("image", new Blob([new Uint8Array(source.buf)], { type: source.mime }), `source.${source.mime.split("/")[1]}`);
    body.append("prompt", prompt);
    body.append("size", "1024x1024");
    body.append("quality", quality || process.env.OPENAI_IMAGE_QUALITY?.trim() || p.imageQuality);

    const res = await fetch("https://api.openai.com/v1/images/edits", { method: "POST", headers: { Authorization: `Bearer ${key}` }, body })
      .catch((e: Error) => { throw new Error(`YZ servisine ulaşılamadı: ${e.message}`); });
    const payload = (await res.json().catch(() => ({}))) as ImagePayload;
    if (!res.ok) {
      const msg = payload.error?.message || `YZ görsel hatası ${res.status}`;
      lastError = new Error(msg);
      if ((res.status === 404 || res.status === 400 || res.status === 403) && /model/i.test(msg)) continue;
      throw lastError;
    }
    const img = payload.data?.[0];
    if (!img?.b64_json) throw new Error("YZ görsel döndürmedi.");
    return { dataUrl: `data:image/png;base64,${img.b64_json}`, model, revisedPrompt: img.revised_prompt ?? null };
  }
  throw lastError ?? new Error("Görsel modeli kullanılamadı.");
}
