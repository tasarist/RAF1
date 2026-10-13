import { body, errMsg, fail, ok } from "@/lib/pa/http";
import { generateOptimized } from "@/lib/pa/imageGen";
import { withLock, getAnalysis, readImage, saveAnalysis, saveImage } from "@/lib/pa/store";

export const runtime = "nodejs";
export const maxDuration = 120;

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  return withLock(id, () => handlePOST(req, ctx));
}

async function handlePOST(req: Request, { params }: Ctx) {
  const a = await getAnalysis((await params).id);
  if (!a) return fail("Kayıt bulunamadı.", 404);
  const { prompt, quality, source = "ours" } = await body<{ prompt?: string; quality?: string; source?: "ours" | "optimized" }>(req);
  if (!prompt?.trim()) return fail("Prompt gerekli.");
  const file = a.images[source === "optimized" ? "optimized" : "ours"];
  if (!file) return fail("Kaynak görsel yok.");

  try {
    const out = await generateOptimized(await readImage(file), prompt.slice(0, 4000), quality);
    const version = (a.optimized?.version ?? 0) + 1;
    a.images.optimized = (await saveImage(a.id, "optimized", out.dataUrl)).file;
    a.images[`optimized-v${version}`] = (await saveImage(a.id, `optimized-v${version}`, out.dataUrl)).file;
    a.optimized = { prompt, model: out.model, revisedPrompt: out.revisedPrompt, version, source, createdAt: new Date().toISOString() };
    if (a.attention) delete a.attention.optimized;
    await saveAnalysis(a);
    return ok(a);
  } catch (e) {
    return fail(errMsg(e), 502);
  }
}
