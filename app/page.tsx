import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const valueProps = [
  ["Compete Better", "Test your packaging against real competitors and see whether it can win attention, recognition and clarity on shelf."],
  ["Reduce Risk", "Find performance problems before print, production or launch commitments turn them into expensive mistakes."],
  ["Optimize Faster", "Move from data to prioritized design actions without waiting weeks for every research iteration."],
];

const methodology = [
  ["01", "Distinctiveness", "Does the pack look recognizably different from competitors?"],
  ["02", "Consistency", "Does it preserve the brand's visual DNA?"],
  ["03", "Product Clarity", "Can shoppers quickly understand product and benefit?"],
  ["04", "Attention & Stand-out", "Does it attract attention and compete on shelf?"],
  ["05", "Consumer Distance", "Does 5m → 3m → 1m communication work?"],
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="pa-main">
        <section className="container pa-hero">
          <div className="pa-hero-copy">
            <div className="pa-kicker">Packaging Performance Intelligence</div>
            <h1>Build packaging that <em>wins at shelf.</em></h1>
            <p>
              Test your packaging against competitors, identify what limits its performance,
              and optimize it before launch.
            </p>
            <div className="pa-hero-actions">
              <Link href="/analyze" className="pa-button">Analyze Your Pack</Link>
              <Link href="/how-it-works" className="pa-button pa-button-ghost">See How It Works</Link>
            </div>
            <div className="pa-hero-proof">
              <span>Faster testing</span><i />
              <span>Packaging-specific</span><i />
              <span>Actionable diagnosis</span>
            </div>
          </div>

          <div className="pa-hero-demo" aria-label="Pack Analytic result preview">
            <div className="pa-demo-top">
              <div><span>Pack Analytic Score</span><strong>78</strong><small>/100</small></div>
              <b>Competitive shelf test</b>
            </div>
            <div className="pa-shelf-stage">
              <div className="pa-pack competitor"><span>RIVAL A</span><strong>31%</strong></div>
              <div className="pa-pack main-pack"><span>YOUR PACK</span><strong>42%</strong><i className="pa-heat h1" /><i className="pa-heat h2" /></div>
              <div className="pa-pack competitor second"><span>RIVAL B</span><strong>27%</strong></div>
            </div>
            <div className="pa-demo-metrics">
              <div><span>Distinctiveness</span><strong>82</strong></div>
              <div><span>Product Clarity</span><strong>71</strong></div>
              <div><span>Attention</span><strong>84</strong></div>
            </div>
            <div className="pa-demo-finding">
              <span>Priority issue</span>
              <p>Main benefit loses visibility at 1m. Increase message hierarchy before launch.</p>
            </div>
          </div>
        </section>

        <section className="pa-trust-strip">
          <div className="container">
            <span>Research thinking</span><b>+</b><span>AI-powered analysis</span><b>+</b><span>Packaging methodology</span><b>=</b><strong>Better shelf decisions</strong>
          </div>
        </section>

        <section className="container pa-problem">
          <div className="pa-section-label">The problem</div>
          <div className="pa-problem-grid">
            <h2>Packaging decisions are still made with too much uncertainty.</h2>
            <div>
              <p>Brands want more competitive packaging, but traditional research is often too slow and expensive for every design iteration.</p>
              <p>General AI tools can be fast, but they are not built around the specific job packaging needs to do on shelf.</p>
              <strong>Brands still go to shelf partially blind.</strong>
            </div>
          </div>
        </section>

        <section className="container pa-values">
          <div className="pa-section-head">
            <div><span>The value</span><h2>Compete better. Reduce risk. Optimize faster.</h2></div>
            <p>Pack Analytic sits between design and research — giving teams faster evidence without removing strategic judgment.</p>
          </div>
          <div className="pa-value-grid">
            {valueProps.map(([title, body], i) => (
              <article key={title}><span>0{i + 1}</span><h3>{title}</h3><p>{body}</p></article>
            ))}
          </div>
        </section>

        <section className="pa-dark-band">
          <div className="container">
            <div className="pa-section-head inverse">
              <div><span>How it works</span><h2>Measure. Diagnose. Improve. Verify.</h2></div>
              <Link href="/how-it-works" className="pa-text-link">Explore the workflow →</Link>
            </div>
            <div className="pa-process">
              {[
                ["Measure", "Analyze the pack alone and against competitors."],
                ["Diagnose", "Find what is limiting attention, clarity or distinctiveness."],
                ["Improve", "Turn findings into prioritized design actions."],
                ["Verify", "Re-test the optimized design and compare the result."],
              ].map(([title, body], i) => (
                <article key={title}><b>{i + 1}</b><h3>{title}</h3><p>{body}</p></article>
              ))}
            </div>
          </div>
        </section>

        <section className="container pa-method-section">
          <div className="pa-section-head">
            <div><span>Powered by 5SE™</span><h2>A methodology built for packaging performance.</h2></div>
            <p>We evaluate packaging as a shopper experiences it: competing for attention, recognition, understanding and action.</p>
          </div>
          <div className="pa-method-grid">
            {methodology.map(([n, title, body]) => (
              <article key={title}><span>{n}</span><h3>{title}</h3><p>{body}</p></article>
            ))}
          </div>
          <Link href="/methodology" className="pa-text-link">Explore the 5SE™ methodology →</Link>
        </section>

        <section className="container pa-competitive">
          <div className="pa-competitive-copy">
            <div className="pa-section-label">Competitive Shelf Intelligence</div>
            <h2>Packaging does not compete on a screen. It competes on a shelf.</h2>
            <p>Pack Analytic compares your design with competitors so you can see whether your brand registers, your product is understood and your message survives the shelf.</p>
          </div>
          <div className="pa-shelf-visual">
            <div><span>A</span></div><div className="active"><span>YOUR PACK</span><b>+26%</b></div><div><span>B</span></div>
            <i className="ring r1" /><i className="ring r2" /><i className="ring r3" />
          </div>
        </section>

        <section className="container pa-action-section">
          <div className="pa-action-card">
            <span>From insight to action</span>
            <h2>Don't just measure your packaging. Improve it.</h2>
            <p>Pack Analytic tells you what is wrong, why it matters and what to change — then helps verify whether the new direction performs better.</p>
            <div className="pa-action-flow"><b>What is wrong</b><i>→</i><b>Why it matters</b><i>→</i><b>What to change</b></div>
          </div>
          <div className="pa-before-after">
            <div><span>Original</span><strong>67</strong><small>Performance score</small></div>
            <i>→</i>
            <div className="after"><span>Optimized</span><strong>81</strong><small>Re-tested result</small></div>
          </div>
        </section>

        <section className="container pa-final-cta">
          <div className="pa-kicker">From design uncertainty to shelf confidence.</div>
          <h2>Stop guessing what will work on shelf.</h2>
          <p>Test it. Understand it. Improve it.</p>
          <Link href="/analyze" className="pa-button">Analyze Your Pack</Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
