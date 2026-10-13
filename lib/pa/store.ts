import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import type { Analysis } from "./types";

// Vercel'de yalnızca /tmp yazılabilir (geçici); yerelde ./data kullanılır.
const ROOT = process.env.DATA_DIR || (process.env.VERCEL ? "/tmp/pack-analytic" : path.join(process.cwd(), "data"));
const DIRS = { analyses: path.join(ROOT, "analyses"), images: path.join(ROOT, "images"), cache: path.join(ROOT, "cache") };

async function ensure(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

export function newId() {
  return crypto.randomBytes(8).toString("hex");
}

export function sha256(data: string | Buffer) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

const ID_RE = /^[a-f0-9]{16}$/;
const SLOT_RE = /^[a-z0-9-]{1,32}$/;

export function validId(id: string) {
  return ID_RE.test(id);
}

export function validSlot(slot: string) {
  return SLOT_RE.test(slot);
}

export async function saveAnalysis(a: Analysis) {
  await ensure(DIRS.analyses);
  a.updatedAt = new Date().toISOString();
  await fs.writeFile(path.join(DIRS.analyses, `${a.id}.json`), JSON.stringify(a, null, 2));
  return a;
}

export async function getAnalysis(id: string): Promise<Analysis | null> {
  if (!validId(id)) return null;
  try {
    return JSON.parse(await fs.readFile(path.join(DIRS.analyses, `${id}.json`), "utf8"));
  } catch {
    return null;
  }
}

export async function listAnalyses(kind?: string): Promise<Analysis[]> {
  await ensure(DIRS.analyses);
  const files = (await fs.readdir(DIRS.analyses)).filter((f) => f.endsWith(".json"));
  const all = await Promise.all(files.map((f) => getAnalysis(f.replace(/\.json$/, ""))));
  return all
    .filter((a): a is Analysis => !!a && (!kind || a.kind === kind))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// Görseller dataURL olarak gelir, dosyaya ikili yazılır.
export function parseDataUrl(dataUrl: string) {
  const m = /^data:(image\/(png|jpeg|webp));base64,(.+)$/.exec(dataUrl || "");
  if (!m) return null;
  return { mime: m[1], ext: m[2] === "jpeg" ? "jpg" : m[2], buf: Buffer.from(m[3], "base64") };
}

export async function saveImage(id: string, slot: string, dataUrl: string) {
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) throw new Error("Geçersiz görsel biçimi (png, jpeg, webp).");
  await ensure(DIRS.images);
  const file = `${id}-${slot}.${parsed.ext}`;
  await fs.writeFile(path.join(DIRS.images, file), parsed.buf);
  return { file, hash: sha256(parsed.buf) };
}

export async function readImage(file: string) {
  const buf = await fs.readFile(path.join(DIRS.images, path.basename(file)));
  const ext = path.extname(file).slice(1);
  const mime = ext === "jpg" ? "image/jpeg" : `image/${ext}`;
  return { buf, mime };
}

export async function imageDataUrl(file: string) {
  const { buf, mime } = await readImage(file);
  return `data:${mime};base64,${buf.toString("base64")}`;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(path.join(DIRS.cache, `${sha256(key)}.json`), "utf8"));
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown) {
  await ensure(DIRS.cache);
  await fs.writeFile(path.join(DIRS.cache, `${sha256(key)}.json`), JSON.stringify(value));
}

// Aynı kayda eşzamanlı yazmalar birbirini ezmesin diye kayıt başına sıralı kuyruk.
const locks = new Map<string, Promise<unknown>>();

export function withLock<T>(id: string, fn: () => Promise<T>): Promise<T> {
  const prev = locks.get(id) ?? Promise.resolve();
  const run = prev.catch(() => undefined).then(fn);
  const tail = run.catch(() => undefined);
  locks.set(id, tail);
  tail.then(() => { if (locks.get(id) === tail) locks.delete(id); });
  return run;
}
