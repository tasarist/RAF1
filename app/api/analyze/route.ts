import { NextResponse } from "next/server";
import { analyzeSinglePackWithFengGui } from "@/lib/fengGui";
import { createFengGuiBackedAnalysis } from "@/lib/liveAnalysis";
import { createMockAnalysis } from "@/lib/mockAnalysis";
import type { ProjectMeta } from "@/lib/types";

export const runtime = "nodejs";

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_BYTES = 1.2 * 1024 * 1024;
const MAX_TOTAL_BYTES = 3.5 * 1024 * 1024;

function getText(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getImage(form: FormData, key: string) {
  const value = form.get(key);
  return value instanceof File ? value : null;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Bilinmeyen hata oluştu.";
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const project: ProjectMeta = {
      category: getText(form, "category"),
      brandName: getText(form, "brandName"),
      productName: getText(form, "productName"),
      competitor1BrandName: getText(form, "competitor1BrandName"),
      competitor2BrandName: getText(form, "competitor2BrandName"),
    };

    if (
      !project.category ||
      !project.productName ||
      !project.brandName ||
      !project.competitor1BrandName ||
      !project.competitor2BrandName
    ) {
      return NextResponse.json(
        { error: "Kategori, ürün adı ve üç marka adı zorunludur." },
        { status: 400 },
      );
    }

    const files = [
      getImage(form, "mainPack"),
      getImage(form, "competitor1"),
      getImage(form, "competitor2"),
    ];

    if (files.some((file) => !file)) {
      return NextResponse.json({ error: "Ana ambalaj ve iki rakip görseli zorunludur." }, { status: 400 });
    }

    const validFiles = files as File[];
    const totalSize = validFiles.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > MAX_TOTAL_BYTES) {
      return NextResponse.json(
        { error: "Üç görselin toplamı 3.5 MB canlı MVP sınırını aşıyor." },
        { status: 400 },
      );
    }

    for (const file of validFiles) {
      if (!ALLOWED_TYPES.has(file.type)) {
        return NextResponse.json({ error: `Desteklenmeyen dosya türü: ${file.name}` }, { status: 400 });
      }
      if (file.size > MAX_BYTES) {
        return NextResponse.json({ error: `${file.name} 1.2 MB canlı MVP sınırını aşıyor.` }, { status: 400 });
      }
    }

    const fileNames = validFiles.map((file) => file.name);
    const useMock = process.env.USE_MOCK_DATA !== "false";

    if (useMock) {
      const result = createMockAnalysis(project, fileNames);
      return NextResponse.json({ project, result });
    }

    try {
      const singlePackAttention = await analyzeSinglePackWithFengGui(validFiles[0]);
      const result = createFengGuiBackedAnalysis(project, fileNames, singlePackAttention);
      return NextResponse.json({ project, result });
    } catch (error) {
      console.error("Feng-GUI analysis failed", error);
      return NextResponse.json(
        { error: `Feng-GUI bağlantısı çalışmadı: ${errorMessage(error)}` },
        { status: 502 },
      );
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Analiz sırasında beklenmeyen bir hata oluştu." }, { status: 500 });
  }
}
