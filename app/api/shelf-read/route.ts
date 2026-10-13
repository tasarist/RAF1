import { readShelf } from "@/lib/pa/ai";
import { body, errMsg, fail, ok } from "@/lib/pa/http";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const { image, brands } = await body<{ image?: string; brands?: string[] }>(req);
  if (!image) return fail("Görsel gerekli.");
  try {
    return ok(await readShelf(image, Array.isArray(brands) ? brands.slice(0, 6).map(String) : []));
  } catch (e) {
    return fail(errMsg(e), 502);
  }
}
