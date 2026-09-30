import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const cards = [
  ["Benchmark", "What makes packaging stand out on shelf?", "A practical framework for separating attention, distinctiveness and product clarity."],
  ["Research", "Why packaging should not be judged in isolation", "The competitive shelf changes what shoppers notice and how quickly a brand registers."],
  ["Methodology", "The 5m / 3m / 1m rule", "How distance changes the job your packaging communication needs to perform."],
  ["Case Study", "Before / after packaging optimization", "How a structured diagnosis can turn visual issues into concrete design actions."],
];

export default function InsightsPage() {
  return (
    <>
      <SiteHeader />
      <main className="pa-main">
        <section className="container pa-page-hero">
          <div className="pa-kicker">Insights</div>
          <h1>Packaging performance, explained.</h1>
          <p>Research, benchmark thinking and practical methods for teams that want stronger packaging decisions.</p>
        </section>
        <section className="container pa-insights-grid">
          {cards.map(([tag, title, body]) => (
            <article key={title}><span>{tag}</span><h2>{title}</h2><p>{body}</p><b>Coming soon</b></article>
          ))}
        </section>
        <section className="container pa-wide-cta">
          <div><span>Prototype content hub</span><h2>Turn Pack Analytic into a category authority.</h2></div>
          <Link href="/methodology" className="pa-button pa-button-ghost">Explore 5SE™</Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
