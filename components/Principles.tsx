const ITEMS = [
  { name: "Uniqueness", tr: "Güçlü ayırıcı marka varlıkları", w: "Görsel ayrışma 30 · Yapı 20 · Renk & grafik 20 · Kategori kodu dengesi 15 · Rakip farkı 15", d: "Rakiplerle yan yana durduğunda tasarım kendine ait bir hafıza yapısı kuruyor mu? Yüksek skor “güzel” demek değil, “sahiplenilebilir” demek.", icon: "M12 3l9 16H3z" },
  { name: "Continuity & Consistency", tr: "Sürekli ve tutarlı ol", w: "Marka varlığı 30 · Portföy 30 · Evrim dengesi 25 · Sistem 15 · Sadece referans yüklenince", d: "Eski ambalaj ve diğer SKU'lar yüklendiyse marka varlıklarının korunup korunmadığını ölçer; yüklenmediyse N/A olur, 0 verilmez.", icon: "M4 12h16M4 6h16M4 18h16" },
  { name: "Product Clarity", tr: "Ürünü doğru yansıt", w: "Kategori 30 · Ürün/varyant 20 · Vaat 35 · Hiyerarşi 15", d: "Ne olduğu, hangi varyant olduğu ve neden alınmalı olduğu ilk saniyelerde okunuyor mu?", icon: "M4 4h16v16H4zM8 9h8M8 13h5" },
  { name: "Attention & Stand-out", tr: "İlgi çekici ol", w: "Tekil dikkat 40 · Raf performansı 60 · 3 dizilim · Parite 33,3%", d: "Ambalaj üç farklı raf konumunda rakiplerine karşı dikkatin ne kadarını alıyor? Shelf Performance Index = ortalama pay / 33,3 × 100.", icon: "M12 4v16M4 12h16M6 6l12 12M18 6L6 18" },
  { name: "Consumer Distance Clarity", tr: "Tüketici odaklı ol", w: "5 m marka bloğu 30 · 3 m logo 30 · 1 m satın alma mesajı 40", d: "Koridordan rafa yaklaşan tüketici sırasıyla renk bloğunu, logoyu ve alım mesajını çözebiliyor mu?", icon: "M12 21c-4-4-8-7.5-8-12a8 8 0 0116 0c0 4.5-4 8-8 12zM12 11a2 2 0 100-4 2 2 0 000 4z" },
];

export function Principles() {
  return (
    <div className="grid grid--5">
      {ITEMS.map((p, i) => (
        <article key={p.name} className="card principle">
          <svg className="principle__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" aria-hidden><path d={p.icon} /></svg>
          <div>
            <span className="tr">0{i + 1} · {p.tr}</span>
            <h3>{p.name}</h3>
          </div>
          <p>{p.d}</p>
          <span className="w">{p.w}</span>
        </article>
      ))}
    </div>
  );
}
