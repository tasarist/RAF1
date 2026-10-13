"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/pa/client";
import type { GoalId } from "@/lib/pa/engine";
import type { Wiz } from "../shared";

export function SetupStep({ w, locked }: { w: Wiz; locked: boolean }) {
  const p = w.project;
  const [brands, setBrands] = useState<string[]>([]);
  const set = (k: keyof typeof p, v: string) => w.setProject({ ...p, [k]: v });

  useEffect(() => {
    api<Array<{ project: { brand: string } }>>("/api/analyses")
      .then((l) => setBrands([...new Set(l.map((a) => a.project.brand).filter(Boolean))]))
      .catch(() => undefined);
  }, []);

  const valid = p.name.trim() && p.brand.trim() && p.category.trim();

  return (
    <section className="wz-step">
      <header className="wz-step-head">
        <h2>Proje Kurulumu</h2>
        <p>Marka adı Raf Testi&apos;nde eşleşme anahtarıdır; ambalajdaki logo ile aynı yazımı kullanın.</p>
      </header>
      <div className="wz-form">
        <label className="wz-field"><span>Proje adı *</span><input id="p-name" value={p.name} onChange={(e) => set("name", e.target.value)} placeholder="Örn. 2027 yaz yenilemesi" /></label>
        <label className="wz-field"><span>Marka *</span><input id="p-brand" value={p.brand} disabled={locked} onChange={(e) => set("brand", e.target.value)} list="wz-brands" placeholder="Örn. Pınar" />
          {brands.length ? <small>Mevcut markalarınız: {brands.join(", ")}</small> : null}
          <datalist id="wz-brands">{brands.map((b) => <option key={b} value={b} />)}</datalist>
        </label>
        <label className="wz-field"><span>Kategori *</span><input id="p-cat" value={p.category} onChange={(e) => set("category", e.target.value)} placeholder="Örn. Ayran 1 L" /></label>
        <label className="wz-field"><span>Kanal</span>
          <select id="p-channel" value={p.channel} onChange={(e) => set("channel", e.target.value)}>
            <option value="Zincir market">Zincir market</option>
            <option value="İndirim marketi">İndirim marketi</option>
            <option value="Geleneksel kanal">Geleneksel kanal</option>
            <option value="E-ticaret">E-ticaret</option>
          </select>
        </label>
      </div>
      <fieldset className="wz-goals" disabled={locked}>
        <legend>Analiz amacı</legend>
        {(Object.entries(w.engine.flows) as Array<[GoalId, { label: string; steps: string[] }]>).map(([k, f]) => (
          <label key={k} className={`wz-goal${p.goal === k ? " on" : ""}`}>
            <input type="radio" name="goal" value={k} checked={p.goal === k} onChange={() => set("goal", k)} />
            <b>{f.label}</b>
            <small>{f.steps.map((s) => w.engine.stepLabels[s as keyof typeof w.engine.stepLabels]).join(" → ")}</small>
          </label>
        ))}
      </fieldset>
      <div className="wz-actions"><button type="button" className="wz-btn" disabled={!valid} onClick={w.next}>Devam</button></div>
    </section>
  );
}
