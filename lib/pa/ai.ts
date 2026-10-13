import { getEngine } from "./engine";
import type { AoiType } from "./engine";
import { boxToQuad, isRectQuad, normalizeQuad, quadToBox } from "./geometry";
import { cacheGet, cacheSet, parseDataUrl, sha256 } from "./store";
import type { BrandElement, BrandRead, ConsistencyRead, Quad, ShelfRead } from "./types";

// Sunucu tarafı YZ görsel okuma. Anahtar yalnızca ortam değişkeninden okunur; tarayıcıya ve loga yazılmaz.
// AI_MOCK=1 yalnızca geliştirme içindir: sağlayıcıya çıkmadan kararlı örnek okuma döner.

const MOCK = process.env.AI_MOCK === "1";

function apiKey() {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw new Error("YZ anahtarı tanımlı değil (OPENAI_API_KEY).");
  return key;
}

function models() {
  const p = getEngine().providers;
  return [process.env.OPENAI_VISION_MODEL?.trim() || p.visionModel, p.visionFallbackModel];
}

const point = { type: "object", additionalProperties: false, properties: { x: { type: "number" }, y: { type: "number" } }, required: ["x", "y"] };
const corners = { type: "object", additionalProperties: false, properties: { tl: point, tr: point, br: point, bl: point }, required: ["tl", "tr", "br", "bl"] };

const AOI_TYPES: AoiType[] = ["logo", "product", "claim", "variant", "visual", "other"];

const brandSchema = {
  type: "object", additionalProperties: false,
  properties: {
    score: { type: "integer" },
    evaluation: { type: "string" },
    elements: {
      type: "array",
      items: {
        type: "object", additionalProperties: false,
        properties: { type: { type: "string", enum: AOI_TYPES }, text: { type: "string" }, strength: { type: "integer" }, corners },
        required: ["type", "text", "strength", "corners"],
      },
    },
  },
  required: ["score", "evaluation", "elements"],
};

const consistencySchema = {
  type: "object", additionalProperties: false,
  properties: { score: { type: "integer" }, evaluation: { type: "string" } },
  required: ["score", "evaluation"],
};

const shelfSchema = {
  type: "object", additionalProperties: false,
  properties: {
    items: {
      type: "array",
      items: { type: "object", additionalProperties: false, properties: { brand: { type: "string" }, corners }, required: ["brand", "corners"] },
    },
  },
  required: ["items"],
};

type ResponsesPayload = { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }>; error?: { message?: string } };

async function callVision<T>(prompt: string, images: string[], schemaName: string, schema: object): Promise<{ data: T; model: string }> {
  let lastError: Error | null = null;
  for (const model of models()) {
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey()}` },
      body: JSON.stringify({
        model,
        store: false,
        input: [{
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            ...images.map((image_url) => ({ type: "input_image", image_url, detail: "high" })),
          ],
        }],
        text: { format: { type: "json_schema", name: schemaName, strict: true, schema } },
      }),
    }).catch((e: Error) => { throw new Error(`YZ servisine ulaşılamadı: ${e.message}`); });

    const payload = (await res.json().catch(() => ({}))) as ResponsesPayload;
    if (!res.ok) {
      const msg = payload.error?.message || `YZ hatası ${res.status}`;
      lastError = new Error(msg);
      // Model erişimi yoksa yedek modele geç; diğer hatalarda dur.
      if ((res.status === 404 || res.status === 400 || res.status === 403) && /model/i.test(msg)) continue;
      throw lastError;
    }
    const text = payload.output_text ?? payload.output?.flatMap((o) => o.content ?? []).map((c) => c.text).filter(Boolean).join("");
    if (!text) throw new Error("YZ boş yanıt döndürdü.");
    return { data: JSON.parse(text) as T, model };
  }
  throw lastError ?? new Error("YZ modeli kullanılamadı.");
}

function checkImage(image: string) {
  if (typeof image !== "string" || image.length > 6_000_000) throw new Error("Görsel çok büyük (6 M karakter sınırı).");
  const parsed = parseDataUrl(image);
  if (!parsed) throw new Error("Geçersiz görsel.");
  return sha256(parsed.buf);
}

const clampScore = (n: number) => Math.round(Math.min(100, Math.max(0, Number(n) || 0)));

function toElement(i: number, type: AoiType, text: string, q: Quad, strength?: number): BrandElement {
  const quad = normalizeQuad(q);
  const box = quadToBox(quad);
  return { id: `a${i + 1}`, type, text: text.trim(), box, ...(isRectQuad(quad) ? {} : { quad }), ...(strength != null ? { strength: clampScore(strength) } : {}) };
}

// ── Deterministik örnek okuma (yalnızca AI_MOCK=1) ─────────────────────
function seeded(hash: string) {
  let s = parseInt(hash.slice(0, 8), 16) || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function mockBrand(hash: string): { data: { score: number; evaluation: string; elements: Array<{ type: AoiType; text: string; strength: number; corners: Quad }> }; model: string } {
  const r = seeded(hash);
  const box = (x: number, y: number, w: number, h: number) => boxToQuad({ x: x + r() * 0.04, y: y + r() * 0.04, w, h });
  return {
    model: "mock",
    data: {
      score: 55 + Math.round(r() * 35),
      evaluation: "Örnek okuma (AI_MOCK). Logo bloğu üst bölümde, ürün adı ortada, claim alt bölümde.",
      elements: [
        { type: "logo", text: "Marka", strength: 70, corners: box(0.3, 0.08, 0.4, 0.14) },
        { type: "product", text: "Ürün adı", strength: 60, corners: box(0.25, 0.3, 0.5, 0.1) },
        { type: "claim", text: "Claim", strength: 50, corners: box(0.2, 0.72, 0.35, 0.08) },
        { type: "variant", text: "Varyant", strength: 55, corners: box(0.6, 0.7, 0.25, 0.1) },
      ],
    },
  };
}

// ── Ana SKU / rakip okuması ─────────────────────────────────────────────
export async function readBrandAssets(image: string): Promise<BrandRead> {
  const hash = checkImage(image);
  const key = `brand-assets-v3:${hash}`;
  const hit = await cacheGet<BrandRead>(key);
  if (hit) return { ...hit, cached: true };

  const engine = getEngine();
  const { data, model } = MOCK ? mockBrand(hash) : await callVision<ReturnType<typeof mockBrand>["data"]>(engine.prompts.dbaUser, [image], "brand_assets", brandSchema);
  const result: BrandRead = {
    score: clampScore(data.score),
    evaluation: data.evaluation,
    model,
    hash,
    ...(MOCK ? { mock: true } : {}),
    elements: data.elements.slice(0, 6).map((e, i) => toElement(i, AOI_TYPES.includes(e.type) ? e.type : "other", e.text, e.corners, e.strength)),
  };
  await cacheSet(key, result);
  return { ...result, cached: false };
}

export async function readConsistency(image: string, other: string, mode: "variant" | "old"): Promise<ConsistencyRead> {
  const h1 = checkImage(image);
  const h2 = checkImage(other);
  const key = `consistency-v1:${mode}:${h1}:${h2}`;
  const hit = await cacheGet<ConsistencyRead>(key);
  if (hit) return hit;

  const engine = getEngine();
  const prompt = mode === "variant" ? engine.prompts.variantUser : engine.prompts.oldUser;
  const { data, model } = MOCK
    ? { data: { score: 60 + Math.round(seeded(h1 + h2)() * 30), evaluation: "Örnek okuma (AI_MOCK)." }, model: "mock" }
    : await callVision<{ score: number; evaluation: string }>(prompt, [image, other], "consistency", consistencySchema);
  const result: ConsistencyRead = { score: clampScore(data.score), evaluation: data.evaluation, model, ...(MOCK ? { mock: true } : {}) };
  await cacheSet(key, result);
  return result;
}

export async function readShelf(image: string, brands: string[]): Promise<ShelfRead> {
  const hash = checkImage(image);
  const hints = brands.map((b) => b.trim()).filter(Boolean);
  const key = `shelf-read-v2:${hash}:${hints.join("|").toLowerCase()}`;
  const hit = await cacheGet<ShelfRead>(key);
  if (hit) return { ...hit, cached: true };

  const engine = getEngine();
  const prompt = hints.length
    ? `${engine.prompts.shelfUser}\nBEKLENEN MARKALAR: ${hints.join(", ")}\nBu markaların bloklarını ara. Adları bu listedeki yazımla aynen döndür. Rafta olmayanı atla, listede olmayan marka ekleme.`
    : engine.prompts.shelfUser;

  let data: { items: Array<{ brand: string; corners: Quad }> };
  let model: string;
  if (MOCK) {
    const r = seeded(hash);
    const names = hints.length ? hints : ["Marka 1", "Marka 2", "Marka 3"];
    const order = [...names].sort(() => r() - 0.5);
    data = { items: order.slice(0, 3).map((brand, i) => ({ brand, corners: boxToQuad({ x: 0.04 + i * 0.32, y: 0.2 + r() * 0.1, w: 0.28, h: 0.5 }) })) };
    model = "mock";
  } else {
    ({ data, model } = await callVision<typeof data>(prompt, [image], "shelf_read", shelfSchema));
  }

  const result: ShelfRead = {
    model, hash, ...(MOCK ? { mock: true } : {}),
    items: data.items.slice(0, 6).map((it, i) => {
      const quad = normalizeQuad(it.corners);
      // YZ yazımı farklı döndürürse ipucundaki yazıma eşle.
      const match = hints.find((h) => h.toLowerCase() === it.brand.trim().toLowerCase());
      return { id: `s${i + 1}`, brand: match ?? it.brand.trim(), box: quadToBox(quad), ...(isRectQuad(quad) ? {} : { quad }) };
    }),
  };
  await cacheSet(key, result);
  return { ...result, cached: false };
}
