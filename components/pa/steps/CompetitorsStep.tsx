"use client";

import { useEffect, useState } from "react";
import { api, fileToCanvasDataUrl, imageUrl, PACK_SIZE } from "@/lib/pa/client";
import { isAttention, type Analysis, type BrandRead, type ConsistencyRead } from "@/lib/pa/types";
import { AoiEditor, fromEditorItem, toEditorItems, type EditorItem } from "../AoiEditor";
import { AttentionView, Bar, MetricGrid } from "../AttentionView";
import { ErrorNote, logoText, StepFooter, UploadSlot, type Wiz } from "../shared";

interface Card { data?: string; read?: BrandRead; items: EditorItem[]; varData?: string; cons?: ConsistencyRead; busy?: string }

type Saved = { id: string; createdAt: string; project: { name: string; brand: string }; comps?: string[]; status: string };

export function CompetitorsStep({ w }: { w: Wiz }) {
  const [mode, setMode] = useState<"saved" | "new">("new");
  const [saved, setSaved] = useState<Saved[]>([]);
  const [cards, setCards] = useState<Card[]>([{ items: [] }, { items: [] }]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redo, setRedo] = useState(false);

  useEffect(() => {
    api<Saved[]>("/api/analyses?kind=competitors")
      .then((l) => { const ok = l.filter((x) => x.status !== "draft"); setSaved(ok); if (ok.length && !w.comp) setMode("saved"); })
      .catch(() => undefined);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setCard = (i: number, patch: Partial<Card>) => setCards((cs) => cs.map((c, j) => (j === i ? { ...c, ...patch } : c)));

  async function onFile(i: number, f: File) {
    setError(null);
    setCard(i, { busy: "main" });
    try {
      const d = await fileToCanvasDataUrl(f, PACK_SIZE.w, PACK_SIZE.h);
      setCard(i, { data: d });
      const r = await api<BrandRead>("/api/brand-assets", { body: { image: d } });
      setCard(i, { read: r, items: toEditorItems(r.elements) });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCard(i, { busy: undefined });
    }
  }

  async function onVariant(i: number, f: File) {
    const base = cards[i].data;
    if (!base) return setError("Önce rakip görselini yükleyin.");
    setCard(i, { busy: "var" });
    try {
      const d = await fileToCanvasDataUrl(f, PACK_SIZE.w, PACK_SIZE.h);
      setCard(i, { varData: d });
      setCard(i, { cons: await api<ConsistencyRead>("/api/brand-consistency", { body: { image: base, other: d, mode: "variant" } }) });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCard(i, { busy: undefined });
    }
  }

  async function pickSaved(id: string) {
    setError(null);
    setBusy(true);
    try {
      if (w.pack) w.setPack(await api<Analysis>(`/api/analyses/${w.pack.id}`, { method: "PATCH", body: { refs: { competitors: id } } }));
      w.setComp(await api<Analysis>(`/api/analyses/${id}`));
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
      let c = await api<Analysis>("/api/analyses", { body: { project: w.project, kind: "competitors", parentId: w.pack?.id } });
      const brandReads: Record<string, BrandRead> = {};
      const consistency: Record<string, ConsistencyRead> = {};
      const aois: Record<number, ReturnType<typeof fromEditorItem>[]> = {};
      for (const i of [0, 1]) {
        const card = cards[i];
        await api(`/api/analyses/${c.id}/images`, { body: { slot: `comp-${i}`, image: card.data } });
        if (card.varData) await api(`/api/analyses/${c.id}/images`, { body: { slot: `comp-var-${i}`, image: card.varData } });
        aois[i] = card.items.map((it) => ({ ...fromEditorItem(it), type: it.type ?? "other" }));
        brandReads[`comp-${i}`] = { ...card.read!, elements: aois[i].map((e) => ({ ...e, type: e.type as never, edited: true })) };
        if (card.cons) consistency[`comp-${i}`] = card.cons;
      }
      await api(`/api/analyses/${c.id}`, { method: "PATCH", body: { brandReads, consistency } });
      // Biri düşerse diğeri sürer.
      const fails: string[] = [];
      for (const i of [0, 1]) {
        await api(`/api/analyses/${c.id}/attention/comp-${i}`, { body: { label: `Rakip ${i ? "B" : "A"}`, aois: aois[i] } }).catch((e: Error) => fails.push(e.message));
      }
      c = await api<Analysis>(`/api/analyses/${c.id}/score`, { body: {} });
      w.setComp(c);
      if (w.pack) w.setPack(await api<Analysis>(`/api/analyses/${w.pack.id}`));
      if (fails.length) setError(`Bazı ölçümler başarısız: ${fails.join("; ")}`);
      setRedo(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const ready = cards.every((c) => c.read && c.items.length > 0 && logoText(c.items)) && !busy && !cards.some((c) => c.busy);
  const comp = w.comp;
  const showResult = comp?.compScores && !redo;

  return (
    <section className="wz-step">
      <header className="wz-step-head">
        <h2>Rakip Testi</h2>
        <p>Her zaman iki rakip: Rakip A ve Rakip B. Rakibin marka adı logo metninden okunur.</p>
      </header>

      {showResult ? (
        <>
          <CompResult comp={comp} aoiTypes={w.engine.aoiTypes} />
          <StepFooter note="Rakip Testi kaydı ambalaj analizine bağlandı.">
            <button type="button" className="wz-btn ghost" onClick={() => { setRedo(true); setMode("new"); setCards([{ items: [] }, { items: [] }]); }}>Farklı rakiplerle yeniden yap</button>
            <button type="button" className="wz-btn" onClick={w.next}>{w.standalone ? "Rakip sonucuna git" : "Devam: Raf Testi"}</button>
          </StepFooter>
        </>
      ) : (
        <>
          <div className="wz-seg" role="tablist">
            <button type="button" className={mode === "saved" ? "on" : ""} onClick={() => setMode("saved")} disabled={!saved.length}>Kayıtlı Rakip Testleri ({saved.length})</button>
            <button type="button" className={mode === "new" ? "on" : ""} onClick={() => setMode("new")}>Yeni</button>
          </div>

          {mode === "saved" ? (
            <div className="wz-list">
              {saved.map((s) => (
                <button key={s.id} type="button" className="wz-list-row" disabled={busy} onClick={() => pickSaved(s.id)}>
                  <b>{s.comps?.join(" · ") || "Rakip Testi"}</b>
                  <span>{s.project.name} · {new Date(s.createdAt).toLocaleDateString("tr-TR")}</span>
                </button>
              ))}
            </div>
          ) : (
            <>
              <div className="wz-grid2 tight">
                {cards.map((c, i) => (
                  <div key={i} className="wz-panel">
                    <div className="wz-panel-head"><h3>Rakip {i ? "B" : "A"}{logoText(c.items) ? ` · ${logoText(c.items)}` : ""}</h3>{c.read ? <span className="wz-chip">DBA {c.read.score}</span> : null}{c.cons ? <span className="wz-chip">Varyant {c.cons.score}</span> : null}</div>
                    {!c.read ? (
                      <UploadSlot label={`Rakip ${i ? "B" : "A"}`} required hint="Ön yüz, düz çekim" src={c.data} busy={c.busy === "main"} onFile={(f) => onFile(i, f)} />
                    ) : (
                      <>
                        <AoiEditor src={c.data!} items={c.items} onChange={(items) => setCard(i, { items })} types={w.engine.aoiTypes} />
                        {!logoText(c.items) ? <p className="wz-warn">Logo/Marka alanının metnine rakibin marka adını yazın; Raf Testi bu adla eşleşir.</p> : null}
                        <div className="wz-subrow">
                          <UploadSlot compact label="Rakip görseli" src={c.data} busy={c.busy === "main"} onFile={(f) => onFile(i, f)} />
                          <UploadSlot compact label="Varyant" hint={c.cons ? `Tutarlılık ${c.cons.score}` : "İsteğe bağlı"} src={c.varData} busy={c.busy === "var" && "Okunuyor…"} onFile={(f) => onVariant(i, f)} />
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
              <StepFooter note={ready ? "İki rakip de ölçülecek." : cards.some((c) => !c.read) ? "Rakip A ve Rakip B görsellerini yükleyin." : busy ? null : "Rakip markası adlarını kontrol edin."}>
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

export function CompResult({ comp, aoiTypes }: { comp: Analysis; aoiTypes: Record<string, string> }) {
  void aoiTypes;
  return (
    <div className="wz-grid2">
      {comp.compScores?.comps.map((c, i) => {
        const a = comp.attention?.[c.slot];
        const att = isAttention(a) ? a : undefined;
        return (
          <div key={c.slot} className="wz-panel">
            <div className="wz-panel-head"><h3>Rakip {i ? "B" : "A"} · {c.label}</h3><span className="wz-chip strong">Toplam {c.total ?? "—"}</span></div>
            <AttentionView src={imageUrl(comp.id, c.slot)} att={att} defaultTab="orig" />
            {a && !att ? <p className="wz-error">Ölçüm başarısız: {(a as { error: string }).error}</p> : null}
            <Bar label="Ayırıcı marka varlıkları (DBA)" value={c.dba} />
            <Bar label="Netlik (bakış payı hedefe yakınlık)" value={c.clarity} />
            <Bar label="Öne çıkma" value={c.standout} />
            {c.consistency != null ? <Bar label="Varyant tutarlılığı" value={c.consistency} /> : null}
            {att ? <MetricGrid att={att} /> : null}
          </div>
        );
      })}
    </div>
  );
}
