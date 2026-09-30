import Link from "next/link";

const nav = [
  ["Product", "/product"],
  ["How It Works", "/how-it-works"],
  ["Methodology", "/methodology"],
  ["Solutions", "/solutions"],
  ["Insights", "/insights"],
];

export function SiteHeader() {
  return (
    <header className="pa-header">
      <div className="container pa-header-inner">
        <Link href="/" className="pa-logo" aria-label="Pack Analytic home">
          <span className="pa-logo-mark"><i>P</i><i>A</i></span>
          <span>Pack Analytic</span>
        </Link>
        <nav className="pa-nav" aria-label="Primary">
          {nav.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
        </nav>
        <div className="pa-header-actions">
          <Link href="/analyze" className="pa-button pa-button-small">Analyze Your Pack</Link>
        </div>
      </div>
    </header>
  );
}
