import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const pillars = [
  ["01", "Daha Güçlü Rekabet Et", "Ambalajınızın tüketicinin rafta gerçekten gördüğü rakiplerin yanında nasıl performans gösterdiğini görün."],
  ["02", "Riski Azalt", "Baskı, üretim ve lansman öncesinde zayıf noktaları erkenden tespit edin."],
  ["03", "Daha Hızlı Optimize Et", "Uzun araştırma süreçlerini beklemeden veriyi net tasarım aksiyonlarına dönüştürün."],
];

const methodology = [
  ["Özgünlük", "82"],
  ["Tutarlılık", "76"],
  ["Ürün Netliği", "71"],
  ["Dikkat", "84"],
  ["Mesafe", "68"],
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="pa-main pa2-main">
        <section className="container pa2-hero">
          <div className="pa2-copy">
            <div className="pa2-kicker"><i /> Ambalaj Performans Zekâsı</div>
            <h1>Ambalajınızı rafa çıkmadan önce <span>daha güçlü hale getirin.</span></h1>
            <p>
              Ambalajınızı rakipleriyle test edin, neden kazandığını veya kaybettiğini görün
              ve lansmandan önce neyi değiştirmeniz gerektiğini bilin.
            </p>
            <div className="pa2-actions">
              <Link href="/analyze" className="pa2-primary">Ambalajını Analiz Et <b>↗</b></Link>
              <Link href="/how-it-works" className="pa2-secondary">Nasıl çalıştığını gör</Link>
            </div>
            <div className="pa2-meta">
              <span>Hızlı test</span><span>Rakip benchmark</span><span>Aksiyona dönük teşhis</span>
            </div>
          </div>

          <div className="pa2-console">
            <div className="pa2-console-head">
              <div>
                <span>PROJE</span>
                <strong>Portakal Suyu / Konsept 04</strong>
              </div>
              <div className="pa2-live"><i /> ANALİZ HAZIR</div>
            </div>

            <div className="pa2-console-grid">
              <div className="pa2-score-panel">
                <span>PACK ANALYTIC SKORU</span>
                <div className="pa2-score-ring">
                  <svg viewBox="0 0 140 140" aria-hidden="true">
                    <circle cx="70" cy="70" r="57" />
                    <circle className="progress" cx="70" cy="70" r="57" />
                  </svg>
                  <strong>78</strong>
                  <small>/100</small>
                </div>
                <p>Güçlü raf potansiyeli. Çözülmesi gereken tek bir kritik iletişim sorunu var.</p>
              </div>

              <div className="pa2-shelf-panel">
                <div className="pa2-panel-label"><span>RAKİPLİ RAF TESTİ</span><b>Eşit paya göre +%26</b></div>
                <div className="pa2-shelf">
                  <div className="pa2-mini-pack rival"><span>RAKİP A</span><b>31%</b></div>
                  <div className="pa2-mini-pack hero-pack">
                    <span>SİZİN AMBALAJINIZ</span><b>42%</b>
                    <i className="heat heat-a" /><i className="heat heat-b" />
                  </div>
                  <div className="pa2-mini-pack rival two"><span>RAKİP B</span><b>27%</b></div>
                </div>
              </div>
            </div>

            <div className="pa2-metric-row">
              {methodology.map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                  <i><b style={{ width: value + "%" }} /></i>
                </div>
              ))}
            </div>

            <div className="pa2-alert">
              <span>01 / ÖNCELİK</span>
              <p>Ana fayda yakın mesafede görünürlüğünü kaybediyor. Alt iletişim alanını sadeleştirin ve claim hiyerarşisini güçlendirin.</p>
              <b>Teşhisi gör →</b>
            </div>
          </div>
        </section>

        <section className="pa2-system-line">
          <div className="container">
            <span>Görsel Dikkat</span><i>×</i><span>Raf Bağlamı</span><i>×</i><span>5SE™ Metodolojisi</span><i>×</i><strong>Yapay Zekâ Teşhisi</strong>
          </div>
        </section>

        <section className="container pa2-problem">
          <div className="pa2-index">01</div>
          <div className="pa2-problem-copy">
            <div className="pa2-kicker"><i /> Problem</div>
            <h2>Ambalaj, yalnızca sezgiyle onaylanamayacak kadar önemli.</h2>
          </div>
          <div className="pa2-problem-body">
            <p>Markalar rakiplerinden daha güçlü ambalajlar istiyor; ancak geleneksel araştırmalar her tasarım iterasyonu için çoğu zaman fazla yavaş ve maliyetli.</p>
            <p>Hızlı yapay zekâ araçları var, fakat çoğu ambalajın rafta cevaplaması gereken özel sorular için geliştirilmiş değil.</p>
            <strong>Pack Analytic, tasarım ile araştırma arasındaki boşluğu doldurur.</strong>
          </div>
        </section>

        <section className="container pa2-pillar-section">
          <div className="pa2-section-head">
            <div>
              <div className="pa2-kicker"><i /> İş değeri</div>
              <h2>Daha fazla güven. Daha az tahmin.</h2>
            </div>
            <p>Tasarım sürecini yavaşlatmadan daha güçlü ambalaj kararları almak isteyen ekipler için geliştirildi.</p>
          </div>

          <div className="pa2-pillars">
            {pillars.map(([n, title, body]) => (
              <article key={title}>
                <div className="pa2-card-top"><span>{n}</span><i>↗</i></div>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="pa2-process-band">
          <div className="container">
            <div className="pa2-section-head light">
              <div>
                <div className="pa2-kicker"><i /> Kapalı döngü optimizasyon</div>
                <h2>Ölç. Teşhis Et. Geliştir. Doğrula.</h2>
              </div>
              <Link href="/how-it-works" className="pa2-inline-link">Akışı incele ↗</Link>
            </div>
            <div className="pa2-process-track">
              {[
                ["01","ÖLÇ","Ambalajınız + rakipler"],
                ["02","TEŞHİS ET","Neden kazanıyor veya kaybediyor?"],
                ["03","GELİŞTİR","Önceliklendirilmiş tasarım aksiyonu"],
                ["04","DOĞRULA","Yeni yönü tekrar test et"],
              ].map(([n,t,b]) => (
                <article key={t}><span>{n}</span><h3>{t}</h3><p>{b}</p></article>
              ))}
            </div>
          </div>
        </section>

        <section className="container pa2-method">
          <div className="pa2-method-copy">
            <div className="pa2-kicker"><i /> 5SE™ ile desteklenir</div>
            <h2>Ambalajın yapması gereken beş işi tek çerçevede ölçer.</h2>
            <p>Pack Analytic ambalajı tüketicinin deneyimlediği şekilde değerlendirir: rekabetçi bir ortamda dikkat çekmek, tanınmak, anlaşılmak ve tercihi desteklemek.</p>
            <Link href="/methodology" className="pa2-inline-link">Metodolojiyi incele ↗</Link>
          </div>
          <div className="pa2-method-board">
            {[
              ["01","Özgünlük","Rakiplerden ayırt edilebilir ol"],
              ["02","Tutarlılık","Markanın görsel varlıklarını koru"],
              ["03","Ürün Netliği","Ne olduğunu hızlı anlat"],
              ["04","Dikkat ve Raf Etkisi","İlk bakışı kazan"],
              ["05","Tüketici Mesafesi","5 m → 3 m → 1 m çalış"],
            ].map(([n,t,b]) => (
              <div key={t}><span>{n}</span><strong>{t}</strong><p>{b}</p></div>
            ))}
          </div>
        </section>

        <section className="container pa2-compare">
          <div className="pa2-compare-visual">
            <div className="pa2-ruler"><span>5 m</span><span>3 m</span><span>1 m</span></div>
            <div className="pa2-pack-row">
              <div className="pack-box muted"><small>RAKİP A</small><b>31%</b></div>
              <div className="pack-box focus"><small>SİZİN AMBALAJINIZ</small><b>42%</b><em>+26%</em></div>
              <div className="pack-box muted alt"><small>RAKİP B</small><b>27%</b></div>
            </div>
          </div>
          <div className="pa2-compare-copy">
            <div className="pa2-kicker"><i /> Rakipli Raf Zekâsı</div>
            <h2>Ambalaj ekranda değil, rafta rekabet eder.</h2>
            <p>Rakiplerinin yanında, sınırlı dikkat süresi içinde ve farklı mesafelerde rekabet eder. Pack Analytic tasarımınızı tek başına bir artwork olarak değil, bu gerçek bağlam içinde değerlendirir.</p>
          </div>
        </section>

        <section className="container pa2-action">
          <div>
            <div className="pa2-kicker"><i /> İçgörüden aksiyona</div>
            <h2>Skorda durmayın.</h2>
            <p>Neyin yanlış olduğunu, neden önemli olduğunu ve neyi değiştirmeniz gerektiğini görün. Ardından yeni yönü tekrar test ederek gerçekten gelişip gelişmediğini doğrulayın.</p>
          </div>
          <div className="pa2-before-after">
            <article><span>ORİJİNAL</span><strong>67</strong><small>Performans skoru</small></article>
            <i>→</i>
            <article className="optimized"><span>OPTİMİZE</span><strong>81</strong><small>Yeniden test sonucu</small></article>
          </div>
        </section>

        <section className="container pa2-final">
          <span>TASARIM BELİRSİZLİĞİNDEN RAF GÜVENİNE</span>
          <h2>Rafta neyin işe yarayacağını tahmin etmeyi bırakın.</h2>
          <p>Test edin. Anlayın. Geliştirin.</p>
          <Link href="/analyze" className="pa2-primary">Ambalajını Analiz Et <b>↗</b></Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
