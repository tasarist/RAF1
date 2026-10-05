import "server-only";
import type { AttentionPrediction, ImageAsset } from "@/lib/types";
import { computeSaliency, hotspotsFrom, shareInBox } from "@/lib/image/saliency";
import type { AoiInput, AttentionProvider } from "../provider";

function clamp(n: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Math.round(n)));
}

/**
 * Mock attention provider.
 *
 * Uses the heuristic saliency model so that heatmaps and AOI shares follow the uploaded artwork.
 * Focus/Clarity scores are derived heuristically and are clearly marked as mock in every result.
 * No network calls, no API keys, zero transactions.
 */
export class MockAttentionProvider implements AttentionProvider {
  readonly name = "mock" as const;

  async predictSinglePack(image: ImageAsset, aois: AoiInput[]): Promise<AttentionPrediction> {
    const map = await computeSaliency(image);
    // Focus: concentrated saliency → higher focus. Clarity: less edge clutter → higher clarity.
    const focusScore = clamp(38 + map.concentration * 58);
    const clarityScore = clamp(88 - map.edgeDensity * 52);
    return {
      provider: "mock",
      focusScore,
      clarityScore,
      clarityDescription: "Mock: kontrast/doygunluk sezgiselinden türetilmiş netlik tahmini.",
      aois: aois.map((a) => ({ ...a, attentionShare: shareInBox(map, a) })),
      hotspots: hotspotsFrom(map),
      transactionsUsed: 0,
      isMock: true,
    };
  }

  async predictShelf(image: ImageAsset, aois: AoiInput[]): Promise<AttentionPrediction> {
    const map = await computeSaliency(image, 60, 30);
    const raw = aois.map((a) => ({ ...a, attentionShare: shareInBox(map, a) }));
    // Normalize the three facings to 100 so the Attention Share reads like the real AOI report.
    const total = raw.reduce((s, a) => s + (a.attentionShare ?? 0), 0) || 1;
    return {
      provider: "mock",
      aois: raw.map((a) => ({ ...a, attentionShare: Math.round(((a.attentionShare ?? 0) / total) * 1000) / 10 })),
      hotspots: hotspotsFrom(map, 18),
      transactionsUsed: 0,
      isMock: true,
    };
  }
}
