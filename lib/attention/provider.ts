import type { AreaOfInterest, AttentionPrediction, ImageAsset } from "@/lib/types";

/**
 * Provider-agnostic visual attention contract.
 *
 * The 5SE engine only depends on this interface, so Attention Insight can be swapped for
 * another predictive eye-tracking vendor without touching scoring or UI code.
 */
export interface AttentionProvider {
  readonly name: "mock" | "attention_insight" | "feng_gui";

  /**
   * Single design (pack) prediction. Should return heatmap, focus map, focus score and clarity
   * score when the vendor supports them, plus per-AOI attention share for the supplied boxes.
   */
  predictSinglePack(image: ImageAsset, aois: Omit<AreaOfInterest, "attentionShare">[], label: string): Promise<AttentionPrediction>;

  /**
   * Shelf prediction. `aois` are the three facings (main / competitor 1 / competitor 2) so the
   * provider can return attention share per brand.
   */
  predictShelf(image: ImageAsset, aois: Omit<AreaOfInterest, "attentionShare">[], label: string): Promise<AttentionPrediction>;
}

export type AoiInput = Omit<AreaOfInterest, "attentionShare">;
