"use client";

import { useEffect, useRef, useState } from "react";
import { boxToQuad, isRectQuad, quadToBox } from "@/lib/pa/geometry";
import type { Box, Quad } from "@/lib/pa/types";

export interface EditorItem { id: string; type?: string; text: string; quad: Quad; strength?: number }

type Corner = keyof Quad;
const CORNERS: Corner[] = ["tl", "tr", "br", "bl"];

// Tür bazında sabit renk: aynı tür her ekranda aynı renkte görünür.
export const TYPE_COLORS: Record<string, string> = {
  logo: "#5ee0c2", product: "#72b8ff", claim: "#ffcf6e", variant: "#ff8f78", visual: "#c39af0", other: "#a9b1bd",
};
const BRAND_COLORS = ["#5ee0c2", "#ff8f78", "#72b8ff", "#ffcf6e", "#c39af0", "#9be06e"];

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
  types?: Record<string, string>; // verilirse tür seçimi gösterilir (ambalaj); yoksa marka modu (raf)
  textLabel?: string;
  max?: number;
  aspect?: number; // genişlik / yükseklik
  suggestions?: string[];
}

type Drag =
  | { mode: "move"; id: string; start: { x: number; y: number }; orig: Quad }
  | { mode: "corner"; id: string; corner: Corner; start: { x: number; y: number }; orig: Quad }
  | { mode: "draw"; id: string; start: { x: number; y: number } };

const clamp = (v: number) => Math.min(1, Math.max(0, v));

export function AoiEditor({ src, items, onChange, types, textLabel = "Metin", max = 6, aspect = 1, suggestions }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const drag = useRef<Drag | null>(null);
  const latest = useRef(items);
  latest.current = items;

  const brandOrder = [...new Set([...(suggestions ?? []), ...items.map((i) => i.text.trim())].filter(Boolean).map((s) => s.toLocaleLowerCase("tr")))];
  const colorOf = (it: EditorItem, i: number) => {
    if (types) return TYPE_COLORS[it.type ?? "other"] ?? TYPE_COLORS.other;
    const k = brandOrder.indexOf(it.text.trim().toLocaleLowerCase("tr"));
    return k >= 0 ? BRAND_COLORS[k % BRAND_COLORS.length] : BRAND_COLORS[i % BRAND_COLORS.length];
  };

  // Seçili alanı Delete/Backspace ile sil (bir metin alanı odaktayken değil).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (!sel || /INPUT|SELECT|TEXTAREA/.test(t.tagName)) return;
      if (e.key === "Delete" || e.key === "Backspace") { onChange(latest.current.filter((i) => i.id !== sel)); setSel(null); }
      if (e.key === "Escape") setSel(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sel, onChange]);

  const toNorm = (e: React.PointerEvent) => {
    const r = stageRef.current!.getBoundingClientRect();
    return { x: clamp((e.clientX - r.left) / r.width), y: clamp((e.clientY - r.top) / r.height) };
  };

  const capture = (e: React.PointerEvent) => stageRef.current?.setPointerCapture(e.pointerId);

  const beginMove = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    const it = items.find((i) => i.id === id);
    if (!it) return;
    capture(e);
    setSel(id);
    drag.current = { mode: "move", id, start: toNorm(e), orig: it.quad };
  };

  const beginCorner = (e: React.PointerEvent, id: string, corner: Corner) => {
    e.stopPropagation();
    const it = items.find((i) => i.id === id);
    if (!it) return;
    capture(e);
    drag.current = { mode: "corner", id, corner, start: toNorm(e), orig: it.quad };
  };

  // Boş alana basıp sürükleyerek yeni alan çiz.
  const beginDraw = (e: React.PointerEvent) => {
    setSel(null);
    if (items.length >= max) return;
    capture(e);
    const p = toNorm(e);
    const id = `a${Date.now().toString(36)}`;
    drag.current = { mode: "draw", id, start: p };
  };

  const move = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const p = toNorm(e);
    if (d.mode === "draw") {
      const b = { x: Math.min(d.start.x, p.x), y: Math.min(d.start.y, p.y), w: Math.abs(p.x - d.start.x), h: Math.abs(p.y - d.start.y) };
      if (b.w < 0.01 && b.h < 0.01) return;
      const exists = latest.current.some((i) => i.id === d.id);
      const quad = boxToQuad(b);
      onChange(exists
        ? latest.current.map((i) => (i.id === d.id ? { ...i, quad } : i))
        : [...latest.current, { id: d.id, type: types ? "other" : undefined, text: "", quad }]);
      setSel(d.id);
      return;
    }
    const dx0 = p.x - d.start.x;
    const dy0 = p.y - d.start.y;
    let q: Quad;
    if (d.mode === "corner") {
      q = { ...d.orig, [d.corner]: { x: clamp(d.orig[d.corner].x + dx0), y: clamp(d.orig[d.corner].y + dy0) } };
    } else {
      const xs = CORNERS.map((k) => d.orig[k].x);
      const ys = CORNERS.map((k) => d.orig[k].y);
      const dx = Math.min(1 - Math.max(...xs), Math.max(-Math.min(...xs), dx0));
      const dy = Math.min(1 - Math.max(...ys), Math.max(-Math.min(...ys), dy0));
      q = Object.fromEntries(CORNERS.map((k) => [k, { x: d.orig[k].x + dx, y: d.orig[k].y + dy }])) as Quad;
    }
    onChange(latest.current.map((i) => (i.id === d.id ? { ...i, quad: q } : i)));
  };

  const end = () => { drag.current = null; };

  const add = () => {
    const id = `a${Date.now().toString(36)}`;
    const n = items.length;
    onChange([...items, { id, type: types ? "other" : undefined, text: "", quad: boxToQuad({ x: 0.3 + (n % 3) * 0.05, y: 0.35 + (n % 3) * 0.05, w: 0.3, h: 0.14 }) }]);
    setSel(id);
  };

  const update = (id: string, patch: Partial<EditorItem>) => onChange(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const remove = (id: string) => { onChange(items.filter((i) => i.id !== id)); if (sel === id) setSel(null); };
  const full = items.length >= max;

  return (
    <div className={`wz-editor${aspect > 1.2 ? " wide" : ""}`}>
      <div>
        <div
          ref={stageRef}
          className={`wz-editor-stage${full ? "" : " can-draw"}`}
          style={{ aspectRatio: String(aspect) }}
          onPointerDown={beginDraw}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" draggable={false} />
          <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
            {items.map((it, i) => {
              const color = colorOf(it, i);
              const on = sel === it.id || hover === it.id;
              return (
                <polygon
                  key={it.id}
                  points={CORNERS.map((k) => `${it.quad[k].x * 1000},${it.quad[k].y * 1000}`).join(" ")}
                  fill={color} fillOpacity={on ? 0.24 : 0.1} stroke={color} strokeWidth={on ? 3.5 : 2}
                  vectorEffect="non-scaling-stroke" style={{ cursor: "move" }}
                  onPointerDown={(e) => beginMove(e, it.id)}
                  onPointerEnter={() => setHover(it.id)} onPointerLeave={() => setHover(null)}
                />
              );
            })}
          </svg>

          {/* Etiketler HTML olarak çizilir: görsel oranı ne olursa olsun yazı bozulmaz. */}
          {items.map((it, i) => {
            const b = quadToBox(it.quad);
            const color = colorOf(it, i);
            const below = b.y < 0.07;
            return (
              <button
                key={`l-${it.id}`} type="button"
                className={`wz-tag${sel === it.id ? " on" : ""}`}
                style={{ left: `${Math.min(b.x, 0.75) * 100}%`, top: `${(below ? b.y + b.h : b.y) * 100}%`, borderColor: color, transform: below ? "translateY(4px)" : "translateY(calc(-100% - 4px))" }}
                onPointerDown={(e) => beginMove(e, it.id)}
                onPointerEnter={() => setHover(it.id)} onPointerLeave={() => setHover(null)}
              >
                <i style={{ background: color }}>{i + 1}</i>
                {types ? <span className="t">{types[it.type ?? "other"]}</span> : null}
                <span className="x">{it.text.trim() || (types ? "metin yok" : "marka adı yok")}</span>
              </button>
            );
          })}

          {sel ? (() => {
            const it = items.find((x) => x.id === sel);
            if (!it) return null;
            const color = colorOf(it, items.indexOf(it));
            return CORNERS.map((k) => (
              <span
                key={k} className="wz-handle" role="presentation"
                style={{ left: `${it.quad[k].x * 100}%`, top: `${it.quad[k].y * 100}%`, borderColor: color }}
                onPointerDown={(e) => beginCorner(e, it.id, k)}
              />
            ));
          })() : null}
        </div>
        <p className="wz-hint">
          {full ? `En fazla ${max} alan. ` : "Boş bir yere basıp sürükleyerek yeni alan çizin. "}
          Alanı sürükleyerek taşıyın; seçili alanın köşelerini çekerek eğik unsurlara uydurun. Seçili alanı silmek için Delete.
        </p>
      </div>

      <div className="wz-editor-list">
        <div className="wz-editor-list-head"><b>{types ? "Alanlar" : "Marka blokları"}</b><span>{items.length}/{max}</span></div>
        {items.map((it, i) => (
          <div
            key={it.id}
            className={`wz-aoi-row${sel === it.id ? " active" : ""}${hover === it.id ? " hover" : ""}`}
            onClick={() => setSel(it.id)}
            onPointerEnter={() => setHover(it.id)} onPointerLeave={() => setHover(null)}
          >
            <span className="wz-aoi-num" style={{ background: colorOf(it, i) }}>{i + 1}</span>
            <div className="wz-aoi-fields">
              {types ? (
                <select aria-label={`Alan ${i + 1} türü`} value={it.type ?? "other"} onChange={(e) => update(it.id, { type: e.target.value })}>
                  {Object.entries(types).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              ) : null}
              <input
                aria-label={`Alan ${i + 1} ${textLabel.toLowerCase()}`} placeholder={textLabel} value={it.text}
                list={suggestions ? "wz-brand-suggest" : undefined}
                onFocus={() => setSel(it.id)}
                onChange={(e) => update(it.id, { text: e.target.value })}
              />
            </div>
            {it.strength != null ? <span className="wz-aoi-str" title="YZ güç puanı">{it.strength}</span> : null}
            <button type="button" className="wz-icon-btn" aria-label={`Alan ${i + 1} sil`} onClick={(e) => { e.stopPropagation(); remove(it.id); }}>×</button>
          </div>
        ))}
        {!items.length ? <p className="wz-muted small">Henüz alan yok. Görsel üzerinde çizin ya da aşağıdan ekleyin.</p> : null}
        {suggestions ? (
          <>
            <datalist id="wz-brand-suggest">{suggestions.map((s) => <option key={s} value={s} />)}</datalist>
            {sel && !types ? (
              <div className="wz-quick">
                <span>Seçili alana marka:</span>
                {suggestions.map((s) => <button key={s} type="button" className="wz-pill" onClick={() => update(sel, { text: s })}>{s}</button>)}
              </div>
            ) : null}
          </>
        ) : null}
        <button type="button" className="wz-btn ghost small" onClick={add} disabled={full}>+ Alan ekle</button>
      </div>
    </div>
  );
}
