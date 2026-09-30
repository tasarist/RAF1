import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="pa-footer">
      <div className="container">
        <div className="pa-footer-top">
          <div>
            <div className="pa-logo pa-footer-logo">
              <span className="pa-logo-mark"><i>P</i><i>A</i></span>
              <span>Pack Analytic</span>
            </div>
            <p>Packaging Performance Intelligence for better decisions before the shelf.</p>
          </div>
          <div className="pa-footer-links">
            <div><strong>Platform</strong><Link href="/product">Product</Link><Link href="/how-it-works">How It Works</Link><Link href="/methodology">5SE™ Methodology</Link></div>
            <div><strong>Use Cases</strong><Link href="/solutions">Solutions</Link><Link href="/insights">Insights</Link><Link href="/analyze">Analyze Your Pack</Link></div>
          </div>
        </div>
        <div className="pa-footer-bottom">
          <span>© 2026 Pack Analytic</span>
          <span>packanalytic.com · Prototype</span>
        </div>
      </div>
    </footer>
  );
}
