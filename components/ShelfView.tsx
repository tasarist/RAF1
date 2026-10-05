"use client";

import { useState } from "react";
import type { ProjectMeta, ShelfPerformance, ShelfTestResult } from "@/lib/types";

const LAYOUT_LABEL: Record<ShelfTestResult["layout"], string> = {
  main_left: "Ana – R1 – R2",
  main_center: "R1 – Ana – R2",
  main_right: "R1 – R2 – Ana",
};

export function ShelfView({ shelf, project }: { shelf: ShelfPerformance; project: ProjectMeta }) {
  const [heat, setHeat] = useState(true);
  return (
    <div className="stack">
      <div className="between">
        <div className="tabs" role="tablist" aria-label="Raf görünümü">
          <button role="tab" aria-selected={!heat} onClick={() => setHeat(false)}>Sanal raf</button>
          <button role="tab" aria-selected={heat} onClick={() => setHeat(true)}>Raf heatmap</button>
        </div>
        <span className="tiny muted">Eşit facing · parite {shelf.parityShare}%</span>
      </div>
      <div className="grid grid--3">
        {shelf.tests.map((t) => (
          <div key={t.layout} className="card shelf-card">
            <div className="between">
              <strong className="small display">{LAYOUT_LABEL[t.layout]}</strong>
              <span className={`badge ${t.prediction.isMock ? "badge--mock" : "badge--live"}`}>{t.prediction.isMock ? "MOCK" : "AI"}</span>
            </div>
            <div className="heat">
              <img src={heat && t.prediction.heatmapUrl ? t.prediction.heatmapUrl : t.shelfImage.dataUrl} alt={`Sanal raf ${LAYOUT_LABEL[t.layout]}`} width={t.shelfImage.width} height={t.shelfImage.height} />
              {heat && !t.prediction.heatmapUrl ? (
                <div
                  className="heat__overlay"
                  style={{
                    backgroundImage: (t.prediction.hotspots ?? [])
                      .map((h) => {
                        const a = Math.min(0.85, 0.25 + h.intensity * 0.6);
                        return `radial-gradient(ellipse at ${h.x}% ${h.y}%, rgba(255,30,30,${a}) 0%, rgba(255,140,0,${a * 0.7}) ${h.radius * 0.35}%, rgba(255,230,0,${a * 0.3}) ${h.radius * 0.7}%, transparent ${h.radius * 1.1}%)`;
                      })
                      .join(","),
                  }}
                />
              ) : null}
              {t.prediction.aois.map((a) => (
                <div key={a.id} className="heat__aoi" style={{ left: `${a.x}%`, top: `${a.y}%`, width: `${a.width}%`, height: `${a.height}%`, borderColor: a.id === "main" ? "var(--blue)" : "rgba(125,132,163,0.7)" }} />
              ))}
            </div>
            <div className="shelf-shares">
              <div className="is-main"><strong className="num">{t.mainAttentionShare}%</strong>{project.brandName}</div>
              <div><strong className="num">{t.competitor1AttentionShare}%</strong>{project.competitor1BrandName}</div>
              <div><strong className="num">{t.competitor2AttentionShare}%</strong>{project.competitor2BrandName}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
