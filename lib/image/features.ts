import "server-only";
import type { ImageAsset } from "@/lib/types";
import { sampleGrid } from "./processing";
import { computeSaliency, type SaliencyMap } from "./saliency";

/**
 * Cheap, deterministic visual features used by the rule-based engine to compare packs.
 * These are heuristics — they inform uniqueness / continuity judgements but are never presented
 * as eye-tracking metrics.
 */
export interface PackFeatures {
  /** 12-bin hue histogram weighted by saturation, normalized to 1. */
  hueHistogram: number[];
  /** Mean saturation 0–1 and mean luminance 0–1. */
  saturation: number;
  luminance: number;
  /** Share of pixels belonging to the dominant hue bin (colour-block strength). */
  dominantHueShare: number;
  dominantHue: number;
  /** Low-res luminance thumbnail 12×12 for structural comparison. */
  structure: number[];
  saliency: SaliencyMap;
}

export async function extractFeatures(asset: ImageAsset): Promise<PackFeatures> {
  const grid = await sampleGrid(asset, 48, 48);
  const { cols, rows } = grid;
  const { data } = await (await import("sharp")).default(Buffer.from(asset.dataUrl.split(",")[1], "base64"))
    .resize(cols, rows, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const hist = new Array(12).fill(0);
  let satSum = 0;
  let lumSum = 0;
  let weightSum = 0;
  for (let i = 0; i < cols * rows; i++) {
    const r = data[i * 3] / 255;
    const g = data[i * 3 + 1] / 255;
    const b = data[i * 3 + 2] / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    if (d > 0) {
      if (max === r) h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h = (h * 60 + 360) % 360;
    }
    const s = max === 0 ? 0 : d / max;
    // ignore near-white / near-black background pixels for hue statistics
    if (s > 0.15 && max > 0.12) {
      hist[Math.floor(h / 30) % 12] += s;
      weightSum += s;
    }
    satSum += s;
    lumSum += grid.lum[i];
  }
  const hueHistogram = hist.map((v) => (weightSum ? v / weightSum : 1 / 12));
  const dominantIndex = hueHistogram.indexOf(Math.max(...hueHistogram));

  // 12×12 structure thumbnail from the 48×48 luminance grid
  const structure: number[] = [];
  for (let y = 0; y < 12; y++) {
    for (let x = 0; x < 12; x++) {
      let s = 0;
      for (let dy = 0; dy < 4; dy++) for (let dx = 0; dx < 4; dx++) s += grid.lum[(y * 4 + dy) * cols + x * 4 + dx];
      structure.push(s / 16);
    }
  }

  return {
    hueHistogram,
    saturation: satSum / (cols * rows),
    luminance: lumSum / (cols * rows),
    dominantHueShare: hueHistogram[dominantIndex] ?? 0,
    dominantHue: dominantIndex * 30 + 15,
    structure,
    saliency: await computeSaliency(asset),
  };
}

/** 0–1 distance between two hue histograms (0 = identical palette). */
export function colorDistance(a: PackFeatures, b: PackFeatures) {
  let d = 0;
  for (let i = 0; i < 12; i++) d += Math.abs(a.hueHistogram[i] - b.hueHistogram[i]);
  const hueDistance = d / 2; // total variation distance
  const satDistance = Math.abs(a.saturation - b.saturation);
  const lumDistance = Math.abs(a.luminance - b.luminance);
  return Math.min(1, hueDistance * 0.7 + satDistance * 0.15 + lumDistance * 0.15);
}

/** 0–1 structural distance: 1 − Pearson correlation of the 12×12 luminance thumbnails, remapped to 0–1. */
export function structureDistance(a: PackFeatures, b: PackFeatures) {
  const n = a.structure.length;
  const ma = a.structure.reduce((s, v) => s + v, 0) / n;
  const mb = b.structure.reduce((s, v) => s + v, 0) / n;
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < n; i++) {
    const xa = a.structure[i] - ma;
    const xb = b.structure[i] - mb;
    num += xa * xb;
    da += xa * xa;
    db += xb * xb;
  }
  const corr = da && db ? num / Math.sqrt(da * db) : 1;
  return Math.min(1, Math.max(0, (1 - corr) / 2));
}
