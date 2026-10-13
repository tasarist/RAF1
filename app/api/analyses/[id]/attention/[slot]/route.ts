import { simulateAttention, type AoiInput } from "@/lib/pa/attention";
import { body, errMsg, fail, ok } from "@/lib/pa/http";
import { withLock, getAnalysis, readImage, saveAnalysis, sha256 } from "@/lib/pa/store";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string; slot: string }> };

// Görsel dikkat ölçümü. Sağlayıcı askıda olduğundan sonuç anında, temsili olarak döner (suspended: true).
export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  return withLock(id, () => handlePOST(req, ctx));
}

async function handlePOST(req: Request, { params }: Ctx) {
  const { id, slot } = await params;
  const a = await getAnalysis(id);
  if (!a) return fail("Kayıt bulunamadı.", 404);
  const file = a.images[slot];
  if (!file) return fail("Bu slotta görsel yok.");

  const { label, aois } = await body<{ label?: string; aois?: AoiInput[] }>(req);
  const clean = (Array.isArray(aois) ? aois : []).slice(0, 6).map((x) => ({
    id: String(x.id), text: String(x.text ?? ""), type: x.type ? String(x.type) : undefined,
    box: { x: +x.box.x, y: +x.box.y, w: +x.box.w, h: +x.box.h },
  }));

  try {
    const { buf } = await readImage(file);
    const result = simulateAttention(sha256(buf), label || slot, clean);
    a.attention = { ...a.attention, [slot]: result };
    await saveAnalysis(a);
    return ok(result);
  } catch (e) {
    a.attention = { ...a.attention, [slot]: { error: errMsg(e), failedAt: new Date().toISOString() } };
    await saveAnalysis(a);
    return fail(errMsg(e), 500);
  }
}
