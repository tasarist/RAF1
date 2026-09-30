import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const solutions = [
  ["Yeni Ambalaj Tasarımı", "Yeni ambalajı baskı, üretim ve lansman kararı verilmeden önce test edin."],
  ["Ambalaj Yenileme", "Yeni tasarımı mevcut ambalajla karşılaştırın ve değişikliğin raf performansını gerçekten geliştirip geliştirmediğini görün."],
  ["Rakip Benchmarking", "Ambalajınızın nerede önde olduğunu, nerede rakiplere benzediğini ve rakiplerin neyi daha iyi yaptığını anlayın."],
  ["Tasarım Optimizasyonu", "Araştırma sinyallerini önceliklendirilmiş tasarım aksiyonlarına ve geliştirilmiş tek bir yöne dönüştürün."],
  ["Portföy / SKU Tutarlılığı", "Ürün ailesinin tekrara düşmeden, tek ve tanınabilir bir marka sistemi olarak çalışıp çalışmadığını değerlendirin."],
  ["Ajans Doğrulaması", "Tasarım ekiplerinin müşteri sunumu veya final onayı öncesinde çalışmalarını daha hızlı doğrulamasını sağlayın."],
];

export default function SolutionsPage() {
  return (
    <>
      <SiteHeader />
      <main className="pa-main">
        <section className="container pa-page-hero">
          <div className="pa-kicker">Çözümler</div>
          <h1>Ambalaj kararının risk taşıdığı her noktada Pack Analytic'i kullanın.</h1>
          <p>Erken tasarım geliştirmeden redesign doğrulamasına, rakip kıyaslamasından portföy kararlarına kadar.</p>
        </section>
        <section className="container pa-solution-grid">
          {solutions.map(([title, body], i) => (
            <article key={title}>
              <span>0{i + 1}</span><h2>{title}</h2><p>{body}</p>
            </article>
          ))}
        </section>
        <section className="container pa-wide-cta">
          <div><span>Ambalaj kararlarını daha erken verin</span><h2>Rafa çıkmadan önce belirsizliği azaltın.</h2></div>
          <Link href="/analyze" className="pa-button">Ambalajını Analiz Et</Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
