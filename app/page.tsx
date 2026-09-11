import Link from "next/link";

const criteria = [
  ["Özgünlük", "Ambalajın iki rakibe göre ne kadar ayırt edici olduğunu ölçer."],
  ["Süreklilik", "Eski ambalaj veya SKU yüklenirse marka ailesi tutarlılığını değerlendirir."],
  ["Ürün Netliği", "Tüketicinin ürün ve ana vaadi hızlı anlayıp anlamadığını tahmin eder."],
  ["Raf Etkisi", "Tekil dikkat performansını ve rakipli raftaki dikkat payını birleştirir."],
  ["Mesafe Netliği", "5 metrede blok, 3 metrede logo, 1 metrede satış mesajını kontrol eder."],
];

const flow = [
  ["1", "Ambalajları Yükle", "Ana tasarım ve iki rakip aynı analiz setine alınır."],
  ["2", "Rafta Ölç", "Sistem üç farklı raf dizilimiyle konum etkisini azaltır."],
  ["3", "5SE Skoru Al", "Özgünlük, ürün netliği, dikkat ve mesafe hiyerarşisi puanlanır."],
  ["4", "Sorunu Gör", "Rapor güçlü yönleri, kritik problemleri ve geliştirme yönünü gösterir."],
];

export default function HomePage() {
  return (
    <main>
      <div className="container">
        <nav className="nav">
          <div className="brand">5SE<span>™</span> Ambalaj Zekası</div>
          <div className="navTag">MVP v0.1 · Demo motoru</div>
        </nav>

        <section className="homeHero">
          <div className="eyebrow">5 Raf Etkisi · Ambalaj Performans Analizi</div>
          <h1>Ambalaj tasarımını rakipleriyle birlikte rafta ölç.</h1>
          <p>
            5SE, tekil ambalaj dikkatini, rakipli raf performansını, ürün vaadinin
            anlaşılırlığını ve 5m / 3m / 1m mesafe hiyerarşisini tek raporda toplar.
          </p>
          <div className="actions">
            <Link className="button primary" href="/analyze">Yeni Analiz Başlat</Link>
            <a className="button" href="#rapor">Rapor Önizlemesi</a>
          </div>
        </section>

        <section className="homeVisual" aria-label="5SE raf analizi önizlemesi">
          <div className="shelfMock">
            <div className="shelfHeader">
              <span>Sanal raf testi</span>
              <strong>Dikkat payı</strong>
            </div>
            <div className="packShelf">
              <div className="packMock mainPackMock">
                <span>ANA</span>
                <strong>JUSS</strong>
                <em>Portakal</em>
                <div className="packFruit" />
              </div>
              <div className="packMock competitorPackMock one">
                <span>RAKİP</span>
                <strong>DİMES</strong>
                <em>Portakal</em>
                <div className="packFruit" />
              </div>
              <div className="packMock competitorPackMock two">
                <span>RAKİP</span>
                <strong>CAPPY</strong>
                <em>Portakal</em>
                <div className="packFruit" />
              </div>
            </div>
            <div className="shelfBars">
              <div><span>JUSS</span><strong>41%</strong><i style={{ width: "41%" }} /></div>
              <div><span>DİMES</span><strong>34%</strong><i style={{ width: "34%" }} /></div>
              <div><span>CAPPY</span><strong>25%</strong><i style={{ width: "25%" }} /></div>
            </div>
          </div>

          <div className="scorePreview" id="rapor">
            <div className="previewScore">
              <span>Genel 5SE</span>
              <strong>76</strong>
              <em>/100</em>
            </div>
            <div className="distancePreview">
              <div><span>5 m</span><strong>Marka bloğu</strong></div>
              <div><span>3 m</span><strong>Logo</strong></div>
              <div><span>1 m</span><strong>Satış mesajı</strong></div>
            </div>
            <div className="issuePreview">
              <span>Kritik bulgu</span>
              <p>Ana vaat ürün görselinin gerisinde kalıyor; satın alma mesajı daha net görünmeli.</p>
            </div>
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
            <h2>Rapor yalnızca skor vermez; ambalajın nerede güç kaybettiğini açıklar.</h2>
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
