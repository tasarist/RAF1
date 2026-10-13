"use client";

import { useState } from "react";
import { api, fileToCanvasDataUrl, imageUrl, PACK_SIZE } from "@/lib/pa/client";
import { isAttention, type Analysis, type BrandRead, type ConsistencyRead } from "@/lib/pa/types";
import { AoiEditor, fromEditorItem, toEditorItems, type EditorItem } from "../AoiEditor";
import { AttentionView, MetricGrid, ShareTable } from "../AttentionView";
import { ErrorNote, logoText, norm, StepFooter, UploadSlot, urlToDataUrl, type Wiz } from "../shared";

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
  const change = (x: EditorItem[]) => { setItems(x); setDirty(true); };

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
  const hasLogo = items.some((i) => i.type === "logo");
  const brandConflict = !!logo && !norm(logo).includes(norm(w.project.brand)) && !norm(w.project.brand).includes(norm(logo));

  function fixLogo() {
    change(items.map((i) => (i.type === "logo" ? { ...i, text: w.project.brand } : i)));
  }

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
  const note = !read ? "Ana SKU görselini yükleyin."
    : brandConflict ? "Logo metni kurulumdaki marka adıyla çelişiyor."
    : !att ? "Alanları onaylayıp ölçün."
    : dirty ? "Değişiklik var; yeniden ölçün."
    : null;

  return (
    <section className="wz-step">
      <header className="wz-step-head">
        <h2>Ambalajını Yükle</h2>
        <p>Ana SKU&apos;nun ön yüzünü yükleyin. YZ logo, ürün adı, claim ve varyant alanlarını okuyup işaretler; siz kontrol edip onaylarsınız. Varyant{refresh ? " ve eski tasarım" : ""} isteğe bağlıdır ve tutarlılık puanını besler.</p>
      </header>

      {!read ? (
        <div className={`wz-uploads${refresh ? "" : " two"}`}>
          <UploadSlot label="Ana SKU" required hint="Ön yüz, düz çekim · kare görsele sığdırılır" src={oursSrc} busy={busy === "ours"} onFile={onOurs} />
          <UploadSlot label="Varyant" hint="İsteğe bağlı · önce Ana SKU" src={src("variant")} busy={busy === "variant"} onFile={(f) => onOther("variant", f)} />
          {refresh ? <UploadSlot label="Eski tasarım" hint="İsteğe bağlı · süreklilik" src={src("old")} busy={busy === "old"} onFile={(f) => onOther("old", f)} /> : null}
        </div>
      ) : (
        <div className="wz-panel">
          <div className="wz-panel-head">
            <h3>Alanları kontrol et</h3>
            <span className="wz-chip" title="Ayırıcı marka varlıkları puanı">DBA {read.score}</span>
            {cons.variant ? <span className="wz-chip">Varyant tutarlılığı {cons.variant.score}</span> : null}
            {cons.old ? <span className="wz-chip">Eski tasarım sürekliliği {cons.old.score}</span> : null}
            {read.mock ? <span className="wz-badge sim">Örnek okuma</span> : null}
          </div>
          <p className="wz-muted">{read.evaluation}</p>

          {oursSrc ? <AoiEditor src={oursSrc} items={items} onChange={change} types={w.engine.aoiTypes} /> : null}

          {!hasLogo ? <p className="wz-warn">Logo/Marka alanı yok. Marka bloğunu çizip türünü “Logo/Marka” yapın; “Ürünü doğru yansıt” skoru bunu kullanır.</p> : null}
          {brandConflict ? (
            <div className="wz-warn row">
              <span>Logo metni “{logo}”, kurulumdaki marka “{w.project.brand}” ile uyuşmuyor.</span>
              <button type="button" className="wz-btn ghost small" onClick={fixLogo}>Logo metnini “{w.project.brand}” yap</button>
            </div>
          ) : null}

          <div className="wz-subrow">
            <UploadSlot compact label="Ana SKU" src={oursSrc} busy={busy === "ours"} onFile={onOurs} />
            <UploadSlot compact label="Varyant" hint={cons.variant ? `Tutarlılık ${cons.variant.score}` : "İsteğe bağlı"} src={src("variant")} busy={busy === "variant" && "Okunuyor…"} onFile={(f) => onOther("variant", f)} />
            {refresh ? <UploadSlot compact label="Eski tasarım" hint={cons.old ? `Süreklilik ${cons.old.score}` : "İsteğe bağlı"} src={src("old")} busy={busy === "old" && "Okunuyor…"} onFile={(f) => onOther("old", f)} /> : null}
          </div>

          <div className="wz-actions">
            <button type="button" className="wz-btn" disabled={!items.length || !!busy || brandConflict} onClick={measure}>
              {busy === "measure" ? "Ölçülüyor…" : att ? "Yeniden ölç" : "Alanları onayla ve ölç"}
            </button>
            <span className="wz-muted small">Ölçüm görsel dikkat modeliyle yapılır; her alanın aldığı bakış payı hesaplanır.</span>
          </div>
        </div>
      )}

      <ErrorNote error={error} />

      {att && oursSrc && !dirty ? (
        <div className="wz-panel">
          <div className="wz-panel-head"><h3>Dikkat ölçümü</h3><span className="wz-muted small">Bakış payı = alandaki bakış / toplam bakış</span></div>
          <div className="wz-grid2">
            <AttentionView src={oursSrc} att={att} />
            <div className="wz-stack">
              <ShareTable att={att} types={w.engine.aoiTypes} />
              <h4>Ambalaj geneli dikkat skorları</h4>
              <MetricGrid att={att} />
            </div>
          </div>
        </div>
      ) : null}

      <StepFooter note={note}>
        <button type="button" className="wz-btn" disabled={!!note || !!busy} onClick={w.next}>Devam: Rakip Testi</button>
      </StepFooter>
    </section>
  );
}
