import { fail, ok } from "@/lib/pa/http";
import { buildFindings, buildRecs } from "@/lib/pa/recs";
import { buildScores, computeCompScores, computeCompare, computeShelfShares } from "@/lib/pa/scoring";
import { withLock, getAnalysis, saveAnalysis } from "@/lib/pa/store";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  return withLock(id, () => handlePOST(_req, ctx));
}

async function handlePOST(_req: Request, { params }: Ctx) {
  const a = await getAnalysis((await params).id);
  if (!a) return fail("Kayıt bulunamadı.", 404);

  if (a.kind === "competitors") {
    a.compScores = computeCompScores(a);
    a.status = "analyzed";
    return ok(await saveAnalysis(a));
  }
  if (a.kind === "shelf") {
    a.shelfShares = computeShelfShares(a);
    a.status = "analyzed";
    return ok(await saveAnalysis(a));
  }

  const comp = a.refs?.competitors ? await getAnalysis(a.refs.competitors) : null;
  const shelf = a.refs?.shelf ? await getAnalysis(a.refs.shelf) : null;
  if (!a.brandAssets && !a.attention?.ours) return fail("Ana SKU okunmadan ve ölçülmeden skor hesaplanamaz.");

  const { scores, detail } = buildScores(a, shelf);
  a.scores = scores;
  a.scoreDetail = detail;
  a.compare = computeCompare(a, scores.dims, scores.total, comp, shelf);
  a.findings = buildFindings(a);
  a.recs = buildRecs(a);
  const ids = new Set(a.recs.map((r) => r.id));
  a.selectedRecs = (a.selectedRecs ?? a.recs.filter((r) => r.priority !== "Düşük").map((r) => r.id)).filter((x) => ids.has(x));
  if (scores.after) a.status = "completed";
  else if (a.status === "draft") a.status = "analyzed";
  return ok(await saveAnalysis(a));
}
