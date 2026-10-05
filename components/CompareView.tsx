"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Analysis, OptimizedDesignResult } from "@/lib/types";
import { apiUrl } from "@/lib/client/env";
import { loadAnalysis, saveAnalysisLocally } from "@/lib/client/analysisDb";
import { AppLink } from "./AppLink";
import { ScoreRing } from "./ScoreRing";
import { HeatmapView } from "./HeatmapView";
import { ShelfView } from "./ShelfView";
import { DistanceStrip } from "./DistanceStrip";

const OPT_STEPS = ["Generating optimized design", "Running visual attention analysis", "Building virtual shelf", "Running 5m / 3m / 1m simulation", "Running 5SE analysis", "Comparing Original vs Optimized"];

export function CompareView() {
  return (
    <Suspense fallback={<div className="container"><div className="skeleton" style={{ height: 320 }} /></div>}>
      <CompareInner />
    </Suspense>
  );
}

function CompareInner() {
  const params = useSearchParams();
  const id = params.get("id");
  const [analysis, setAnalysis] = useState<Analysis | null | undefined>(undefined);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return setAnalysis(null);
    loadAnalysis(id).then(setAnalysis);
  }, [id]);

  async function optimize() {
    if (!analysis) return;
    setRunning(true);
    setError(null);
    setProgress(0);
    const t = window.setInterval(() => setProgress((p) => Math.min(OPT_STEPS.length - 1, p + (Math.random() < 0.4 ? 1 : 0))), 900);
    try {
      const res = await fetch(apiUrl(`/api/analyses/${analysis.id}/optimize`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis }),
      });
      const json = (await res.json().catch(() => ({}))) as { analysis?: Analysis; error?: string };
      if (!res.ok || !json.analysis) throw new Error(json.error ?? `Sunucu hatası (${res.status})`);
      await saveAnalysisLocally(json.analysis);
      setAnalysis(json.analysis);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Optimizasyon başarısız oldu.");
    } finally {
      window.clearInterval(t);
      setRunning(false);
    }
  }

  if (analysis === undefined) return <div className="container"><div className="skeleton" style={{ height: 320 }} /></div>;
  if (!analysis) {
    return (
      <div className="container">
        <div className="empty">
          <strong>Analiz bulunamadı.</strong>
          <AppLink to="/new" className="btn btn--primary">+ New 5SE Analysis</AppLink>
        </div>
      </div>
    );
  }

  const { project, original } = analysis;
  const brief = original.report.optimized_design;

  if (!analysis.optimized) {
    return (
      <div className="container stack" style={{ gap: 20, maxWidth: 980 }}>
        <div>
          <div className="eyebrow">Improve my design</div>
          <h1>{project.brandName} {project.productName} · optimize tasarım</h1>
          <p className="muted" style={{ marginTop: 8 }}>Sistem 4 alternatif değil, teşhise bağlı tek bir optimize tasarım üretir ve aynı testlerden geçirir.</p>
        </div>
        {error ? <div className="alert alert--error" role="alert">{error}</div> : null}
        <div className="split split--wide-right">
          <div className="card card--pad stack">
            <img src={original.packImage.dataUrl} alt="Orijinal ambalaj" style={{ borderRadius: 12, border: "1px solid var(--border)", background: "#fff" }} />
            <div className="between">
              <span className="badge badge--muted">ORIGINAL</span>
              <strong className="display num">5SE {original.report.scores.overall_5se_score}</strong>
            </div>
          </div>
          <div className="card card--pad stack" style={{ gap: 16 }}>
            <div>
              <div className="eyebrow eyebrow--blue">Optimizasyon brief'i</div>
              <p className="small">{brief.objective}</p>
            </div>
            <div className="grid grid--2">
              <div>
                <strong className="small">Korunacak</strong>
                <ul className="clean">{brief.preserve.map((p, i) => <li key={i}>{p}</li>)}</ul>
              </div>
              <div>
                <strong className="small">Değişecek</strong>
                <ul className="clean">{brief.change.map((p, i) => <li key={i}>{p}</li>)}</ul>
              </div>
            </div>
            <details>
              <summary>Görsel üretim promptu</summary>
              <pre className="json" style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>{brief.imageGenerationPrompt}</pre>
            </details>
            {running ? (
              <div className="process" aria-live="polite">
                {OPT_STEPS.map((s, i) => (
                  <div key={s} className={`process__row ${i < progress ? "is-done" : i === progress ? "is-active" : "is-pending"}`}>
                    <span className="process__dot">{i < progress ? "✓" : ""}</span><span>{s}</span>
                  </div>
                ))}
              </div>
            ) : (
              <button className="btn btn--amber btn--xl" onClick={optimize}>IMPROVE MY DESIGN</button>
            )}
            {analysis.mode === "mock" ? <p className="tiny muted">Mock modda gerçek görsel üretimi yapılmaz; orijinalin “MOCK · OPTİMİZE SİMÜLASYONU” etiketli bir türevi ile döngü uçtan uca test edilir. Gerçek üretim için OPENAI_API_KEY gerekir.</p> : null}
          </div>
        </div>
        <AppLink to="/results" query={{ id: analysis.id }} className="btn btn--ghost" >← Sonuçlara dön</AppLink>
      </div>
    );
  }

  return <BeforeAfter analysis={analysis} optimized={analysis.optimized} onRerun={optimize} running={running} />;
}

function Delta({ v, suffix = "" }: { v: number | null; suffix?: string }) {
  if (v === null) return <span className="d d--flat">N/A</span>;
  const cls = v > 0 ? "d--up" : v < 0 ? "d--down" : "d--flat";
  return <span className={`d ${cls} num`}>{v > 0 ? "+" : ""}{v}{suffix}</span>;
}

function BeforeAfter({ analysis, optimized, onRerun, running }: { analysis: Analysis; optimized: OptimizedDesignResult; onRerun: () => void; running: boolean }) {
  const a = analysis.original;
  const b = optimized.measurement;
  const sa = a.report.scores;
  const sb = b.report.scores;
  const d = optimized.delta;
  const worse = d.overall_5se_score < 0;
  const [tab, setTab] = useState<"attention" | "shelf" | "distance">("attention");

  const rows: Array<[string, number | null, number | null, number | null]> = [
    ["Uniqueness", sa.uniqueness, sb.uniqueness, d.uniqueness],
    ["Continuity & Consistency", sa.continuity_consistency, sb.continuity_consistency, d.continuity_consistency],
    ["Product Clarity", sa.product_clarity, sb.product_clarity, d.product_clarity],
    ["Attention & Stand-out", sa.attention_standout, sb.attention_standout, d.attention_standout],
    ["Consumer Distance Clarity", sa.consumer_distance_clarity, sb.consumer_distance_clarity, d.consumer_distance_clarity],
    ["Shelf Performance Index", sa.shelf_performance_index, sb.shelf_performance_index, d.shelf_performance_index],
  ];

  return (
    <div className="container stack" style={{ gap: 0 }}>
      <section className="card card--blue reveal" style={{ padding: 32, position: "relative", overflow: "hidden" }}>
        <div className="ba-head">
          <div className="stack" style={{ justifyItems: "center", textAlign: "center" }}>
            <span className="badge" style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>ORIGINAL</span>
            <ScoreRing value={sa.overall_5se_score} size={140} label="5SE" onDark />
          </div>
          <div style={{ textAlign: "center" }}>
            <div className="eyebrow">Before / After</div>
            <div className="bigdelta" style={{ color: worse ? "#ffb3b5" : "var(--sky)" }}>{d.overall_5se_score > 0 ? "+" : ""}{d.overall_5se_score}</div>
            <div className="small" style={{ color: "rgba(255,255,255,0.8)" }}>5SE Points · {sa.overall_5se_score} → {sb.overall_5se_score}</div>
            <div className="tiny" style={{ color: "rgba(255,255,255,0.65)", marginTop: 6 }}>{b.report.criteriaCounted} kriter üzerinden</div>
          </div>
          <div className="stack" style={{ justifyItems: "center", textAlign: "center" }}>
            <span className="badge" style={{ background: "var(--amber)", color: "#2a1600" }}>OPTIMIZED</span>
            <ScoreRing value={sb.overall_5se_score} size={140} label="5SE" color="sky" onDark />
          </div>
        </div>
        <div className="stamp-pattern" aria-hidden style={{ height: "50%", opacity: 0.12 }} />
      </section>

      {worse ? (
        <div className="alert alert--warn section" role="status">
          Optimize tasarım orijinalden <b>daha düşük</b> skor aldı ({sa.overall_5se_score} → {sb.overall_5se_score}). Bu sonuç saklanmıyor: brief'in yeniden gözden geçirilmesi veya yeniden üretim önerilir.
        </div>
      ) : null}
      <div className="cluster section" style={{ marginTop: 16 }}>
        <span className={`badge ${optimized.generator.isMock ? "badge--mock" : "badge--live"}`}>{optimized.generator.isMock ? "MOCK GÖRSEL SİMÜLASYONU" : `Görsel: ${optimized.generator.model ?? optimized.generator.name}`}</span>
        <span className={`badge ${analysis.mode === "mock" ? "badge--mock" : "badge--live"}`}>{analysis.mode === "mock" ? "MOCK ATTENTION VERİSİ" : `Attention: ${analysis.provider}`}</span>
        <span className="tiny muted">{optimized.generator.note}</span>
      </div>

      <section className="section">
        <div className="compare">
          <div className="card compare__pane">
            <div className="between"><span className="badge badge--muted">ORIGINAL</span><strong className="display num">5SE {sa.overall_5se_score}</strong></div>
            <img src={a.packImage.dataUrl} alt="Orijinal tasarım" />
          </div>
          <div className="card compare__pane">
            <div className="between"><span className="badge badge--important">OPTIMIZED</span><strong className="display num">5SE {sb.overall_5se_score}</strong></div>
            <img src={b.packImage.dataUrl} alt="Optimize tasarım" />
          </div>
        </div>
      </section>

      <section className="section split">
        <div className="card card--pad stack">
          <h2>Skor karşılaştırması</h2>
          <div className="delta">
            <div className="tiny muted">Kriter</div><div className="tiny muted" style={{ textAlign: "right" }}>Original → Optimized</div><div /><div className="tiny muted" style={{ textAlign: "right" }}>Δ</div>
            {rows.map(([name, x, y, dl]) => (
              <Row key={name} name={name} x={x} y={y} d={dl} />
            ))}
          </div>
          <div className="grid grid--2" style={{ marginTop: 8 }}>
            <div className="metric"><span className="metric__label">Ort. raf payı</span><span className="metric__value num">{a.shelf.averageMainShare}% → {b.shelf.averageMainShare}%</span></div>
            <div className="metric"><span className="metric__label">Focus · Clarity</span><span className="metric__value num" style={{ fontSize: "1.25rem" }}>{a.singlePack.focusScore ?? "—"}/{a.singlePack.clarityScore ?? "—"} → {b.singlePack.focusScore ?? "—"}/{b.singlePack.clarityScore ?? "—"}</span></div>
          </div>
        </div>
        <div className="card card--pad stack">
          <div className="eyebrow eyebrow--blue">Ne değişti</div>
          <p className="small">{optimized.brief.objective}</p>
          <ul className="clean">{optimized.brief.change.map((c, i) => <li key={i}>{c}</li>)}</ul>
          <div className="divider" />
          <div className="eyebrow eyebrow--blue">Optimize tasarımın değerlendirmesi</div>
          <p className="small muted">{b.report.summary.overall_assessment}</p>
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <h2>Yeniden test</h2>
          <div className="tabs" role="tablist">
            <button role="tab" aria-selected={tab === "attention"} onClick={() => setTab("attention")}>Tekil dikkat</button>
            <button role="tab" aria-selected={tab === "shelf"} onClick={() => setTab("shelf")}>3 raf testi</button>
            <button role="tab" aria-selected={tab === "distance"} onClick={() => setTab("distance")}>5 m / 3 m / 1 m</button>
          </div>
        </div>
        {tab === "attention" ? (
          <div className="compare">
            <div className="card compare__pane"><span className="badge badge--muted">ORIGINAL</span><HeatmapView image={a.packImage} prediction={a.singlePack} compact /><span className="small muted">Focus {a.singlePack.focusScore ?? "—"} · Clarity {a.singlePack.clarityScore ?? "—"}</span></div>
            <div className="card compare__pane"><span className="badge badge--important">OPTIMIZED</span><HeatmapView image={b.packImage} prediction={b.singlePack} compact /><span className="small muted">Focus {b.singlePack.focusScore ?? "—"} · Clarity {b.singlePack.clarityScore ?? "—"}</span></div>
          </div>
        ) : null}
        {tab === "shelf" ? (
          <div className="stack" style={{ gap: 24 }}>
            <div><span className="badge badge--muted" style={{ marginBottom: 10 }}>ORIGINAL · SPI {a.shelf.shelfPerformanceIndex}</span><ShelfView shelf={a.shelf} project={analysis.project} /></div>
            <div><span className="badge badge--important" style={{ marginBottom: 10 }}>OPTIMIZED · SPI {b.shelf.shelfPerformanceIndex}</span><ShelfView shelf={b.shelf} project={analysis.project} /></div>
          </div>
        ) : null}
        {tab === "distance" ? (
          <div className="stack" style={{ gap: 24 }}>
            <div><span className="badge badge--muted" style={{ marginBottom: 10 }}>ORIGINAL · {sa.consumer_distance_clarity}</span><DistanceStrip distance={a.distance} /></div>
            <div><span className="badge badge--important" style={{ marginBottom: 10 }}>OPTIMIZED · {sb.consumer_distance_clarity}</span><DistanceStrip distance={b.distance} /></div>
          </div>
        ) : null}
      </section>

      <section className="section between">
        <AppLink to="/results" query={{ id: analysis.id }} className="btn btn--ghost">← Orijinal sonuçlar</AppLink>
        <div className="cluster">
          <button className="btn btn--ghost" onClick={onRerun} disabled={running}>{running ? "Yeniden üretiliyor…" : "Yeniden üret ve test et"}</button>
          <AppLink to="/new" className="btn btn--primary">+ New 5SE Analysis</AppLink>
        </div>
      </section>
    </div>
  );
}

function Row({ name, x, y, d }: { name: string; x: number | null; y: number | null; d: number | null }) {
  return (
    <>
      <div>{name}</div>
      <div className="n">{x === null ? "N/A" : x}<span className="arrow"> → </span>{y === null ? "N/A" : y}</div>
      <div />
      <div><Delta v={d} /></div>
    </>
  );
}
