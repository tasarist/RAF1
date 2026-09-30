import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const capabilities = [
  ["01", "Görsel Dikkat Analizi", "İlk bakışta neyin fark edildiğini ve dikkatin ambalaj üzerinde nerede kaybolduğunu görün."],
  ["02", "Rakipli Raf Testi", "Ambalajınızı tek başına değil, gerçek rakipleriyle birlikte değerlendirin."],
  ["03", "Özgünlük Analizi", "Görsel sisteminizin kategori kodlarından ve rakiplerden ne kadar ayrıştığını ölçün."],
  ["04", "Ürün ve Fayda Netliği", "Tüketicinin ürünün ne olduğunu ve neden önemli olduğunu ne kadar hızlı anlayabildiğini kontrol edin."],
  ["05", "5 m / 3 m / 1 m Görünürlük", "Marka bloğu, logo tanınırlığı ve satın alma mesajını farklı tüketici mesafelerinde test edin."],
  ["06", "Yapay Zekâ Teşhisi", "Skorları ve dikkat sinyallerini net tasarım sorunlarına, nedenlere ve önceliklere dönüştürün."],
  ["07", "Yapay Zekâ Optimizasyonu", "Genel öneriler yerine odaklı ve uygulanabilir bir tasarım geliştirme yönü oluşturun."],
  ["08", "Yeniden Test", "Orijinal ve optimize edilmiş tasarımı karşılaştırın; değişikliğin gerçekten işe yarayıp yaramadığını doğrulayın."],
];

export default function ProductPage() {
  return (
    <>
      <SiteHeader />
      <main className="pa-main">
        <section className="container pa-page-hero">
          <div className="pa-kicker">Ürün</div>
          <h1>Ambalaj performansını geliştirmek için ihtiyacınız olan her şey.</h1>
          <p>Pack Analytic; dikkat verisini, ambalaja özel metodolojiyi ve yapay zekâ teşhisini tasarım ekipleri için tek bir çalışma akışında birleştirir.</p>
          <Link href="/analyze" className="pa-button">Ambalajını Analiz Et</Link>
        </section>

        <section className="container pa-capability-grid">
          {capabilities.map(([n, title, body]) => (
            <article className="pa-capability-card" key={title}>
              <span>{n}</span><h2>{title}</h2><p>{body}</p>
            </article>
          ))}
        </section>

        <section className="container pa-wide-cta">
          <div><span>Veriden tasarım kararına</span><h2>Sadece bir ısı haritası değil. Bir karar sistemi.</h2></div>
          <Link href="/how-it-works" className="pa-button pa-button-ghost">Nasıl çalıştığını gör</Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
