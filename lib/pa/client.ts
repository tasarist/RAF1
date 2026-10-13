"use client";

import type { AttentionResult } from "./types";

export async function api<T>(url: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(url, {
    method: init?.method ?? (init?.body ? "POST" : "GET"),
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });
  const data = await res.json().catch(() => ({ error: `Sunucu hatası (${res.status})` }));
  if (!res.ok) throw new Error((data as { error?: string }).error || `Hata ${res.status}`);
  return data as T;
}

export function imageUrl(id: string, slot: string, v?: string) {
  return `/api/analyses/${id}/images/${slot}${v ? `?v=${encodeURIComponent(v)}` : ""}`;
}

// Görseli hedef tuvale sığdırır (oran korunur, kenarlar beyaz). Ambalaj 1024×1024, raf 1536×1024.
export function fileToCanvasDataUrl(file: File, w: number, h: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d");
      if (!ctx) return reject(new Error("Tuval açılamadı."));
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      const s = Math.min(w / img.width, h / img.height);
      const dw = img.width * s;
      const dh = img.height * s;
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.9));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Görsel okunamadı.")); };
    img.src = url;
  });
}

export const PACK_SIZE = { w: 1024, h: 1024 };
export const SHELF_SIZE = { w: 1536, h: 1024 };

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Görsel yüklenemedi."));
    img.src = src;
  });
}

// Isı haritası: bakış noktaları süreyle ağırlıklı yoğunluk → renk rampası.
export async function drawHeatmap(canvas: HTMLCanvasElement, src: string, att: AttentionResult) {
  const img = await loadImage(src);
  const W = canvas.width;
  const H = Math.round((W * img.height) / img.width);
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.drawImage(img, 0, 0, W, H);
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(0, 0, W, H);

  const off = document.createElement("canvas");
  off.width = W;
  off.height = H;
  const o = off.getContext("2d");
  if (!o) return;
  const rad = Math.max(W, H) * 0.07;
  const maxD = Math.max(...att.fixations.map((f) => f.d), 1);
  for (const f of att.fixations) {
    const g = o.createRadialGradient(f.x * W, f.y * H, 0, f.x * W, f.y * H, rad);
    const a = 0.12 + 0.18 * (f.d / maxD);
    g.addColorStop(0, `rgba(0,0,0,${a})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    o.fillStyle = g;
    o.fillRect(f.x * W - rad, f.y * H - rad, rad * 2, rad * 2);
  }
  const data = o.getImageData(0, 0, W, H);
  let peak = 1;
  for (let i = 3; i < data.data.length; i += 4) peak = Math.max(peak, data.data[i]);
  const ramp = [[40, 70, 255], [0, 220, 140], [255, 230, 0], [255, 60, 30]];
  for (let i = 0; i < data.data.length; i += 4) {
    const t = data.data[i + 3] / peak;
    if (t < 0.06) { data.data[i + 3] = 0; continue; }
    const p = Math.min(2.999, t * 3);
    const k = Math.floor(p);
    const f = p - k;
    for (let c = 0; c < 3; c++) data.data[i + c] = ramp[k][c] + (ramp[k + 1][c] - ramp[k][c]) * f;
    data.data[i + 3] = Math.round(70 + 150 * t);
  }
  o.putImageData(data, 0, 0);
  ctx.drawImage(off, 0, 0);
}

// Bakış rotası: ilk bakışların sırası, daire boyu = süre.
export async function drawGaze(canvas: HTMLCanvasElement, src: string, att: AttentionResult) {
  const img = await loadImage(src);
  const W = canvas.width;
  const H = Math.round((W * img.height) / img.width);
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.drawImage(img, 0, 0, W, H);
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.fillRect(0, 0, W, H);
  const pts = att.gazePath.map((i) => att.fixations[i]).filter(Boolean);
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x * W, p.y * H) : ctx.moveTo(p.x * W, p.y * H)));
  ctx.stroke();
  pts.forEach((p, i) => {
    const r = 9 + (p.d / 460) * 12;
    ctx.beginPath();
    ctx.arc(p.x * W, p.y * H, r, 0, Math.PI * 2);
    ctx.fillStyle = i === 0 ? "rgba(255,90,60,0.92)" : "rgba(30,120,255,0.88)";
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.font = `700 ${Math.round(r)}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(i + 1), p.x * W, p.y * H + 1);
  });
}
