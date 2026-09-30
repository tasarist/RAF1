import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const dimensions = [
  ["01", "Distinctiveness", "How different and recognizable is the pack compared with its competitors?"],
  ["02", "Consistency", "Does the design preserve and strengthen the brand's visual DNA across time and portfolio?"],
  ["03", "Product Clarity", "Can shoppers quickly understand the category, variant and core benefit?"],
  ["04", "Attention & Stand-out", "Does the pack attract attention on its own and compete effectively on shelf?"],
  ["05", "Consumer Distance", "Does the communication work in sequence: 5m brand block, 3m logo, 1m purchase message?"],
];

export default function MethodologyPage() {
  return (
    <>
      <SiteHeader />
      <main className="pa-main">
        <section className="container pa-page-hero">
          <div className="pa-kicker">5SE™ Methodology</div>
          <h1>A packaging performance framework built for the shelf.</h1>
          <p>5SE™ is Pack Analytic's proprietary framework for turning attention signals, competitive context and packaging principles into a structured diagnosis.</p>
        </section>

        <section className="container pa-methodology-stack">
          {dimensions.map(([n, title, body]) => (
            <article key={title}>
              <span>{n}</span>
              <h2>{title}</h2>
              <p>{body}</p>
              <b>0—100</b>
            </article>
          ))}
        </section>

        <section className="container pa-method-note">
          <div className="pa-kicker">A practical principle</div>
          <h2>We evaluate packaging as a shopper experiences it.</h2>
          <p>Not as a flat artwork on a designer's screen, but as a competing object that must be noticed, recognized, understood and acted on.</p>
          <Link href="/product" className="pa-text-link">Explore the product →</Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
