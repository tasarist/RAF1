import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const scores = [
  ["Özgünlük", 82],
  ["Ürün Netliği", 71],
  ["Dikkat", 84],
  ["Mesafe", 68],
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="pa-main pa2-main zentic-home">
        <section className="zentic-hero">
          <div className="container zentic-hero-inner">
            <div className="zentic-badge"><i /> Ambalaj Performans Zekâsı <span>Yeni nesil raf analizi</span></div>
            <h1>Ambalajınızı <span>rafta kazanan</span> bir tasarıma dönüştürün.</h1>
            <p>
              Pack Analytic; ambalajınızı rakipleriyle test eder, neden kazandığını veya
              kaybettiğini açıklar ve rafa çıkmadan önce neyi değiştirmeniz gerektiğini gösterir.
            </p>
            <div className="zentic-hero-actions">
              <Link href="/analyze" className="zentic-primary">Ambalajını Analiz Et <b>↗</b></Link>
              <a href="#nasil-calisir" className="zentic-secondary">Nasıl çalışır <span>↓</span></a>
            </div>
            <div className="zentic-proof-row">
              <span><i>✓</i> Hızlı test</span>
              <span><i>✓</i> Rakip benchmark</span>
              <span><i>✓</i> Yapay zekâ teşhisi</span>
              <span><i>✓</i> 5SE™ metodolojisi</span>
            </div>

            <div className="zentic-orbit orbit-a" />
            <div className="zentic-orbit orbit-b" />
            <div className="zentic-glow glow-a" />
            <div className="zentic-glow glow-b" />
          </div>

          <div className="container zentic-dashboard-wrap">
            <div className="zentic-dashboard">
              <div className="zentic-dash-top">
                <div className="zentic-window-dots"><i /><i /><i /></div>
                <div className="zentic-dash-title">
                  <span>Pack Analytic</span>
                  <small>Portakal Suyu / Konsept 04</small>
                </div>
                <div className="zentic-dash-status"><i /> Analiz hazır</div>
              </div>

              <div className="zentic-dash-body">
                <aside className="zentic-sidebar">
                  <div className="zentic-side-logo">PA</div>
                  <nav>
                    <span className="active">Genel Bakış</span>
                    <span>Raf Testi</span>
                    <span>5SE™ Skorları</span>
                    <span>Teşhis</span>
                    <span>Öneriler</span>
                  </nav>
                  <div className="zentic-side-foot">AI Engine · Online</div>
                </aside>

                <section className="zentic-workspace">
                  <div className="zentic-workspace-head">
                    <div><span>GENEL 5SE SKORU</span><strong>78<small>/100</small></strong></div>
                    <div className="zentic-growth">+12 puan potansiyel</div>
                  </div>

                  <div className="zentic-main-grid">
                    <article className="zentic-card zentic-shelf-card">
                      <div className="zentic-card-head"><span>RAKİPLİ RAF TESTİ</span><b>Eşit paya göre +%26</b></div>
                      <div className="zentic-shelf-stage">
                        <div className="zentic-pack rival"><small>RAKİP A</small><strong>31%</strong></div>
                        <div className="zentic-pack main">
                          <small>SİZİN AMBALAJINIZ</small><strong>42%</strong>
                          <i className="heat heat-one" /><i className="heat heat-two" />
                        </div>
                        <div className="zentic-pack rival alt"><small>RAKİP B</small><strong>27%</strong></div>
                      </div>
                    </article>

                    <article className="zentic-card zentic-score-card">
                      <div className="zentic-card-head"><span>PERFORMANS</span><b>Canlı sonuç</b></div>
                      <div className="zentic-score-ring">
                        <svg viewBox="0 0 140 140">
                          <circle cx="70" cy="70" r="57" />
                          <circle className="progress" cx="70" cy="70" r="57" />
                        </svg>
                        <strong>78</strong>
                        <small>/100</small>
                      </div>
                      <p>Güçlü raf potansiyeli. Bir kritik iletişim sorunu çözülmeli.</p>
                    </article>
                  </div>

                  <div className="zentic-score-row">
                    {scores.map(([label, value]) => (
                      <div key={String(label)}>
                        <span>{label}</span>
                        <strong>{value}</strong>
                        <i><b style={{ width: value + "%" }} /></i>
                      </div>
                    ))}
                  </div>

                  <div className="zentic-insight">
                    <div><span>ÖNCELİKLİ TEŞHİS</span><strong>Ana fayda 1 m iletişiminde görünürlüğünü kaybediyor.</strong></div>
                    <p>Alt iletişim alanını sadeleştirin ve ana claim hiyerarşisini güçlendirin.</p>
                    <b>Önerileri gör →</b>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </section>

        <section className="zentic-logo-strip">
          <div className="container">
            <span>Görsel Dikkat</span><i>•</i>
            <span>Rakipli Raf Testi</span><i>•</i>
            <span>5SE™ Metodolojisi</span><i>•</i>
            <span>Yapay Zekâ Teşhisi</span><i>•</i>
            <span>Tasarım Optimizasyonu</span>
          </div>
        </section>

        <section className="zentic-section container">
          <div className="zentic-section-heading">
            <span className="zentic-eyebrow">Neden Pack Analytic?</span>
            <h2>Ambalaj kararlarını sezgiden çıkarıp <em>kanıta</em> yaklaştırır.</h2>
            <p>Markaların en kritik tasarım kararlarını daha hızlı, daha karşılaştırılabilir ve daha aksiyona dönük hale getirir.</p>
          </div>
          <div className="zentic-feature-grid">
            {[
              ["01","Rakiplerin Önüne Geç","Ambalajınızı tek başına değil, tüketicinin gördüğü gerçek rakip ortamında değerlendirin."],
              ["02","Rafa Çıkmadan Riski Gör","Baskı ve lansmandan önce görünürlük, netlik ve ayrışma sorunlarını yakalayın."],
              ["03","Daha Hızlı Optimize Et","Araştırma verisini tasarım ekibinin doğrudan uygulayabileceği aksiyonlara dönüştürün."],
            ].map(([n,title,body]) => (
              <article key={title}>
                <span>{n}</span>
                <div className="zentic-feature-icon">✦</div>
                <h3>{title}</h3>
                <p>{body}</p>
                <Link href="/product">Daha fazla bilgi ↗</Link>
              </article>
            ))}
          </div>
        </section>

        <section className="zentic-section zentic-process-section" id="nasil-calisir">
          <div className="container">
            <div className="zentic-section-heading centered">
              <span className="zentic-eyebrow">Nasıl çalışır?</span>
              <h2>Dört adımda <em>ölçülebilir</em> tasarım kararı.</h2>
              <p>Pack Analytic, araştırma ve optimizasyonu tek bir kapalı döngüde birleştirir.</p>
            </div>

            <div className="zentic-process-grid">
              {[
                ["01","Ölç","Ana ambalajı ve rakipleri görsel dikkat, netlik ve raf performansı açısından analiz eder."],
                ["02","Teşhis Et","Nerede kaybettiğinizi, nedenini ve hangi sorunun öncelikli olduğunu açıklar."],
                ["03","Geliştir","Önceliklendirilmiş tasarım aksiyonları ve optimize edilmiş yön oluşturur."],
                ["04","Doğrula","Yeni tasarımı tekrar test ederek değişimin gerçekten işe yarayıp yaramadığını gösterir."],
              ].map(([n,title,body]) => (
                <article key={title}>
                  <div className="zentic-process-number">{n}</div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="zentic-section container zentic-analysis-output">
          <div className="zentic-section-heading">
            <span className="zentic-eyebrow">Çıktı</span>
            <h2>Sadece skor değil. <em>Ne yapmanız gerektiğini</em> gösterir.</h2>
          </div>

          <div className="zentic-output-grid">
            <article className="zentic-output-card large">
              <div className="zentic-output-top"><span>5SE™ SCORECARD</span><b>78/100</b></div>
              <div className="zentic-output-chart">
                <i style={{height:"82%"}}/><i style={{height:"76%"}}/><i style={{height:"71%"}}/><i style={{height:"84%"}}/><i style={{height:"68%"}}/>
              </div>
              <div className="zentic-output-labels"><span>Özgünlük</span><span>Tutarlılık</span><span>Netlik</span><span>Dikkat</span><span>Mesafe</span></div>
            </article>

            <article className="zentic-output-card">
              <div className="zentic-output-top"><span>TEŞHİS</span><b>3 konu</b></div>
              <ul>
                <li><i className="red"/>Ana fayda yeterince görünür değil</li>
                <li><i className="yellow"/>Logo çevresinde görsel rekabet yüksek</li>
                <li><i className="green"/>Distinctive asset güçlendirilebilir</li>
              </ul>
            </article>

            <article className="zentic-output-card">
              <div className="zentic-output-top"><span>AKSİYON</span><b>Öncelikli</b></div>
              <ol>
                <li>Ana claim'i sadeleştir</li>
                <li>Logo çevresini temizle</li>
                <li>Grafik varlığı güçlendir</li>
              </ol>
            </article>
          </div>
        </section>

        <section className="zentic-section zentic-method-band">
          <div className="container zentic-method-layout">
            <div>
              <span className="zentic-eyebrow">5SE™ Metodolojisi</span>
              <h2>Ambalajın rafta yapması gereken beş işi ölçer.</h2>
              <p>Özgünlükten ürün netliğine, dikkat performansından 5 m / 3 m / 1 m iletişimine kadar.</p>
              <Link href="/methodology" className="zentic-text-link">Metodolojiyi incele →</Link>
            </div>
            <div className="zentic-method-list">
              {[
                ["01","Özgünlük","Rakiplerden ayırt edilebilir mi?"],
                ["02","Tutarlılık","Marka varlıkları korunuyor mu?"],
                ["03","Ürün Netliği","Ürün ve fayda hızlı anlaşılıyor mu?"],
                ["04","Dikkat & Raf Etkisi","İlk bakışı kazanıyor mu?"],
                ["05","Tüketici Mesafesi","5 m → 3 m → 1 m doğru çalışıyor mu?"],
              ].map(([n,title,body]) => (
                <div key={title}><span>{n}</span><strong>{title}</strong><p>{body}</p></div>
              ))}
            </div>
          </div>
        </section>

        <section className="zentic-final-cta">
          <div className="container">
            <span>Rafa çıkmadan önce bilin.</span>
            <h2>Ambalajınızın performansını tahmin etmeyin. <em>Test edin.</em></h2>
            <p>Ambalajınızı rakipleriyle karşılaştırın, sorunları görün ve daha güçlü bir tasarıma ulaşın.</p>
            <Link href="/analyze" className="zentic-primary">Ambalajını Analiz Et <b>↗</b></Link>
          </div>
        </section>
      </main>

      <div className="pa2-mobile-sticky">
        <div><span>Pack Analytic</span><small>Rafa çıkmadan önce test et</small></div>
        <Link href="/analyze">Analiz Et ↗</Link>
      </div>
      <SiteFooter />
    </>
  );
}
