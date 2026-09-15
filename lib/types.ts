export type ShelfLayout = "main_left" | "main_center" | "main_right";
export type AnalysisSource = "mock" | "feng_gui";

export interface ProjectMeta {
  category: string;
  brandName: string;
  productName: string;
  competitor1BrandName: string;
  competitor2BrandName: string;
}

export interface ShelfTestResult {
  layout: ShelfLayout;
  mainAttentionShare: number;
  competitor1AttentionShare: number;
  competitor2AttentionShare: number;
}

export interface AttentionHotspot {
  x: number;
  y: number;
  maxValue?: number;
}

export interface SinglePackAttentionResult {
  provider?: AnalysisSource;
  providerImageId?: string;
  uploadedImageUrl?: string;
  heatmapUrl?: string;
  rawAttentionUrl?: string;
  opacityReportUrl?: string;
  gazeplotReportUrl?: string;
  aoiReportUrl?: string;
  aestheticsReportUrl?: string;
  overallScore?: number;
  focusScore?: number;
  clarityScore?: number;
  complexityScore?: number;
  memoryScore?: number;
  excitingScore?: number;
  balanceScore?: number;
  approachScore?: number;
  withdrawScore?: number;
  hotspots?: AttentionHotspot[];
  aoi?: {
    logo?: number;
    productName?: number;
    mainClaim?: number;
    productVisual?: number;
    variant?: number;
  };
}

export interface FiveSeScores {
  uniqueness: number;
  continuityConsistency: number | null;
  productClarity: number;
  singlePackAttention: number;
  shelfPerformanceIndex: number;
  attentionStandout: number;
  consumerDistanceClarity: number;
  overall5seScore: number;
}

export interface FiveSeAnalysisResult {
  source?: AnalysisSource;
  aiEnhanced?: boolean;
  aiModel?: string;
  scores: FiveSeScores;
  summary: string;
  strengths: string[];
  criticalIssues: string[];
  importantIssues: string[];
  opportunities: string[];
  recommendations: string[];
  shelfTests: ShelfTestResult[];
  singlePackAttention?: SinglePackAttentionResult;
}

export interface AnalyzeApiResponse {
  project: ProjectMeta;
  result: FiveSeAnalysisResult;
}
