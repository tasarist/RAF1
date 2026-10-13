import type { Box, Quad } from "./types";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function quadToBox(q: Quad): Box {
  const xs = [q.tl.x, q.tr.x, q.br.x, q.bl.x].map(clamp01);
  const ys = [q.tl.y, q.tr.y, q.br.y, q.bl.y].map(clamp01);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}

export function boxToQuad(b: Box): Quad {
  return {
    tl: { x: b.x, y: b.y },
    tr: { x: b.x + b.w, y: b.y },
    br: { x: b.x + b.w, y: b.y + b.h },
    bl: { x: b.x, y: b.y + b.h },
  };
}

// Dörtgen dikdörtgen değilse (eğik/perspektif) quad saklanır.
export function isRectQuad(q: Quad, eps = 0.004): boolean {
  return Math.abs(q.tl.y - q.tr.y) < eps && Math.abs(q.bl.y - q.br.y) < eps
    && Math.abs(q.tl.x - q.bl.x) < eps && Math.abs(q.tr.x - q.br.x) < eps;
}

export function normalizeQuad(q: Quad): Quad {
  const c = (p: { x: number; y: number }) => ({ x: clamp01(Number(p?.x) || 0), y: clamp01(Number(p?.y) || 0) });
  return { tl: c(q.tl), tr: c(q.tr), br: c(q.br), bl: c(q.bl) };
}

export function inBox(x: number, y: number, b: Box) {
  return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
}
