import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const dimensions = [
  ["01", "Özgünlük", "Ambalaj rakiplerine göre ne kadar farklı, ayırt edilebilir ve tanınabilir?"],
  ["02", "Tutarlılık", "Tasarım markanın görsel DNA'sını zaman içinde ve ürün portföyünde koruyup güçlendiriyor mu?"],
  ["03", "Ürün Netliği", "Tüketici kategori, varyant ve temel faydayı hızlıca anlayabiliyor mu?"],
  ["04", "Dikkat ve Raf Etkisi", "Ambalaj tek başına dikkat çekiyor ve rafta rakipleriyle etkili biçimde rekabet edebiliyor mu?"],
  ["05", "Tüketici Mesafesi", "İletişim sırası doğru çalışıyor mu: 5 m marka bloğu, 3 m logo, 1 m satın alma mesajı?"],
];

export default function MethodologyPage() {
  return (
    <>
      <SiteHeader />
      <main className="pa-main">
        <section className="container pa-page-hero">
          <div className="pa-kicker">5SE™ Metodolojisi</div>
          <h1>Raf için geliştirilmiş bir ambalaj performans çerçevesi.</h1>
          <p>5SE™, dikkat sinyallerini, rekabet bağlamını ve ambalaj tasarımı prensiplerini yapılandırılmış bir teşhise dönüştüren Pack Analytic'e ait metodolojidir.</p>
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
          <div className="pa-kicker">Temel prensip</div>
          <h2>Ambalajı tüketicinin deneyimlediği şekilde değerlendiriyoruz.</h2>
          <p>Tasarımcının ekranındaki düz bir artwork olarak değil; fark edilmesi, tanınması, anlaşılması ve satın alma kararını desteklemesi gereken rekabetçi bir raf öğesi olarak.</p>
          <Link href="/product" className="pa-text-link">Ürünü incele →</Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
