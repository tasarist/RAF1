import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <div className="container">
        <nav className="nav">
          <div className="brand">5SE<span>™</span> Ambalaj Zekası</div>
          <div className="navTag">MVP v0.1 · Demo motoru</div>
        </nav>

        <section className="hero">
          <div className="eyebrow">5 Raf Etkisi · Yapay Zeka Ambalaj Analizi</div>
          <h1>Ambalajı rafta ölç. Sorunu bul. Daha güçlü tasarla.</h1>
          <p>
            Ana ambalajınızı ve iki rakibi yükleyin. 5SE metodolojisi; özgünlük,
            ürün netliği, dikkat ve raf etkisi ile mesafe hiyerarşisini tek bir
            analiz akışında birleştirir.
          </p>
          <div className="actions">
            <Link className="button primary" href="/analyze">Yeni analiz başlat</Link>
            <a className="button" href="#scope">MVP kapsamı</a>
          </div>
        </section>

        <section id="scope" className="section">
          <div className="grid3">
            <article className="feature">
              <strong>1 · Yükle</strong>
              <p>Ana tasarım + 2 rakip. Bu sürümde görseller yalnızca analiz isteği sırasında işlenir; kalıcı olarak kaydedilmez.</p>
            </article>
            <article className="feature">
              <strong>2 · Analiz Et</strong>
              <p>v0.1 gerçek API yerine deterministik demo sonuç üretir. Böylece kullanıcı deneyimini ve 5SE veri yapısını önce doğrularız.</p>
            </article>
            <article className="feature">
              <strong>3 · Sonuçları Gör</strong>
              <p>Genel 5SE skoru, dört zorunlu kriter, raf dikkat payları, güçlü yönler ve geliştirme önerileri görüntülenir.</p>
            </article>
          </div>
        </section>

        <footer className="footer">5SE™ MVP v0.1 · Prototip sürüm</footer>
      </div>
    </main>
  );
}
