import type { DistanceClarity } from "@/lib/types";
import { scoreTone } from "./ScoreRing";

export function DistanceStrip({ distance }: { distance: DistanceClarity }) {
  return (
    <div>
      <div className="distance__arrow">
        <span>5 m · Blok</span>
        <i />
        <span>3 m · Logo</span>
        <i />
        <span>1 m · Mesaj</span>
      </div>
      <div className="distance">
        {distance.stages.map((s) => (
          <div key={s.stage} className="card distance__stage">
            <div className="between">
              <span className="distance__m">{s.stage.replace("m", " m")}</span>
              <span className={`badge badge--${scoreTone(s.score) === "green" ? "live" : scoreTone(s.score) === "red" ? "critical" : scoreTone(s.score) === "amber" ? "important" : "info"}`}>{s.score}/100</span>
            </div>
            <img src={s.simulation.dataUrl} alt={`${s.stage} simülasyonu`} width={s.simulation.width} height={s.simulation.height} />
            <strong className="small">{s.label}</strong>
            <p className="tiny muted">{s.question}</p>
            <p className="small">{s.note}</p>
            <span className="tiny muted">Güven: {s.confidence === "high" ? "yüksek" : s.confidence === "medium" ? "orta" : "düşük"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
