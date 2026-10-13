import { readBrandAssets } from "@/lib/pa/ai";
import { body, errMsg, fail, ok } from "@/lib/pa/http";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const { image } = await body<{ image?: string }>(req);
  if (!image) return fail("Görsel gerekli.");
  try {
    return ok(await readBrandAssets(image));
  } catch (e) {
    return fail(errMsg(e), 502);
  }
}
