import { getAnalysis, readImage } from "@/lib/pa/store";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string; slot: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id, slot } = await params;
  const a = await getAnalysis(id);
  const file = a?.images[slot];
  if (!file) return new Response("Bulunamadı", { status: 404 });
  const { buf, mime } = await readImage(file);
  return new Response(new Uint8Array(buf), { headers: { "Content-Type": mime, "Cache-Control": "private, max-age=60" } });
}
