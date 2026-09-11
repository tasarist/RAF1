export type ShelfLayout = "main_left" | "main_center" | "main_right";

export interface ProjectMeta {
  category: string;
  brandName: string;
  productName: string;
}

export interface ShelfTestResult {
  layout: ShelfLayout;
  mainAttentionShare: number;
  competitor1AttentionShare: number;
  competitor2AttentionShare: number;
}

export interface SinglePackAttentionResult {
  focusScore?: number;
  clarityScore?: number;
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
