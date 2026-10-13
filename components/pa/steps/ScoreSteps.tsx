"use client";

import { useEffect, useRef, useState } from "react";
import { api, imageUrl } from "@/lib/pa/client";
import { isAttention, type Analysis, type DimKey } from "@/lib/pa/types";
import { AttentionView, Bar, MetricGrid, ShareTable } from "../AttentionView";
import { ErrorNote, ScoreScale, StepFooter, Verdict, type Wiz } from "../shared";
import { ShelfResult } from "./ShelfStep";

export const DIMS: Array<{ key: DimKey; no: string; label: string; how: string }> = [
  { key: "dba", no: "01", label: "Güçlü ayırıcı marka varlıkları", how: "YZ'nin ambalajdaki marka kodlarını (logo, renk, şekil) okuyup verdiği DBA puanı." },
  { key: "consistency", no: "02", label: "Sürekli ve tutarlı ol", how: "Varyant tutarlılığı ve eski tasarım sürekliliği puanlarının ortalaması." },
  { key: "reflect", no: "03", label: "Ürünü doğru yansıt", how: "Logo, varyant ve claim alanlarının bakış payının hedeflere (%25 / %20 / %20) yakınlığı." },
  { key: "exciting", no: "04", label: "İlgi çekici ol", how: "Raftaki dikkat payı; adil payın iki katı 100 puan sayılır." },
  { key: "consumer", no: "05", label: "Tüketici odaklı ol", how: "Görsel dikkat modelinin ambalaj geneli için verdiği Genel skor." },
];

// ── Adım 5 · Analiz ───────────────────────────────────────────────────────
export function AnalysisStep({ w }: { w: Wiz }) {
  const tasks = ["Ana SKU ölçümü doğrulanıyor", "Rakip Testi birleştiriliyor", "Raf Testi marka payı", "Marka varlıkları ve tutarlılık", "Ürünü doğru yansıtma", "5SE™ skoru"];
  const [done, setDone] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current || !w.pack) return;
    started.current = true;
    const timer = setInterval(() => setDone((d) => Math.min(tasks.length - 1, d + 1)), 350);
    api<Analysis>(`/api/analyses/${w.pack.id}/score`, { body: {} })
      .then((a) => { w.setPack(a); setTimeout(() => { clearInterval(timer); setDone(tasks.length); }, 900); })
      .catch((e: Error) => { clearInterval(timer); setError(e.message); });
    return () => clearInterval(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="wz-step">
      <header className="wz-step-head"><h2>Analiz</h2><p>Skorlar sunucuda, motor v{w.pack?.engineVersion} kurallarıyla hesaplanır.</p></header>
      <ol className="wz-progress">
        {tasks.map((t, i) => <li key={t} className={i < done ? "done" : i === done ? "run" : ""}>{t}</li>)}
      </ol>
      <ErrorNote error={error} />
      <StepFooter note={done < tasks.length && !error ? "Hesaplanıyor…" : null}><button type="button" className="wz-btn" disabled={done < tasks.length} onClick={w.next}>5SE™ Sonuçlarını gör</button></StepFooter>
    </section>
  );
}

// ── Adım 6 · 5SE™ Sonuçları ───────────────────────────────────────────────
export function ResultsStep({ w }: { w: Wiz }) {
  const a = w.pack;
  if (!a?.scores || !a.scoreDetail) return <section className="wz-step"><p>Skor henüz hesaplanmadı.</p></section>;
  const s = a.scores;
  const d = a.scoreDetail;
  const att = isAttention(a.attention?.ours) ? a.attention.ours : undefined;
  const rules = w.engine.rules;
  const rows = a.compare ?? [];
  const best = (k: DimKey | "total") => {
    const vals = rows.map((r) => (k === "total" ? r.total : r.dims[k])).filter((v): v is number => v != null);
    return vals.length ? Math.max(...vals) : null;
  };

  return (
    <section className="wz-step">
      <header className="wz-step-head"><h2>5SE™ Sonuçları</h2><p>{a.project.name} · {a.project.brand} · motor v{a.engineVersion}{att?.suspended ? " · dikkat ölçümü askıda (temsili)" : ""}</p></header>

      <div className="wz-panel">
        <ScoreScale total={s.total} verdict={s.verdict} risky={rules.thresholds.risky} ready={rules.thresholds.ready} />
        <div className="wz-bars">{DIMS.map((x) => <Bar key={x.key} label={`${x.no} ${x.label}`} value={s.dims[x.key]} />)}</div>
      </div>

      {rows.length > 1 ? (
        <div className="wz-panel">
          <h3>Rakiplerle karşılaştırma</h3>
          <div className="wz-scroll">
            <table className="wz-table">
              <thead><tr><th />{DIMS.map((x) => <th key={x.key} className="num" title={x.label}>{x.no}</th>)}<th className="num">Toplam</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.slot} className={r.slot === "ours" ? "ours" : ""}>
                    <td>{r.slot === "ours" ? "Ana SKU" : r.slot === "comp-0" ? "Rakip A" : "Rakip B"} · {r.label}</td>
                    {DIMS.map((x) => <td key={x.key} className="num">{r.dims[x.key] ?? "—"}{r.dims[x.key] != null && r.dims[x.key] === best(x.key) ? <em className="lead">önde</em> : null}</td>)}
                    <td className="num"><b>{r.total ?? "—"}</b>{r.total != null && r.total === best("total") ? <em className="lead">önde</em> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="wz-muted small">{DIMS.map((x) => `${x.no} ${x.label}`).join(" · ")}</p>
        </div>
      ) : null}

      {a.findings?.length ? (
        <div className="wz-panel"><h3>Bulgular</h3><ul className="wz-bullets">{a.findings.map((f) => <li key={f}>{f}</li>)}</ul></div>
      ) : null}

      <div className="wz-panel wz-dim">
        <DimHead no="01" label="Güçlü ayırıcı marka varlıkları" value={s.dims.dba} />
        <p className="wz-muted">{a.brandAssets?.evaluation}</p>
        <table className="wz-table">
          <thead><tr><th>Unsur</th><th>Tür</th><th className="num">Güç</th></tr></thead>
          <tbody>{a.brandAssets?.elements.map((e) => <tr key={e.id}><td>{e.text || "—"}</td><td>{w.engine.aoiTypes[e.type]}</td><td className="num">{e.strength ?? "—"}</td></tr>)}</tbody>
        </table>
      </div>

      <div className="wz-panel wz-dim">
        <DimHead no="02" label="Sürekli ve tutarlı ol" value={s.dims.consistency} />
        {a.consistency?.variant ? <p><b>Varyant tutarlılığı {a.consistency.variant.score}.</b> {a.consistency.variant.evaluation}</p> : null}
        {a.consistency?.old ? <p><b>Eski tasarım sürekliliği {a.consistency.old.score}.</b> {a.consistency.old.evaluation}</p> : null}
        {!a.consistency?.variant && !a.consistency?.old ? <p className="wz-muted">Varyant veya eski tasarım yüklenmedi; bu boyut toplama katılmadı.</p> : null}
      </div>

      <div className="wz-panel wz-dim">
        <DimHead no="03" label="Ürünü doğru yansıt" value={s.dims.reflect} />
        <table className="wz-table">
          <thead><tr><th>Tür</th><th className="num">Bakış payı</th><th className="num">Hedef</th><th className="num">Yakınlık</th></tr></thead>
          <tbody>{d.reflect.rows.map((r) => <tr key={r.type}><td>{r.label}</td><td className="num">%{r.share}</td><td className="num">%{r.target}</td><td className="num"><b>{r.closeness}</b></td></tr>)}</tbody>
        </table>
        {!d.reflect.rows.length ? <p className="wz-muted">Logo, varyant veya claim alanı işaretlenmedi.</p> : null}
      </div>

      <div className="wz-panel wz-dim">
        <DimHead no="04" label="İlgi çekici ol" value={s.dims.exciting} />
        {d.exciting.source === "shelf" && w.shelf ? (
          <>
            <p className="wz-muted">Raf payı %{d.exciting.share} · adil pay %{d.exciting.fairShare} ({d.exciting.brands} marka) · adil payın iki katı = 100</p>
            <ShelfResult shelf={w.shelf} brand={a.project.brand} />
          </>
        ) : <p className="wz-muted">Raf Testi bağlı değil; ambalajın dikkat ölçümündeki {d.exciting.source === "exciting" ? "Heyecan metriği" : "Netlik/Hatırlanma/Yaklaşma ortalaması"} kullanıldı.</p>}
      </div>

      <div className="wz-panel wz-dim">
        <DimHead no="05" label="Tüketici odaklı ol" value={s.dims.consumer} />
        {att ? (
          <div className="wz-grid2">
            <AttentionView src={imageUrl(a.id, "ours")} att={att} />
            <div className="wz-stack"><MetricGrid att={att} /><p className="wz-muted small">Bölüm skoru = Genel dikkat skoru.</p></div>
          </div>
        ) : null}
      </div>

      <StepFooter note="Sonraki adımda ölçümlere dayalı öneriler listelenir."><button type="button" className="wz-btn" onClick={w.next}>Devam: Teşhis</button></StepFooter>
    </section>
  );
}

function DimHead({ no, label, value }: { no: string; label: string; value: number | null }) {
  const how = DIMS.find((d) => d.no === no)?.how;
  const cls = value == null ? "none" : value < 55 ? "risk" : value < 75 ? "mid" : "ok";
  return (
    <div className="wz-dim-head">
      <span className="wz-no">{no}</span>
      <div><h3>{label}</h3>{how ? <p className="wz-muted small">{how}</p> : null}</div>
      <b className={`wz-dim-val ${cls}`}>{value ?? "—"}</b>
    </div>
  );
}

// ── Adım 7 · Teşhis ──────────────────────────────────────────────────────
export function DiagnosisStep({ w }: { w: Wiz }) {
  const a = w.pack!;
  const [sel, setSel] = useState<string[]>(a.selectedRecs ?? []);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    try {
      w.setPack(await api<Analysis>(`/api/analyses/${a.id}`, { method: "PATCH", body: { selectedRecs: sel } }));
      w.next();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <section className="wz-step">
      <header className="wz-step-head"><h2>Teşhis</h2><p>Öneriler ölçülen değerlerden türetildi. Uygulanacakları seçin.</p></header>
      {a.recs?.length ? (
        <div className="wz-recs">
          {a.recs.map((r) => (
            <label key={r.id} className={`wz-rec${sel.includes(r.id) ? " on" : ""}`}>
              <input type="checkbox" checked={sel.includes(r.id)} onChange={(e) => setSel((x) => (e.target.checked ? [...x, r.id] : x.filter((y) => y !== r.id)))} />
              <div>
                <div className="wz-rec-head"><span className={`wz-prio ${r.priority === "Yüksek" ? "risk" : r.priority === "Orta" ? "mid" : "ok"}`}>{r.priority}</span><b>{r.title}</b></div>
                <p>{r.detail}</p>
                <small>{r.measure}</small>
              </div>
            </label>
          ))}
        </div>
      ) : <p className="wz-muted">Tüm boyutlar hedefte; öneri yok.</p>}
      <ErrorNote error={error} />
      <StepFooter note={`${sel.length} öneri seçili`}>
        {a.recs?.length ? <button type="button" className="wz-btn ghost" onClick={() => setSel(sel.length === a.recs!.length ? [] : a.recs!.map((r) => r.id))}>{sel.length === a.recs.length ? "Seçimi temizle" : "Tümünü seç"}</button> : null}
        <button type="button" className="wz-btn" onClick={save}>Devam: Tasarımı Optimize Et</button>
      </StepFooter>
    </section>
  );
}

// ── Adım 10 · Önce / Sonra ───────────────────────────────────────────────
export function BeforeAfterStep({ w }: { w: Wiz }) {
  const a = w.pack!;
  const s = a.scores;
  const opt = isAttention(a.attention?.optimized) ? a.attention.optimized : undefined;
  const ours = isAttention(a.attention?.ours) ? a.attention.ours : undefined;
  if (!s?.after) return <section className="wz-step"><p>Optimize tasarım henüz yeniden test edilmedi.</p></section>;
  return (
    <section className="wz-step">
      <header className="wz-step-head"><h2>Önce / Sonra</h2><p>Aynı raf, aynı rakipler. Yalnızca gerçekten yeniden ölçülen boyutlar değişir; tahmin yok.</p></header>
      <div className="wz-panel">
        <div className="wz-ba-totals">
          <div><span className="wz-eyebrow">Önce</span><b className="wz-total">{s.total ?? "—"}</b><Verdict verdict={s.verdict} /></div>
          <span className="wz-arrow">→</span>
          <div><span className="wz-eyebrow">Sonra</span><b className="wz-total">{s.totalAfter ?? "—"}</b><Verdict verdict={s.verdictAfter} /></div>
        </div>
        <div className="wz-ba">
          {DIMS.map((x) => {
            const b = s.before[x.key];
            const af = s.after![x.key];
            const re = s.remeasured?.[x.key];
            const delta = b != null && af != null ? Math.round((af - b) * 10) / 10 : null;
            return (
              <div key={x.key} className="wz-ba-row">
                <span className="wz-ba-label">{x.no} {x.label}</span>
                <Bar label="Önce" value={b} />
                <Bar label="Sonra" value={af} tone="after" note={re ? undefined : "yeniden ölçülmedi · önceki değer korundu"} />
                <b className={`wz-delta ${delta == null || !re ? "" : delta > 0 ? "up" : delta < 0 ? "down" : ""}`}>{re && delta != null ? `${delta > 0 ? "+" : ""}${delta}` : "="}</b>
              </div>
            );
          })}
        </div>
      </div>
      <div className="wz-grid2">
        <div className="wz-panel"><h3>Önce</h3><AttentionView src={imageUrl(a.id, "ours")} att={ours} /></div>
        <div className="wz-panel"><h3>Sonra · v{a.optimized?.version}{a.optimized?.manual ? " (revize yükleme)" : ""}</h3><AttentionView src={imageUrl(a.id, "optimized", a.optimized?.createdAt)} att={opt} /></div>
      </div>
      <StepFooter note="Analiz tamamlandı ve hesabınızda kayıtlı."><a className="wz-btn ghost" href="/analyze">Yeni analiz</a><a className="wz-btn" href="/analyses">Analizlerime dön</a></StepFooter>
    </section>
  );
}

export { ShareTable };
