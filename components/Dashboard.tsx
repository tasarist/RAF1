"use client";

import { useEffect, useState } from "react";
import type { AnalysisSummary } from "@/lib/types";
import { listLocalAnalyses } from "@/lib/client/analysisDb";
import { AppLink } from "./AppLink";
import { Principles } from "./Principles";

export function Dashboard() {
  const [items, setItems] = useState<AnalysisSummary[] | null>(null);
  useEffect(() => {
    listLocalAnalyses().then(setItems).catch(() => setItems([]));
  }, []);

  return (
    <div className="container stack" style={{ gap: 40 }}>
      <section className="hero reveal">
        <div>
          <div className="eyebrow">5 Shelf Effect™ · Tasarist</div>
          <h1>
            Ambalajını rafta <em>ölç</em>, <span className="light">teşhis et,</span> iyileştir.
          </h1>
          <p className="lead">
            Tüketicinin raf önünde 8 saniyesi var. 5SE, ambalajını iki rakibiyle sanal rafa koyar, tahmini dikkat verisiyle ölçer, beş kriterde puanlar ve tek bir optimize tasarım üretip yeniden test eder.
          </p>
          <div className="hero__actions">
            <AppLink to="/new" className="btn btn--primary btn--lg">+ New 5SE Analysis</AppLink>
            <a href="#method" className="btn btn--ghost btn--lg">Metodoloji</a>
          </div>
          <div className="loop" aria-label="Ürün döngüsü">
            <span>ANALYZE</span><i>→</i><span>DIAGNOSE</span><i>→</i><span>COMPARE</span><i>→</i><span>IMPROVE</span><i>→</i><span>RE-TEST</span>
          </div>
        </div>
        <aside className="hero__panel" aria-label="5SE nasıl çalışır">
          <div className="eyebrow eyebrow--blue">Bir analiz neyi ölçer?</div>
          {[
            ["Uniqueness", "Rakiplerden görsel ayrışma"],
            ["Continuity & Consistency", "Eski ambalaj / SKU ailesiyle süreklilik (opsiyonel)"],
            ["Product Clarity", "Ürün, varyant ve vaat netliği"],
            ["Attention & Stand-out", "Tekil dikkat + 3 raf dizilimi → Shelf Performance Index"],
            ["Consumer Distance Clarity", "5 m blok · 3 m logo · 1 m satın alma mesajı"],
          ].map(([t, d], i) => (
            <div key={t} style={{ display: "grid", gridTemplateColumns: "28px 1fr", gap: 10, alignItems: "start" }}>
              <b className="display" style={{ color: "var(--amber)", fontSize: 18 }}>{i + 1}</b>
              <div>
                <strong className="small display">{t}</strong>
                <p className="tiny muted">{d}</p>
              </div>
            </div>
          ))}
          <p className="tiny muted" style={{ borderTop: "1px solid var(--border)", paddingTop: 10 }}>
            Mock modda dikkat verileri sezgisel bir saliency modelinden üretilir ve her ekranda “Mock” olarak işaretlenir. Gerçek analiz için Attention Insight API anahtarı gerekir.
          </p>
        </aside>
        <div className="stamp-pattern" aria-hidden />
      </section>

      <section className="section" style={{ marginTop: 0 }}>
        <div className="section__head">
          <div>
            <h2>Analizlerim</h2>
            <p>Sonuçlar bu cihazda saklanır; henüz hesap veya veritabanı yok.</p>
          </div>
          <AppLink to="/new" className="btn btn--primary">+ New 5SE Analysis</AppLink>
        </div>
        {items === null ? (
          <div className="list">
            {[0, 1].map((i) => <div key={i} className="skeleton" style={{ height: 88 }} />)}
          </div>
        ) : items.length === 0 ? (
          <div className="empty">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden><rect x="6" y="14" width="10" height="22" rx="2" stroke="currentColor" strokeWidth="2" /><rect x="19" y="10" width="10" height="26" rx="2" stroke="var(--blue)" strokeWidth="2.5" /><rect x="32" y="14" width="10" height="22" rx="2" stroke="currentColor" strokeWidth="2" /><path d="M4 40h40" stroke="currentColor" strokeWidth="2" /></svg>
            <strong>Henüz analiz yok.</strong>
            <span className="small">Ana ambalaj ve iki rakip görseliyle ilk 5SE analizini başlat; mock modda API anahtarı gerekmez.</span>
            <AppLink to="/new" className="btn btn--primary">İlk analizi başlat</AppLink>
          </div>
        ) : (
          <div className="list">
            {items.map((a) => (
              <AppLink key={a.id} to="/results" query={{ id: a.id }} className="card row">
                <img src={a.thumbnail} alt="" />
                <div>
                  <div className="row__title">{a.projectName}</div>
                  <div className="row__meta">
                    {a.brandName} · {a.productName} · {a.category} · {new Date(a.createdAt).toLocaleString("tr-TR")} · <span className={`badge ${a.mode === "mock" ? "badge--mock" : "badge--live"}`}>{a.mode.toUpperCase()}</span>
                  </div>
                </div>
                <div className="row__score num">
                  {a.optimizedScore !== undefined ? <>{a.overallScore} → {a.optimizedScore}</> : a.overallScore}
                  <small>5SE Score{a.optimizedScore !== undefined ? " · optimize edildi" : ""}</small>
                </div>
              </AppLink>
            ))}
          </div>
        )}
      </section>

      <section className="section" id="method">
        <div className="section__head">
          <div>
            <div className="eyebrow">Metodoloji</div>
            <h2>5 Shelf Effect: estetik ikinci planda</h2>
            <p>Amaç kolay algılanan logo ve ambalajlar. 5SE puanı güzellik ölçmez; rafta ilk bakışta kazanma olasılığını ölçer.</p>
          </div>
        </div>
        <Principles />
      </section>
    </div>
  );
}
