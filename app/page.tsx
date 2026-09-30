import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const pillars = [
  ["01", "Compete Better", "See how your packaging performs against the designs shoppers actually see beside it."],
  ["02", "Reduce Risk", "Identify weak points before print, production and launch make them expensive."],
  ["03", "Optimize Faster", "Turn data into clear design actions without waiting for a full research cycle."],
];

const methodology = [
  ["Distinctiveness", "82"],
  ["Consistency", "76"],
  ["Product Clarity", "71"],
  ["Attention", "84"],
  ["Distance", "68"],
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="pa-main pa2-main">
        <section className="container pa2-hero">
          <div className="pa2-copy">
            <div className="pa2-kicker"><i /> Packaging Performance Intelligence</div>
            <h1>Make packaging <span>perform better</span> before it reaches the shelf.</h1>
            <p>
              Pack Analytic tests your pack against competitors, diagnoses what limits its
              performance, and turns the findings into clearer design decisions.
            </p>
            <div className="pa2-actions">
              <Link href="/analyze" className="pa2-primary">Analyze Your Pack <b>↗</b></Link>
              <Link href="/how-it-works" className="pa2-secondary">See how it works</Link>
            </div>
            <div className="pa2-meta">
              <span>Fast testing</span><span>Competitive benchmark</span><span>Actionable diagnosis</span>
            </div>
          </div>

          <div className="pa2-console">
            <div className="pa2-console-head">
              <div>
                <span>PROJECT</span>
                <strong>Orange Juice / Concept 04</strong>
              </div>
              <div className="pa2-live"><i /> ANALYSIS READY</div>
            </div>

            <div className="pa2-console-grid">
              <div className="pa2-score-panel">
                <span>PACK ANALYTIC SCORE</span>
                <div className="pa2-score-ring">
                  <svg viewBox="0 0 140 140" aria-hidden="true">
                    <circle cx="70" cy="70" r="57" />
                    <circle className="progress" cx="70" cy="70" r="57" />
                  </svg>
                  <strong>78</strong>
                  <small>/100</small>
                </div>
                <p>Strong shelf potential. One critical communication issue remains.</p>
              </div>

              <div className="pa2-shelf-panel">
                <div className="pa2-panel-label"><span>COMPETITIVE SHELF</span><b>+26% vs equal share</b></div>
                <div className="pa2-shelf">
                  <div className="pa2-mini-pack rival"><span>RIVAL A</span><b>31%</b></div>
                  <div className="pa2-mini-pack hero-pack">
                    <span>YOUR PACK</span><b>42%</b>
                    <i className="heat heat-a" /><i className="heat heat-b" />
                  </div>
                  <div className="pa2-mini-pack rival two"><span>RIVAL B</span><b>27%</b></div>
                </div>
              </div>
            </div>

            <div className="pa2-metric-row">
              {methodology.map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                  <i><b style={{ width: value + "%" }} /></i>
                </div>
              ))}
            </div>

            <div className="pa2-alert">
              <span>01 / PRIORITY</span>
              <p>Main benefit loses visibility at close range. Simplify the lower communication zone and increase claim hierarchy.</p>
              <b>View diagnosis →</b>
            </div>
          </div>
        </section>

        <section className="pa2-system-line">
          <div className="container">
            <span>Visual Attention</span><i>×</i><span>Shelf Context</span><i>×</i><span>5SE™ Methodology</span><i>×</i><strong>AI Diagnosis</strong>
          </div>
        </section>

        <section className="container pa2-problem">
          <div className="pa2-index">01</div>
          <div className="pa2-problem-copy">
            <div className="pa2-kicker"><i /> The problem</div>
            <h2>Packaging is too important to approve by instinct alone.</h2>
          </div>
          <div className="pa2-problem-body">
            <p>Brands want packaging that performs better than competitors, but traditional research is often too slow and costly for every design iteration.</p>
            <p>Fast AI tools exist, but most are not built around the specific questions packaging must answer on shelf.</p>
            <strong>Pack Analytic fills the gap between design and research.</strong>
          </div>
        </section>

        <section className="container pa2-pillar-section">
          <div className="pa2-section-head">
            <div>
              <div className="pa2-kicker"><i /> Business value</div>
              <h2>More confidence. Less guesswork.</h2>
            </div>
            <p>Built for teams that need stronger packaging decisions without slowing the design process down.</p>
          </div>

          <div className="pa2-pillars">
            {pillars.map(([n, title, body]) => (
              <article key={title}>
                <div className="pa2-card-top"><span>{n}</span><i>↗</i></div>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="pa2-process-band">
          <div className="container">
            <div className="pa2-section-head light">
              <div>
                <div className="pa2-kicker"><i /> Closed-loop optimization</div>
                <h2>Measure. Diagnose. Improve. Verify.</h2>
              </div>
              <Link href="/how-it-works" className="pa2-inline-link">Explore workflow ↗</Link>
            </div>
            <div className="pa2-process-track">
              {[
                ["01","MEASURE","Your pack + competitors"],
                ["02","DIAGNOSE","Why it wins or loses"],
                ["03","IMPROVE","Prioritized design action"],
                ["04","VERIFY","Re-test the new direction"],
              ].map(([n,t,b]) => (
                <article key={t}><span>{n}</span><h3>{t}</h3><p>{b}</p></article>
              ))}
            </div>
          </div>
        </section>

        <section className="container pa2-method">
          <div className="pa2-method-copy">
            <div className="pa2-kicker"><i /> Powered by 5SE™</div>
            <h2>One framework for the five jobs packaging must do.</h2>
            <p>Pack Analytic evaluates packaging as shoppers experience it: fighting for attention, recognition, understanding and preference in a competitive environment.</p>
            <Link href="/methodology" className="pa2-inline-link">Explore methodology ↗</Link>
          </div>
          <div className="pa2-method-board">
            {[
              ["01","Distinctiveness","Be recognizably different"],
              ["02","Consistency","Preserve visual brand assets"],
              ["03","Product Clarity","Explain what it is, fast"],
              ["04","Attention & Stand-out","Win the first look"],
              ["05","Consumer Distance","Work from 5m → 3m → 1m"],
            ].map(([n,t,b]) => (
              <div key={t}><span>{n}</span><strong>{t}</strong><p>{b}</p></div>
            ))}
          </div>
        </section>

        <section className="container pa2-compare">
          <div className="pa2-compare-visual">
            <div className="pa2-ruler"><span>5m</span><span>3m</span><span>1m</span></div>
            <div className="pa2-pack-row">
              <div className="pack-box muted"><small>RIVAL A</small><b>31%</b></div>
              <div className="pack-box focus"><small>YOUR PACK</small><b>42%</b><em>+26%</em></div>
              <div className="pack-box muted alt"><small>RIVAL B</small><b>27%</b></div>
            </div>
          </div>
          <div className="pa2-compare-copy">
            <div className="pa2-kicker"><i /> Competitive Shelf Intelligence</div>
            <h2>Packaging does not compete on a screen.</h2>
            <p>It competes next to other packs, under time pressure, at different viewing distances. Pack Analytic evaluates that context instead of treating your design as an isolated artwork.</p>
          </div>
        </section>

        <section className="container pa2-action">
          <div>
            <div className="pa2-kicker"><i /> From insight to action</div>
            <h2>Don't stop at the score.</h2>
            <p>Understand what is wrong, why it matters and what to change. Then re-test the new direction to see whether it actually improved.</p>
          </div>
          <div className="pa2-before-after">
            <article><span>ORIGINAL</span><strong>67</strong><small>Performance score</small></article>
            <i>→</i>
            <article className="optimized"><span>OPTIMIZED</span><strong>81</strong><small>Re-tested result</small></article>
          </div>
        </section>

        <section className="container pa2-final">
          <span>FROM DESIGN UNCERTAINTY TO SHELF CONFIDENCE</span>
          <h2>Stop guessing what will work on shelf.</h2>
          <p>Test it. Understand it. Improve it.</p>
          <Link href="/analyze" className="pa2-primary">Analyze Your Pack <b>↗</b></Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
