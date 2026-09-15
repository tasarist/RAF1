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
  const complexityEfficiency = typeof singlePackAttention.complexityScore === "number"
    ? 100 - singlePackAttention.complexityScore
    : undefined;
  const liveSinglePackScore = clamp(average([
    singlePackAttention.overallScore,
    singlePackAttention.focusScore,
    singlePackAttention.clarityScore,
    singlePackAttention.memoryScore,
    singlePackAttention.balanceScore,
    singlePackAttention.approachScore,
    complexityEfficiency,
  ], base.scores.singlePackAttention));
  const liveClarity = clamp(singlePackAttention.clarityScore ?? base.scores.productClarity);
  const liveFocus = clamp(singlePackAttention.focusScore ?? liveSinglePackScore);
  const liveOverall = singlePackAttention.overallScore;
  const liveMemory = singlePackAttention.memoryScore;
  const liveApproach = singlePackAttention.approachScore;
  const liveWithdraw = singlePackAttention.withdrawScore;
  const liveComplexity = singlePackAttention.complexityScore;
  const productClarity = clamp(base.scores.productClarity * 0.35 + liveClarity * 0.65);
  const consumerDistanceClarity = clamp(base.scores.consumerDistanceClarity * 0.45 + liveClarity * 0.35 + liveFocus * 0.2);
  const normalizedShelf = clamp(50 + (base.scores.shelfPerformanceIndex - 100) * 1.25);
  const attentionStandout = clamp(liveSinglePackScore * 0.4 + normalizedShelf * 0.6);
  const overall5seScore = clamp((base.scores.uniqueness + productClarity + attentionStandout + consumerDistanceClarity) / 4);

  const criticalIssues: string[] = [];
  if (liveClarity < 55) criticalIssues.push("Feng-GUI netlik skoru düşük; tüketicinin ana mesajı hızlı çözmesi zor olabilir.");
  if (liveFocus < 45) criticalIssues.push("Feng-GUI odak skoru düşük; dikkat tek bir güçlü alanda toplanmıyor.");
  if (typeof liveComplexity === "number" && liveComplexity > 75) criticalIssues.push("Görsel karmaşıklık yüksek; ambalaj satış mesajını baskılayabilir.");
  if (typeof liveWithdraw === "number" && liveWithdraw > 60) criticalIssues.push("Feng-GUI withdraw değeri yüksek; görsel dil tüketicide uzaklaşma sinyali üretebilir.");
  if (!criticalIssues.length) criticalIssues.push("Canlı tekil analizde kritik seviyede bir dikkat problemi görünmüyor.");

  const importantIssues = [
    "Raf performansı şimdilik demo simülasyonla gösteriliyor; gerçek raf görseli üretim motoru sonraki adımda bağlanmalı.",
    ...base.importantIssues.slice(0, 1),
  ];
  if (typeof liveOverall === "number" && liveOverall < 65) {
    importantIssues.push("Feng-GUI genel skoru orta seviyede; tasarımın ilk bakış etkisi güçlendirilebilir.");
  }
  if (typeof liveMemory === "number" && liveMemory < 55) {
    importantIssues.push("Hafıza skoru düşük; ambalajın akılda kalıcılığı tasarım optimizasyonunda ayrıca ele alınmalı.");
  }
  if (typeof liveApproach === "number" && liveApproach < 55) {
    importantIssues.push("Yaklaşma skoru düşük; ambalaj tüketiciyi rafa yaklaştıracak kadar davetkar görünmeyebilir.");
  }

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
      typeof liveMemory === "number" ? `Hafıza skoru ${liveMemory}/100; bu değer ambalajın akılda kalma potansiyelini gösterir.` : "Feng-GUI hafıza verisi geldikçe akılda kalma potansiyeli ayrıca izlenecek.",
      ...base.strengths.slice(0, 1),
    ],
    criticalIssues,
    importantIssues,
    recommendations: [
      "Feng-GUI ısı haritasındaki en sıcak alanlar logo, ürün adı ve ana vaat hiyerarşisiyle karşılaştırılmalı.",
      "Genel, odak, netlik ve karmaşıklık skorları birlikte okunarak tasarımın hem dikkat çekme hem de kolay anlaşılma dengesi optimize edilmeli.",
      ...base.recommendations,
    ],
    singlePackAttention,
  };
}
