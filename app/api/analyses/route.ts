import { NextResponse } from "next/server";
import { listAnalyses } from "@/lib/store/analysisStore";
import { toSummary } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Server-cache list (non-durable). The browser keeps its own copy in IndexedDB. */
export async function GET() {
  return NextResponse.json({ analyses: listAnalyses().map(toSummary) });
}
