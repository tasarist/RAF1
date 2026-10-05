import "server-only";
import type { AttentionHotspot, ImageAsset } from "@/lib/types";
import { sampleGrid } from "./processing";

/**
 * Heuristic saliency used ONLY by the mock provider.
 *
 * It is not eye-tracking prediction. It combines local luminance contrast, colour saturation and a
 * mild centre bias so that mock heatmaps react to the uploaded artwork instead of being random.
 * Every result derived from it is flagged `isMock: true`.
 */
export interface SaliencyMap {
  cols: number;
  rows: number;
  /** Normalized 0–1 values, sums to 1. */
  values: Float32Array;
  /** Concentration 0–1: 1 = attention piled onto a few cells. */
  concentration: number;
  /** Edge density 0–1: proxy for visual clutter. */
  edgeDensity: number;
}

export async function computeSaliency(asset: ImageAsset, cols = 40, rows = 40): Promise<SaliencyMap> {
  const grid = await sampleGrid(asset, cols, rows);
  const values = new Float32Array(cols * rows);
  let edgeSum = 0;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = y * cols + x;
      let contrast = 0;
      let n = 0;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          if (!dx && !dy) continue;
          const xx = x + dx;
          const yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= cols || yy >= rows) continue;
          contrast += Math.abs(grid.lum[i] - grid.lum[yy * cols + xx]);
          n++;
        }
      }
      contrast = n ? contrast / n : 0;
      edgeSum += contrast;
      const cx = (x + 0.5) / cols - 0.5;
      const cy = (y + 0.5) / rows - 0.5;
      const centre = 1 - Math.min(1, Math.sqrt(cx * cx + cy * cy) * 1.4);
      // near-white background cells get suppressed so packshots on white don't light up the margins
      const background = grid.lum[i] > 0.93 && grid.sat[i] < 0.08 ? 0.25 : 1;
      values[i] = (contrast * 2.2 + grid.sat[i] * 0.9 + 0.15) * (0.55 + 0.45 * centre) * background;
    }
  }

  // light smoothing
  const smooth = new Float32Array(values.length);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let s = 0;
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= cols || yy >= rows) continue;
          s += values[yy * cols + xx];
          n++;
        }
      }
      smooth[y * cols + x] = s / n;
    }
  }

  let total = 0;
  for (const v of smooth) total += v;
  for (let i = 0; i < smooth.length; i++) smooth[i] = total ? smooth[i] / total : 1 / smooth.length;

  const sorted = Array.from(smooth).sort((a, b) => b - a);
  const top10 = sorted.slice(0, Math.ceil(sorted.length * 0.1)).reduce((a, b) => a + b, 0);
  const concentration = Math.min(1, Math.max(0, (top10 - 0.1) / 0.6));
  const edgeDensity = Math.min(1, edgeSum / (cols * rows) / 0.18);

  return { cols, rows, values: smooth, concentration, edgeDensity };
}

/** Share (0–100) of the saliency mass that falls inside a percent box. */
export function shareInBox(map: SaliencyMap, box: { x: number; y: number; width: number; height: number }) {
  let s = 0;
  const x0 = Math.floor((box.x / 100) * map.cols);
  const x1 = Math.ceil(((box.x + box.width) / 100) * map.cols);
  const y0 = Math.floor((box.y / 100) * map.rows);
  const y1 = Math.ceil(((box.y + box.height) / 100) * map.rows);
  for (let y = Math.max(0, y0); y < Math.min(map.rows, y1); y++) {
    for (let x = Math.max(0, x0); x < Math.min(map.cols, x1); x++) s += map.values[y * map.cols + x];
  }
  return Math.round(s * 1000) / 10;
}

/** Top-N cells as hotspots for the client-side heatmap overlay. */
export function hotspotsFrom(map: SaliencyMap, count = 14): AttentionHotspot[] {
  const cells = Array.from(map.values).map((v, i) => ({ v, i }));
  cells.sort((a, b) => b.v - a.v);
  const max = cells[0]?.v || 1;
  const chosen: AttentionHotspot[] = [];
  for (const cell of cells) {
    const x = ((cell.i % map.cols) + 0.5) / map.cols * 100;
    const y = (Math.floor(cell.i / map.cols) + 0.5) / map.rows * 100;
    // keep hotspots spread out
    if (chosen.some((h) => Math.hypot(h.x - x, h.y - y) < 7)) continue;
    chosen.push({ x, y, intensity: Math.round((cell.v / max) * 100) / 100, radius: 9 + (cell.v / max) * 8 });
    if (chosen.length >= count) break;
  }
  return chosen;
}
