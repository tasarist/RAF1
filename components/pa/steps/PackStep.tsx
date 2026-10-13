"use client";

import { useState } from "react";
import { api, fileToCanvasDataUrl, imageUrl, PACK_SIZE } from "@/lib/pa/client";
import { isAttention, type Analysis, type BrandRead, type ConsistencyRead } from "@/lib/pa/types";
import { AoiEditor, fromEditorItem, toEditorItems, type EditorItem } from "../AoiEditor";
import { AttentionView, MetricGrid, ShareTable } from "../AttentionView";
import { ErrorNote, logoText, norm, UploadSlot, urlToDataUrl, type Wiz } from "../shared";

type Slot = "ours" | "variant" | "old";

export function PackStep({ w }: { w: Wiz }) {
  const pack = w.pack;
  const refresh = w.project.goal === "refresh";
  const [data, setData] = useState<Partial<Record<Slot, string>>>({});
  const [read, setRead] = useState<BrandRead | null>(pack?.brandAssets ?? null);
  const [items, setItems] = useState<EditorItem[]>(pack?.brandAssets ? toEditorItems(pack.brandAssets.elements) : []);
  const [cons, setCons] = useState<Partial<Record<"variant" | "old", ConsistencyRead>>>(pack?.consistency ?? {});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const att = isAttention(pack?.attention?.ours) ? pack.attention.ours : undefined;
  const src = (s: Slot) => data[s] ?? (pack?.images[s] ? imageUrl(pack.id, s, pack.updatedAt) : null);

  async function oursDataUrl() {
    return data.ours ?? (pack?.images.ours ? await urlToDataUrl(imageUrl(pack.id, "ours")) : null);
  }

  async function onOurs(f: File) {
    setError(null);
    setBusy("ours");
    try {
      const d = await fileToCanvasDataUrl(f, PACK_SIZE.w, PACK_SIZE.h);
      setData((x) => ({ ...x, ours: d }));
      const r = await api<BrandRead>("/api/brand-assets", { body: { image: d } });
      setRead(r);
      setItems(toEditorItems(r.elements));
      setDirty(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function onOther(slot: "variant" | "old", f: File) {
    setError(null);
    setBusy(slot);
    try {
      const d = await fileToCanvasDataUrl(f, PACK_SIZE.w, PACK_SIZE.h);
      setData((x) => ({ ...x, [slot]: d }));
      const base = await oursDataUrl();
      if (!base) throw new Error("Önce Ana SKU görselini yükleyin.");
      const c = await api<ConsistencyRead>("/api/brand-consistency", { body: { image: base, other: d, mode: slot } });
      setCons((x) => ({ ...x, [slot]: c }));
      setDirty(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const logo = logoText(items);
  const brandConflict = !!logo && !norm(logo).includes(norm(w.project.brand)) && !norm(w.project.brand).includes(norm(logo));

  async function measure() {
    setError(null);
    setBusy("measure");
    try {
      let a: Analysis = pack ?? await api<Analysis>("/api/analyses", { body: { project: w.project, kind: "pack" } });
      for (const s of ["ours", "variant", "old"] as Slot[]) {
        if (data[s]) await api(`/api/analyses/${a.id}/images`, { body: { slot: s, image: data[s] } });
      }
      const elements = items.map((it) => ({ ...fromEditorItem(it), type: it.type ?? "other", edited: true }));
      await api(`/api/analyses/${a.id}`, { method: "PATCH", body: { brandAssets: { ...read, elements }, consistency: cons } });
      await api(`/api/analyses/${a.id}/attention/ours`, { body: { label: "Ana SKU", aois: elements } });
      a = await api<Analysis>(`/api/analyses/${a.id}`);
      w.setPack(a);
      setData({});
      setDirty(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const oursSrc = src("ours");
  const canMeasure = !!read && items.length > 0 && !busy;
  const canContinue = !!att && !dirty && !brandConflict && !busy;

  return (
    <section className="wz-step">
      <header className="wz-step-head">
        <h2>Ambalajını Yükle</h2>
        <p>Ana SKU zorunlu (1024×1024&apos;e sığdırılır). YZ unsurları okur ve alanları işaretler; siz onaylayıp düzeltirsiniz.</p>
      </header>

      <div className="wz-uploads">
        <UploadSlot label="Ana SKU" required hint="Ön yüz, düz çekim" src={oursSrc} busy={busy === "ours"} onFile={onOurs} />
        <UploadSlot label="Varyant" hint="İsteğe bağlı · tutarlılık" src={src("variant")} busy={busy === "variant"} onFile={(f) => onOther("variant", f)} />
        {refresh ? <UploadSlot label="Eski tasarım" hint="Yenileme · süreklilik" src={src("old")} busy={busy === "old"} onFile={(f) => onOther("old", f)} /> : null}
      </div>

      {read ? (
        <div className="wz-panel">
          <div className="wz-panel-head">
            <h3>YZ okuması</h3>
            <span className="wz-chip">DBA {read.score}</span>
            {read.mock ? <span className="wz-badge sim">Örnek okuma</span> : null}
            {cons.variant ? <span className="wz-chip">Varyant tutarlılığı {cons.variant.score}</span> : null}
            {cons.old ? <span className="wz-chip">Eski tasarım sürekliliği {cons.old.score}</span> : null}
          </div>
          <p className="wz-muted">{read.evaluation}</p>
          <h4>Alanları onayla</h4>
          {oursSrc ? <AoiEditor src={oursSrc} items={items} onChange={(x) => { setItems(x); setDirty(true); }} types={w.engine.aoiTypes} /> : null}
          {brandConflict ? <p className="wz-warn">Logo metni “{logo}” ile kurulumdaki marka “{w.project.brand}” çelişiyor. Logo alanının metnini düzeltin.</p> : null}
          <div className="wz-actions">
            <button type="button" className="wz-btn" disabled={!canMeasure} onClick={measure}>{busy === "measure" ? "Ölçülüyor…" : att ? "Yeniden ölç" : "Alanları onayla ve ölç"}</button>
            {dirty && att ? <span className="wz-muted">Değişiklik var; devam etmek için yeniden ölçün.</span> : null}
          </div>
        </div>
      ) : null}

      <ErrorNote error={error} />

      {att && oursSrc ? (
        <div className="wz-panel wz-grid2">
          <AttentionView src={oursSrc} att={att} />
          <div className="wz-stack">
            <h3>Bakış Payı (%)</h3>
            <ShareTable att={att} types={w.engine.aoiTypes} />
            <h4>Ambalaj geneli dikkat skorları</h4>
            <MetricGrid att={att} />
          </div>
        </div>
      ) : null}

      <div className="wz-actions"><button type="button" className="wz-btn" disabled={!canContinue} onClick={w.next}>Devam: Rakip Testi</button></div>
    </section>
  );
}
