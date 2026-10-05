import "server-only";
import type {
  AttentionPrediction,
  CriterionBreakdownItem,
  CriterionResult,
  DistanceClarity,
  DistanceStageResult,
  ImageAsset,
  ShelfPerformance,
  ShelfTestResult,
} from "@/lib/types";
import { colorDistance, structureDistance, type PackFeatures } from "@/lib/image/features";
import { simulateDistance } from "@/lib/image/processing";

export const PARITY_SHARE = 33.3;

export function clamp(n: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Math.round(n)));
}

function weighted(items: CriterionBreakdownItem[]) {
  const total = items.reduce((s, i) => s + i.weight, 0) || 1;
  return clamp(items.reduce((s, i) => s + i.score * i.weight, 0) / total);
}

function aoiShare(pred: AttentionPrediction, role: string) {
  const a = pred.aois.find((x) => x.role === role);
  return a?.attentionShare ?? null;
}

/* ------------------------------------------------------------------ */
/* 1. UNIQUENESS                                                        */
/* ------------------------------------------------------------------ */
export function scoreUniqueness(main: PackFeatures, competitors: PackFeatures[]): CriterionResult {
  const colorD = competitors.map((c) => colorDistance(main, c));
  const structD = competitors.map((c) => structureDistance(main, c));
  const avg = (xs: number[]) => xs.reduce((s, v) => s + v, 0) / (xs.length || 1);

  const colorScore = clamp(avg(colorD) * 125);
  const structureScore = clamp(avg(structD) * 140);
  const overall = clamp(colorScore * 0.55 + structureScore * 0.45);
  // Category code balance: total detachment from the category is as risky as blending in.
  const meanDistance = avg([...colorD, ...structD]);
  const balance = clamp(100 - Math.abs(meanDistance - 0.45) * 180);
  const closest = Math.min(...colorD.map((c, i) => c * 0.6 + structD[i] * 0.4));
  const differentiation = clamp(closest * 150);

  const breakdown: CriterionBreakdownItem[] = [
    { key: "overall_visual_distinctiveness", label: "Overall Visual Distinctiveness", weight: 30, score: overall, note: "Renk ve yapı farkının birleşik okuması." },
    { key: "structural_uniqueness", label: "Structural / Layout Uniqueness", weight: 20, score: structureScore, note: `Yerleşim benzerliği (düşük korelasyon = yüksek skor).` },
    { key: "color_graphic_uniqueness", label: "Color & Graphic Uniqueness", weight: 20, score: colorScore, note: `Renk paleti mesafesi: ${colorD.map((d) => Math.round(d * 100)).join("% / ")}%.` },
    { key: "category_code_balance", label: "Category Code Balance", weight: 15, score: balance, note: "Kategori kodlarını koruma ile ayrışma dengesi." },
    { key: "competitor_differentiation", label: "Competitor Differentiation", weight: 15, score: differentiation, note: "En yakın rakibe olan görsel mesafe." },
  ];
  const score = weighted(breakdown);
  const nearest = colorD.indexOf(Math.min(...colorD)) + 1;
  const narrative =
    score >= 75
      ? `Ana ambalaj iki rakipten net biçimde ayrışıyor; renk paleti ve yerleşim kendine ait bir sistem kuruyor. Bu skor estetik değil, görsel ayrışma derecesini gösterir.`
      : score >= 50
        ? `Ana ambalaj orta düzeyde farklılaşıyor. Rakip ${nearest} ile renk yakınlığı ayrışmayı sınırlıyor; yapı/yerleşim farkı ise kısmen çalışıyor.`
        : `Ana ambalaj rakipleriyle benzer kategori kodlarını kullanıyor ve palet/yerleşim olarak yakın duruyor; rafta “aynı aileden” okunma riski var.`;
  return {
    key: "uniqueness",
    name: "Uniqueness",
    methodologyName: "Güçlü Ayırıcı Marka Varlıkları",
    score,
    breakdown,
    narrative,
    confidence: "medium",
  };
}

/* ------------------------------------------------------------------ */
/* 2. CONTINUITY & CONSISTENCY (optional)                              */
/* ------------------------------------------------------------------ */
export function scoreContinuity(main: PackFeatures, previous?: PackFeatures, skus: PackFeatures[] = []): CriterionResult {
  if (!previous && !skus.length) {
    return {
      key: "continuity_consistency",
      name: "Continuity & Consistency",
      methodologyName: "Sürekli ve Tutarlı Ol",
      score: null,
      breakdown: [],
      narrative: "Eski ambalaj veya diğer SKU yüklenmediği için değerlendirilmedi (N/A). Bu kriter genel skora dahil edilmedi.",
      confidence: "high",
    };
  }
  const prevColor = previous ? colorDistance(main, previous) : null;
  const prevStruct = previous ? structureDistance(main, previous) : null;
  const skuColor = skus.map((s) => colorDistance(main, s));
  const skuStruct = skus.map((s) => structureDistance(main, s));
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

  const assetContinuity = prevColor !== null ? clamp(100 - prevColor * 140) : clamp(100 - (avg(skuColor) ?? 0.3) * 140);
  const portfolio = skus.length ? clamp(100 - ((avg(skuColor) ?? 0) * 0.6 + (avg(skuStruct) ?? 0) * 0.4) * 130) : assetContinuity;
  // Evolution balance: a refresh should move, but not so far that memory structures break (sweet spot ≈ 0.2–0.4 distance).
  const evolutionDistance = prevStruct !== null && prevColor !== null ? prevStruct * 0.5 + prevColor * 0.5 : (avg([...skuColor, ...skuStruct]) ?? 0.3);
  const evolution = clamp(100 - Math.abs(evolutionDistance - 0.3) * 220);
  const coherence = clamp((assetContinuity + portfolio) / 2 - Math.abs(assetContinuity - portfolio) * 0.3);

  const breakdown: CriterionBreakdownItem[] = [
    { key: "brand_asset_continuity", label: "Brand Asset Continuity", weight: 30, score: assetContinuity, note: "Palet ve ana varlıkların önceki ambalajla sürekliliği." },
    { key: "portfolio_consistency", label: "Portfolio Consistency", weight: 30, score: portfolio, note: skus.length ? `${skus.length} SKU ile palet/yapı uyumu.` : "SKU yüklenmedi; önceki ambalaj üzerinden okundu." },
    { key: "evolution_balance", label: "Evolution Balance", weight: 25, score: evolution, note: "Değişim dozu: ne kopuş ne de yerinde sayma." },
    { key: "system_coherence", label: "System Coherence", weight: 15, score: coherence, note: "Ailenin tek sistem gibi okunması." },
  ];
  const score = weighted(breakdown);
  return {
    key: "continuity_consistency",
    name: "Continuity & Consistency",
    methodologyName: "Sürekli ve Tutarlı Ol",
    score,
    breakdown,
    narrative:
      score >= 70
        ? "Yeni tasarım marka dünyasının hafıza yapılarını koruyor; SKU'lar ayrışırken aynı aileden okunuyor."
        : "Yeni tasarım ile referans ambalaj(lar) arasındaki mesafe marka hafızasını zorlayabilir; ayırıcı varlıkların tekrarını güçlendirin.",
    confidence: "medium",
  };
}

/* ------------------------------------------------------------------ */
/* 3. PRODUCT CLARITY                                                  */
/* ------------------------------------------------------------------ */
export function scoreProductClarity(pred: AttentionPrediction, main: PackFeatures, aoiSource: "vision_model" | "heuristic"): CriterionResult {
  const clarity = pred.clarityScore ?? 60;
  const claimShare = aoiShare(pred, "claim");
  const nameShare = aoiShare(pred, "product_name");
  const visualShare = aoiShare(pred, "product_visual");
  const logoShare = aoiShare(pred, "logo");

  const categoryRecognition = clamp(45 + (visualShare ?? 25) * 1.2 + main.dominantHueShare * 30);
  const variantClarity = clamp(40 + (nameShare ?? 15) * 2.2 + clarity * 0.2);
  const benefitClarity = clamp(25 + (claimShare ?? 10) * 3.2 + clarity * 0.3);
  // Hierarchy: attention should flow logo → name → claim/visual without one element swallowing everything.
  const shares = [logoShare, nameShare, claimShare, visualShare].map((s) => s ?? 0);
  const max = Math.max(...shares);
  const hierarchy = clamp(100 - Math.max(0, max - 45) * 2 - (1 - main.saliency.concentration) * 25);

  const breakdown: CriterionBreakdownItem[] = [
    { key: "category_recognition", label: "Category Recognition", weight: 30, score: categoryRecognition, note: "Ürün görselinin dikkat payı ve renk bloğu gücü." },
    { key: "product_variant_clarity", label: "Product / Variant Clarity", weight: 20, score: variantClarity, note: `Ürün adı dikkat payı: ${nameShare ?? "—"}%.` },
    { key: "benefit_promise_clarity", label: "Benefit / Promise Clarity", weight: 35, score: benefitClarity, note: `Ana vaat dikkat payı: ${claimShare ?? "—"}% · Clarity Score ${pred.clarityScore ?? "—"}.` },
    { key: "communication_hierarchy", label: "Communication Hierarchy", weight: 15, score: hierarchy, note: "Dikkatin tek öğede toplanmaması, kontrollü akış." },
  ];
  const score = weighted(breakdown);
  const narrative =
    benefitClarity < 55
      ? `Ürün görseli dikkati topluyor ancak ana vaat alanı (${claimShare ?? "—"}%) düşük dikkat alıyor; tüketici ürünün ne olduğunu görüyor, neden almalı sorusunun cevabını geç okuyor.`
      : `Kategori ve ürün adı hızlı çözülüyor; ana vaat ${claimShare ?? "—"}% dikkat payı ile satın alma gerekçesini destekliyor.`;
  return {
    key: "product_clarity",
    name: "Product Clarity",
    methodologyName: "Ürünü Doğru Yansıt",
    score,
    breakdown,
    narrative,
    confidence: aoiSource === "vision_model" && !pred.isMock ? "medium" : "low",
  };
}

/* ------------------------------------------------------------------ */
/* 4. ATTENTION & STAND-OUT                                            */
/* ------------------------------------------------------------------ */
export function computeShelfPerformance(tests: ShelfTestResult[]): ShelfPerformance {
  const avg = (k: "mainAttentionShare" | "competitor1AttentionShare" | "competitor2AttentionShare") =>
    Math.round((tests.reduce((s, t) => s + t[k], 0) / (tests.length || 1)) * 10) / 10;
  const averageMainShare = avg("mainAttentionShare");
  return {
    tests,
    averageMainShare,
    averageCompetitor1Share: avg("competitor1AttentionShare"),
    averageCompetitor2Share: avg("competitor2AttentionShare"),
    shelfPerformanceIndex: Math.round((averageMainShare / PARITY_SHARE) * 100),
    parityShare: PARITY_SHARE,
  };
}

export function scoreSinglePackAttention(pred: AttentionPrediction) {
  const focus = pred.focusScore ?? 55;
  const clarity = pred.clarityScore ?? 60;
  const brandShare = (aoiShare(pred, "logo") ?? 0) + (aoiShare(pred, "product_name") ?? 0) + (aoiShare(pred, "claim") ?? 0);
  // Attention should land on brand + message, not only on decoration.
  const targeting = clamp(brandShare * 1.6);
  return clamp(focus * 0.4 + clarity * 0.25 + targeting * 0.35);
}

export function scoreAttentionStandout(pred: AttentionPrediction, shelf: ShelfPerformance): CriterionResult & { singlePackAttention: number } {
  const singlePackAttention = scoreSinglePackAttention(pred);
  // SPI 100 = parity → 50 points; each index point above/below moves 1.25 points.
  const shelfScore = clamp(50 + (shelf.shelfPerformanceIndex - 100) * 1.25);
  const breakdown: CriterionBreakdownItem[] = [
    { key: "single_pack_attention", label: "Single Pack Attention", weight: 40, score: singlePackAttention, note: `Focus ${pred.focusScore ?? "—"} · Clarity ${pred.clarityScore ?? "—"} · marka+mesaj dikkat payı.` },
    { key: "shelf_performance", label: "Shelf Performance", weight: 60, score: shelfScore, note: `Shelf Performance Index ${shelf.shelfPerformanceIndex} (ort. dikkat payı ${shelf.averageMainShare}%).` },
  ];
  const score = weighted(breakdown);
  const spi = shelf.shelfPerformanceIndex;
  const narrative =
    spi >= 110
      ? `Ambalaj üç dizilimin ortalamasında ${shelf.averageMainShare}% dikkat payı alıyor (parite ${PARITY_SHARE}%); rafta ortalamanın belirgin üzerinde.`
      : spi >= 95
        ? `Raf dikkat payı ${shelf.averageMainShare}% ile parite civarında; öne çıkma tekil ambalajın odak gücüne bağlı kalıyor.`
        : `Raf dikkat payı ${shelf.averageMainShare}% ile paritenin altında; rakipler ilk bakışı daha çok topluyor.`;
  return {
    key: "attention_standout",
    name: "Attention & Stand-out",
    methodologyName: "İlgi Çekici Ol",
    score,
    breakdown,
    narrative,
    confidence: pred.isMock ? "low" : "high",
    singlePackAttention,
  };
}

/* ------------------------------------------------------------------ */
/* 5. CONSUMER DISTANCE CLARITY                                        */
/* ------------------------------------------------------------------ */
export async function scoreDistanceClarity(
  pack: ImageAsset,
  pred: AttentionPrediction,
  main: PackFeatures,
  competitors: PackFeatures[],
): Promise<{ criterion: CriterionResult; distance: DistanceClarity }> {
  const [sim5, sim3, sim1] = await Promise.all([simulateDistance(pack, "5m"), simulateDistance(pack, "3m"), simulateDistance(pack, "1m")]);
  const logo = pred.aois.find((a) => a.role === "logo");
  const claim = pred.aois.find((a) => a.role === "claim");
  const logoArea = logo ? (logo.width * logo.height) / 100 : 8;
  const claimArea = claim ? (claim.width * claim.height) / 100 : 8;
  const colorContrastToCompetitors = competitors.length ? competitors.reduce((s, c) => s + colorDistance(main, c), 0) / competitors.length : 0.4;

  // 5 m — brand block: strength of the dominant colour block + how different it is from neighbours.
  const brandBlock = clamp(30 + main.dominantHueShare * 55 + colorContrastToCompetitors * 45 + main.saturation * 20);
  // 3 m — logo: size of the logo area + attention it captures.
  const logoScore = clamp(25 + Math.min(logoArea, 18) * 2.6 + (logo?.attentionShare ?? 15) * 1.4);
  // 1 m — purchase message: claim size + attention + clarity.
  const messageScore = clamp(15 + Math.min(claimArea, 16) * 2.2 + (claim?.attentionShare ?? 10) * 2 + (pred.clarityScore ?? 60) * 0.3);

  const conf = pred.isMock ? ("low" as const) : ("medium" as const);
  const stages: DistanceStageResult[] = [
    {
      stage: "5m",
      label: "Brand Block",
      question: "Tüketici uzaktan markanın oluşturduğu renk/tasarım bloğunu görüyor mu?",
      simulation: sim5,
      score: brandBlock,
      legibleAois: pred.aois.filter((a) => a.role === "product_visual" || a.role === "brand_block").map((a) => a.id),
      note: brandBlock >= 65 ? "Dominant renk bloğu 5 metrede rakiplerden ayrışan bir alan yaratıyor." : "Renk bloğu 5 metrede zayıf; yan yana geldiğinde rakiplerle karışma riski var.",
      confidence: conf,
    },
    {
      stage: "3m",
      label: "Logo / Brand Recognition",
      question: "Logo 3 metrede açıkça fark ediliyor mu?",
      simulation: sim3,
      score: logoScore,
      legibleAois: pred.aois.filter((a) => a.role === "logo" || a.role === "product_visual").map((a) => a.id),
      note: logoScore >= 65 ? "Logo alanı 3 metrede okunur büyüklükte ve yeterli dikkat alıyor." : `Logo 3 metre seviyesinde zayıf: alan ${Math.round(logoArea)}% ve dikkat payı ${logo?.attentionShare ?? "—"}%.`,
      confidence: conf,
    },
    {
      stage: "1m",
      label: "Purchase Message",
      question: "Ana fayda, claim ve varyant 1 metrede okunuyor mu?",
      simulation: sim1,
      score: messageScore,
      legibleAois: pred.aois.map((a) => a.id),
      note: messageScore >= 65 ? "Satın alma mesajı 1 metrede okunabilir ve dikkat çekiyor." : "Satın alma mesajı 1 metrede yeterince görünmüyor; karar anında ikna katmanı zayıf kalıyor.",
      confidence: conf,
    },
  ];
  const breakdown: CriterionBreakdownItem[] = [
    { key: "brand_block_5m", label: "5 m · Brand Block", weight: 30, score: brandBlock, note: stages[0].note },
    { key: "logo_3m", label: "3 m · Logo", weight: 30, score: logoScore, note: stages[1].note },
    { key: "purchase_message_1m", label: "1 m · Purchase Message", weight: 40, score: messageScore, note: stages[2].note },
  ];
  const score = weighted(breakdown);
  return {
    criterion: {
      key: "consumer_distance_clarity",
      name: "Consumer Distance Clarity",
      methodologyName: "Tüketici Odaklı Ol",
      score,
      breakdown,
      narrative: `5 m ${brandBlock} · 3 m ${logoScore} · 1 m ${messageScore}. ${messageScore < logoScore && messageScore < brandBlock ? "En zayıf katman satın alma mesajı: tüketici ürüne yaklaştığında ikna katmanı geç devreye giriyor." : brandBlock < 60 ? "En zayıf katman marka bloğu: koridor mesafesinden ambalaj bir blok oluşturmuyor." : "Üç mesafe katmanı dengeli çalışıyor."}`,
      confidence: conf,
    },
    distance: { stages, score },
  };
}
