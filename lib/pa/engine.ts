// Motor konfigürasyonu. Her kayıt oluşturulduğu sürüme bağlanır; eski raporlar yeni kurallarla değişmez.

export type StepId =
  | "setup" | "pack" | "competitors" | "shelf" | "analysis"
  | "results" | "diagnosis" | "optimize" | "retest" | "beforeAfter"
  | "compResult" | "shelfResult";

export type GoalId = "new" | "refresh" | "competitors" | "shelf";

export type AoiType = "logo" | "product" | "claim" | "variant" | "visual" | "other";

export interface EngineConfig {
  version: number;
  flows: Record<GoalId, { label: string; steps: StepId[] }>;
  stepLabels: Record<StepId, string>;
  aoiTypes: Record<AoiType, string>;
  rules: {
    thresholds: { risky: number; ready: number };
    shareTargets: Partial<Record<AoiType, number>>;
    consistencyWeights: { variant: number; old: number };
    excitingMetric: "exciting";
    excitingFallback: Array<"clear" | "memory" | "approach">;
    consumerMetric: "overall";
    recTarget: number;
  };
  prompts: { dbaUser: string; variantUser: string; oldUser: string; shelfUser: string };
  providers: { visionModel: string; visionFallbackModel: string; imageModel: string; imageFallbackModel: string; imageQuality: string };
}

const packSteps: StepId[] = ["setup", "pack", "competitors", "shelf", "analysis", "results", "diagnosis", "optimize", "retest", "beforeAfter"];

const V4: EngineConfig = {
  version: 4,
  flows: {
    new: { label: "Yeni ambalaj tasarımı", steps: packSteps },
    refresh: { label: "Ambalaj yenileme", steps: packSteps },
    competitors: { label: "Rakip Testi", steps: ["setup", "competitors", "compResult"] },
    shelf: { label: "Raf Testi", steps: ["setup", "shelf", "shelfResult"] },
  },
  stepLabels: {
    setup: "Proje Kurulumu",
    pack: "Ambalajını Yükle",
    competitors: "Rakip Testi",
    shelf: "Raf Testi",
    analysis: "Analiz",
    results: "5SE™ Sonuçları",
    diagnosis: "Teşhis",
    optimize: "Tasarımı Optimize Et",
    retest: "Yeniden Test",
    beforeAfter: "Önce / Sonra",
    compResult: "Rakip sonucu",
    shelfResult: "Raf sonucu",
  },
  aoiTypes: {
    logo: "Logo/Marka",
    product: "Ürün adı",
    claim: "Claim",
    variant: "Varyant",
    visual: "Ürün görseli",
    other: "Diğer",
  },
  rules: {
    thresholds: { risky: 55, ready: 75 },
    shareTargets: { logo: 25, variant: 20, claim: 20 },
    consistencyWeights: { variant: 0.5, old: 0.5 },
    excitingMetric: "exciting",
    excitingFallback: ["clear", "memory", "approach"],
    consumerMetric: "overall",
    recTarget: 75,
  },
  prompts: {
    dbaUser: [
      "Bu bir ürün ambalajı görselidir. Ayırıcı marka varlıklarını (Distinctive Brand Assets) değerlendir.",
      "1) 0–100 arası bir DBA puanı ver: logo/marka bloğunun tanınırlığı, renk ve şekil kodlarının ayırt ediciliği, rafta uzaktan tanınma olasılığı.",
      "2) Kısa bir Türkçe değerlendirme yaz (en fazla 3 cümle).",
      "3) En fazla 6 görsel unsuru işaretle. Sıra: logo/marka, ürün adı, claim, varyant, sonra en belirgin diğerleri.",
      "Her unsur için türü (logo, product, claim, variant, visual, other), üzerindeki metni (yoksa kısa tanım), 0–100 güç puanını ve unsurun 4 köşe noktasını ver.",
      "Köşeler görsele göre 0–1 arası normalize (x soldan, y yukarıdan): tl, tr, br, bl. Eğik/perspektifli unsurlarda dörtgen eğimi izlesin.",
      "Logo türündeki unsurun text alanına marka adını aynen yaz.",
    ].join("\n"),
    variantUser: [
      "İlk görsel Ana SKU, ikinci görsel aynı markanın bir varyantıdır.",
      "Varyantın ana SKU ile marka tutarlılığını 0–100 arası puanla: logo yerleşimi, renk sistemi, tipografi, yerleşim düzeni, aile olarak tanınma.",
      "Kısa bir Türkçe değerlendirme yaz (en fazla 3 cümle).",
    ].join("\n"),
    oldUser: [
      "İlk görsel yeni tasarım, ikinci görsel aynı ürünün eski tasarımıdır.",
      "Yeni tasarımın eski tasarımla sürekliliğini 0–100 arası puanla: mevcut müşterinin ürünü rafta yine tanıyabilme olasılığı (renk, logo, şekil, düzen kodlarının korunması).",
      "Kısa bir Türkçe değerlendirme yaz (en fazla 3 cümle).",
    ].join("\n"),
    shelfUser: [
      "Bu bir market rafı görselidir. Raftaki marka bloklarını (aynı markanın yan yana ürün grubu) bul.",
      "En fazla 6 grup, hedef 3. Her grup için marka adını ve bloğun 4 köşe noktasını (0–1 normalize; tl, tr, br, bl) ver.",
    ].join("\n"),
  },
  providers: {
    visionModel: "gpt-5.4",
    visionFallbackModel: "gpt-4.1",
    imageModel: "gpt-image-2.5-sunburst",
    imageFallbackModel: "gpt-image-1",
    imageQuality: "medium",
  },
};

const VERSIONS: Record<number, EngineConfig> = { 4: V4 };

export const CURRENT_ENGINE_VERSION = 4;

export function getEngine(version: number = CURRENT_ENGINE_VERSION): EngineConfig {
  return VERSIONS[version] ?? V4;
}
