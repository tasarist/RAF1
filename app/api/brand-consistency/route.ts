import { readConsistency } from "@/lib/pa/ai";
import { body, errMsg, fail, ok } from "@/lib/pa/http";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const { image, other, mode } = await body<{ image?: string; other?: string; mode?: string }>(req);
  if (!image || !other) return fail("İki görsel gerekli.");
  if (mode !== "variant" && mode !== "old") return fail("Geçersiz mod.");
  try {
    return ok(await readConsistency(image, other, mode));
  } catch (e) {
    return fail(errMsg(e), 502);
  }
}
