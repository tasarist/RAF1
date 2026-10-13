"use client";

import { useMemo, useState } from "react";
import { api, fileToCanvasDataUrl, imageUrl, PACK_SIZE } from "@/lib/pa/client";
import { isAttention, type Analysis } from "@/lib/pa/types";
import { AoiEditor, fromEditorItem, toEditorItems, type EditorItem } from "../AoiEditor";
import { AttentionView, MetricGrid, ShareTable } from "../AttentionView";
import { ErrorNote, StepFooter, UploadSlot, type Wiz } from "../shared";

const GUARD = "Edit only the 2D artwork/label of this packaging image. Keep the same package silhouette, proportions, closure, perspective and position; square canvas, clean neutral background. Keep the brand name and product type. Do not add people, hands or unrelated objects.";

// ── Adım 8 · Tasarımı Optimize Et ────────────────────────────────────────
export function OptimizeStep({ w }: { w: Wiz }) {
  const a = w.pack!;
  const chosen = useMemo(() => (a.recs ?? []).filter((r) => a.selectedRecs?.includes(r.id)), [a]);
  const [mode, setMode] = useState<"ai" | "upload">("ai");
  const [prompt, setPrompt] = useState(a.optimized?.prompt ?? `${GUARD}\n\nApply these improvements:\n${chosen.map((r) => `- ${r.prompt}`).join("\n") || "- Improve brand visibility, message hierarchy and contrast."}`);
  const [quality, setQuality] = useState("medium");
  const [source, setSource] = useState<"ours" | "optimized">("ours");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setError(null);
    setBusy(true);
    try {
      w.setPack(await api<Analysis>(`/api/analyses/${a.id}/optimize`, { body: { prompt, quality, source } }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function upload(f: File) {
    setError(null);
    setBusy(true);
    try {
      const d = await fileToCanvasDataUrl(f, PACK_SIZE.w, PACK_SIZE.h);
      await api(`/api/analyses/${a.id}/images`, { body: { slot: "optimized", image: d } });
      w.setPack(await api<Analysis>(`/api/analyses/${a.id}`));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const has = !!a.images.optimized;

  return (
    <section className="wz-step">
      <header className="wz-step-head"><h2>Tasarımı Optimize Et</h2><p>Seçilen öneriler: {chosen.length ? chosen.map((r) => r.title).join(" · ") : "yok"}.</p></header>
      <div className="wz-seg" role="tablist">
        <button type="button" className={mode === "ai" ? "on" : ""} onClick={() => setMode("ai")}>YZ ile üret</button>
        <button type="button" className={mode === "upload" ? "on" : ""} onClick={() => setMode("upload")}>Revize görsel yükle</button>
      </div>
      <div className="wz-grid2">
        <div className="wz-panel">
          {mode === "ai" ? (
            <div className="wz-stack">
              <label className="wz-field"><span>Prompt (düzenlenebilir)</span><textarea id="opt-prompt" rows={10} value={prompt} onChange={(e) => setPrompt(e.target.value)} /></label>
              <div className="wz-form">
                <label className="wz-field"><span>Kalite</span>
                  <select id="opt-quality" value={quality} onChange={(e) => setQuality(e.target.value)}><option value="low">Düşük (hızlı)</option><option value="medium">Orta</option><option value="high">Yüksek</option></select>
                </label>
                <label className="wz-field"><span>Temel</span>
                  <select id="opt-source" value={source} onChange={(e) => setSource(e.target.value as "ours" | "optimized")}><option value="ours">Orijinal Ana SKU</option><option value="optimized" disabled={!has}>Son üretim (yineleme)</option></select>
                </label>
              </div>
              <div className="wz-actions"><button type="button" className="wz-btn" disabled={busy || !prompt.trim()} onClick={generate}>{busy ? "Üretiliyor… (1 dakikaya kadar)" : "Tasarımı üret"}</button></div>
            </div>
          ) : (
            <UploadSlot label="Revize tasarım" hint="Kendi tasarımcınızın hazırladığı versiyon" src={null} busy={busy && "Yükleniyor…"} onFile={upload} />
          )}
          <ErrorNote error={error} />
        </div>
        <div className="wz-panel">
          <h3>{has ? `Optimize tasarım · v${a.optimized?.version}${a.optimized?.manual ? " (yükleme)" : ""}` : "Henüz optimize tasarım yok"}</h3>
          <div className="wz-attimg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={has ? imageUrl(a.id, "optimized", a.optimized?.createdAt) : imageUrl(a.id, "ours")} alt="" style={{ opacity: has ? 1 : 0.35 }} />
          </div>
        </div>
      </div>
      <StepFooter note={has ? null : "Önce bir optimize tasarım üretin ya da yükleyin."}><button type="button" className="wz-btn" disabled={!has || busy} onClick={w.next}>Devam: Yeniden Test</button></StepFooter>
    </section>
  );
}

// ── Adım 9 · Yeniden Test ────────────────────────────────────────────────
export function RetestStep({ w }: { w: Wiz }) {
  const a = w.pack!;
  const opt = isAttention(a.attention?.optimized) ? a.attention.optimized : undefined;
  const base = isAttention(a.attention?.ours) ? a.attention.ours.aois : a.brandAssets?.elements ?? [];
  const [items, setItems] = useState<EditorItem[]>(toEditorItems(opt?.aois ?? base));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const src = imageUrl(a.id, "optimized", a.optimized?.createdAt);

  async function measure() {
    setError(null);
    setBusy(true);
    try {
      const aois = items.map((it) => ({ ...fromEditorItem(it), type: it.type ?? "other" }));
      await api(`/api/analyses/${a.id}/attention/optimized`, { body: { label: "Optimize tasarım", aois } });
      w.setPack(await api<Analysis>(`/api/analyses/${a.id}/score`, { body: {} }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="wz-step">
      <header className="wz-step-head"><h2>Yeniden Test</h2><p>Alanlar Ana SKU&apos;dan taşındı; yeni tasarıma göre düzeltip ölçün.</p></header>
      <div className="wz-panel">
        <AoiEditor src={src} items={items} onChange={setItems} types={w.engine.aoiTypes} />
        <div className="wz-actions"><button type="button" className="wz-btn" disabled={busy || !items.length} onClick={measure}>{busy ? "Ölçülüyor…" : opt ? "Yeniden ölç" : "Alanları onayla ve ölç"}</button></div>
        <ErrorNote error={error} />
      </div>
      {opt ? (
        <div className="wz-panel wz-grid2">
          <AttentionView src={src} att={opt} />
          <div className="wz-stack"><h3>Bakış Payı (%)</h3><ShareTable att={opt} types={w.engine.aoiTypes} /><MetricGrid att={opt} /></div>
        </div>
      ) : null}
      <StepFooter note={opt ? null : "Alanları kontrol edip optimize tasarımı ölçün."}><button type="button" className="wz-btn" disabled={!opt || !a.scores?.after} onClick={w.next}>Devam: Önce / Sonra</button></StepFooter>
    </section>
  );
}
