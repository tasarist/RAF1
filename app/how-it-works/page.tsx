import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const steps = [
  ["01", "Ölç", "Ambalajınızı ve rakiplerini yükleyin. Pack Analytic görsel dikkat, raf performansı, özgünlük, netlik ve mesafe hiyerarşisini değerlendirir."],
  ["02", "Teşhis Et", "Sistem ambalajın neden kazandığını veya kaybettiğini açıklar; kritik sorunları ikincil fırsatlardan ayırır."],
  ["03", "Geliştir", "Teşhisi önceliklendirilmiş tasarım aksiyonlarına ve odaklı bir optimizasyon yönüne dönüştürün."],
  ["04", "Doğrula", "Optimize edilen tasarımı orijinal ve rakiplerle yeniden test ederek performansın gerçekten gelişip gelişmediğini görün."],
];

export default function HowItWorksPage() {
  return (
    <>
      <SiteHeader />
      <main className="pa-main">
        <section className="container pa-page-hero">
          <div className="pa-kicker">Nasıl Çalışır</div>
          <h1>Ölç. Teşhis Et. Geliştir. Doğrula.</h1>
          <p>Araştırma disiplinini tasarım hızına taşıyan kapalı döngü bir çalışma sistemi.</p>
        </section>

        <section className="container pa-process-list">
          {steps.map(([n, title, body]) => (
            <article key={title}>
              <span className="pa-step-number">{n}</span>
              <div><h2>{title}</h2><p>{body}</p></div>
              <div className="pa-step-signal"><i /><i /><i /></div>
            </article>
          ))}
        </section>

        <section className="container pa-proof-band">
          <div><span>Orijinal</span><strong>67</strong></div>
          <i>→</i>
          <div className="active"><span>Optimize</span><strong>81</strong></div>
          <p>Önce / sonra doğrulaması, tasarım gelişimini yalnızca tartışılan değil, ölçülebilen bir sonuca dönüştürür.</p>
        </section>

        <section className="container pa-wide-cta">
          <div><span>Üç görselle başlayın</span><h2>Ambalajınız. İki rakip. Tek ve net bir karar.</h2></div>
          <Link href="/analyze" className="pa-button">Analizi Başlat</Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
