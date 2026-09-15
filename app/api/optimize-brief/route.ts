import { NextResponse } from "next/server";
import { generateOptimizationBrief } from "@/lib/openaiBrief";
import type { FiveSeAnalysisResult, ProjectMeta } from "@/lib/types";

export const runtime = "nodejs";

function parseJson<T>(value: unknown, label: string): T {
  if (typeof value !== "string") {
    throw new Error(`${label} bulunamadı.`);
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    throw new Error(`${label} okunamadı.`);
  }
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Bilinmeyen hata oluştu.";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const project = parseJson<ProjectMeta>(body.project, "Proje bilgisi");
    const analysis = parseJson<FiveSeAnalysisResult>(body.analysis, "Analiz sonucu");
    const result = await generateOptimizationBrief(project, analysis);

    return NextResponse.json(result);
  } catch (error) {
    console.error("OpenAI brief generation failed", error);
    return NextResponse.json(
      { error: `Brief oluşturulamadı: ${errorMessage(error)}` },
      { status: 502 },
    );
  }
}
