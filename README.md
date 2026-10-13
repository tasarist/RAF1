# Pack Analytic — 5SE™ Analiz Demo (motor v4)

`/analyze` sayfası "Ambalajını Analiz Et" iş akışının çalışan demosudur:
Proje Kurulumu → Ambalajını Yükle → Rakip Testi → Raf Testi → Analiz → 5SE™ Sonuçları → Teşhis → Tasarımı Optimize Et → Yeniden Test → Önce / Sonra.
Bağımsız Rakip Testi ve Raf Testi akışları da vardır. Kayıtlar `/analyses` sayfasında listelenir; yarıda kalan analiz kaldığı adımdan sürer.

- **YZ görsel okuma** (Ana SKU, rakipler, raflar, tutarlılık): gerçek OpenAI API, `OPENAI_API_KEY` gerekir. Sonuçlar görsel hash'i ile önbelleğe alınır.
- **Görsel dikkat modeli**: askıda. Görsel hash'i ve onaylı alanlardan kararlı, temsili bakış noktaları üretilir; ısı haritası ve bakış rotası bunlardan çizilir ("Askıda · temsili").
- **Skorlar** yalnızca sunucuda, `lib/pa/scoring.ts` içinde, kaydın motor sürümüyle hesaplanır (`lib/pa/engine.ts`).
- Giriş, kredi, PDF/PPTX dışa aktarım ve yönetici paneli bu demoda yoktur.
- Kayıtlar JSON dosyası olarak `DATA_DIR` altında tutulur (yerelde `./data`, Vercel'de geçici `/tmp`).

Demo varsayımları: bakış payı yakınlığı 0–100 aralığına sıkıştırılır; ambalajda olmayan alan türü hesaba girmez; Rakip Testi toplamı DBA, netlik ve öne çıkma ortalamasıdır; Önce/Sonra'da yalnızca dikkate dayalı 03 ve 05 yeniden ölçülür.

---

# 5SE™ Packaging Intelligence — MVP v0.1

Bu paket doğrudan çalıştırılabilir/deploy edilebilir bir **Next.js prototipidir**.

## Bu sürüm ne yapıyor?

- Ana ambalaj + 2 rakip görseli yükleme
- Kategori / marka / ürün alanları
- Görsel önizleme
- `/api/analyze` backend doğrulaması
- Deterministik mock 5SE skorları
- 3 raf pozisyonu için mock attention share
- Feng-GUI canlı tekil ambalaj analizi için hazır adapter
- Strengths / issues / recommendations sonuç ekranı

> **Önemli:** Varsayılan olarak demo modundadır. Feng-GUI canlı analiz için Vercel ortam değişkenleri eklenmeli ve Feng-GUI hesabında `api` rolü açık olmalıdır.

## Yerelde çalıştırma

Node.js 20+ önerilir.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Tarayıcıda:

```text
http://localhost:3000
```

## Vercel'e yükleme — en kolay yöntem

1. GitHub repository'yi Vercel projesi olarak seçin.
2. Vercel Next.js'i otomatik tanır.
3. Demo mod için Environment Variable ekleyin:

```text
USE_MOCK_DATA=true
```

4. Deploy'a basın.

## Feng-GUI canlı moda alma

Feng-GUI tekil ambalaj analizini çalıştırmak için Vercel'de şu Environment Variable'ları ekleyin:

```text
USE_MOCK_DATA=false
FENG_GUI_API_KEY=...
FENG_GUI_SERVICE_URL=https://service.feng-gui.com
FENG_GUI_USERNAME=...
```

Notlar:

- `FENG_GUI_API_KEY` asla GitHub'a yazılmamalıdır.
- Feng-GUI dokümanına göre `ImageAttention` kullanımı için hesapta `api` rolü gerekir.
- Canlı modun bu sprintte yaptığı şey: ana ambalajı Feng-GUI ile analiz etmek, ısı haritası ve focus/clarity skorlarını sonuç ekranına taşımak.
- Canlı MVP'de Vercel yükleme sınırı nedeniyle her görseli yaklaşık 1.2 MB altında tutun. Büyük dosya desteğini sonraki sprintte doğrudan storage upload ile ekleyeceğiz.
- Raf kıyaslaması bu sprintte hâlâ demo simülasyonla çalışır. Bir sonraki sprintte üç ambalajdan gerçek raf görseli üretip onu da Feng-GUI'ye göndereceğiz.

## `ai.tasarist.co` bağlama

Deploy tamamlandıktan sonra Vercel projesinde:

**Settings → Domains → Add Domain → `ai.tasarist.co`**

Vercel size DNS tarafında eklemeniz gereken CNAME kaydını gösterecektir. Bu kayıt tasarist.co DNS yönetim paneline eklenir. FTP ile dosya kopyalamak gerekmez.

## Gelecek sprint

1. Feng-GUI hesabında `api` rolünün açılması
2. 3 otomatik shelf composite görseli
3. Shelf görsellerini Feng-GUI ile canlı test etme
4. AOI / heatmap verisi eşleştirme
5. OpenAI Responses API + structured JSON
6. 5m / 3m / 1m distance engine
7. Sonra tek optimize tasarım + re-test

## Gizlilik

Bu v0.1 yüklenen dosyaları kalıcı olarak bizim tarafta depolamaz. Feng-GUI canlı modda analiz edilen dosyalar Feng-GUI hesabının saklama politikasına göre orada tutulabilir; ticari kullanımdan önce veri saklama koşulları ayrıca netleştirilmelidir.
