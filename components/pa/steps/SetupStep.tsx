"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/pa/client";
import { CATEGORY_GROUPS, CHANNELS } from "@/lib/pa/categories";
import type { GoalId } from "@/lib/pa/engine";
import { StepFooter, type Wiz } from "../shared";

const GOAL_HELP: Record<GoalId, string> = {
  new: "Yeni bir ambalajı rakipleri ve raf ortamıyla test et, öneri al, optimize et.",
  refresh: "Mevcut ambalajın yenilenmiş halini test et; eski tasarımla süreklilik de ölçülür.",
  competitors: "Yalnızca iki rakip ambalajı ölç ve karşılaştır.",
  shelf: "Yalnızca 3 raf görselinde markaların dikkat payını ölç.",
};

export function SetupStep({ w, locked }: { w: Wiz; locked: boolean }) {
  const p = w.project;
  const [brands, setBrands] = useState<string[]>([]);
  const set = (k: keyof typeof p, v: string) => w.setProject({ ...p, [k]: v });

  useEffect(() => {
    api<Array<{ project: { brand: string } }>>("/api/analyses")
      .then((l) => setBrands([...new Set(l.map((a) => a.project.brand).filter(Boolean))]))
      .catch(() => undefined);
  }, []);

  const missing = [!p.name.trim() && "proje adı", !p.brand.trim() && "marka", !p.category.trim() && "kategori"].filter(Boolean) as string[];

  return (
    <section className="wz-step">
      <header className="wz-step-head">
        <h2>Proje Kurulumu</h2>
        <p>Analizin amacını ve ürün bilgisini girin. Marka adı Raf Testi&apos;nde eşleşme anahtarıdır; ambalajdaki logo ile aynı yazımı kullanın.</p>
      </header>

      <fieldset className="wz-goals" disabled={locked}>
        <legend>Ne yapmak istiyorsunuz?</legend>
        {(Object.entries(w.engine.flows) as Array<[GoalId, { label: string; steps: string[] }]>).map(([k, f]) => (
          <label key={k} className={`wz-goal${p.goal === k ? " on" : ""}`}>
            <input type="radio" name="goal" value={k} checked={p.goal === k} onChange={() => set("goal", k)} />
            <b>{f.label}</b>
            <span>{GOAL_HELP[k]}</span>
            <small>{f.steps.length} adım</small>
          </label>
        ))}
      </fieldset>

      <div className="wz-panel">
        <div className="wz-form">
          <label className="wz-field"><span>Proje adı *</span>
            <input id="p-name" value={p.name} onChange={(e) => set("name", e.target.value)} placeholder="Örn. 2027 yaz yenilemesi" autoComplete="off" />
          </label>
          <div className="wz-field"><label htmlFor="p-brand"><span>Marka *</span></label>
            <input id="p-brand" value={p.brand} disabled={locked} onChange={(e) => set("brand", e.target.value)} placeholder="Ambalajdaki logo yazımıyla" autoComplete="off" />
            {brands.length && !locked ? (
              <div className="wz-quick"><span>Önceki markalar:</span>{brands.slice(0, 8).map((b) => <button key={b} type="button" className={`wz-pill${b === p.brand ? " on" : ""}`} onClick={() => set("brand", b)}>{b}</button>)}</div>
            ) : null}
          </div>
          <CategoryPicker value={p.category} onChange={(v) => set("category", v)} />
          <label className="wz-field"><span>Satış kanalı</span>
            <select id="p-channel" value={p.channel} onChange={(e) => set("channel", e.target.value)}>
              {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
        </div>
      </div>

      <StepFooter note={missing.length ? `Eksik: ${missing.join(", ")}` : undefined}>
        <button type="button" className="wz-btn" disabled={missing.length > 0} onClick={w.next}>Devam</button>
      </StepFooter>
    </section>
  );
}

// Aranabilir kategori seçici: gruplu öneri listesi, serbest yazım da olur.
function CategoryPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);

  const q = value.trim().toLocaleLowerCase("tr");
  const groups = useMemo(() => CATEGORY_GROUPS
    .map((g) => ({ ...g, items: g.items.filter((i) => !q || i.toLocaleLowerCase("tr").includes(q) || g.group.toLocaleLowerCase("tr").includes(q)) }))
    .filter((g) => g.items.length), [q]);
  const flat = groups.flatMap((g) => g.items.map((i) => ({ group: g.group, item: i })));

  useEffect(() => {
    const close = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  const pick = (g: string, i: string) => { onChange(`${g} › ${i}`); setOpen(false); };
  const exact = CATEGORY_GROUPS.some((g) => g.items.some((i) => `${g.group} › ${i}` === value));

  return (
    <div className="wz-field wz-combo" ref={box}>
      <label htmlFor="p-cat"><span>Kategori *</span></label>
      <input
        id="p-cat" value={value} placeholder="Ara: ayran, deterjan, cips…" autoComplete="off"
        role="combobox" aria-expanded={open} aria-controls="p-cat-list"
        onFocus={() => setOpen(true)}
        onChange={(e) => { onChange(e.target.value); setOpen(true); setActive(0); }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => Math.min(flat.length - 1, a + 1)); }
          if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
          if (e.key === "Enter" && open && flat[active]) { e.preventDefault(); pick(flat[active].group, flat[active].item); }
          if (e.key === "Escape") setOpen(false);
        }}
      />
      <small>{exact ? "Listeden seçildi." : value.trim() ? "Listede yoksa yazdığınız kategori kullanılır." : "Listeden seçin ya da kendi kategorinizi yazın."}</small>
      {open && flat.length && !exact ? (
        <div className="wz-combo-list" id="p-cat-list" role="listbox">
          {groups.map((g) => (
            <div key={g.group} className="wz-combo-group">
              <b>{g.group}</b>
              <div>
                {g.items.map((i) => {
                  const idx = flat.findIndex((f) => f.group === g.group && f.item === i);
                  return (
                    <button key={i} type="button" role="option" aria-selected={idx === active} className={idx === active ? "on" : ""}
                      onPointerEnter={() => setActive(idx)} onClick={() => pick(g.group, i)}>{i}</button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
