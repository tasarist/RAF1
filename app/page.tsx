import Link from "next/link";

const criteria = [
  ["Özgünlük", "Rakiplere göre ayırt edici görsel karakter."],
  ["Süreklilik", "Eski ambalaj veya SKU varsa marka ailesi uyumu."],
  ["Ürün Netliği", "Ürünün ve ana vaadin hızlı anlaşılması."],
  ["Raf Etkisi", "Tekil dikkat ve rakipli raf performansı."],
  ["Mesafe Netliği", "5 m marka bloğu, 3 m logo, 1 m satış mesajı."],
];

const flow = [
  ["1", "Yükle", "Ana tasarım, iki rakip, kategori ve marka adları."],
  ["2", "Ölç", "Dikkat, netlik, odak ve rakipli performans sinyalleri."],
  ["3", "Puanla", "5SE kriterleri tek bir skor sisteminde birleşir."],
  ["4", "Yön Ver", "Kritik sorunlar ve tasarım geliştirme önerisi çıkar."],
];

const scoreBars = [
  ["Özgünlük", "74", "74%"],
  ["Ürün Netliği", "69", "69%"],
  ["Dikkat ve Raf Etkisi", "84", "84%"],
  ["Mesafe Netliği", "75", "75%"],
];

export default function HomePage() {
  return (
    <main>
      <div className="container">
        <nav className="nav">
          <div className="brand">5SE<span>™</span> Ambalaj Zekası</div>
          <div className="navTag">MVP v0.1 · Demo motoru</div>
        </nav>

        <section className="homeHero refinedHero">
          <div className="heroTextBlock">
            <div className="eyebrow">5 Raf Etkisi · Ambalaj Performans Analizi</div>
            <h1>Ambalajın rafta neden kazandığını veya kaybettiğini göster.</h1>
            <p>
              5SE; ambalaj tasarımını rakipleriyle birlikte değerlendirir, dikkat payını
              yorumlar, ürün vaadinin netliğini ölçer ve tasarımı geliştirmek için somut
              öncelikler çıkarır.
            </p>
            <div className="actions">
              <Link className="button primary" href="/analyze">Yeni Analiz Başlat</Link>
              <a className="button" href="#rapor">Rapor Mantığı</a>
            </div>
          </div>

          <div className="heroInfographic" aria-label="5SE analiz özeti">
            <div className="infographicHeader">
              <span>5SE çıktı özeti</span>
              <strong>76/100</strong>
            </div>
            <div className="signalFlow">
              <div><span>Girdi</span><strong>3 ambalaj</strong></div>
              <i />
              <div><span>Motor</span><strong>5SE analiz</strong></div>
              <i />
              <div><span>Çıktı</span><strong>Skor + teşhis</strong></div>
            </div>
            <div className="scoreBarsPreview">
              {scoreBars.map(([label, value, width]) => (
                <div className="scoreBarPreview" key={label}>
                  <div><span>{label}</span><strong>{value}</strong></div>
                  <em><i style={{ width }} /></em>
                </div>
              ))}
            </div>
            <div className="findingStrip">
              <span>Kritik bulgu</span>
              <p>Ana vaat yeterince hızlı görünmüyor; satın alma mesajı daha net kurulmalı.</p>
            </div>
          </div>
        </section>

        <section className="infographicBand" id="rapor">
          <div className="sectionHeader">
            <span>Rapor mantığı</span>
            <h2>Tek ekran, dört temel karar alanı.</h2>
          </div>
          <div className="infographicGrid">
            <article className="infoTile attentionTile">
              <span>01</span>
              <strong>Dikkat Haritası</strong>
              <p>Ambalajda ilk bakışın hangi alanlara yoğunlaştığını gösterir.</p>
              <div className="heatDiagram"><i /><i /><i /></div>
            </article>
            <article className="infoTile compareTile">
              <span>02</span>
              <strong>Rakip Kıyaslaması</strong>
              <p>Ana tasarımın iki rakibe göre dikkat payı ve ayrışma gücü okunur.</p>
              <div className="compareDiagram"><i /><i /><i /></div>
            </article>
            <article className="infoTile distanceTile">
              <span>03</span>
              <strong>5 m / 3 m / 1 m</strong>
              <p>Marka bloğu, logo ve satın alma mesajı doğru sırayla kontrol edilir.</p>
              <div className="distanceDiagram"><b>5m</b><b>3m</b><b>1m</b></div>
            </article>
            <article className="infoTile diagnosisTile">
              <span>04</span>
              <strong>Teşhis ve Öneri</strong>
              <p>Rapor yalnızca puan vermez; tasarımın hangi noktadan güçleneceğini söyler.</p>
              <div className="diagnosisDiagram"><i /><i /><i /></div>
            </article>
          </div>
        </section>

        <section className="section tight">
          <div className="sectionHeader">
            <span>Çalışma akışı</span>
            <h2>Analiz, teşhis ve iyileştirme aynı omurgada birleşir.</h2>
          </div>
          <div className="flowGrid">
            {flow.map(([number, title, body]) => (
              <article className="flowCard" key={title}>
                <span>{number}</span>
                <strong>{title}</strong>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section tight">
          <div className="sectionHeader">
            <span>5SE metodolojisi</span>
            <h2>Ambalajın raftaki gücünü beş açıdan okur.</h2>
          </div>
          <div className="methodGrid">
            {criteria.map(([title, body]) => (
              <article className="methodItem" key={title}>
                <strong>{title}</strong>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <footer className="footer">5SE™ MVP v0.1 · Prototip sürüm</footer>
      </div>
    </main>
  );
}
