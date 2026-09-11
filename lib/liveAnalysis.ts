import { createMockAnalysis } from "./mockAnalysis";
import type { FiveSeAnalysisResult, ProjectMeta, SinglePackAttentionResult } from "./types";

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function average(values: Array<number | undefined>, fallback: number) {
  const clean = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (!clean.length) return fallback;
  return clean.reduce((sum, value) => sum + value, 0) / clean.length;
}

export function createFengGuiBackedAnalysis(
  project: ProjectMeta,
  fileNames: string[],
  singlePackAttention: SinglePackAttentionResult,
): FiveSeAnalysisResult {
  const base = createMockAnalysis(project, fileNames);
  const liveSinglePackScore = clamp(average([
    singlePackAttention.overallScore,
    singlePackAttention.focusScore,
    singlePackAttention.clarityScore,
  ], base.scores.singlePackAttention));
  const liveClarity = clamp(singlePackAttention.clarityScore ?? base.scores.productClarity);
  const liveFocus = clamp(singlePackAttention.focusScore ?? liveSinglePackScore);
  const liveComplexity = singlePackAttention.complexityScore;
  const productClarity = clamp(base.scores.productClarity * 0.35 + liveClarity * 0.65);
  const consumerDistanceClarity = clamp(base.scores.consumerDistanceClarity * 0.55 + liveClarity * 0.45);
  const normalizedShelf = clamp(50 + (base.scores.shelfPerformanceIndex - 100) * 1.25);
  const attentionStandout = clamp(liveSinglePackScore * 0.4 + normalizedShelf * 0.6);
  const overall5seScore = clamp((base.scores.uniqueness + productClarity + attentionStandout + consumerDistanceClarity) / 4);

  const criticalIssues: string[] = [];
  if (liveClarity < 55) criticalIssues.push("Feng-GUI netlik skoru düşük; tüketicinin ana mesajı hızlı çözmesi zor olabilir.");
  if (liveFocus < 45) criticalIssues.push("Feng-GUI odak skoru düşük; dikkat tek bir güçlü alanda toplanmıyor.");
  if (typeof liveComplexity === "number" && liveComplexity > 75) criticalIssues.push("Görsel karmaşıklık yüksek; ambalaj satış mesajını baskılayabilir.");
  if (!criticalIssues.length) criticalIssues.push("Canlı tekil analizde kritik seviyede bir dikkat problemi görünmüyor.");

  return {
    ...base,
    source: "feng_gui",
    scores: {
      ...base.scores,
      productClarity,
      singlePackAttention: liveSinglePackScore,
      attentionStandout,
      consumerDistanceClarity,
      overall5seScore,
    },
    summary: `${project.brandName} ${project.productName} için tekil ambalaj dikkati Feng-GUI canlı verisiyle analiz edildi. Raf karşılaştırması bu sprintte henüz simülasyon modunda; canlı raf motoru eklendiğinde ${project.competitor1BrandName} ve ${project.competitor2BrandName} ile gerçek raf payı ayrıca ölçülecek.`,
    strengths: [
      `Feng-GUI canlı analizinde tekil ambalaj dikkat skoru ${liveSinglePackScore}/100 olarak işlendi.`,
      `Netlik skoru ${liveClarity}/100; bu değer ürün mesajı ve mesafe netliği hesaplamasına yansıtıldı.`,
      ...base.strengths.slice(0, 1),
    ],
    criticalIssues,
    importantIssues: [
      "Raf performansı şimdilik demo simülasyonla gösteriliyor; gerçek raf görseli üretim motoru sonraki adımda bağlanmalı.",
      ...base.importantIssues.slice(0, 1),
    ],
    recommendations: [
      "Feng-GUI ısı haritasındaki en sıcak alanlar logo, ürün adı ve ana vaat hiyerarşisiyle karşılaştırılmalı.",
      ...base.recommendations,
    ],
    singlePackAttention,
  };
}
