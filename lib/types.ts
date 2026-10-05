/**
 * 5SE™ Packaging Intelligence — shared domain types.
 *
 * Everything the pipeline produces is expressed in these types so the UI,
 * the attention provider adapters and the AI engine stay decoupled.
 */

export type ShelfLayout = "main_left" | "main_center" | "main_right";
export const SHELF_LAYOUTS: ShelfLayout[] = ["main_left", "main_center", "main_right"];

export type AnalysisMode = "mock" | "live";
export type AttentionProviderName = "mock" | "attention_insight" | "feng_gui";

export type Severity = "critical" | "important" | "opportunity";

/** Pack roles the user can upload. */
export type PackRole = "main" | "competitor1" | "competitor2" | "previous" | "sku";

export interface ProjectMeta {
  projectName: string;
  category: string;
  brandName: string;
  productName: string;
  competitor1BrandName: string;
  competitor2BrandName: string;
}

/** A normalized image as produced by the image pipeline. Data URLs keep the MVP database-free. */
export interface ImageAsset {
  dataUrl: string;
  width: number;
  height: number;
  mime: "image/jpeg" | "image/png" | "image/webp";
  bytes: number;
}

/** Area of interest in percentage coordinates (0–100), matching Attention Insight's AOI contract. */
export interface AreaOfInterest {
  id: string;
  name: string;
  /** Semantic role so the engine can reason about it. */
  role: "logo" | "product_name" | "claim" | "product_visual" | "variant" | "brand_block" | "other";
  x: number;
  y: number;
  width: number;
  height: number;
  /** Percentage of attention attributed to this AOI (0–100). */
  attentionShare: number | null;
  /** How the box was obtained. */
  source: "vision_model" | "heuristic" | "auto_aoi" | "user";
}

/** Attention hotspot in percentage coordinates — used to render mock heatmaps client-side. */
export interface AttentionHotspot {
  x: number;
  y: number;
  /** Relative intensity 0–1. */
  intensity: number;
  /** Relative radius as % of the shorter image edge. */
  radius: number;
}

/**
 * Output of a single attention prediction. Only fields Attention Insight actually provides are
 * modelled as metrics; anything else is derived and marked as such by the engine.
 */
export interface AttentionPrediction {
  provider: AttentionProviderName;
  /** Provider-side study id (Attention Insight `study_id`), undefined in mock mode. */
  studyId?: string;
  heatmapUrl?: string;
  focusMapUrl?: string;
  /** Attention Insight Focus Score (0–100). */
  focusScore?: number;
  /** Attention Insight Clarity Score (0–100). */
  clarityScore?: number;
  /** Provider's own clarity description if any. */
  clarityDescription?: string;
  aois: AreaOfInterest[];
  /** Mock-only: synthetic hotspots used to draw a heatmap overlay in the browser. */
  hotspots?: AttentionHotspot[];
  /** Provider transactions consumed by this prediction. */
  transactionsUsed: number;
  isMock: boolean;
}

export interface ShelfTestResult {
  layout: ShelfLayout;
  /** Composited shelf image. */
  shelfImage: ImageAsset;
  prediction: AttentionPrediction;
  mainAttentionShare: number;
  competitor1AttentionShare: number;
  competitor2AttentionShare: number;
}

export interface ShelfPerformance {
  tests: ShelfTestResult[];
  averageMainShare: number;
  averageCompetitor1Share: number;
  averageCompetitor2Share: number;
  /** average main share / 33.3 × 100 */
  shelfPerformanceIndex: number;
  /** 33.3 for three brands */
  parityShare: number;
}

export type DistanceStage = "5m" | "3m" | "1m";

export interface DistanceStageResult {
  stage: DistanceStage;
  label: string;
  question: string;
  /** Downscaled + re-upscaled simulation of what the shopper perceives. */
  simulation: ImageAsset;
  /** 0–100 score for the stage. */
  score: number;
  /** Which AOIs remain legible at this stage (by id). */
  legibleAois: string[];
  note: string;
  confidence: "low" | "medium" | "high";
}

export interface DistanceClarity {
  stages: DistanceStageResult[];
  score: number;
}

export interface CriterionBreakdownItem {
  key: string;
  label: string;
  weight: number;
  score: number;
  note: string;
}

export interface CriterionResult {
  key: "uniqueness" | "continuity_consistency" | "product_clarity" | "attention_standout" | "consumer_distance_clarity";
  name: string;
  /** Turkish methodology name from the Tasarist 5 Shelf Effect deck. */
  methodologyName: string;
  score: number | null;
  breakdown: CriterionBreakdownItem[];
  narrative: string;
  confidence: "low" | "medium" | "high";
}

export interface Issue {
  severity: Severity;
  title: string;
  evidence: string;
  cause: string;
  recommendation: string;
  relatedCriteria: CriterionResult["key"][];
}

export interface Recommendation {
  priority: number;
  action: string;
  expectedEffect: string[];
}

export interface OptimizedDesignBrief {
  objective: string;
  preserve: string[];
  change: string[];
  imageGenerationPrompt: string;
}

/** The JSON contract defined in the product spec (section 14). */
export interface FiveSeScores {
  uniqueness: number;
  continuity_consistency: number | null;
  product_clarity: number;
  single_pack_attention: number;
  shelf_performance_index: number;
  attention_standout: number;
  consumer_distance_clarity: number;
  overall_5se_score: number;
}

export interface FiveSeReport {
  scores: FiveSeScores;
  /** 4 or 5 depending on whether continuity data was supplied. */
  criteriaCounted: 4 | 5;
  criteria: CriterionResult[];
  summary: {
    overall_assessment: string;
    strongest_area: string;
    weakest_area: string;
  };
  strengths: string[];
  issues: {
    critical: Issue[];
    important: Issue[];
    opportunities: Issue[];
  };
  recommendations: Recommendation[];
  optimized_design: OptimizedDesignBrief;
  engine: {
    name: "rule_based_mock" | "openai_structured";
    model?: string;
    confidence: "low" | "medium" | "high";
    notes: string[];
  };
}

/** Everything measured for one design variant (original or optimized). */
export interface VariantMeasurement {
  variant: "original" | "optimized";
  packImage: ImageAsset;
  singlePack: AttentionPrediction;
  shelf: ShelfPerformance;
  distance: DistanceClarity;
  report: FiveSeReport;
  /** Provider transactions consumed for this variant (target: 4). */
  predictionsUsed: number;
}

export interface OptimizedDesignResult {
  measurement: VariantMeasurement;
  brief: OptimizedDesignBrief;
  generator: {
    name: "mock_placeholder" | "openai_image_edit";
    model?: string;
    isMock: boolean;
    note: string;
  };
  delta: {
    overall_5se_score: number;
    uniqueness: number;
    product_clarity: number;
    attention_standout: number;
    consumer_distance_clarity: number;
    shelf_performance_index: number;
    continuity_consistency: number | null;
  };
  createdAt: string;
}

export interface ContinuityInput {
  previousPack?: ImageAsset;
  otherSkus: ImageAsset[];
}

export interface Analysis {
  id: string;
  createdAt: string;
  mode: AnalysisMode;
  provider: AttentionProviderName;
  project: ProjectMeta;
  inputs: {
    main: ImageAsset;
    competitor1: ImageAsset;
    competitor2: ImageAsset;
    previous?: ImageAsset;
    otherSkus: ImageAsset[];
  };
  original: VariantMeasurement;
  optimized?: OptimizedDesignResult;
  pipelineLog: PipelineStep[];
}

export interface PipelineStep {
  key: string;
  label: string;
  status: "done" | "skipped" | "failed";
  durationMs: number;
  detail?: string;
}

/** Lightweight summary stored for the dashboard list. */
export interface AnalysisSummary {
  id: string;
  createdAt: string;
  mode: AnalysisMode;
  projectName: string;
  brandName: string;
  productName: string;
  category: string;
  overallScore: number;
  optimizedScore?: number;
  thumbnail: string;
}

export function toSummary(analysis: Analysis): AnalysisSummary {
  return {
    id: analysis.id,
    createdAt: analysis.createdAt,
    mode: analysis.mode,
    projectName: analysis.project.projectName,
    brandName: analysis.project.brandName,
    productName: analysis.project.productName,
    category: analysis.project.category,
    overallScore: analysis.original.report.scores.overall_5se_score,
    optimizedScore: analysis.optimized?.measurement.report.scores.overall_5se_score,
    thumbnail: analysis.inputs.main.dataUrl,
  };
}
