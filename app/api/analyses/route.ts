import { CURRENT_ENGINE_VERSION } from "@/lib/pa/engine";
import { body, fail, ok } from "@/lib/pa/http";
import { getAnalysis, listAnalyses, newId, saveAnalysis, withLock } from "@/lib/pa/store";
import type { Analysis, Kind, Project } from "@/lib/pa/types";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const kind = new URL(req.url).searchParams.get("kind") ?? undefined;
  const list = await listAnalyses(kind);
  // Liste özeti: büyük alanlar gönderilmez.
  return ok(list.map((a) => ({
    id: a.id, kind: a.kind, status: a.status, createdAt: a.createdAt, updatedAt: a.updatedAt, project: a.project,
    total: a.scores?.total ?? null, verdict: a.scores?.verdict ?? null, step: a.progress?.step ?? null, images: Object.keys(a.images),
    brands: a.kind === "shelf" ? a.shelfShares?.byBrand.map((b) => b.brand) ?? [] : undefined,
    comps: a.kind === "competitors" ? a.compScores?.comps.map((c) => c.label) ?? [] : undefined,
  })));
}

export async function POST(req: Request) {
  const { project, kind = "pack", parentId } = await body<{ project?: Project; kind?: Kind; parentId?: string }>(req);
  if (!project?.brand?.trim() || !project?.name?.trim()) return fail("Proje adı ve marka gerekli.");
  if (!["pack", "competitors", "shelf"].includes(kind)) return fail("Geçersiz kayıt türü.");

  const now = new Date().toISOString();
  const a: Analysis = {
    id: newId(), kind, engineVersion: CURRENT_ENGINE_VERSION, status: "draft", createdAt: now, updatedAt: now,
    project: { name: project.name.trim(), brand: project.brand.trim(), category: project.category?.trim() ?? "", goal: project.goal, channel: project.channel?.trim() ?? "" },
    images: {},
  };

  // Ambalaj akışından açılan modül: ambalaj kaydına bağlanır.
  if (parentId) {
    const linked = await withLock(parentId, async () => {
      const parent = await getAnalysis(parentId);
      if (!parent || parent.kind !== "pack") return false;
      a.parentId = parentId;
      await saveAnalysis(a);
      parent.refs = { ...parent.refs, [kind === "competitors" ? "competitors" : "shelf"]: a.id };
      await saveAnalysis(parent);
      return true;
    });
    if (!linked) return fail("Bağlı ambalaj kaydı bulunamadı.", 404);
  } else {
    await saveAnalysis(a);
  }
  return ok(a, 201);
}
