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
            <p>Rafa çıkmadan önce daha güçlü ambalaj kararları için Ambalaj Performans Zekâsı.</p>
          </div>
          <div className="pa-footer-links">
            <div><strong>Platform</strong><Link href="/product">Ürün</Link><Link href="/how-it-works">Nasıl Çalışır</Link><Link href="/methodology">5SE™ Metodolojisi</Link></div>
            <div><strong>Kullanım Alanları</strong><Link href="/solutions">Çözümler</Link><Link href="/insights">İçgörüler</Link><Link href="/analyze">Ambalajını Analiz Et</Link></div>
          </div>
        </div>
        <div className="pa-footer-bottom">
          <span>© 2026 Pack Analytic</span>
          <span>packanalytic.com · Prototip</span>
        </div>
      </div>
    </footer>
  );
}
