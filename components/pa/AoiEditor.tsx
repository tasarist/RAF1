"use client";

import { useRef, useState } from "react";
import { boxToQuad, isRectQuad, quadToBox } from "@/lib/pa/geometry";
import type { Box, Quad } from "@/lib/pa/types";

export interface EditorItem { id: string; type?: string; text: string; quad: Quad; strength?: number }

type Corner = keyof Quad;
const CORNERS: Corner[] = ["tl", "tr", "br", "bl"];
const COLORS = ["#5ee0c2", "#ffcf6e", "#72b8ff", "#ff8f78", "#c39af0", "#9be06e"];

export function toEditorItems(list: Array<{ id: string; type?: string; text?: string; brand?: string; box: Box; quad?: Quad; strength?: number }>): EditorItem[] {
  return list.map((e) => ({ id: e.id, type: e.type, text: e.text ?? e.brand ?? "", quad: e.quad ?? boxToQuad(e.box), strength: e.strength }));
}

export function fromEditorItem(it: EditorItem) {
  const box = quadToBox(it.quad);
  return { id: it.id, text: it.text, box, ...(isRectQuad(it.quad) ? {} : { quad: it.quad }), ...(it.type ? { type: it.type } : {}), ...(it.strength != null ? { strength: it.strength } : {}) };
}

interface Props {
  src: string;
  items: EditorItem[];
  onChange: (items: EditorItem[]) => void;
  types?: Record<string, string>; // verilirse tür seçimi gösterilir
  textLabel?: string;
  max?: number;
  aspect?: number; // genişlik/yükseklik
  suggestions?: string[];
}

export function AoiEditor({ src, items, onChange, types, textLabel = "Metin", max = 6, aspect = 1, suggestions }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [sel, setSel] = useState<string | null>(items[0]?.id ?? null);
  const drag = useRef<{ id: string; corner?: Corner; start: { x: number; y: number }; orig: Quad } | null>(null);

  const toNorm = (e: React.PointerEvent) => {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  };

  const begin = (e: React.PointerEvent, id: string, corner?: Corner) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    const it = items.find((i) => i.id === id);
    if (!it) return;
    setSel(id);
    drag.current = { id, corner, start: toNorm(e), orig: it.quad };
  };

  const move = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const p = toNorm(e);
    let dx = p.x - d.start.x;
    let dy = p.y - d.start.y;
    const c = (v: number) => Math.min(1, Math.max(0, v));
    let q: Quad;
    if (d.corner) {
      q = { ...d.orig, [d.corner]: { x: c(d.orig[d.corner].x + dx), y: c(d.orig[d.corner].y + dy) } };
    } else {
      const xs = CORNERS.map((k) => d.orig[k].x);
      const ys = CORNERS.map((k) => d.orig[k].y);
      dx = Math.min(1 - Math.max(...xs), Math.max(-Math.min(...xs), dx));
      dy = Math.min(1 - Math.max(...ys), Math.max(-Math.min(...ys), dy));
      q = Object.fromEntries(CORNERS.map((k) => [k, { x: d.orig[k].x + dx, y: d.orig[k].y + dy }])) as Quad;
    }
    onChange(items.map((i) => (i.id === d.id ? { ...i, quad: q } : i)));
  };

  const end = () => { drag.current = null; };

  const add = () => {
    const id = `a${Date.now().toString(36)}`;
    onChange([...items, { id, type: types ? "other" : undefined, text: "", quad: boxToQuad({ x: 0.35, y: 0.4, w: 0.3, h: 0.15 }) }]);
    setSel(id);
  };

  const update = (id: string, patch: Partial<EditorItem>) => onChange(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const remove = (id: string) => { onChange(items.filter((i) => i.id !== id)); setSel(null); };

  return (
    <div className="wz-editor">
      <div className="wz-editor-stage" style={{ aspectRatio: String(aspect) }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" draggable={false} />
        <svg ref={svgRef} viewBox="0 0 1000 1000" preserveAspectRatio="none" onPointerMove={move} onPointerUp={end} onPointerLeave={end} onPointerDown={() => setSel(null)}>
          {items.map((it, i) => {
            const color = COLORS[i % COLORS.length];
            const pts = CORNERS.map((k) => `${it.quad[k].x * 1000},${it.quad[k].y * 1000}`).join(" ");
            const active = sel === it.id;
            return (
              <g key={it.id}>
                <polygon points={pts} fill={color} fillOpacity={active ? 0.22 : 0.1} stroke={color} strokeWidth={active ? 4 : 2.5} vectorEffect="non-scaling-stroke" style={{ cursor: "move" }} onPointerDown={(e) => begin(e, it.id)} />
                <text x={it.quad.tl.x * 1000 + 6} y={it.quad.tl.y * 1000 - 8} fill={color} fontSize={aspect > 1 ? 26 : 30} fontWeight={700} style={{ pointerEvents: "none" }}>{i + 1}</text>
                {active && CORNERS.map((k) => (
                  <circle key={k} cx={it.quad[k].x * 1000} cy={it.quad[k].y * 1000} r={aspect > 1 ? 10 : 14} fill="#fff" stroke={color} strokeWidth={3} vectorEffect="non-scaling-stroke" style={{ cursor: "grab" }} onPointerDown={(e) => begin(e, it.id, k)} />
                ))}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="wz-editor-list">
        {items.map((it, i) => (
          <div key={it.id} className={`wz-aoi-row${sel === it.id ? " active" : ""}`} onClick={() => setSel(it.id)}>
            <span className="wz-aoi-num" style={{ background: COLORS[i % COLORS.length] }}>{i + 1}</span>
            {types ? (
              <select aria-label="Alan türü" value={it.type ?? "other"} onChange={(e) => update(it.id, { type: e.target.value })}>
                {Object.entries(types).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            ) : null}
            <input aria-label={textLabel} placeholder={textLabel} value={it.text} list={suggestions ? "wz-brand-suggest" : undefined} onChange={(e) => update(it.id, { text: e.target.value })} />
            <button type="button" className="wz-icon-btn" aria-label="Alanı sil" onClick={(e) => { e.stopPropagation(); remove(it.id); }}>×</button>
          </div>
        ))}
        {suggestions ? <datalist id="wz-brand-suggest">{suggestions.map((s) => <option key={s} value={s} />)}</datalist> : null}
        <button type="button" className="wz-btn ghost small" onClick={add} disabled={items.length >= max}>
          + Alan ekle {items.length >= max ? `(en fazla ${max})` : ""}
        </button>
        <p className="wz-hint">Alanı sürükleyerek taşıyın; seçili alanın köşelerini çekerek eğik/perspektifli unsurlara uydurun.</p>
      </div>
    </div>
  );
}
