import { getEngine } from "./engine";
import type { EngineConfig } from "./engine";
import {
  isAttention,
  type Analysis, type AttentionResult, type CompScore, type CompareRow, type DimKey, type DimValues,
  type ScoreDetail, type Scores, type ShelfShares,
} from "./types";

// Tüm skorlar sunucuda, kaydın motor sürümünün kurallarıyla hesaplanır.

export const DIM_KEYS: DimKey[] = ["dba", "consistency", "reflect", "exciting", "consumer"];
export const DIM_LABELS: Record<DimKey, string> = {
  dba: "Güçlü ayırıcı marka varlıkları",
  consistency: "Sürekli ve tutarlı ol",
  reflect: "Ürünü doğru yansıt",
  exciting: "İlgi çekici ol",
  consumer: "Tüketici odaklı ol",
};

const r1 = (n: number) => Math.round(n * 10) / 10;
const clamp = (n: number) => Math.min(100, Math.max(0, n));

export function mean(values: Array<number | null | undefined>): number | null {
  const v = values.filter((x): x is number => typeof x === "number");
  return v.length ? r1(v.reduce((s, x) => s + x, 0) / v.length) : null;
}

export function verdictFor(total: number | null, engine: EngineConfig): string | null {
  if (total == null) return null;
  const { risky, ready } = engine.rules.thresholds;
  return total < risky ? "Riskli" : total < ready ? "Geliştirilebilir" : "Rafa hazır";
}

// 03 · Ürünü doğru yansıt — tür bazında bakış payının hedefe yakınlığı, hedef ağırlıklı ortalama.
// Varsayım K1: yakınlık 0–100 arasına sıkıştırılır. K2: ambalajda olmayan tür hesaba girmez.
export function reflectScore(att: AttentionResult | undefined, engine: EngineConfig) {
  const rows: ScoreDetail["reflect"]["rows"] = [];
  if (!att || !att.fixationsTotal) return { rows, value: null as number | null };
  for (const [type, target] of Object.entries(engine.rules.shareTargets)) {
    const typed = att.aois.filter((a) => a.type === type);
    if (!typed.length || !target) continue;
    const share = r1((typed.reduce((s, a) => s + a.fixationCount, 0) / att.fixationsTotal) * 100);
    const closeness = r1(clamp(100 * (1 - Math.abs(share - target) / target)));
    rows.push({ type, label: engine.aoiTypes[type as keyof typeof engine.aoiTypes], share, target, closeness });
  }
  const wsum = rows.reduce((s, x) => s + x.target, 0);
  return { rows, value: wsum ? r1(rows.reduce((s, x) => s + x.closeness * x.target, 0) / wsum) : null };
}

// 04 · İlgi çekici ol — raf payı; adil payın iki katı = 100. Raf yoksa dikkat metriği, o da yoksa yedek ortalama.
export function excitingScore(share: number | null, brands: number, att: AttentionResult | undefined, engine: EngineConfig): ScoreDetail["exciting"] {
  if (share != null && brands > 0) {
    const fairShare = r1(100 / brands);
    return { source: "shelf", share, fairShare, brands, value: r1(Math.min(100, (share / (2 * (100 / brands))) * 100)) };
  }
  if (att && typeof att[engine.rules.excitingMetric] === "number") return { source: "exciting", value: att[engine.rules.excitingMetric] };
  if (att) return { source: "fallback", value: mean(engine.rules.excitingFallback.map((k) => att[k])) };
  return { source: "none", value: null };
}

export function computeShelfShares(shelf: Analysis): ShelfShares {
  const perShelf: ShelfShares["perShelf"] = {};
  const acc = new Map<string, { brand: string; sum: number; n: number }>();
  for (let i = 0; i < 3; i++) {
    const slot = `shelf-${i}`;
    const att = shelf.attention?.[slot];
    if (!isAttention(att) || !att.fixationsTotal) continue;
    perShelf[slot] = att.aois.map((a) => {
      const share = r1((a.fixationCount / att.fixationsTotal) * 100);
      const k = a.text.trim().toLowerCase();
      const cur = acc.get(k) ?? { brand: a.text.trim(), sum: 0, n: 0 };
      acc.set(k, { ...cur, sum: cur.sum + share, n: cur.n + 1 });
      return { brand: a.text.trim(), share };
    });
  }
  const byBrand = [...acc.values()].map((b) => ({ brand: b.brand, share: r1(b.sum / b.n), shelves: b.n })).sort((a, b) => b.share - a.share);
  return { byBrand, perShelf };
}

export function shelfShareFor(shares: ShelfShares | undefined, brand: string | undefined) {
  if (!shares || !brand) return null;
  return shares.byBrand.find((b) => b.brand.toLowerCase() === brand.trim().toLowerCase())?.share ?? null;
}

function logoText(read: { elements: Array<{ type: string; text: string }> } | undefined) {
  return read?.elements.find((e) => e.type === "logo")?.text?.trim() || undefined;
}

export function compLabel(comp: Analysis, i: number) {
  return logoText(comp.brandReads?.[`comp-${i}`]) ?? `Rakip ${i === 0 ? "A" : "B"}`;
}

export function computeScores(pack: Analysis, shelf: Analysis | null) {
  const engine = getEngine(pack.engineVersion);
  const att = pack.attention?.ours;
  const ours = isAttention(att) ? att : undefined;

  const variant = pack.consistency?.variant?.score ?? null;
  const old = pack.consistency?.old?.score ?? null;
  const w = engine.rules.consistencyWeights;
  const consistency = variant != null && old != null ? r1((variant * w.variant + old * w.old) / (w.variant + w.old)) : variant ?? old;

  const reflect = reflectScore(ours, engine);
  const shares = shelf?.shelfShares;
  const exciting = excitingScore(shelfShareFor(shares, pack.project.brand), shares?.byBrand.length ?? 0, ours, engine);
  const consumer = ours ? ours[engine.rules.consumerMetric] : null;

  const dims: DimValues = {
    dba: pack.brandAssets?.score ?? null,
    consistency,
    reflect: reflect.value,
    exciting: exciting.value,
    consumer,
  };
  const detail: ScoreDetail = {
    dba: { source: "brandAssets.score", value: dims.dba },
    consistency: { variant, old, value: consistency },
    reflect,
    exciting,
    consumer: { source: `attention.ours.${engine.rules.consumerMetric}`, value: consumer },
  };
  return { dims, detail };
}

export function computeAfter(pack: Analysis, before: DimValues) {
  const engine = getEngine(pack.engineVersion);
  const opt = pack.attention?.optimized;
  if (!isAttention(opt)) return null;
  const after: DimValues = { ...before };
  const remeasured = Object.fromEntries(DIM_KEYS.map((k) => [k, false])) as Record<DimKey, boolean>;
  const reflect = reflectScore(opt, engine).value;
  if (reflect != null) { after.reflect = reflect; remeasured.reflect = true; }
  after.consumer = opt[engine.rules.consumerMetric];
  remeasured.consumer = true;
  return { after, remeasured };
}

export function buildScores(pack: Analysis, shelf: Analysis | null): { scores: Scores; detail: ScoreDetail } {
  const engine = getEngine(pack.engineVersion);
  const { dims, detail } = computeScores(pack, shelf);
  const total = mean(DIM_KEYS.map((k) => dims[k]));
  const scores: Scores = { dims, before: dims, total, verdict: verdictFor(total, engine) };
  const after = computeAfter(pack, dims);
  if (after) {
    scores.after = after.after;
    scores.remeasured = after.remeasured;
    scores.totalAfter = mean(DIM_KEYS.map((k) => after.after[k]));
    scores.verdictAfter = verdictFor(scores.totalAfter, engine);
  }
  return { scores, detail };
}

// Rakip Testi skorları. Varsayım K3: toplam = DBA, netlik, öne çıkma ortalaması.
export function computeCompScores(comp: Analysis): { comps: CompScore[] } {
  const engine = getEngine(comp.engineVersion);
  const comps: CompScore[] = [0, 1].map((i) => {
    const slot = `comp-${i}`;
    const a = comp.attention?.[slot];
    const att = isAttention(a) ? a : undefined;
    const dba = comp.brandReads?.[slot]?.score ?? null;
    const clarity = reflectScore(att, engine).value;
    const standout = att ? att.exciting : null;
    return {
      slot, label: compLabel(comp, i), dba,
      consistency: comp.consistency?.[slot]?.score ?? null,
      clarity, standout,
      consumerDistance: att ? att.overall : null,
      total: mean([dba, clarity, standout]),
    };
  });
  return { comps };
}

export function computeCompare(pack: Analysis, dims: DimValues, total: number | null, comp: Analysis | null, shelf: Analysis | null): CompareRow[] {
  const rows: CompareRow[] = [{ slot: "ours", label: pack.project.brand || "Ana SKU", dims, total }];
  if (!comp) return rows;
  const engine = getEngine(pack.engineVersion);
  const shares = shelf?.shelfShares;
  for (const i of [0, 1]) {
    const slot = `comp-${i}`;
    const a = comp.attention?.[slot];
    const att = isAttention(a) ? a : undefined;
    const label = compLabel(comp, i);
    const d: DimValues = {
      dba: comp.brandReads?.[slot]?.score ?? null,
      consistency: comp.consistency?.[slot]?.score ?? null,
      reflect: reflectScore(att, engine).value,
      exciting: excitingScore(shelfShareFor(shares, label), shares?.byBrand.length ?? 0, att, engine).value,
      consumer: att ? att.overall : null,
    };
    rows.push({ slot, label, dims: d, total: mean(DIM_KEYS.map((k) => d[k])) });
  }
  return rows;
}
