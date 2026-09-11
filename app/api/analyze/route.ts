import { NextResponse } from "next/server";
import { createMockAnalysis } from "@/lib/mockAnalysis";
import type { ProjectMeta } from "@/lib/types";

export const runtime = "nodejs";

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_BYTES = 12 * 1024 * 1024;

function getText(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getImage(form: FormData, key: string) {
  const value = form.get(key);
  return value instanceof File ? value : null;
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const project: ProjectMeta = {
      category: getText(form, "category"),
      brandName: getText(form, "brandName"),
      productName: getText(form, "productName"),
    };

    if (!project.category || !project.brandName || !project.productName) {
      return NextResponse.json({ error: "Kategori, marka ve ürün alanları zorunludur." }, { status: 400 });
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
    for (const file of validFiles) {
      if (!ALLOWED_TYPES.has(file.type)) {
        return NextResponse.json({ error: `Desteklenmeyen dosya türü: ${file.name}` }, { status: 400 });
      }
      if (file.size > MAX_BYTES) {
        return NextResponse.json({ error: `${file.name} 12 MB sınırını aşıyor.` }, { status: 400 });
      }
    }

    const useMock = process.env.USE_MOCK_DATA !== "false";
    if (!useMock) {
      return NextResponse.json(
        { error: "Canlı API adaptörleri v0.1'de etkin değil. USE_MOCK_DATA=true kullanın." },
        { status: 501 },
      );
    }

    const result = createMockAnalysis(project, validFiles.map((file) => file.name));
    return NextResponse.json({ project, result });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Analiz sırasında beklenmeyen bir hata oluştu." }, { status: 500 });
  }
}
