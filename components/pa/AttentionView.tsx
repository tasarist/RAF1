"use client";

import { useEffect, useRef, useState } from "react";
import { drawGaze, drawHeatmap } from "@/lib/pa/client";
import type { AttentionResult } from "@/lib/pa/types";

const METRICS: Array<[keyof AttentionResult, string]> = [
  ["overall", "Genel"], ["focus", "Odak"], ["clear", "Netlik"], ["approach", "Yaklaşma"],
  ["withdraw", "Uzaklaşma"], ["memory", "Hatırlanma"], ["exciting", "Heyecan"], ["balance", "Denge"],
];

type Tab = "orig" | "heat" | "gaze";

export function AttentionView({ src, att, defaultTab = "heat" }: { src: string; att?: AttentionResult; defaultTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(att ? defaultTab : "orig");
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!att || tab === "orig" || !canvas.current) return;
    const c = canvas.current;
    c.width = 900;
    (tab === "heat" ? drawHeatmap : drawGaze)(c, src, att).catch(() => undefined);
  }, [att, tab, src]);

  return (
    <div className="wz-attview">
      <div className="wz-tabs" role="tablist">
        {([["orig", "Orijinal"], ["heat", "Isı haritası"], ["gaze", "Bakış rotası"]] as Array<[Tab, string]>).map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} disabled={!att && k !== "orig"} onClick={() => setTab(k)}>{l}</button>
        ))}
        {att?.suspended ? <span className="wz-badge sim">Askıda · temsili</span> : null}
      </div>
      <div className="wz-attimg">
        {tab === "orig" || !att ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" />
        ) : (
          <canvas ref={canvas} />
        )}
      </div>
    </div>
  );
}

export function MetricGrid({ att }: { att: AttentionResult }) {
  return (
    <div className="wz-metrics">
      {METRICS.map(([k, l]) => (
        <div key={k} className={k === "overall" ? "main" : ""}>
          <span>{l}</span>
          <b>{att[k] as number}</b>
        </div>
      ))}
    </div>
  );
}

export function ShareTable({ att, types }: { att: AttentionResult; types?: Record<string, string> }) {
  return (
    <table className="wz-table">
      <thead><tr><th>Alan</th>{types ? <th>Tür</th> : null}<th className="num">Bakış</th><th className="num">Bakış Payı</th></tr></thead>
      <tbody>
        {att.aois.map((a, i) => (
          <tr key={a.id}>
            <td>{i + 1}. {a.text || "—"}</td>
            {types ? <td>{types[a.type ?? ""] ?? "—"}</td> : null}
            <td className="num">{a.fixationCount}</td>
            <td className="num"><b>%{a.share.toFixed(1)}</b></td>
          </tr>
        ))}
      </tbody>
      <tfoot><tr><td colSpan={types ? 2 : 1}>Toplam bakış</td><td className="num">{att.fixationsTotal}</td><td /></tr></tfoot>
    </table>
  );
}

export function Bar({ value, label, note, tone }: { value: number | null; label: string; note?: string; tone?: "after" }) {
  const v = value ?? 0;
  const cls = value == null ? "none" : v < 55 ? "risk" : v < 75 ? "mid" : "ok";
  return (
    <div className="wz-bar">
      <div className="wz-bar-head"><span>{label}</span><b>{value == null ? "—" : value}</b></div>
      <div className="wz-bar-track"><i className={`${cls}${tone ? ` ${tone}` : ""}`} style={{ width: `${v}%` }} /></div>
      {note ? <small>{note}</small> : null}
    </div>
  );
}
