import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const cards = [
  ["Benchmark", "Bir ambalajı rafta öne çıkaran nedir?", "Dikkat, özgünlük ve ürün netliğini birbirinden ayırmak için pratik bir çerçeve."],
  ["Araştırma", "Ambalaj neden tek başına değerlendirilmemeli?", "Rekabetçi raf ortamı tüketicinin neyi fark ettiğini ve markayı ne kadar hızlı algıladığını değiştirir."],
  ["Metodoloji", "5 m / 3 m / 1 m kuralı", "Mesafe değiştikçe ambalaj iletişiminin yapması gereken işin nasıl değiştiğini anlatır."],
  ["Vaka Çalışması", "Ambalaj optimizasyonunda önce / sonra", "Yapılandırılmış bir teşhisin görsel sorunları nasıl somut tasarım aksiyonlarına dönüştürdüğünü gösterir."],
];

export default function InsightsPage() {
  return (
    <>
      <SiteHeader />
      <main className="pa-main">
        <section className="container pa-page-hero">
          <div className="pa-kicker">İçgörüler</div>
          <h1>Ambalaj performansını daha iyi anlayın.</h1>
          <p>Daha güçlü ambalaj kararları almak isteyen ekipler için araştırmalar, benchmark bakışı ve pratik yöntemler.</p>
        </section>
        <section className="container pa-insights-grid">
          {cards.map(([tag, title, body]) => (
            <article key={title}><span>{tag}</span><h2>{title}</h2><p>{body}</p><b>Yakında</b></article>
          ))}
        </section>
        <section className="container pa-wide-cta">
          <div><span>İçerik ve araştırma merkezi</span><h2>Pack Analytic'i ambalaj performansı konusunda bir referans noktası haline getirin.</h2></div>
          <Link href="/methodology" className="pa-button pa-button-ghost">5SE™'yi İncele</Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
