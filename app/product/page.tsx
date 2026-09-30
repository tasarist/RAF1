import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const capabilities = [
  ["01", "Visual Attention Analysis", "See what gets noticed first and where attention gets lost inside the pack."],
  ["02", "Competitive Shelf Test", "Evaluate your pack against real competitors instead of judging it in isolation."],
  ["03", "Distinctiveness Analysis", "Measure how clearly your visual system separates from category conventions and competitors."],
  ["04", "Product & Benefit Clarity", "Check whether shoppers can quickly understand what the product is and why it matters."],
  ["05", "5m / 3m / 1m Visibility", "Test brand block, logo recognition and purchase message at different shopper distances."],
  ["06", "AI Diagnosis", "Turn scores and attention signals into clear design problems, reasons and priorities."],
  ["07", "AI Optimization", "Generate a focused optimization direction instead of a generic list of suggestions."],
  ["08", "Re-Test", "Compare original versus optimized design and verify whether the change actually helped."],
];

export default function ProductPage() {
  return (
    <>
      <SiteHeader />
      <main className="pa-main">
        <section className="container pa-page-hero">
          <div className="pa-kicker">Product</div>
          <h1>Everything you need to improve packaging performance.</h1>
          <p>Pack Analytic combines attention data, packaging-specific methodology and AI diagnosis in one workflow built for design teams.</p>
          <Link href="/analyze" className="pa-button">Analyze Your Pack</Link>
        </section>

        <section className="container pa-capability-grid">
          {capabilities.map(([n, title, body]) => (
            <article className="pa-capability-card" key={title}>
              <span>{n}</span><h2>{title}</h2><p>{body}</p>
            </article>
          ))}
        </section>

        <section className="container pa-wide-cta">
          <div><span>From data to design action</span><h2>Not just a heatmap. A decision system.</h2></div>
          <Link href="/how-it-works" className="pa-button pa-button-ghost">See how it works</Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
