"use client";

import { useId, useState } from "react";
import type { GoalId, StepId } from "@/lib/pa/engine";
import type { Analysis, Project } from "@/lib/pa/types";

export interface EngineInfo {
  version: number;
  flows: Record<GoalId, { label: string; steps: StepId[] }>;
  stepLabels: Record<StepId, string>;
  aoiTypes: Record<string, string>;
  rules: { thresholds: { risky: number; ready: number }; shareTargets: Record<string, number>; recTarget: number };
}

export interface Wiz {
  engine: EngineInfo;
  project: Project;
  setProject: (p: Project) => void;
  pack: Analysis | null;
  setPack: (a: Analysis | null) => void;
  comp: Analysis | null;
  setComp: (a: Analysis | null) => void;
  shelf: Analysis | null;
  setShelf: (a: Analysis | null) => void;
  next: () => void;
  standalone: boolean;
}

export function UploadSlot({ label, hint, src, onFile, required, busy, aspect = 1, compact }: {
  label: string; hint?: string; src?: string | null; onFile: (f: File) => void; required?: boolean; busy?: boolean | string; aspect?: number; compact?: boolean;
}) {
  const id = useId();
  const [over, setOver] = useState(false);
  return (
    <label
      htmlFor={id}
      className={`wz-upload${src ? " has" : ""}${over ? " over" : ""}${busy ? " busy" : ""}${compact ? " compact" : ""}`}
      style={compact ? undefined : { aspectRatio: String(aspect) }}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files?.[0]; if (f && f.type.startsWith("image/")) onFile(f); }}
    >
      <input id={id} type="file" accept="image/png,image/jpeg,image/webp" className="wz-hidden" disabled={!!busy} onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src && !compact ? <img src={src} alt="" /> : null}
      {busy ? <span className="wz-upload-busy"><i className="wz-spin" />{typeof busy === "string" ? busy : "YZ okuyor…"}</span> : null}
      <span className="wz-upload-label">
        <b>{label}{required ? " *" : ""}</b>
        {hint ? <small>{hint}</small> : null}
        <em>{src ? "Değiştir" : "Görsel seç ya da sürükle bırak"}</em>
      </span>
    </label>
  );
}

// Adımın alt çubuğu: ana düğme + düğme neden kapalıysa kısa açıklama.
export function StepFooter({ note, children }: { note?: string | null; children: React.ReactNode }) {
  return (
    <div className="wz-footer">
      {note ? <span className="wz-footer-note">{note}</span> : <span />}
      <div className="wz-footer-btns">{children}</div>
    </div>
  );
}

export function Verdict({ verdict }: { verdict: string | null | undefined }) {
  if (!verdict) return <span className="wz-verdict none">—</span>;
  const cls = verdict === "Riskli" ? "risk" : verdict === "Geliştirilebilir" ? "mid" : "ok";
  return <span className={`wz-verdict ${cls}`}>{verdict}</span>;
}

export function ScoreScale({ total, verdict, risky, ready }: { total: number | null; verdict: string | null; risky: number; ready: number }) {
  return (
    <div className="wz-scale">
      <div className="wz-scale-top">
        <div><span className="wz-eyebrow">5SE™ toplam skor</span><b className="wz-total">{total ?? "—"}</b></div>
        <Verdict verdict={verdict} />
      </div>
      <div className="wz-scale-bar">
        {total != null ? <i className="wz-scale-marker" style={{ left: `${total}%` }} /> : null}
        <span className="risk" style={{ flexBasis: `${risky}%` }}>Riskli</span>
        <span className="mid" style={{ flexBasis: `${ready - risky}%` }}>Geliştirilebilir</span>
        <span className="ok" style={{ flexBasis: `${100 - ready}%` }}>Rafa hazır</span>
      </div>
      <div className="wz-scale-ticks"><span>0</span><span style={{ left: `${risky}%` }}>{risky}</span><span style={{ left: `${ready}%` }}>{ready}</span><span style={{ left: "100%" }}>100</span></div>
    </div>
  );
}

export function ErrorNote({ error }: { error: string | null }) {
  return error ? <p className="wz-error" role="alert">{error}</p> : null;
}

export async function urlToDataUrl(url: string): Promise<string> {
  const blob = await (await fetch(url)).blob();
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Görsel okunamadı."));
    r.readAsDataURL(blob);
  });
}

export function logoText(elements: Array<{ type?: string; text: string }> | undefined) {
  return elements?.find((e) => e.type === "logo")?.text?.trim() || "";
}

export const norm = (s: string) => s.toLocaleLowerCase("tr").replace(/\s+/g, " ").trim();
