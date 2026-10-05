import { NextResponse } from "next/server";
import { getPublicStatus } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Secret-free runtime status for the UI mode badge. */
export async function GET() {
  return NextResponse.json(getPublicStatus());
}
