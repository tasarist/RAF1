import { body, fail, ok } from "@/lib/pa/http";
import { withLock, getAnalysis, saveAnalysis } from "@/lib/pa/store";
import type { Analysis } from "@/lib/pa/types";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const a = await getAnalysis((await params).id);
  return a ? ok(a) : fail("Kayıt bulunamadı.", 404);
}

// İstemcinin yazabileceği alanlar. Skorlar yalnızca /score ile yazılır.
const WRITABLE = ["project", "brandAssets", "brandReads", "shelfReads", "consistency", "selectedRecs", "progress"] as const;

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  return withLock(id, () => handlePATCH(req, ctx));
}

async function handlePATCH(req: Request, { params }: Ctx) {
  const a = await getAnalysis((await params).id);
  if (!a) return fail("Kayıt bulunamadı.", 404);
  const patch = await body<Partial<Analysis>>(req);

  for (const k of WRITABLE) {
    if (patch[k] === undefined) continue;
    if (k === "brandReads" || k === "shelfReads" || k === "consistency") {
      (a as unknown as Record<string, unknown>)[k] = { ...(a[k] ?? {}), ...(patch[k] as object) };
    } else {
      (a as unknown as Record<string, unknown>)[k] = patch[k];
    }
  }

  // Kayıtlı Rakip/Raf Testi bağlama.
  if (patch.refs && a.kind === "pack") {
    for (const [key, refId] of Object.entries(patch.refs)) {
      if (!refId) continue;
      const ref = await getAnalysis(refId);
      const want = key === "competitors" ? "competitors" : "shelf";
      if (!ref || ref.kind !== want) return fail("Bağlanacak kayıt bulunamadı.", 404);
      if (want === "shelf") {
        const brands = ref.shelfShares?.byBrand.map((b) => b.brand.toLowerCase()) ?? [];
        if (!brands.includes(a.project.brand.toLowerCase())) return fail(`Bu Raf Testi'nde ${a.project.brand} markası yok.`, 422);
      }
      a.refs = { ...a.refs, [want]: refId };
    }
  }
  await saveAnalysis(a);
  return ok(a);
}
