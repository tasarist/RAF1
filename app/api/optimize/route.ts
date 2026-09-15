import { NextResponse } from "next/server";
import { generateOptimizedPackDesign } from "@/lib/openaiImage";
import type { FiveSeAnalysisResult, ProjectMeta } from "@/lib/types";

export const runtime = "nodejs";

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_BYTES = 1.2 * 1024 * 1024;

function getText(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getImage(form: FormData, key: string) {
  const value = form.get(key);
  return value instanceof File ? value : null;
}

function parseJson<T>(value: string, label: string): T {
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
    const form = await request.formData();
    const mainPack = getImage(form, "mainPack");
    const projectText = getText(form, "project");
    const analysisText = getText(form, "analysis");
    const designBrief = getText(form, "designBrief");

    if (!mainPack) {
      return NextResponse.json({ error: "Optimize tasarım için ana ambalaj görseli zorunludur." }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(mainPack.type)) {
      return NextResponse.json({ error: `Desteklenmeyen dosya türü: ${mainPack.name}` }, { status: 400 });
    }
    if (mainPack.size > MAX_BYTES) {
      return NextResponse.json({ error: `${mainPack.name} 1.2 MB canlı MVP sınırını aşıyor.` }, { status: 400 });
    }
    if (!projectText || !analysisText) {
      return NextResponse.json({ error: "Analiz sonucu bulunamadı. Önce 5SE analizi çalıştırılmalı." }, { status: 400 });
    }

    const project = parseJson<ProjectMeta>(projectText, "Proje bilgisi");
    const analysis = parseJson<FiveSeAnalysisResult>(analysisText, "Analiz sonucu");
    const result = await generateOptimizedPackDesign(mainPack, project, analysis, designBrief);

    return NextResponse.json(result);
  } catch (error) {
    console.error("OpenAI design generation failed", error);
    return NextResponse.json(
      { error: `Tasarım üretilemedi: ${errorMessage(error)}` },
      { status: 502 },
    );
  }
}
