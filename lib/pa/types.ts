import type { AoiType, GoalId, StepId } from "./engine";

export type Pt = { x: number; y: number };
export type Quad = { tl: Pt; tr: Pt; br: Pt; bl: Pt };
export type Box = { x: number; y: number; w: number; h: number }; // 0–1 normalize

export type Kind = "pack" | "competitors" | "shelf";

export interface Project {
  name: string;
  brand: string;
  category: string;
  goal: GoalId;
  channel: string;
}

export interface BrandElement {
  id: string;
  type: AoiType;
  text: string;
  box: Box;
  quad?: Quad;
  strength?: number;
  edited?: boolean;
}

export interface BrandRead {
  score: number;
  evaluation: string;
  model: string;
  cached?: boolean;
  hash?: string;
  mock?: boolean;
  elements: BrandElement[];
}

export interface ConsistencyRead {
  score: number;
  evaluation: string;
  model: string;
  mock?: boolean;
}

export interface ShelfItem {
  id: string;
  brand: string;
  box: Box;
  quad?: Quad;
}

export interface ShelfRead {
  items: ShelfItem[];
  model: string;
  cached?: boolean;
  hash?: string;
  mock?: boolean;
}

export interface Fixation { x: number; y: number; d: number } // normalize konum, süre (ms)

export interface AttentionAoiResult { id: string; text: string; type?: string; box: Box; fixationCount: number; share: number }

export interface AttentionResult {
  label: string;
  overall: number; focus: number; clear: number; approach: number; withdraw: number;
  memory: number; exciting: number; balance: number;
  aois: AttentionAoiResult[];
  fixationsTotal: number;
  fixations: Fixation[];       // ısı haritası ve bakış rotası istemcide bunlardan çizilir
  gazePath: number[];          // fixations dizisinde ilk bakış sırası (indeks)
  suspended: boolean;
  hash: string;
  measuredAt: string;
}

export type AttentionSlot = AttentionResult | { error: string; failedAt: string };

export type DimKey = "dba" | "consistency" | "reflect" | "exciting" | "consumer";

export type DimValues = Record<DimKey, number | null>;

export interface Scores {
  dims: DimValues;
  before: DimValues;
  total: number | null;
  verdict: string | null;
  after?: DimValues;
  totalAfter?: number | null;
  verdictAfter?: string | null;
  remeasured?: Record<DimKey, boolean>;
}

export interface ScoreDetail {
  dba: { source: string; value: number | null };
  consistency: { variant: number | null; old: number | null; value: number | null };
  reflect: { rows: Array<{ type: string; label: string; share: number; target: number; closeness: number }>; value: number | null };
  exciting: { source: "shelf" | "exciting" | "fallback" | "none"; share?: number; fairShare?: number; brands?: number; value: number | null };
  consumer: { source: string; value: number | null };
}

export interface CompareRow { slot: string; label: string; dims: DimValues; total: number | null }

export interface CompScore {
  slot: string; label: string;
  dba: number | null; consistency: number | null; clarity: number | null;
  standout: number | null; consumerDistance: number | null; total: number | null;
}

export interface ShelfShares {
  byBrand: Array<{ brand: string; share: number; shelves: number }>;
  perShelf: Record<string, Array<{ brand: string; share: number }>>;
}

export interface Rec {
  id: string;
  dim: DimKey;
  priority: "Yüksek" | "Orta" | "Düşük";
  title: string;
  detail: string;
  measure: string;
  prompt: string;
}

export interface Analysis {
  id: string;
  kind: Kind;
  engineVersion: number;
  status: "draft" | "analyzed" | "completed";
  createdAt: string;
  updatedAt: string;
  parentId?: string;
  project: Project;
  images: Record<string, string>; // slot -> dosya adı
  brandAssets?: BrandRead;
  brandReads?: Record<string, BrandRead>;
  shelfReads?: Record<string, ShelfRead>;
  consistency?: Record<string, ConsistencyRead>;
  attention?: Record<string, AttentionSlot>;
  refs?: { competitors?: string; shelf?: string };
  scores?: Scores;
  scoreDetail?: ScoreDetail;
  compare?: CompareRow[];
  compScores?: { comps: CompScore[] };
  shelfShares?: ShelfShares;
  findings?: string[];
  recs?: Rec[];
  selectedRecs?: string[];
  optimized?: { prompt?: string; model?: string; revisedPrompt?: string | null; version: number; source?: string; manual?: boolean; createdAt: string };
  progress?: { step: StepId; reached: StepId[]; updatedAt: string };
}

export function isAttention(slot: AttentionSlot | undefined): slot is AttentionResult {
  return !!slot && !("error" in slot);
}
