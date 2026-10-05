import { NextResponse } from "next/server";
import { getAnalysis } from "@/lib/store/analysisStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const analysis = getAnalysis(id);
  if (!analysis) return NextResponse.json({ error: "Analiz sunucu önbelleğinde bulunamadı." }, { status: 404 });
  return NextResponse.json({ analysis });
}
