import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const solutions = [
  ["New Packaging Design", "Test new packaging before print, production and launch commitments are made."],
  ["Packaging Redesign", "Compare the redesign with the current pack and see whether the change really improves shelf performance."],
  ["Competitor Benchmarking", "Understand where your pack is ahead, where it blends in and what competitors are doing better."],
  ["Design Optimization", "Translate research signals into prioritized design actions and one improved direction."],
  ["Portfolio / SKU Consistency", "Evaluate whether a product family works as one recognizable brand system without becoming repetitive."],
  ["Agency Validation", "Give design teams a faster way to validate work before client presentation or final approval."],
];

export default function SolutionsPage() {
  return (
    <>
      <SiteHeader />
      <main className="pa-main">
        <section className="container pa-page-hero">
          <div className="pa-kicker">Solutions</div>
          <h1>Use Pack Analytic wherever packaging decisions carry risk.</h1>
          <p>From early design development to redesign validation, competitive benchmarking and portfolio decisions.</p>
        </section>
        <section className="container pa-solution-grid">
          {solutions.map(([title, body], i) => (
            <article key={title}>
              <span>0{i + 1}</span><h2>{title}</h2><p>{body}</p>
            </article>
          ))}
        </section>
        <section className="container pa-wide-cta">
          <div><span>Packaging decisions, made earlier</span><h2>Reduce uncertainty before the shelf.</h2></div>
          <Link href="/analyze" className="pa-button">Analyze Your Pack</Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
