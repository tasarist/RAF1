// Kurulumda önerilen kategoriler (serbest yazım da kabul edilir).
export const CATEGORY_GROUPS: Array<{ group: string; items: string[] }> = [
  { group: "Süt ve süt ürünleri", items: ["Süt", "Ayran", "Yoğurt", "Kefir", "Beyaz peynir", "Kaşar peyniri", "Tereyağı", "Krema", "Puding ve sütlü tatlı"] },
  { group: "İçecekler", items: ["Su", "Maden suyu", "Gazlı içecek", "Meyve suyu", "Soğuk çay", "Enerji içeceği", "Sporcu içeceği", "Bitki bazlı içecek"] },
  { group: "Sıcak içecekler", items: ["Çay", "Türk kahvesi", "Hazır kahve", "Filtre kahve", "Kapsül kahve", "Bitki çayı"] },
  { group: "Atıştırmalık ve şekerleme", items: ["Cips", "Kraker", "Bisküvi", "Kek", "Çikolata", "Gofret", "Şekerleme", "Sakız", "Kuruyemiş", "Bar ve granola"] },
  { group: "Kahvaltılık", items: ["Reçel", "Bal", "Zeytin", "Tahin ve pekmez", "Sürülebilir çikolata", "Kahvaltılık gevrek"] },
  { group: "Temel gıda", items: ["Makarna", "Pirinç", "Bakliyat", "Un", "Şeker", "Sıvı yağ", "Zeytinyağı", "Salça", "Baharat", "Konserve", "Hazır çorba", "Sos ve ketçap"] },
  { group: "Dondurulmuş ve soğuk", items: ["Dondurma", "Dondurulmuş gıda", "Şarküteri", "Hazır yemek"] },
  { group: "Kişisel bakım", items: ["Şampuan", "Saç kremi", "Duş jeli", "Sabun", "Deodorant", "Diş macunu", "Tıraş ürünleri", "Cilt bakımı", "Güneş koruyucu"] },
  { group: "Ev bakım", items: ["Çamaşır deterjanı", "Yumuşatıcı", "Bulaşık deterjanı", "Yüzey temizleyici", "Çamaşır suyu", "Kâğıt ürünleri"] },
  { group: "Bebek ve çocuk", items: ["Bebek bezi", "Bebek maması", "Islak mendil"] },
  { group: "Evcil hayvan", items: ["Kedi maması", "Köpek maması", "Kedi kumu"] },
  { group: "Sağlık ve takviye", items: ["Vitamin ve takviye", "Bitkisel ürün"] },
];

export const CHANNELS = ["Zincir market", "İndirim marketi", "Geleneksel kanal", "E-ticaret", "Hızlı ticaret", "Eczane / kozmetik mağazası"];
