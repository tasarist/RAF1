"use client";

import { useState } from "react";
import type { AttentionPrediction, ImageAsset } from "@/lib/types";

type Mode = "heatmap" | "focus" | "aoi";

/**
 * Renders the provider heatmap / focus map when available; in mock mode it paints the synthetic
 * hotspots as radial gradients so the prototype is visibly a simulation.
 */
export function HeatmapView({ image, prediction, initial = "heatmap", compact = false }: { image: ImageAsset; prediction: AttentionPrediction; initial?: Mode; compact?: boolean }) {
  const [mode, setMode] = useState<Mode>(initial);
  const hotspots = prediction.hotspots ?? [];
  const gradient = hotspots
    .map((h) => {
      const alpha = Math.min(0.95, 0.35 + h.intensity * 0.6);
      return `radial-gradient(circle at ${h.x}% ${h.y}%, rgba(255,30,30,${alpha}) 0%, rgba(255,140,0,${alpha * 0.8}) ${h.radius * 0.45}%, rgba(255,230,0,${alpha * 0.5}) ${h.radius * 0.85}%, rgba(40,200,120,${alpha * 0.22}) ${h.radius * 1.25}%, transparent ${h.radius * 1.7}%)`;
    })
    .join(",");
  const focusGradient = hotspots
    .filter((h) => h.intensity > 0.45)
    .map((h) => `radial-gradient(circle at ${h.x}% ${h.y}%, transparent ${h.radius * 0.9}%, rgba(8,10,40,0.82) ${h.radius * 1.5}%)`)
    .join(",");

  const providerImage = mode === "heatmap" ? prediction.heatmapUrl : mode === "focus" ? prediction.focusMapUrl : undefined;

  return (
    <div className="stack">
      {!compact ? (
        <div className="between">
          <div className="tabs" role="tablist" aria-label="Attention görünümü">
            {(["heatmap", "focus", "aoi"] as Mode[]).map((m) => (
              <button key={m} role="tab" aria-selected={mode === m} onClick={() => setMode(m)}>
                {m === "heatmap" ? "Attention Heatmap" : m === "focus" ? "Focus Map" : "AOI"}
              </button>
            ))}
          </div>
          <span className={`badge ${prediction.isMock ? "badge--mock" : "badge--live"}`}>{prediction.isMock ? "MOCK SİMÜLASYON" : "ATTENTION INSIGHT"}</span>
        </div>
      ) : null}
      <div className={`heat ${mode === "focus" ? "heat--focus" : ""}`}>
        <img src={providerImage ?? image.dataUrl} alt={mode === "aoi" ? "Ambalaj ve ilgi alanları" : `Ambalaj ${mode}`} width={image.width} height={image.height} />
        {!providerImage && mode === "heatmap" ? <div className="heat__overlay" style={{ backgroundImage: gradient }} /> : null}
        {!providerImage && mode === "focus" ? <div className="heat__overlay" style={{ backgroundImage: focusGradient || "rgba(8,10,40,0.6)" }} /> : null}
        {mode === "aoi"
          ? prediction.aois.map((a) => (
              <div key={a.id} className="heat__aoi" style={{ left: `${a.x}%`, top: `${a.y}%`, width: `${a.width}%`, height: `${a.height}%` }}>
                <span>
                  {a.name} {a.attentionShare !== null ? `· ${a.attentionShare}%` : ""}
                </span>
              </div>
            ))
          : null}
        {compact ? <span className={`badge heat__tag ${prediction.isMock ? "badge--mock" : "badge--live"}`}>{prediction.isMock ? "MOCK" : "AI"}</span> : null}
      </div>
    </div>
  );
}
