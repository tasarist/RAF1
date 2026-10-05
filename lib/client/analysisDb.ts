"use client";

import type { Analysis, AnalysisSummary } from "@/lib/types";
import { toSummary } from "@/lib/types";
import { apiUrl } from "./env";

/**
 * Browser-side persistence for analyses (IndexedDB, with an in-memory fallback for sandboxed
 * iframes where storage is blocked). No login, no database yet — the user's results stay on their
 * device, which also keeps unreleased packaging private.
 */
const DB_NAME = "fivese";
const STORE = "analyses";
const memory = new Map<string, Analysis>();

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") return resolve(null);
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: "id" });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function saveAnalysisLocally(analysis: Analysis) {
  memory.set(analysis.id, analysis);
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(analysis);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

async function readLocal(id: string): Promise<Analysis | null> {
  if (memory.has(id)) return memory.get(id)!;
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const req = db.transaction(STORE, "readonly").objectStore(STORE).get(id);
      req.onsuccess = () => resolve((req.result as Analysis | undefined) ?? null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/** Local first, then the server cache (same process), else null. */
export async function loadAnalysis(id: string): Promise<Analysis | null> {
  const local = await readLocal(id);
  if (local) return local;
  try {
    const res = await fetch(apiUrl(`/api/analyses/${id}`));
    if (!res.ok) return null;
    const json = (await res.json()) as { analysis: Analysis };
    memory.set(id, json.analysis);
    return json.analysis;
  } catch {
    return null;
  }
}

export async function listLocalAnalyses(): Promise<AnalysisSummary[]> {
  const items = new Map<string, Analysis>(memory);
  const db = await openDb();
  if (db) {
    await new Promise<void>((resolve) => {
      try {
        const req = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
        req.onsuccess = () => {
          for (const a of (req.result as Analysis[]) ?? []) items.set(a.id, a);
          resolve();
        };
        req.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }
  if (!items.size) {
    // Sandboxed preview without storage: fall back to the server cache list.
    try {
      const res = await fetch(apiUrl("/api/analyses"));
      if (res.ok) {
        const json = (await res.json()) as { analyses: AnalysisSummary[] };
        return json.analyses;
      }
    } catch {
      /* offline */
    }
  }
  return Array.from(items.values())
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(toSummary);
}

export async function deleteLocalAnalysis(id: string) {
  memory.delete(id);
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}
