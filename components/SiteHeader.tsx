import Link from "next/link";

const nav = [
  ["Ürün", "/product"],
  ["Nasıl Çalışır", "/how-it-works"],
  ["Metodoloji", "/methodology"],
  ["Çözümler", "/solutions"],
  ["İçgörüler", "/insights"],
];

export function SiteHeader() {
  return (
    <header className="pa-header">
      <div className="container pa-header-inner">
        <Link href="/" className="pa-logo" aria-label="Pack Analytic ana sayfa">
          <span className="pa-logo-mark"><i>P</i><i>A</i></span>
          <span>Pack Analytic</span>
        </Link>
        <nav className="pa-nav" aria-label="Ana menü">
          {nav.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
        </nav>
        <div className="pa-header-actions">
          <Link href="/analyze" className="pa-button pa-button-small">Ambalajını Analiz Et</Link>
        </div>
      </div>
    </header>
  );
}
