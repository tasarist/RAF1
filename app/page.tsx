import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <div className="container">
        <nav className="nav">
          <div className="brand">5SE<span>™</span> Packaging Intelligence</div>
          <div className="navTag">MVP v0.1 · Mock engine</div>
        </nav>

        <section className="hero">
          <div className="eyebrow">5 Shelf Effect · AI Packaging Analysis</div>
          <h1>Ambalajı rafta ölç. Sorunu bul. Daha güçlü tasarla.</h1>
          <p>
            Ana ambalajınızı ve iki rakibi yükleyin. 5SE metodolojisi; uniqueness,
            product clarity, attention & stand-out ve mesafe hiyerarşisini tek bir
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
              <strong>1 · Upload</strong>
              <p>Ana tasarım + 2 rakip. Bu sürümde görseller yalnızca analiz isteği sırasında işlenir; kalıcı olarak kaydedilmez.</p>
            </article>
            <article className="feature">
              <strong>2 · Analyze</strong>
              <p>v0.1 gerçek API yerine deterministik mock sonuç üretir. Böylece UX ve 5SE veri yapısını önce doğrularız.</p>
            </article>
            <article className="feature">
              <strong>3 · Results</strong>
              <p>Overall 5SE, dört zorunlu skor, raf attention payları, güçlü yönler ve geliştirme önerileri görüntülenir.</p>
            </article>
          </div>
        </section>

        <footer className="footer">5SE™ MVP v0.1 · Prototype build</footer>
      </div>
    </main>
  );
}
