import { inBox } from "./geometry";
import type { AttentionResult, Box, Fixation } from "./types";

// Görsel dikkat modeli ŞU AN ASKIDA: sağlayıcıya çıkılmaz.
// Değerler görselin hash'i + AOI'lerden türetilir (kararlı: aynı girdi → aynı sonuç), `suspended: true` işaretlenir
// ve önbelleğe yazılmaz. Isı haritası ve bakış rotası istemcide bu bakış noktalarından çizilir.

export interface AoiInput { id: string; text: string; type?: string; box: Box }

function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  let s = h >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(r: () => number) {
  return Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r());
}

const TYPE_PULL: Record<string, number> = { logo: 1.35, product: 1.0, claim: 0.75, variant: 0.85, visual: 1.15, other: 0.6, brand: 1 };
const clamp01 = (v: number) => Math.min(0.999, Math.max(0.001, v));
const score = (v: number) => Math.round(Math.min(98, Math.max(5, v)));

export function simulateAttention(hash: string, label: string, aois: AoiInput[]): AttentionResult {
  const r = rng(`${hash}:${aois.map((a) => `${a.box.x.toFixed(3)},${a.box.y.toFixed(3)},${a.box.w.toFixed(3)},${a.box.h.toFixed(3)}`).join(";")}`);

  // Çekim noktaları: her AOI + merkez eğilimli arka plan.
  const attractors = aois.map((a) => {
    const area = Math.max(0.002, a.box.w * a.box.h);
    return { box: a.box, w: (TYPE_PULL[a.type ?? "brand"] ?? 0.8) * Math.sqrt(area * 8) * (0.55 + r() * 0.9) };
  });
  const bgWeight = 0.35 + r() * 0.35;
  const totalW = attractors.reduce((s, a) => s + a.w, 0) + bgWeight;

  const n = 42 + Math.floor(r() * 22);
  const fixations: Fixation[] = [];
  for (let i = 0; i < n; i++) {
    let pick = r() * totalW;
    const target = attractors.find((a) => (pick -= a.w) < 0);
    let x: number, y: number;
    if (target) {
      const b = target.box;
      x = b.x + b.w / 2 + gauss(r) * b.w * 0.22;
      y = b.y + b.h / 2 + gauss(r) * b.h * 0.22;
    } else {
      x = 0.5 + gauss(r) * 0.2;
      y = 0.45 + gauss(r) * 0.2;
    }
    fixations.push({ x: clamp01(x), y: clamp01(y), d: Math.round(140 + r() * 320) });
  }

  const total = fixations.length;
  const aoiResults = aois.map((a) => {
    const count = fixations.filter((f) => inBox(f.x, f.y, a.box)).length;
    return { id: a.id, text: a.text, type: a.type, box: a.box, fixationCount: count, share: Math.round((count / total) * 1000) / 10 };
  });
  const concentration = aoiResults.reduce((s, a) => s + a.share, 0);

  return {
    label,
    overall: score(38 + concentration * 0.32 + r() * 18),
    focus: score(35 + concentration * 0.3 + r() * 20),
    clear: score(40 + r() * 45),
    approach: score(40 + r() * 45),
    withdraw: score(10 + r() * 35),
    memory: score(40 + r() * 45),
    exciting: score(35 + r() * 50),
    balance: score(40 + r() * 45),
    aois: aoiResults,
    fixationsTotal: total,
    fixations,
    gazePath: Array.from({ length: Math.min(10, total) }, (_, i) => i),
    suspended: true,
    hash,
    measuredAt: new Date().toISOString(),
  };
}
