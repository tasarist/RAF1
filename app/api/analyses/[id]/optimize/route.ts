import { NextResponse } from "next/server";
import { runOptimization } from "@/lib/pipeline";
import { getAnalysis, saveAnalysis } from "@/lib/store/analysisStore";
import type { Analysis } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * POST /api/analyses/:id/optimize
 * Generates one optimized design, re-tests it and returns the analysis with before/after data.
 * The client may send the full analysis in the body so a cold server (no cache) can still work.
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    let analysis = getAnalysis(id);
    if (!analysis) {
      const body = (await request.json().catch(() => null)) as { analysis?: Analysis } | null;
      if (body?.analysis?.id === id) analysis = body.analysis;
    }
    if (!analysis) return NextResponse.json({ error: "Analiz bulunamadı. Lütfen analizi yeniden çalıştırın." }, { status: 404 });

    const optimized = await runOptimization(analysis);
    const updated: Analysis = { ...analysis, optimized };
    saveAnalysis(updated);
    return NextResponse.json({ analysis: updated });
  } catch (error) {
    console.error("[5SE] optimize failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Optimizasyon başarısız." }, { status: 422 });
  }
}
