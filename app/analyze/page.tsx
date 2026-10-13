"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { CompResult, CompetitorsStep } from "@/components/pa/steps/CompetitorsStep";
import { OptimizeStep, RetestStep } from "@/components/pa/steps/OptimizeSteps";
import { PackStep } from "@/components/pa/steps/PackStep";
import { AnalysisStep, BeforeAfterStep, DiagnosisStep, ResultsStep } from "@/components/pa/steps/ScoreSteps";
import { SetupStep } from "@/components/pa/steps/SetupStep";
import { ShelfResult, ShelfStep } from "@/components/pa/steps/ShelfStep";
import { type EngineInfo, type Wiz } from "@/components/pa/shared";
import { api } from "@/lib/pa/client";
import type { StepId } from "@/lib/pa/engine";
import type { Analysis, Project } from "@/lib/pa/types";
import "./wizard.css";

const EMPTY: Project = { name: "", brand: "", category: "", goal: "new", channel: "Zincir market" };

export default function AnalyzePage() {
  const [engine, setEngine] = useState<EngineInfo | null>(null);
  const [project, setProject] = useState<Project>(EMPTY);
  const [pack, setPack] = useState<Analysis | null>(null);
  const [comp, setComp] = useState<Analysis | null>(null);
  const [shelf, setShelf] = useState<Analysis | null>(null);
  const [step, setStep] = useState<StepId>("setup");
  const [reached, setReached] = useState<StepId[]>(["setup"]);
  const [error, setError] = useState<string | null>(null);

  const steps = engine?.flows[project.goal]?.steps ?? [];
  const main = pack ?? (project.goal === "competitors" ? comp : project.goal === "shelf" ? shelf : null);

  // Açılış: motor konfigürasyonu + ?resume=<id> ile kaldığı adımdan devam.
  useEffect(() => {
    (async () => {
      try {
        setEngine(await api<EngineInfo>("/api/engine"));
        const id = new URLSearchParams(window.location.search).get("resume");
        if (!id) return;
        const a = await api<Analysis>(`/api/analyses/${id}`);
        setProject(a.project);
        if (a.kind === "pack") {
          setPack(a);
          if (a.refs?.competitors) setComp(await api<Analysis>(`/api/analyses/${a.refs.competitors}`).catch(() => null));
          if (a.refs?.shelf) setShelf(await api<Analysis>(`/api/analyses/${a.refs.shelf}`).catch(() => null));
        } else if (a.kind === "competitors") setComp(a);
        else setShelf(a);
        if (a.progress) { setStep(a.progress.step); setReached(a.progress.reached); }
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, []);

  // İlerleme kayda yazılır (yarıda kalsa bile devam edilebilir).
  useEffect(() => {
    if (!main) return;
    if (main.progress?.step === step && main.progress.reached.length === reached.length) return;
    api(`/api/analyses/${main.id}`, { method: "PATCH", body: { progress: { step, reached, updatedAt: new Date().toISOString() } } }).catch(() => undefined);
  }, [main?.id, step, reached]); // eslint-disable-line react-hooks/exhaustive-deps

  const go = useCallback((s: StepId) => {
    setStep(s);
    setReached((r) => (r.includes(s) ? r : [...r, s]));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const next = useCallback(() => {
    const i = steps.indexOf(step);
    if (i >= 0 && i < steps.length - 1) go(steps[i + 1]);
  }, [steps, step, go]);

  if (!engine) {
    return <><SiteHeader /><main className="wz container"><p className="wz-muted">{error ?? "Yükleniyor…"}</p></main></>;
  }

  const w: Wiz = { engine, project, setProject, pack, setPack, comp, setComp, shelf, setShelf, next, standalone: project.goal === "competitors" || project.goal === "shelf" };

  return (
    <>
      <SiteHeader />
      <main className="wz container">
        <div className="wz-top">
          <div>
            <span className="wz-eyebrow">Ambalajını Analiz Et · motor v{engine.version}</span>
            <h1>{project.name || "Yeni analiz"}{project.brand ? <small> · {project.brand}</small> : null}</h1>
          </div>
          <div className="wz-top-links">
            <span className="wz-badge sim" title="Görsel dikkat modeli askıda: değerler görselden türetilen temsili değerlerdir.">Dikkat modeli askıda · temsili</span>
            <Link href="/analyses" className="wz-btn ghost small">Analizlerim</Link>
          </div>
        </div>

        <nav className="wz-stepper" aria-label="Adımlar">
          {steps.map((s, i) => {
            const done = reached.includes(s) && i < steps.indexOf(step);
            return (
              <button key={s} type="button" aria-current={s === step ? "step" : undefined} className={`${s === step ? "on" : ""}${reached.includes(s) ? " reached" : ""}${done ? " done" : ""}`} disabled={!reached.includes(s)} onClick={() => go(s)}>
                <i>{done ? "✓" : i + 1}</i><span>{engine.stepLabels[s]}</span>
              </button>
            );
          })}
        </nav>

        {error ? <p className="wz-error">{error}</p> : null}

        {step === "setup" && <SetupStep w={w} locked={!!main} />}
        {step === "pack" && <PackStep w={w} />}
        {step === "competitors" && <CompetitorsStep w={w} />}
        {step === "shelf" && <ShelfStep w={w} />}
        {step === "analysis" && <AnalysisStep w={w} />}
        {step === "results" && <ResultsStep w={w} />}
        {step === "diagnosis" && <DiagnosisStep w={w} />}
        {step === "optimize" && <OptimizeStep w={w} />}
        {step === "retest" && <RetestStep w={w} />}
        {step === "beforeAfter" && <BeforeAfterStep w={w} />}
        {step === "compResult" && comp ? (
          <section className="wz-step"><header className="wz-step-head"><h2>Rakip sonucu</h2></header><CompResult comp={comp} aoiTypes={engine.aoiTypes} /><div className="wz-actions"><Link className="wz-btn" href="/analyses">Analizlerime dön</Link></div></section>
        ) : null}
        {step === "shelfResult" && shelf ? (
          <section className="wz-step"><header className="wz-step-head"><h2>Raf sonucu</h2></header><ShelfResult shelf={shelf} brand={project.brand} /><div className="wz-actions"><Link className="wz-btn" href="/analyses">Analizlerime dön</Link></div></section>
        ) : null}
      </main>
    </>
  );
}
