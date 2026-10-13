"use client";

import { useEffect, useMemo, useState } from "react";
import { api, fileToCanvasDataUrl, imageUrl, SHELF_SIZE } from "@/lib/pa/client";
import { isAttention, type Analysis, type ShelfRead } from "@/lib/pa/types";
import { AoiEditor, fromEditorItem, toEditorItems, type EditorItem } from "../AoiEditor";
import { AttentionView } from "../AttentionView";
import { ErrorNote, logoText, norm, StepFooter, UploadSlot, type Wiz } from "../shared";

interface Card { data?: string; read?: ShelfRead; items: EditorItem[]; busy?: boolean }
type Saved = { id: string; createdAt: string; project: { name: string; brand: string }; brands?: string[]; status: string };

const SHELF_ASPECT = SHELF_SIZE.w / SHELF_SIZE.h;

export function ShelfStep({ w }: { w: Wiz }) {
  const [mode, setMode] = useState<"saved" | "new">("new");
  const [saved, setSaved] = useState<Saved[]>([]);
  const [cards, setCards] = useState<Card[]>([{ items: [] }, { items: [] }, { items: [] }]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redo, setRedo] = useState(false);

  // Marka ipuçları: proje markası + Rakip Testi logo metinleri.
  const hints = useMemo(() => {
    const list = [w.project.brand];
    for (const i of [0, 1]) {
      const t = logoText(w.comp?.brandReads?.[`comp-${i}`]?.elements);
      if (t) list.push(t);
    }
    return [...new Set(list.filter(Boolean))];
  }, [w.project.brand, w.comp]);

  useEffect(() => {
    api<Saved[]>("/api/analyses?kind=shelf")
      .then((l) => {
        const ok = l.filter((x) => x.status !== "draft" && (x.brands ?? []).some((b) => norm(b) === norm(w.project.brand)));
        setSaved(ok);
        if (ok.length && !w.shelf) setMode("saved");
      })
      .catch(() => undefined);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setCard = (i: number, patch: Partial<Card>) => setCards((cs) => cs.map((c, j) => (j === i ? { ...c, ...patch } : c)));

  async function onFile(i: number, f: File) {
    setError(null);
    setCard(i, { busy: true });
    try {
      const d = await fileToCanvasDataUrl(f, SHELF_SIZE.w, SHELF_SIZE.h);
      setCard(i, { data: d });
      const r = await api<ShelfRead>("/api/shelf-read", { body: { image: d, brands: hints } });
      setCard(i, { read: r, items: toEditorItems(r.items) });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCard(i, { busy: false });
    }
  }

  // Kural: 3 rafın tamamında aynı 3 marka; kurulumdaki marka her rafta.
  const issues = useMemo(() => {
    const out: string[] = [];
    if (cards.some((c) => !c.read)) return out;
    const sets = cards.map((c) => new Set(c.items.map((it) => norm(it.text)).filter(Boolean)));
    cards.forEach((c, i) => {
      if (c.items.some((it) => !it.text.trim())) out.push(`Raf ${i + 1}: adı boş alan var.`);
      if (sets[i].size !== c.items.filter((it) => it.text.trim()).length) out.push(`Raf ${i + 1}: aynı marka birden fazla alanda.`);
      if (!sets[i].has(norm(w.project.brand))) out.push(`Raf ${i + 1}: “${w.project.brand}” markası yok.`);
    });
    const first = [...sets[0]].sort().join("|");
    if (sets.some((s) => [...s].sort().join("|") !== first)) out.push("Üç rafta aynı markalar bulunmalı.");
    if (sets[0].size !== 3) out.push(`Her rafta 3 marka olmalı (şu an Raf 1'de ${sets[0].size}).`);
    return out;
  }, [cards, w.project.brand]);

  async function pickSaved(id: string) {
    setError(null);
    setBusy(true);
    try {
      if (w.pack) w.setPack(await api<Analysis>(`/api/analyses/${w.pack.id}`, { method: "PATCH", body: { refs: { shelf: id } } }));
      w.setShelf(await api<Analysis>(`/api/analyses/${id}`));
      setRedo(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function measure() {
    setError(null);
    setBusy(true);
    try {
      let s = await api<Analysis>("/api/analyses", { body: { project: w.project, kind: "shelf", parentId: w.pack?.id } });
      const shelfReads: Record<string, ShelfRead> = {};
      const aois: Record<number, ReturnType<typeof fromEditorItem>[]> = {};
      for (const i of [0, 1, 2]) {
        await api(`/api/analyses/${s.id}/images`, { body: { slot: `shelf-${i}`, image: cards[i].data } });
        aois[i] = cards[i].items.map((it) => fromEditorItem({ ...it, text: it.text.trim() }));
        shelfReads[`shelf-${i}`] = { ...cards[i].read!, items: aois[i].map((x) => ({ id: x.id, brand: x.text, box: x.box, ...(x.quad ? { quad: x.quad } : {}) })) };
      }
      await api(`/api/analyses/${s.id}`, { method: "PATCH", body: { shelfReads } });
      const fails: string[] = [];
      for (const i of [0, 1, 2]) {
        await api(`/api/analyses/${s.id}/attention/shelf-${i}`, { body: { label: `Raf ${i + 1}`, aois: aois[i] } }).catch((e: Error) => fails.push(e.message));
      }
      s = await api<Analysis>(`/api/analyses/${s.id}/score`, { body: {} });
      w.setShelf(s);
      if (w.pack) w.setPack(await api<Analysis>(`/api/analyses/${w.pack.id}`));
      if (fails.length) setError(`Bazı ölçümler başarısız: ${fails.join("; ")}`);
      setRedo(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const shelf = w.shelf;
  const ready = cards.every((c) => c.read) && !issues.length && !busy && !cards.some((c) => c.busy);

  return (
    <section className="wz-step">
      <header className="wz-step-head">
        <h2>Raf Testi</h2>
        <p>Aynı 3 markanın göründüğü 3 raf görseli yükleyin (yatay, 1536×1024&apos;e sığdırılır). YZ marka bloklarını bulur; adları ve alanları kontrol edin.</p>
        <div className="wz-quick"><span>Beklenen markalar:</span>{hints.map((h) => <span key={h} className="wz-pill static">{h}</span>)}</div>
      </header>

      {shelf?.shelfShares && !redo ? (
        <>
          <ShelfResult shelf={shelf} brand={w.project.brand} />
          <StepFooter>
            <button type="button" className="wz-btn ghost" onClick={() => { setRedo(true); setMode("new"); setCards([{ items: [] }, { items: [] }, { items: [] }]); }}>Yeni raf testi yap</button>
            <button type="button" className="wz-btn" onClick={w.next}>{w.standalone ? "Raf sonucuna git" : "Devam: Analiz"}</button>
          </StepFooter>
        </>
      ) : (
        <>
          <div className="wz-seg" role="tablist">
            <button type="button" className={mode === "saved" ? "on" : ""} onClick={() => setMode("saved")} disabled={!saved.length}>Kayıtlı Raf Testleri ({saved.length})</button>
            <button type="button" className={mode === "new" ? "on" : ""} onClick={() => setMode("new")}>Yeni</button>
          </div>
          {mode === "saved" ? (
            <div className="wz-list">
              {saved.map((s) => (
                <button key={s.id} type="button" className="wz-list-row" disabled={busy} onClick={() => pickSaved(s.id)}>
                  <b>{s.brands?.join(" · ")}</b>
                  <span>{s.project.name} · {new Date(s.createdAt).toLocaleDateString("tr-TR")}</span>
                </button>
              ))}
            </div>
          ) : (
            <>
              <div className="wz-stack">
                {cards.map((c, i) => (
                  <div key={i} className="wz-panel">
                    <div className="wz-panel-head"><h3>Raf {i + 1}</h3>{c.read?.mock ? <span className="wz-badge sim">Örnek okuma</span> : null}</div>
                    {c.read && c.data ? (
                      <>
                        <AoiEditor src={c.data} items={c.items} onChange={(items) => setCard(i, { items })} textLabel="Marka" aspect={SHELF_ASPECT} suggestions={hints} />
                        <div className="wz-subrow"><UploadSlot compact label={`Raf ${i + 1} görseli`} src={c.data} busy={c.busy} onFile={(f) => onFile(i, f)} /></div>
                      </>
                    ) : (
                      <div className="wz-uploads one"><UploadSlot label={`Raf ${i + 1}`} required hint="İdeal 1536×1024" src={c.data} busy={c.busy} onFile={(f) => onFile(i, f)} aspect={SHELF_ASPECT} /></div>
                    )}
                  </div>
                ))}
              </div>
              {issues.length ? <ul className="wz-issues">{issues.map((x) => <li key={x}>{x}</li>)}</ul> : null}
              <StepFooter note={cards.some((c) => !c.read) ? `${cards.filter((c) => !c.read).length} raf görseli eksik.` : issues.length ? "Marka eşleşme sorunlarını düzeltin." : null}>
                <button type="button" className="wz-btn" disabled={!ready} onClick={measure}>{busy ? "Ölçülüyor…" : "Alanları onayla ve ölç"}</button>
              </StepFooter>
            </>
          )}
        </>
      )}
      <ErrorNote error={error} />
    </section>
  );
}

export function ShelfResult({ shelf, brand }: { shelf: Analysis; brand: string }) {
  const by = shelf.shelfShares?.byBrand ?? [];
  const fair = by.length ? 100 / by.length : 0;
  return (
    <div className="wz-stack">
      <div className="wz-panel">
        <div className="wz-panel-head"><h3>Markaların raftaki görünürlüğü</h3><span className="wz-muted">3 raf ortalaması · adil pay %{fair.toFixed(1)}</span></div>
        <div className="wz-shares">
          {by.map((b) => (
            <div key={b.brand} className={`wz-share${norm(b.brand) === norm(brand) ? " ours" : ""}`}>
              <span>{b.brand}</span>
              <div className="wz-bar-track"><i style={{ width: `${Math.min(100, b.share)}%` }} /><em style={{ left: `${fair}%` }} /></div>
              <b>%{b.share.toFixed(1)}</b>
            </div>
          ))}
        </div>
      </div>
      <div className="wz-grid3">
        {[0, 1, 2].map((i) => {
          const a = shelf.attention?.[`shelf-${i}`];
          const att = isAttention(a) ? a : undefined;
          return (
            <div key={i} className="wz-panel">
              <h4>Raf {i + 1}</h4>
              <AttentionView src={imageUrl(shelf.id, `shelf-${i}`)} att={att} />
              <ul className="wz-mini">
                {(shelf.shelfShares?.perShelf[`shelf-${i}`] ?? []).map((x) => <li key={x.brand}><span>{x.brand}</span><b>%{x.share.toFixed(1)}</b></li>)}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
