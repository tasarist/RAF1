"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Analysis, CriterionResult } from "@/lib/types";
import { loadAnalysis } from "@/lib/client/analysisDb";
import { AppLink } from "./AppLink";
import { ScoreRing, ScoreBar } from "./ScoreRing";
import { HeatmapView } from "./HeatmapView";
import { ShelfView } from "./ShelfView";
import { DistanceStrip } from "./DistanceStrip";
import { IssueList } from "./IssueList";

export function ResultsView() {
  return (
    <Suspense fallback={<div className="container"><div className="skeleton" style={{ height: 320 }} /></div>}>
      <ResultsInner />
    </Suspense>
  );
}

function ResultsInner() {
  const params = useSearchParams();
  const id = params.get("id");
  const [analysis, setAnalysis] = useState<Analysis | null | undefined>(undefined);

  useEffect(() => {
    if (!id) return setAnalysis(null);
    loadAnalysis(id).then(setAnalysis);
  }, [id]);

  if (analysis === undefined) {
    return (
      <div className="container stack">
        <div className="skeleton" style={{ height: 300 }} />
        <div className="grid grid--5">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ height: 180 }} />)}</div>
      </div>
    );
  }
  if (!analysis) {
    return (
      <div className="container">
        <div className="empty">
          <strong>Analiz bulunamadı.</strong>
          <span className="small">Sonuçlar bu cihazda saklanır. Analizi yeniden çalıştırabilirsiniz.</span>
          <AppLink to="/new" className="btn btn--primary">+ New 5SE Analysis</AppLink>
        </div>
      </div>
    );
  }

  const { original: m, project } = analysis;
  const r = m.report;
  const isMock = analysis.mode === "mock";

  return (
    <div className="container stack" style={{ gap: 0 }}>
      {/* ---------- 5SE SCORE ---------- */}
      <section className="card card--blue reveal" style={{ padding: 32, position: "relative", overflow: "hidden" }}>
        <div className="score-head">
          <ScoreRing value={r.scores.overall_5se_score} size={172} label="5SE SCORE" onDark />
          <div className="stack">
            <div className="cluster">
              <span className={`badge ${isMock ? "badge--mock" : "badge--live"}`}>{isMock ? "MOCK · PROTOTİP VERİSİ" : `Live · ${analysis.provider}`}</span>
              <span className="badge badge--info">{r.criteriaCounted} KRİTER ÜZERİNDEN</span>
              <span className="badge badge--info">MOTOR: {r.engine.name === "openai_structured" ? `OPENAI ${(r.engine.model ?? "").toUpperCase()}` : "KURAL TABANLI"}</span>
            </div>
            <div className="eyebrow" style={{ marginBottom: 0 }}>{project.projectName} · {project.category}</div>
            <h1 style={{ color: "#fff" }}>
              5SE SCORE — {r.scores.overall_5se_score}<span style={{ fontWeight: 300 }}>/100</span>
            </h1>
            <p className="display" style={{ color: "var(--sky)", fontWeight: 700, fontSize: "var(--text-lg)" }}>{project.brandName} {project.productName}</p>
            <p style={{ color: "rgba(255,255,255,0.88)", maxWidth: "70ch" }}>{r.summary.overall_assessment}</p>
            <div className="cluster tiny" style={{ color: "rgba(255,255,255,0.75)" }}>
              <span>En güçlü: <b>{r.summary.strongest_area}</b></span>
              <span>·</span>
              <span>En zayıf: <b>{r.summary.weakest_area}</b></span>
              <span>·</span>
              <span>{r.criteriaCounted === 4 ? "Continuity & Consistency N/A (referans yüklenmedi) → 4 kriter ortalaması" : "5 kriter ortalaması"}</span>
            </div>
          </div>
        </div>
        <div className="stamp-pattern" aria-hidden style={{ height: "60%", opacity: 0.12 }} />
      </section>

      {/* ---------- 5 criteria ---------- */}
      <section className="section">
        <div className="section__head">
          <div>
            <h2>5 Shelf Effect kriterleri</h2>
            <p>Her kriter 0–100. Skorlar raf performansı ve algı netliğini ölçer, estetik yargı içermez.</p>
          </div>
        </div>
        <div className="grid grid--5">
          {r.criteria.map((c) => <CriterionCard key={c.key} c={c} />)}
        </div>
      </section>

      {/* ---------- Visual attention ---------- */}
      <section className="section">
        <div className="section__head">
          <div>
            <h2>Visual Attention</h2>
            <p>Tekil ambalaj tahmini dikkat analizi. {m.singlePack.isMock ? "Mock modda ısı haritası sezgisel saliency modelinden üretilir; eye-tracking tahmini değildir." : "Attention Insight tahmini eye-tracking verisi."}</p>
          </div>
        </div>
        <div className="split">
          <div className="card card--pad">
            <HeatmapView image={m.packImage} prediction={m.singlePack} />
          </div>
          <div className="stack">
            <div className="grid grid--2">
              <div className="metric">
                <span className="metric__label">Focus Score</span>
                <span className="metric__value num">{m.singlePack.focusScore ?? "—"}<small>/100</small></span>
                <span className="metric__note">Dikkatin az sayıda alanda toplanma derecesi</span>
              </div>
              <div className="metric">
                <span className="metric__label">Clarity Score</span>
                <span className="metric__value num">{m.singlePack.clarityScore ?? "—"}<small>/100</small></span>
                <span className="metric__note">{m.singlePack.clarityDescription ?? "Tasarımın algısal çözülme kolaylığı"}</span>
              </div>
            </div>
            <div className="card card--pad stack">
              <div className="between">
                <strong className="display small">AOI · Percentage of Attention</strong>
                <span className="tiny muted">{m.singlePack.aois[0]?.source === "vision_model" ? "AOI: vision model" : "AOI: standart yerleşim varsayımı"}</span>
              </div>
              {m.singlePack.aois.map((a) => (
                <ScoreBar key={a.id} label={a.name} value={a.attentionShare} unit="%" tone={a.role === "logo" ? "blue" : a.role === "claim" ? "amber" : a.role === "product_visual" ? "sky" : "muted"} />
              ))}
              <p className="tiny muted">Paylar ambalaj üzerindeki toplam dikkatin yüzdesidir; toplam 100'ü aşmaz.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Shelf performance ---------- */}
      <section className="section">
        <div className="section__head">
          <div>
            <h2>Shelf Performance</h2>
            <p>Üç dizilim, eşit facing. Paylar üç markanın toplam dikkatinin yüzdesi; parite {m.shelf.parityShare}%.</p>
          </div>
        </div>
        <div className="grid grid--4" style={{ marginBottom: 16 }}>
          <div className="metric metric--blue">
            <span className="metric__label">Shelf Performance Index</span>
            <span className="metric__value num">{m.shelf.shelfPerformanceIndex}</span>
            <span className="metric__note">Ortalama pay / 33,3 × 100 · 100 = parite</span>
          </div>
          <div className="metric">
            <span className="metric__label">{project.brandName} (ort.)</span>
            <span className="metric__value num">{m.shelf.averageMainShare}<small>%</small></span>
            <span className="metric__note">Main Pack dikkat payı</span>
          </div>
          <div className="metric">
            <span className="metric__label">{project.competitor1BrandName}</span>
            <span className="metric__value num">{m.shelf.averageCompetitor1Share}<small>%</small></span>
            <span className="metric__note">Competitor 1</span>
          </div>
          <div className="metric">
            <span className="metric__label">{project.competitor2BrandName}</span>
            <span className="metric__value num">{m.shelf.averageCompetitor2Share}<small>%</small></span>
            <span className="metric__note">Competitor 2</span>
          </div>
        </div>
        <ShelfView shelf={m.shelf} project={project} />
        <div className="grid grid--3" style={{ marginTop: 16 }}>
          <div className="metric"><span className="metric__label">Single Pack Attention Score</span><span className="metric__value num">{r.scores.single_pack_attention}</span><span className="metric__note">Focus + Clarity + marka/mesaj AOI payı</span></div>
          <div className="metric"><span className="metric__label">Shelf Performance Index</span><span className="metric__value num">{r.scores.shelf_performance_index}</span><span className="metric__note">100'ü aşabilir</span></div>
          <div className="metric"><span className="metric__label">Attention & Stand-out Score</span><span className="metric__value num">{r.scores.attention_standout}<small>/100</small></span><span className="metric__note">%40 tekil + %60 raf</span></div>
        </div>
      </section>

      {/* ---------- Distance ---------- */}
      <section className="section">
        <div className="section__head">
          <div>
            <h2>Consumer Distance Clarity</h2>
            <p>5 m → 3 m → 1 m simülasyonu: backend ambalajı küçültüp yeniden büyütür; ek attention tahmini kullanmaz.</p>
          </div>
          <span className="badge badge--info">SKOR {r.scores.consumer_distance_clarity}/100</span>
        </div>
        <DistanceStrip distance={m.distance} />
      </section>

      {/* ---------- Diagnosis ---------- */}
      <section className="section">
        <div className="section__head">
          <div>
            <h2>Diagnosis</h2>
            <p>Her bulgu: kanıt → neden → öneri. Genel tasarım klişesi değil, ölçülen probleme bağlı tavsiye.</p>
          </div>
          <span className="tiny muted">Motor güveni: {r.engine.confidence === "high" ? "yüksek" : r.engine.confidence === "medium" ? "orta" : "düşük"}</span>
        </div>
        <div className="split split--narrow-left">
          <div className="stack">
            <div className="card card--pad stack">
              <div className="eyebrow eyebrow--blue">Güçlü yönler</div>
              <ul className="clean">{r.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
            <div className="card card--pad stack">
              <div className="eyebrow">Öncelikli öneriler</div>
              <ol style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 8 }} className="small">
                {r.recommendations.map((rec) => (
                  <li key={rec.priority}>
                    {rec.action}
                    {rec.expectedEffect.length ? <div className="pill-list" style={{ marginTop: 4 }}>{rec.expectedEffect.map((e) => <span key={e}>{e}</span>)}</div> : null}
                  </li>
                ))}
              </ol>
            </div>
            <div className="card card--soft card--pad stack">
              <div className="eyebrow eyebrow--blue">Motor notları</div>
              <ul className="clean">{r.engine.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
            </div>
          </div>
          <div className="stack" style={{ gap: 20 }}>
            <div className="stack">
              <div className="cluster"><span className="badge badge--critical">CRITICAL</span><span className="tiny muted">{r.issues.critical.length} bulgu</span></div>
              <IssueList issues={r.issues.critical} />
            </div>
            <div className="stack">
              <div className="cluster"><span className="badge badge--important">IMPORTANT</span><span className="tiny muted">{r.issues.important.length} bulgu</span></div>
              <IssueList issues={r.issues.important} />
            </div>
            <div className="stack">
              <div className="cluster"><span className="badge badge--opportunity">OPPORTUNITY</span><span className="tiny muted">{r.issues.opportunities.length} bulgu</span></div>
              <IssueList issues={r.issues.opportunities} />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="section card card--pad" style={{ textAlign: "center", padding: 40, display: "grid", gap: 14, justifyItems: "center" }}>
        <div className="eyebrow">Improve → Re-test</div>
        <h2>Teşhis edilen problemleri düzelten tek bir optimize tasarım üret</h2>
        <p className="muted" style={{ maxWidth: "60ch" }}>
          Marka karakteri korunur; yalnızca yukarıdaki bulgular değiştirilir. Ardından tekil, 3 raf ve 5 m/3 m/1 m testleri yeniden çalışır ve ORIGINAL vs OPTIMIZED karşılaştırması gösterilir.
        </p>
        <AppLink to="/compare" query={{ id: analysis.id }} className="btn btn--amber btn--xl">
          {analysis.optimized ? "Before / After sonuçlarını gör" : "IMPROVE MY DESIGN"}
        </AppLink>
        {isMock ? <span className="tiny muted">Mock modda görsel üretimi yapılmaz; orijinalin işaretli bir simülasyonu kullanılarak döngü test edilir.</span> : null}
      </section>

      <details className="section">
        <summary>Pipeline günlüğü ve 5SE JSON çıktısı</summary>
        <div className="grid grid--2" style={{ marginTop: 12 }}>
          <div className="stack">
            {analysis.pipelineLog.map((s) => (
              <div key={s.key} className={`process__row ${s.status === "done" ? "is-done" : s.status === "failed" ? "" : "is-pending"}`}>
                <span className="process__dot">{s.status === "done" ? "✓" : s.status === "skipped" ? "–" : "!"}</span>
                <span>{s.label}{s.detail ? <span className="muted"> · {s.detail}</span> : null}</span>
                <em>{s.durationMs} ms</em>
              </div>
            ))}
          </div>
          <pre className="json">{JSON.stringify({ scores: r.scores, criteriaCounted: r.criteriaCounted, summary: r.summary, strengths: r.strengths, issues: r.issues, recommendations: r.recommendations, optimized_design: r.optimized_design }, null, 2)}</pre>
        </div>
      </details>
    </div>
  );
}

const CRITERION_INDEX: Record<CriterionResult["key"], string> = {
  uniqueness: "01",
  continuity_consistency: "02",
  product_clarity: "03",
  attention_standout: "04",
  consumer_distance_clarity: "05",
};

function CriterionCard({ c }: { c: CriterionResult }) {
  return (
    <article className="card crit">
      <div className="crit__head">
        <div>
          <div className="crit__tr">{CRITERION_INDEX[c.key]} · {c.methodologyName}</div>
          <div className="crit__name">{c.name}</div>
        </div>
      </div>
      <div className={`crit__score num ${c.score === null ? "crit__score--na" : ""}`}>
        {c.score === null ? "N/A" : <>{c.score}<small>/100</small></>}
      </div>
      <ScoreBar label="" value={c.score} hideValue />
      <p>{c.narrative}</p>
      <details>
        <summary>Alt kırılım</summary>
        <div className="stack" style={{ marginTop: 8 }}>
          {c.breakdown.map((b) => (
            <ScoreBar key={b.key} label={b.label} sub={`%${b.weight}`} value={c.score === null ? null : b.score} />
          ))}
          <span className="tiny muted">Güven: {c.confidence === "high" ? "yüksek" : c.confidence === "medium" ? "orta" : "düşük"}</span>
        </div>
      </details>
    </article>
  );
}
