import type { FiveSeAnalysisResult, ProjectMeta, ShelfTestResult } from "./types";

function hash(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

function clamp(n: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Math.round(n)));
}

export function createMockAnalysis(project: ProjectMeta, fileNames: string[]): FiveSeAnalysisResult {
  const seed = hash([
    project.category,
    project.brandName,
    project.productName,
    project.competitor1BrandName,
    project.competitor2BrandName,
    ...fileNames,
  ].join("|"));
  const swing = (offset: number, range: number) => ((seed >> offset) % range) - Math.floor(range / 2);

  const uniqueness = clamp(72 + swing(1, 18));
  const productClarity = clamp(68 + swing(4, 22));
  const singlePackAttention = clamp(74 + swing(7, 18));
  const distance = clamp(70 + swing(10, 20));

  const base = 33.3;
  const shares = [
    clamp(base + swing(12, 12), 25, 45),
    clamp(base + swing(15, 12), 25, 45),
    clamp(base + swing(18, 12), 25, 45),
  ];

  const shelfTests: ShelfTestResult[] = shares.map((main, index) => {
    const remaining = 100 - main;
    const c1 = Math.round(remaining * (0.48 + (((seed >> (21 + index)) % 9) / 100)) * 10) / 10;
    const c2 = Math.round((100 - main - c1) * 10) / 10;
    const layouts: ShelfTestResult["layout"][] = ["main_left", "main_center", "main_right"];
    return {
      layout: layouts[index],
      mainAttentionShare: Math.round(main * 10) / 10,
      competitor1AttentionShare: c1,
      competitor2AttentionShare: c2,
    };
  });

  const avgShare = shelfTests.reduce((sum, x) => sum + x.mainAttentionShare, 0) / shelfTests.length;
  const shelfPerformanceIndex = Math.round((avgShare / 33.3) * 100);
  const normalizedShelf = clamp(50 + (shelfPerformanceIndex - 100) * 1.25);
  const attentionStandout = clamp(singlePackAttention * 0.4 + normalizedShelf * 0.6);
  const overall = clamp((uniqueness + productClarity + attentionStandout + distance) / 4);

  return {
    source: "mock",
    scores: {
      uniqueness,
      continuityConsistency: null,
      productClarity,
      singlePackAttention,
      shelfPerformanceIndex,
      attentionStandout,
      consumerDistanceClarity: distance,
      overall5seScore: overall,
    },
    summary: `${project.brandName} ${project.productName} tasarımı demo simülasyonda ${overall}/100 genel 5SE skoru üretti. ${project.competitor1BrandName} ve ${project.competitor2BrandName} ile raf karşılaştırmasında tekil ambalaj odağı ve dikkat payı birlikte değerlendirildi. En yüksek etki alanı mesaj hiyerarşisini ve marka görünürlüğünü aynı anda güçlendirmek olacaktır.`,
    strengths: [
      `${project.brandName} için ana görsel hiyerarşi ilk bakışta belirgin bir odak yaratıyor.`,
      `${project.competitor1BrandName} ve ${project.competitor2BrandName} karşısında raf dikkat payı izlenebilir bir seviyede kalıyor.`,
      "Genel renk ve grafik sistemi ambalajı kategoride ayırabilecek potansiyel taşıyor.",
    ],
    criticalIssues: [
      productClarity < 65 ? "Ana ürün vaadi yeterince hızlı anlaşılmıyor." : "Kritik seviyede belirgin bir mesaj problemi simüle edilmedi.",
    ],
    importantIssues: [
      distance < 70 ? "3 m logo ve 1 m satın alma mesajı hiyerarşisi güçlendirilmeli." : "Mesafe hiyerarşisi korunurken logo ve ana vaat arasındaki rekabet azaltılabilir.",
    ],
    opportunities: ["Ürün görseli, logo ve ana vaat arasındaki dikkat paylaşımı daha kontrollü hale getirilebilir."],
    recommendations: [
      "Ana vaadi daha kısa ve daha görünür bir satış mesajına dönüştür.",
      `${project.brandName} logosu çevresindeki görsel rekabeti azaltarak marka tanınmasını hızlandır.`,
      `${project.competitor1BrandName} ve ${project.competitor2BrandName} ile benzer kategori kodlarını korurken özgün grafik varlıkların ağırlığını artır.`,
    ],
    shelfTests,
    singlePackAttention: {
      provider: "mock",
      focusScore: singlePackAttention,
      clarityScore: clamp(72 + swing(23, 18)),
      aoi: {
        logo: clamp(18 + swing(25, 10)),
        productName: clamp(21 + swing(27, 12)),
        mainClaim: clamp(13 + swing(29, 10)),
        productVisual: clamp(31 + swing(31, 12)),
      },
    },
  };
}
