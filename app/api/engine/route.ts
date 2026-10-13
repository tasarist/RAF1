import { getEngine } from "@/lib/pa/engine";
import { ok } from "@/lib/pa/http";

export async function GET() {
  const e = getEngine();
  // İstemler istemciye gönderilmez.
  return ok({ version: e.version, flows: e.flows, stepLabels: e.stepLabels, aoiTypes: e.aoiTypes, rules: e.rules });
}
