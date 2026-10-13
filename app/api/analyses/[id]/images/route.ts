import { body, errMsg, fail, ok } from "@/lib/pa/http";
import { withLock, getAnalysis, saveAnalysis, saveImage, validSlot } from "@/lib/pa/store";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  return withLock(id, () => handlePOST(req, ctx));
}

async function handlePOST(req: Request, { params }: Ctx) {
  const a = await getAnalysis((await params).id);
  if (!a) return fail("Kayıt bulunamadı.", 404);
  const { slot, image } = await body<{ slot?: string; image?: string }>(req);
  if (!slot || !validSlot(slot) || !image) return fail("Slot ve görsel gerekli.");
  try {
    const { file } = await saveImage(a.id, slot, image);
    a.images[slot] = file;
    // Kullanıcının kendi revizesi: yeni sürüm, eski ölçüm geçersiz.
    if (slot === "optimized") {
      const version = (a.optimized?.version ?? 0) + 1;
      const { file: vfile } = await saveImage(a.id, `optimized-v${version}`, image);
      a.images[`optimized-v${version}`] = vfile;
      a.optimized = { version, manual: true, createdAt: new Date().toISOString() };
      if (a.attention) delete a.attention.optimized;
    }
    await saveAnalysis(a);
    return ok({ slot, file });
  } catch (e) {
    return fail(errMsg(e));
  }
}
