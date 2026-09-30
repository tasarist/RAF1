import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const steps = [
  ["01", "Measure", "Upload your pack and competitors. Pack Analytic evaluates visual attention, shelf performance, distinctiveness, clarity and distance hierarchy."],
  ["02", "Diagnose", "The system explains why the pack is winning or losing and separates critical issues from secondary opportunities."],
  ["03", "Improve", "Turn the diagnosis into prioritized design actions and one focused optimization direction."],
  ["04", "Verify", "Re-test the optimized design against the original and competitors to see whether performance improved."],
];

export default function HowItWorksPage() {
  return (
    <>
      <SiteHeader />
      <main className="pa-main">
        <section className="container pa-page-hero">
          <div className="pa-kicker">How It Works</div>
          <h1>Measure. Diagnose. Improve. Verify.</h1>
          <p>A closed-loop workflow that brings research discipline into the speed of design.</p>
        </section>

        <section className="container pa-process-list">
          {steps.map(([n, title, body]) => (
            <article key={title}>
              <span className="pa-step-number">{n}</span>
              <div><h2>{title}</h2><p>{body}</p></div>
              <div className="pa-step-signal"><i /><i /><i /></div>
            </article>
          ))}
        </section>

        <section className="container pa-proof-band">
          <div><span>Original</span><strong>67</strong></div>
          <i>→</i>
          <div className="active"><span>Optimized</span><strong>81</strong></div>
          <p>Before / after validation turns design improvement into something you can verify, not just debate.</p>
        </section>

        <section className="container pa-wide-cta">
          <div><span>Start with three images</span><h2>Your pack. Two competitors. One clear decision.</h2></div>
          <Link href="/analyze" className="pa-button">Start Analysis</Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
