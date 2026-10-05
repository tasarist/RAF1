import "server-only";
import type { AttentionPrediction, CriterionResult, DistanceClarity, FiveSeReport, Issue, ProjectMeta, Recommendation, ShelfPerformance } from "@/lib/types";
import { clamp, PARITY_SHARE } from "./scoring";

export interface EngineInput {
  project: ProjectMeta;
  criteria: {
    uniqueness: CriterionResult;
    continuity: CriterionResult;
    productClarity: CriterionResult;
    attention: CriterionResult & { singlePackAttention: number };
    distance: CriterionResult;
  };
  singlePack: AttentionPrediction;
  shelf: ShelfPerformance;
  distance: DistanceClarity;
  aoiSource: "vision_model" | "heuristic";
  isMock: boolean;
}

function share(pred: AttentionPrediction, role: string) {
  return pred.aois.find((a) => a.role === role)?.attentionShare ?? null;
}

export function overallScore(criteria: CriterionResult[]): { score: number; counted: 4 | 5 } {
  const scored = criteria.filter((c) => typeof c.score === "number") as Array<CriterionResult & { score: number }>;
  const counted = scored.length >= 5 ? 5 : 4;
  return { score: clamp(scored.reduce((s, c) => s + c.score, 0) / (scored.length || 1)), counted };
}

/**
 * Rule-based 5SE engine. Produces the same JSON contract as the OpenAI engine so the UI never cares
 * which one ran. Every issue is tied to a measured value (evidence → cause → recommendation).
 */
export function buildRuleBasedReport(input: EngineInput): FiveSeReport {
  const { criteria, singlePack, shelf, distance, project } = input;
  const list = [criteria.uniqueness, criteria.continuity, criteria.productClarity, criteria.attention, criteria.distance];
  const { score: overall, counted } = overallScore(list);

  const logoShare = share(singlePack, "logo");
  const claimShare = share(singlePack, "claim");
  const visualShare = share(singlePack, "product_visual");
  const nameShare = share(singlePack, "product_name");
  const stage = (s: "5m" | "3m" | "1m") => distance.stages.find((x) => x.stage === s)!;

  const critical: Issue[] = [];
  const important: Issue[] = [];
  const opportunities: Issue[] = [];

  // --- Product clarity / message
  const benefit = criteria.productClarity.breakdown.find((b) => b.key === "benefit_promise_clarity")?.score ?? 60;
  if (benefit < 55) {
    critical.push({
      severity: "critical",
      title: "Ana ürün vaadi yeterince hızlı anlaşılmıyor",
      evidence: `Ana vaat alanı dikkatin yalnızca ${claimShare ?? "—"}%'ini alıyor; ürün görseli ${visualShare ?? "—"}% ile baskın.`,
      cause: "Vaat metni ürün görseline göre küçük ve düşük kontrastlı; dikkat hiyerarşisinde üçüncü sıraya düşüyor.",
      recommendation: "Ana vaadi tek, kısa bir satış cümlesine indirgeyip ürün görselinin hemen altında yüksek kontrastlı bir alan olarak kur.",
      relatedCriteria: ["product_clarity", "consumer_distance_clarity"],
    });
  } else if (benefit < 70) {
    important.push({
      severity: "important",
      title: "Ana vaat okunuyor ama ikna gücü sınırlı",
      evidence: `Vaat dikkat payı ${claimShare ?? "—"}%, Clarity Score ${singlePack.clarityScore ?? "—"}.`,
      cause: "Vaat alanı diğer bilgi öğeleriyle aynı görsel ağırlıkta; öncelik sinyali vermiyor.",
      recommendation: "Vaat alanını ikincil bilgilerden ayır; bir renk zemini veya boşluk ile tekleştir.",
      relatedCriteria: ["product_clarity"],
    });
  }

  // --- Shelf performance
  if (shelf.shelfPerformanceIndex < 90) {
    critical.push({
      severity: "critical",
      title: "Rafta dikkat payı paritenin altında",
      evidence: `Üç dizilim ortalaması ${shelf.averageMainShare}% (parite ${PARITY_SHARE}%), Shelf Performance Index ${shelf.shelfPerformanceIndex}.`,
      cause: `${project.competitor1BrandName} ve ${project.competitor2BrandName} daha yüksek kontrast veya daha büyük renk bloğu ile ilk bakışı topluyor.`,
      recommendation: "Ambalajın dominant rengini ve ana odak noktasını güçlendir; küçük dekoratif öğeleri azaltarak tek bir güçlü odak yarat.",
      relatedCriteria: ["attention_standout", "uniqueness"],
    });
  } else if (shelf.shelfPerformanceIndex < 100) {
    important.push({
      severity: "important",
      title: "Raf performansı paritenin hemen altında",
      evidence: `Shelf Performance Index ${shelf.shelfPerformanceIndex}; en zayıf dizilim ${shelf.tests.reduce((a, b) => (a.mainAttentionShare < b.mainAttentionShare ? a : b)).layout.replace("main_", "ana ambalaj ")}.`,
      cause: "Konuma göre dikkat payı dalgalanıyor; kenar pozisyonda rakip blokları ambalajı gölgeliyor.",
      recommendation: "Renk bloğunu kenarlara kadar taşıyarak konumdan bağımsız görünürlük sağla.",
      relatedCriteria: ["attention_standout"],
    });
  }

  // --- Logo / 3 m
  if (stage("3m").score < 60) {
    important.push({
      severity: "important",
      title: "Logo 3 metre seviyesinde zayıf",
      evidence: `3 m skoru ${stage("3m").score}; logo dikkat payı ${logoShare ?? "—"}%.`,
      cause: "Logo alanı ambalaj yüzeyine göre küçük ya da çevresindeki görsel yoğunluk logoyu boğuyor.",
      recommendation: "Logo boyutunu artır veya logo çevresinde sakin bir koruma alanı oluştur; logo ile ürün adı arasındaki rekabeti azalt.",
      relatedCriteria: ["consumer_distance_clarity", "attention_standout"],
    });
  }

  // --- 5 m brand block
  if (stage("5m").score < 60) {
    important.push({
      severity: "important",
      title: "5 metrede marka bloğu oluşmuyor",
      evidence: `5 m skoru ${stage("5m").score}; dominant renk bloğu zayıf veya rakiplerle aynı tonda.`,
      cause: "Renk sistemi parçalı; koridor mesafesinden tek bir blok gibi okunmuyor.",
      recommendation: "Tek bir dominant marka rengini ambalaj yüzeyinin büyük bölümünde kullan; yan yana facing'lerde blok etkisi yarat.",
      relatedCriteria: ["consumer_distance_clarity", "uniqueness"],
    });
  }

  // --- Uniqueness
  if ((criteria.uniqueness.score ?? 0) < 50) {
    important.push({
      severity: "important",
      title: "Rakiplerden görsel ayrışma düşük",
      evidence: `Uniqueness ${criteria.uniqueness.score}; renk/yerleşim mesafesi rakiplere yakın.`,
      cause: "Kategori kodları neredeyse aynı biçimde tekrar ediliyor; ayırıcı marka varlığı zayıf.",
      recommendation: "Kategori kodunu koru ama bir ayırıcı varlık (özgün renk bloğu, sembol veya yapı) ekleyip bunu tüm SKU'lara taşı.",
      relatedCriteria: ["uniqueness"],
    });
  } else if ((criteria.uniqueness.score ?? 0) < 70) {
    opportunities.push({
      severity: "opportunity",
      title: "Ayırıcı marka varlığı daha güçlü sahiplenilebilir",
      evidence: `Uniqueness ${criteria.uniqueness.score}.`,
      cause: "Ayrışma var ancak tek bir hafıza yapısı etrafında toplanmıyor.",
      recommendation: "En güçlü görsel öğeyi (renk, şekil veya sembol) büyütüp tekrar ederek marka imzasına dönüştür.",
      relatedCriteria: ["uniqueness"],
    });
  }

  // --- Hierarchy / clutter
  if (singlePack.focusScore !== undefined && singlePack.focusScore < 50) {
    important.push({
      severity: "important",
      title: "Dikkat dağınık, tek bir odak yok",
      evidence: `Focus Score ${singlePack.focusScore}.`,
      cause: "Çok sayıda eş ağırlıklı öğe dikkati bölüyor.",
      recommendation: "İkincil ikon ve bilgi alanlarını küçült; yüzeyde tek bir birincil odak bırak.",
      relatedCriteria: ["attention_standout", "product_clarity"],
    });
  }
  if ((singlePack.clarityScore ?? 100) < 65) {
    opportunities.push({
      severity: "opportunity",
      title: "Alt bilgi alanı sadeleştirilebilir",
      evidence: `Clarity Score ${singlePack.clarityScore}.`,
      cause: "Metin miktarı ve küçük öğeler algısal yükü artırıyor.",
      recommendation: "Zorunlu olmayan metinleri arka yüze taşı; ön yüzde üç mesaj katmanını (marka, ürün, vaat) koru.",
      relatedCriteria: ["product_clarity"],
    });
  }
  if ((visualShare ?? 0) > 45) {
    opportunities.push({
      severity: "opportunity",
      title: "Ürün görseli dikkati tekeline alıyor",
      evidence: `Ürün görseli ${visualShare}% dikkat payı; logo ${logoShare ?? "—"}%, vaat ${claimShare ?? "—"}%.`,
      cause: "Görsel çekici ama marka ve mesaj katmanları onun gölgesinde kalıyor.",
      recommendation: "Görselin ağırlığını koruyup logo ve vaat için kontrast alanı aç; görselin dikkati logoya akmasını sağlayacak yön kur.",
      relatedCriteria: ["attention_standout", "product_clarity"],
    });
  }
  if (!critical.length && !important.length) {
    opportunities.push({
      severity: "opportunity",
      title: "Sistem sağlıklı; ince ayar alanı",
      evidence: `5SE ${overall}/100, tüm kriterler eşik üzerinde.`,
      cause: "Ölçülen sinyaller arasında baskın bir problem yok.",
      recommendation: "Skor artışı için en düşük kriter üzerinde çalışın ve SKU ailesi ile test edin.",
      relatedCriteria: [],
    });
  }

  const strengths: string[] = [];
  if (shelf.shelfPerformanceIndex >= 100) strengths.push(`Rafta ortalama ${shelf.averageMainShare}% dikkat payı ile parite üzerinde (SPI ${shelf.shelfPerformanceIndex}).`);
  if ((criteria.uniqueness.score ?? 0) >= 65) strengths.push("Renk ve yerleşim sistemi rakiplerden ayrışan bir karakter kuruyor.");
  if ((singlePack.focusScore ?? 0) >= 65) strengths.push(`Focus Score ${singlePack.focusScore}: dikkat kontrollü biçimde az sayıda alanda toplanıyor.`);
  if ((singlePack.clarityScore ?? 0) >= 70) strengths.push(`Clarity Score ${singlePack.clarityScore}: tasarım algısal olarak kolay çözülüyor.`);
  if (stage("5m").score >= 65) strengths.push("Dominant renk bloğu 5 metrede ayrışan bir alan yaratıyor.");
  if ((logoShare ?? 0) >= 18) strengths.push(`Logo ${logoShare}% dikkat payı ile marka tanınmasını destekliyor.`);
  if (!strengths.length) strengths.push(`Ürün adı ${nameShare ?? "—"}% dikkat payı ile ürünün ne olduğu okunuyor.`);

  const ranked = [...critical, ...important, ...opportunities];
  const recommendations: Recommendation[] = ranked.slice(0, 5).map((issue, i) => ({
    priority: i + 1,
    action: issue.recommendation,
    expectedEffect: issue.relatedCriteria.map((c) => labelFor(c)),
  }));

  const sortedCriteria = list.filter((c) => typeof c.score === "number") as Array<CriterionResult & { score: number }>;
  const strongest = sortedCriteria.reduce((a, b) => (a.score >= b.score ? a : b));
  const weakest = sortedCriteria.reduce((a, b) => (a.score <= b.score ? a : b));

  const optimized_design = {
    objective: `Marka karakterini koruyarak ${weakest.name} kriterini güçlendir; ${ranked[0]?.title.toLowerCase() ?? "ana problemi"} çöz.`,
    preserve: ["Ambalaj formu, oran ve perspektif", "Logo ve marka rengi", "Ürün görseli konsepti", "Mevcut yerleşim mantığı"],
    change: ranked.slice(0, 4).map((r) => r.recommendation),
    imageGenerationPrompt: buildImagePrompt(project, ranked.slice(0, 4).map((r) => r.recommendation)),
  };

  const notes = [
    input.isMock ? "Mock modu: attention verileri sezgisel saliency modelinden üretildi, gerçek eye-tracking tahmini değildir." : "Attention verileri sağlayıcıdan alındı.",
    input.aoiSource === "heuristic" ? "AOI kutuları vision model yerine standart ambalaj yerleşimi varsayımıyla konumlandırıldı; AOI bazlı yorumların güveni düşüktür." : "AOI kutuları vision model ile tespit edildi.",
    `Overall 5SE ${counted} kriter ortalamasıdır${counted === 4 ? " (Continuity & Consistency N/A)" : ""}.`,
  ];

  return {
    scores: {
      uniqueness: criteria.uniqueness.score ?? 0,
      continuity_consistency: criteria.continuity.score,
      product_clarity: criteria.productClarity.score ?? 0,
      single_pack_attention: criteria.attention.singlePackAttention,
      shelf_performance_index: shelf.shelfPerformanceIndex,
      attention_standout: criteria.attention.score ?? 0,
      consumer_distance_clarity: criteria.distance.score ?? 0,
      overall_5se_score: overall,
    },
    criteriaCounted: counted,
    criteria: list,
    summary: {
      overall_assessment: buildAssessment(input, overall, strongest, weakest),
      strongest_area: `${strongest.name} (${strongest.score})`,
      weakest_area: `${weakest.name} (${weakest.score})`,
    },
    strengths,
    issues: { critical, important, opportunities },
    recommendations,
    optimized_design,
    engine: { name: "rule_based_mock", confidence: input.isMock ? "low" : "medium", notes },
  };
}

function buildAssessment(input: EngineInput, overall: number, strongest: CriterionResult, weakest: CriterionResult) {
  const { shelf, singlePack, project } = input;
  const visual = share(singlePack, "product_visual");
  const logo = share(singlePack, "logo");
  const claim = share(singlePack, "claim");
  const shelfPhrase =
    shelf.shelfPerformanceIndex >= 100
      ? `rafta ${shelf.averageMainShare}% dikkat payı ile parite üzerinde (SPI ${shelf.shelfPerformanceIndex})`
      : `rafta ${shelf.averageMainShare}% dikkat payı ile paritenin altında (SPI ${shelf.shelfPerformanceIndex})`;
  const attentionPhrase =
    (visual ?? 0) > (logo ?? 0) + (claim ?? 0)
      ? `Tekil ambalajda dikkatin büyük bölümü ürün görseline gidiyor (${visual}%); logo ${logo ?? "—"}% ve ana vaat ${claim ?? "—"}% ile düşük kalıyor. Bu nedenle görünürlük ${shelf.shelfPerformanceIndex >= 100 ? "güçlü olsa da" : "zayıf kalırken"} marka ve satış mesajı yeterince etkin değil.`
      : `Tekil ambalajda dikkat marka ve mesaj katmanlarında toplanıyor (logo ${logo ?? "—"}%, vaat ${claim ?? "—"}%); bu, raf görünürlüğünü satın alma gerekçesine bağlıyor.`;
  return `${project.brandName} ${project.productName} ambalajı 5SE ${overall}/100 aldı ve ${shelfPhrase}. ${attentionPhrase} En güçlü alan ${strongest.name}, en zayıf alan ${weakest.name}; iyileştirme önceliği buradan başlamalı.`;
}

function labelFor(key: CriterionResult["key"]) {
  const map: Record<CriterionResult["key"], string> = {
    uniqueness: "Uniqueness ↑",
    continuity_consistency: "Continuity ↑",
    product_clarity: "Product Clarity ↑",
    attention_standout: "Attention & Stand-out ↑",
    consumer_distance_clarity: "Distance Clarity ↑",
  };
  return map[key];
}

export function buildImagePrompt(project: ProjectMeta, changes: string[]) {
  return [
    `Edit ONLY the flat 2D artwork of this ${project.category} packaging for the brand "${project.brandName}" (product: ${project.productName}).`,
    "Keep the exact package silhouette, proportions, perspective, lighting, cap/closure, camera angle and canvas size.",
    "Preserve the brand logo, brand colour and product visual concept. Do not invent a new brand or a new package shape.",
    "Apply only these improvements:",
    ...changes.map((c, i) => `${i + 1}. ${c}`),
    "Increase logo visibility and the readability of the main purchase message. Reduce visual competition around them.",
    "Output a commercially realistic packaging front view. No people, no hands, no extra objects, no text other than what already exists on the pack.",
  ].join("\n");
}
