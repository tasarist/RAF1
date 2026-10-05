import { NextResponse } from "next/server";
import { runAnalysis } from "@/lib/pipeline";
import { saveAnalysis } from "@/lib/store/analysisStore";
import type { ProjectMeta } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_FILE_BYTES = 4 * 1024 * 1024;
const MAX_SKUS = 4;

function text(form: FormData, key: string) {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function file(form: FormData, key: string) {
  const v = form.get(key);
  return v instanceof File && v.size > 0 ? v : null;
}

function validate(f: File, label: string) {
  if (!ALLOWED_TYPES.has(f.type)) return `${label}: desteklenmeyen dosya türü (${f.type || "bilinmiyor"}). PNG, JPG veya WEBP yükleyin.`;
  if (f.size > MAX_FILE_BYTES) return `${label}: dosya 4 MB sınırını aşıyor.`;
  return null;
}

/**
 * POST /api/analyze — multipart form.
 * Required: projectName, category, brandName, productName, competitor1BrandName, competitor2BrandName,
 *           mainPack, competitor1, competitor2
 * Optional: previousPack, sku[] (up to 4)
 * Uploaded bytes never leave the request lifecycle except as private data URLs inside the result.
 */
export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const project: ProjectMeta = {
      projectName: text(form, "projectName"),
      category: text(form, "category"),
      brandName: text(form, "brandName"),
      productName: text(form, "productName"),
      competitor1BrandName: text(form, "competitor1BrandName") || "Rakip 1",
      competitor2BrandName: text(form, "competitor2BrandName") || "Rakip 2",
    };
    const missing = (["projectName", "category", "brandName", "productName"] as const).filter((k) => !project[k]);
    if (missing.length) return NextResponse.json({ error: `Eksik alanlar: ${missing.join(", ")}` }, { status: 400 });

    const main = file(form, "mainPack");
    const c1 = file(form, "competitor1");
    const c2 = file(form, "competitor2");
    if (!main || !c1 || !c2) return NextResponse.json({ error: "Ana ambalaj ve iki rakip görseli zorunludur." }, { status: 400 });

    const previous = file(form, "previousPack");
    const skus = form.getAll("sku").filter((v): v is File => v instanceof File && v.size > 0).slice(0, MAX_SKUS);

    for (const [f, label] of [[main, "Ana ambalaj"], [c1, "Rakip 1"], [c2, "Rakip 2"], ...(previous ? [[previous, "Eski ambalaj"] as const] : []), ...skus.map((s, i) => [s, `SKU ${i + 1}`] as const)] as Array<readonly [File, string]>) {
      const err = validate(f, label);
      if (err) return NextResponse.json({ error: err }, { status: 400 });
    }

    const toBuffer = async (f: File) => Buffer.from(await f.arrayBuffer());
    const analysis = await runAnalysis(project, {
      main: await toBuffer(main),
      competitor1: await toBuffer(c1),
      competitor2: await toBuffer(c2),
      previous: previous ? await toBuffer(previous) : undefined,
      otherSkus: await Promise.all(skus.map(toBuffer)),
    });
    saveAnalysis(analysis);
    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("[5SE] analyze failed", error);
    const message = error instanceof Error ? error.message : "Analiz sırasında beklenmeyen bir hata oluştu.";
    // 4xx so the preview proxy does not clamp the status.
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
