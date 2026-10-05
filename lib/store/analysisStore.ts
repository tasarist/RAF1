import "server-only";
import type { Analysis } from "@/lib/types";

/**
 * Process-local analysis cache.
 *
 * The MVP has no database by design. Results travel to the browser and are persisted there
 * (IndexedDB); this server cache exists so freshly created analyses can be re-fetched by id while the
 * same server instance is alive (dev server, `next start`, or a warm Vercel function). It is NOT
 * durable storage — Supabase will take over in a later phase.
 */
const MAX_ENTRIES = 40;

type Store = Map<string, Analysis>;

const globalStore = globalThis as unknown as { __fiveSeStore?: Store };
const store: Store = globalStore.__fiveSeStore ?? new Map();
globalStore.__fiveSeStore = store;

export function saveAnalysis(analysis: Analysis) {
  store.set(analysis.id, analysis);
  if (store.size > MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest) store.delete(oldest);
  }
}

export function getAnalysis(id: string) {
  return store.get(id) ?? null;
}

export function listAnalyses() {
  return Array.from(store.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
