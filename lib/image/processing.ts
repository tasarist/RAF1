import "server-only";
import sharp, { type OverlayOptions } from "sharp";
import type { ImageAsset, ShelfLayout } from "@/lib/types";

/** Long-edge size used for all normalized pack images. Small enough to travel as data URLs. */
export const PACK_LONG_EDGE = 720;
export const SHELF_WIDTH = 1500;
export const SHELF_HEIGHT = 720;

const MIME_BY_FORMAT: Record<string, ImageAsset["mime"]> = {
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function bufferToAsset(buffer: Buffer, mime: ImageAsset["mime"]): Promise<ImageAsset> {
  const meta = await sharp(buffer).metadata();
  return {
    dataUrl: `data:${mime};base64,${buffer.toString("base64")}`,
    width: meta.width ?? 0,
    height: meta.height ?? 0,
    mime,
    bytes: buffer.byteLength,
  };
}

export function assetToBuffer(asset: ImageAsset): Buffer {
  const comma = asset.dataUrl.indexOf(",");
  return Buffer.from(asset.dataUrl.slice(comma + 1), "base64");
}

/**
 * Normalize an uploaded pack: validate it decodes, flatten transparency onto white,
 * fit inside PACK_LONG_EDGE and re-encode as JPEG. Output stays private (data URL, never public storage).
 */
export async function normalizePack(input: Buffer): Promise<ImageAsset> {
  const meta = await sharp(input).metadata();
  if (!meta.format || !MIME_BY_FORMAT[meta.format]) {
    throw new Error("Görsel formatı okunamadı. PNG, JPG veya WEBP yükleyin.");
  }
  const out = await sharp(input)
    .rotate()
    .flatten({ background: "#ffffff" })
    .resize({ width: PACK_LONG_EDGE, height: PACK_LONG_EDGE, fit: "inside", withoutEnlargement: false })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  return bufferToAsset(out, "image/jpeg");
}

export interface FacingBox {
  role: "main" | "competitor1" | "competitor2";
  /** Percent coordinates of the facing on the shelf image. */
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Build one virtual shelf: three packs, equal facing width, on a neutral shelf background.
 * Returns the composite plus the percent boxes of each facing (used as AOIs).
 */
export async function buildShelf(
  packs: { main: ImageAsset; competitor1: ImageAsset; competitor2: ImageAsset },
  layout: ShelfLayout,
): Promise<{ image: ImageAsset; facings: FacingBox[] }> {
  const order: FacingBox["role"][] =
    layout === "main_left"
      ? ["main", "competitor1", "competitor2"]
      : layout === "main_center"
        ? ["competitor1", "main", "competitor2"]
        : ["competitor1", "competitor2", "main"];

  const slotWidth = SHELF_WIDTH / 3;
  const padX = 34;
  const padTop = 40;
  const shelfBoardY = SHELF_HEIGHT - 56;
  const maxW = slotWidth - padX * 2;
  const maxH = shelfBoardY - padTop - 8;

  const background = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SHELF_WIDTH}" height="${SHELF_HEIGHT}">
      <defs>
        <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#f4f4f2"/><stop offset="1" stop-color="#e6e6e3"/>
        </linearGradient>
        <linearGradient id="board" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#d9d9d4"/><stop offset="1" stop-color="#bdbdb7"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#wall)"/>
      <rect x="0" y="${shelfBoardY}" width="100%" height="56" fill="url(#board)"/>
      <rect x="0" y="${shelfBoardY}" width="100%" height="4" fill="#ffffff" opacity="0.7"/>
      <rect x="0" y="${shelfBoardY - 26}" width="100%" height="26" fill="#000" opacity="0.06"/>
    </svg>`,
  );

  const composites: OverlayOptions[] = [];
  const facings: FacingBox[] = [];

  for (let i = 0; i < order.length; i++) {
    const role = order[i];
    const asset = packs[role];
    const buffer = assetToBuffer(asset);
    const resized = await sharp(buffer)
      .resize({ width: Math.round(maxW), height: Math.round(maxH), fit: "inside" })
      .toBuffer({ resolveWithObject: true });
    const w = resized.info.width;
    const h = resized.info.height;
    const left = Math.round(i * slotWidth + (slotWidth - w) / 2);
    const top = Math.round(shelfBoardY - h);

    // soft contact shadow
    const shadow = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w + 40}" height="40"><ellipse cx="${(w + 40) / 2}" cy="20" rx="${w / 2}" ry="10" fill="#000" opacity="0.18"/></svg>`,
    );
    composites.push({ input: await sharp(shadow).blur(6).toBuffer(), left: left - 20, top: shelfBoardY - 18 });
    composites.push({ input: resized.data, left, top });

    facings.push({
      role,
      x: (left / SHELF_WIDTH) * 100,
      y: (top / SHELF_HEIGHT) * 100,
      width: (w / SHELF_WIDTH) * 100,
      height: (h / SHELF_HEIGHT) * 100,
    });
  }

  const out = await sharp(background).composite(composites).jpeg({ quality: 80, mozjpeg: true }).toBuffer();
  return { image: await bufferToAsset(out, "image/jpeg"), facings };
}

/**
 * Consumer distance simulation. We approximate the loss of visual acuity by downscaling the pack to
 * the number of pixels a shopper's retina would resolve at that distance and upscaling it back with a
 * light blur. 5 m → only colour blocks, 3 m → logo-scale shapes, 1 m → message-scale text.
 */
export async function simulateDistance(pack: ImageAsset, stage: "5m" | "3m" | "1m"): Promise<ImageAsset> {
  const targetLongEdge = stage === "5m" ? 22 : stage === "3m" ? 46 : 130;
  const blur = stage === "5m" ? 1.6 : stage === "3m" ? 1.1 : 0.6;
  const buffer = assetToBuffer(pack);
  const tiny = await sharp(buffer).resize({ width: targetLongEdge, height: targetLongEdge, fit: "inside" }).toBuffer();
  const out = await sharp(tiny)
    .resize({ width: 520, height: 520, fit: "inside", kernel: "cubic" })
    .blur(blur)
    .jpeg({ quality: 78 })
    .toBuffer();
  return bufferToAsset(out, "image/jpeg");
}

/**
 * Mock stand-in for the optimized design. Applies a mild, deterministic clarity treatment
 * (contrast + saturation) and stamps a visible PROTOTYPE badge so nobody mistakes it for a real
 * generated design. The badge is intentionally part of the image.
 */
export async function createMockOptimizedPack(pack: ImageAsset): Promise<ImageAsset> {
  const buffer = assetToBuffer(pack);
  const meta = await sharp(buffer).metadata();
  const w = meta.width ?? PACK_LONG_EDGE;
  const h = meta.height ?? PACK_LONG_EDGE;
  const badgeW = Math.min(w - 16, 300);
  const badge = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${badgeW}" height="46">
      <rect x="0" y="0" width="${badgeW}" height="46" rx="8" fill="#0413EC" opacity="0.92"/>
      <text x="${badgeW / 2}" y="29" font-family="Montserrat, Arial, sans-serif" font-size="15" font-weight="700" fill="#ffffff" text-anchor="middle" letter-spacing="1">MOCK · OPTİMİZE SİMÜLASYONU</text>
    </svg>`,
  );
  const out = await sharp(buffer)
    .modulate({ saturation: 1.12, brightness: 1.02 })
    .linear(1.08, -8)
    .composite([{ input: badge, left: Math.round((w - badgeW) / 2), top: h - 58 }])
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  return bufferToAsset(out, "image/jpeg");
}

/** Raw greyscale + saturation grid used by the heuristic saliency model. */
export async function sampleGrid(asset: ImageAsset, cols: number, rows: number) {
  const { data } = await sharp(assetToBuffer(asset))
    .resize(cols, rows, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const lum = new Float32Array(cols * rows);
  const sat = new Float32Array(cols * rows);
  for (let i = 0; i < cols * rows; i++) {
    const r = data[i * 3] / 255;
    const g = data[i * 3 + 1] / 255;
    const b = data[i * 3 + 2] / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    lum[i] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    sat[i] = max === 0 ? 0 : (max - min) / max;
  }
  return { cols, rows, lum, sat };
}
