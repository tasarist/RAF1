"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Analysis } from "@/lib/types";
import { apiUrl } from "@/lib/client/env";
import { prepareUpload } from "@/lib/client/imagePrep";
import { saveAnalysisLocally } from "@/lib/client/analysisDb";
import { navigate } from "./AppLink";
import { UploadSlot, type SlotFile } from "./UploadSlot";

const CATEGORIES = ["Gıda", "İçecek", "Süt ürünleri", "Atıştırmalık", "Kişisel bakım", "Ev temizliği", "Kozmetik", "Takviye & sağlık", "Evcil hayvan", "Diğer"];

/** Processing steps exactly as defined in the product spec (screen 4). */
const PROCESS_STEPS = [
  "Preparing packaging images",
  "Running visual attention analysis",
  "Building virtual shelf",
  "Comparing competitors",
  "Running 5SE analysis",
  "Creating report",
];

type Step = 1 | 2 | 3;

export function NewAnalysisWizard() {
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState({ projectName: "", category: CATEGORIES[0], brandName: "", productName: "", competitor1BrandName: "", competitor2BrandName: "" });
  const [main, setMain] = useState<SlotFile | null>(null);
  const [c1, setC1] = useState<SlotFile | null>(null);
  const [c2, setC2] = useState<SlotFile | null>(null);
  const [previous, setPrevious] = useState<SlotFile | null>(null);
  const [skus, setSkus] = useState<Array<SlotFile | null>>([null, null]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const timer = useRef<number | null>(null);

  const infoValid = form.projectName.trim() && form.brandName.trim() && form.productName.trim() && form.category;
  const uploadsValid = main && c1 && c2;
  const continuityCount = (previous ? 1 : 0) + skus.filter(Boolean).length;

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => () => { if (timer.current) window.clearInterval(timer.current); }, []);

  async function submit() {
    if (!uploadsValid) return;
    setError(null);
    setStep(3);
    setProgress(0);
    setElapsed(0);
    const started = Date.now();
    // Visual pacing only — the API runs the full pipeline in one request; the real step log is shown on the results page.
    timer.current = window.setInterval(() => {
      setElapsed(Math.round((Date.now() - started) / 1000));
      setProgress((p) => Math.min(PROCESS_STEPS.length - 1, p + (Math.random() < 0.35 ? 1 : 0)));
    }, 900);

    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v.trim()));
      fd.append("mainPack", await prepareUpload(main!.file));
      fd.append("competitor1", await prepareUpload(c1!.file));
      fd.append("competitor2", await prepareUpload(c2!.file));
      if (previous) fd.append("previousPack", await prepareUpload(previous.file));
      for (const s of skus) if (s) fd.append("sku", await prepareUpload(s.file));

      const res = await fetch(apiUrl("/api/analyze"), { method: "POST", body: fd });
      const json = (await res.json().catch(() => ({}))) as { analysis?: Analysis; error?: string };
      if (!res.ok || !json.analysis) throw new Error(json.error ?? `Sunucu hatası (${res.status})`);
      await saveAnalysisLocally(json.analysis);
      setProgress(PROCESS_STEPS.length);
      window.setTimeout(() => navigate("/results", { id: json.analysis!.id }), 500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analiz başarısız oldu.");
      setStep(2);
    } finally {
      if (timer.current) window.clearInterval(timer.current);
    }
  }

  const stepsBar = useMemo(
    () => (
      <div className="steps" aria-label="Adımlar">
        {["Proje bilgisi", "Ambalajları yükle", "Analiz"].map((s, i) => {
          const n = (i + 1) as Step;
          return (
            <span key={s} className={n === step ? "is-active" : n < step ? "is-done" : ""}>
              <b>{n < step ? "✓" : n}</b>
              {s}
            </span>
          );
        })}
      </div>
    ),
    [step],
  );

  return (
    <div className="container" style={{ maxWidth: 980 }}>
      <div className="eyebrow">Yeni 5SE Analizi</div>
      <h1 style={{ marginBottom: 20 }}>{step === 1 ? "Proje bilgisi" : step === 2 ? "Ambalajları yükle" : "Analiz çalışıyor"}</h1>
      {stepsBar}

      {error ? <div className="alert alert--error" role="alert" style={{ marginBottom: 16 }}>{error}</div> : null}

      {step === 1 ? (
        <form
          className="card card--pad stack reveal"
          style={{ gap: 18 }}
          onSubmit={(e) => {
            e.preventDefault();
            if (infoValid) setStep(2);
          }}
        >
          <div className="grid grid--2">
            <div className="field">
              <label htmlFor="projectName">Project Name</label>
              <input id="projectName" required value={form.projectName} onChange={update("projectName")} placeholder="Örn. Yoğurt 500 g relansman" />
            </div>
            <div className="field">
              <label htmlFor="category">Product Category</label>
              <select id="category" value={form.category} onChange={update("category")}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="brandName">Brand Name</label>
              <input id="brandName" required value={form.brandName} onChange={update("brandName")} placeholder="Marka" />
            </div>
            <div className="field">
              <label htmlFor="productName">Product Name</label>
              <input id="productName" required value={form.productName} onChange={update("productName")} placeholder="Ürün / varyant" />
            </div>
            <div className="field">
              <label htmlFor="c1">Competitor 1 (marka)</label>
              <input id="c1" value={form.competitor1BrandName} onChange={update("competitor1BrandName")} placeholder="Rakip 1" />
              <span className="hint">Raf ve raporlarda etiket olarak kullanılır.</span>
            </div>
            <div className="field">
              <label htmlFor="c2">Competitor 2 (marka)</label>
              <input id="c2" value={form.competitor2BrandName} onChange={update("competitor2BrandName")} placeholder="Rakip 2" />
            </div>
          </div>
          <div className="between">
            <span className="tiny muted">Yüklenen görseller yalnızca analiz için işlenir, herkese açık hale gelmez.</span>
            <button className="btn btn--primary" type="submit" disabled={!infoValid}>Devam → Ambalajları yükle</button>
          </div>
        </form>
      ) : null}

      {step === 2 ? (
        <div className="stack reveal" style={{ gap: 20 }}>
          <div className="grid grid--3">
            <UploadSlot title="Main Pack" subtitle={`${form.brandName} · ${form.productName}`} required value={main} onChange={setMain} />
            <UploadSlot title="Competitor 1" subtitle={form.competitor1BrandName || "Rakip 1"} required value={c1} onChange={setC1} />
            <UploadSlot title="Competitor 2" subtitle={form.competitor2BrandName || "Rakip 2"} required value={c2} onChange={setC2} />
          </div>
          <div className="card card--soft card--pad stack">
            <div className="between">
              <div>
                <strong className="display">Continuity & Consistency için referanslar</strong>
                <p className="small muted">Opsiyonel. Yüklenmezse bu kriter N/A olur ve 5SE skoru 4 kriter üzerinden hesaplanır.</p>
              </div>
              <span className={`badge ${continuityCount ? "badge--info" : "badge--muted"}`}>{continuityCount ? `${continuityCount} REFERANS → 5 KRİTER` : "N/A → 4 KRİTER"}</span>
            </div>
            <div className="grid grid--3">
              <UploadSlot title="Previous Packaging" subtitle="Eski ambalaj" value={previous} onChange={setPrevious} compact />
              {skus.map((s, i) => (
                <UploadSlot key={i} title={`Other SKU ${i + 1}`} subtitle="Aynı marka, farklı ürün" value={s} onChange={(f) => setSkus((arr) => arr.map((x, j) => (j === i ? f : x)))} compact />
              ))}
            </div>
          </div>
          <div className="between">
            <button className="btn btn--ghost" type="button" onClick={() => setStep(1)}>← Proje bilgisi</button>
            <button className="btn btn--primary btn--lg" type="button" disabled={!uploadsValid} onClick={submit}>5SE Analizini başlat</button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="card card--pad stack reveal" style={{ gap: 18 }}>
          <div className="between">
            <p className="muted small">{form.brandName} {form.productName} · {form.competitor1BrandName || "Rakip 1"} ve {form.competitor2BrandName || "Rakip 2"} ile sanal rafta test ediliyor.</p>
            <span className="tiny muted num">{elapsed}s</span>
          </div>
          <div className="process" aria-live="polite">
            {PROCESS_STEPS.map((s, i) => {
              const state = i < progress ? "is-done" : i === progress ? "is-active" : "is-pending";
              return (
                <div key={s} className={`process__row ${state}`}>
                  <span className="process__dot">{i < progress ? "✓" : ""}</span>
                  <span>{s}</span>
                  {i === progress ? <em>çalışıyor…</em> : null}
                </div>
              );
            })}
          </div>
          <p className="tiny muted">Bir analiz 4 attention tahmini kullanır (1 tekil + 3 raf). Mock modda kredi tüketilmez.</p>
        </div>
      ) : null}
    </div>
  );
}
