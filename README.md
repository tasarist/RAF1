# 5SE™ Packaging Intelligence

Ambalajını rafta **ölç → teşhis et → rakiplerle karşılaştır → iyileştir → yeniden test et**.

5SE, Tasarist'in **5 Shelf Effect** metodolojisini çalışan bir ürüne dönüştürür. Kullanıcı ana ambalajı ve iki rakip ambalajı yükler; sistem tekil dikkat analizi yapar, üç farklı dizilimde sanal raf kurar, Shelf Performance Index hesaplar, 5 m / 3 m / 1 m algı simülasyonu üretir, beş kriterde puanlar, problemleri kanıt → neden → öneri zinciriyle teşhis eder ve **tek bir optimize tasarım** üretip aynı testlerden geçirir.

> Bu bir "heatmap sitesi" değil; heatmap yalnızca girdidir. Çıktı, raf performansı ve iyileştirme döngüsüdür.

---

## Durum: MVP (v0.3) — mock modu uçtan uca çalışır

| Katman | Durum | Not |
| --- | --- | --- |
| UI (Dashboard, New Analysis, Upload, Processing, Results, Before/After) | ✅ | Next.js 15 App Router, TypeScript, plain CSS design system, 375 px+ responsive, dark mode |
| Görsel pipeline (normalize, sanal raf ×3, 5m/3m/1m simülasyonu) | ✅ gerçek | `sharp` ile backend'de üretilir, mock değildir |
| Attention verisi | 🟡 mock / 🟢 adaptör hazır | Mock: sezgisel saliency modeli. Live: Attention Insight API v2 adaptörü yazıldı, anahtar bekliyor |
| 5SE skor motoru | ✅ kural tabanlı | Ölçülen verilerden deterministik hesaplama; OpenAI yapılandırılmış motor anahtar varsa devreye girer |
| Teşhis (Critical / Important / Opportunity) | ✅ | Her bulgu ölçülen değere bağlı |
| Optimize tasarım | 🟡 mock / 🟢 adaptör hazır | Mock: orijinalin "MOCK · OPTİMİZE SİMÜLASYONU" etiketli türevi. Live: OpenAI Images edit (`gpt-image-1`) |
| Re-test + Before/After | ✅ | Optimize tasarım orijinalle aynı pipeline'dan geçer; negatif delta saklanmaz |
| Login / ödeme / PDF / veritabanı | ⛔ | Kapsam dışı (MVP). Sonuçlar tarayıcıda IndexedDB'de tutulur |

Mock çıktılar arayüzde her yerde **MOCK** etiketiyle işaretlenir; sahte API anahtarı üretilmez, gerçek analiz yapıyormuş gibi davranılmaz.

---

## Hızlı başlangıç

```bash
npm install
cp .env.example .env.local     # USE_MOCK_DATA=true varsayılan
npm run dev                    # http://localhost:3000
```

Örnek ambalajlar `public/samples/` içinde (`main.jpg`, `competitor1.jpg`, `competitor2.jpg`, `previous.jpg`, `sku.jpg`; `node scripts/make-samples.mjs` ile yeniden üretilir).

Komut satırından test:

```bash
curl -F projectName="Test" -F category="Süt ürünleri" -F brandName=NORDIKA -F productName="Süzme Yoğurt" \
  -F mainPack=@public/samples/main.jpg -F competitor1=@public/samples/competitor1.jpg -F competitor2=@public/samples/competitor2.jpg \
  http://localhost:3000/api/analyze
```

---

## Ortam değişkenleri

| Değişken | Varsayılan | Açıklama |
| --- | --- | --- |
| `USE_MOCK_DATA` | `true` | `false` yapılmadan hiçbir dış API çağrılmaz. Anahtar eksikse sistem otomatik mock'a düşer, çökmez |
| `ATTENTION_PROVIDER` | `attention_insight` | `attention_insight` \| `feng_gui` \| `mock` |
| `ATTENTION_INSIGHT_API_KEY` | — | Attention Insight v2 API anahtarı (`Api-key` header) |
| `ATTENTION_INSIGHT_BASE_URL` | `https://ext-api.attentioninsight.com/api/v2` | |
| `OPENAI_API_KEY` | — | Yapılandırılmış 5SE motoru + optimize görsel üretimi |
| `OPENAI_MODEL` | `gpt-4.1-mini` | Responses API, `store: false`, `json_schema` strict |
| `OPENAI_IMAGE_MODEL` | `gpt-image-1` | Images edit endpoint |
| `OPENAI_IMAGE_QUALITY` | `medium` | |

Anahtarlar yalnızca sunucu tarafında (`lib/config.ts`, `server-only`) okunur; istemciye giden tek şey `/api/status` içindeki boolean bayraklardır.

---

## Mimari

```
app/
  page.tsx              Dashboard
  new/                  New Analysis + Upload + Processing (3 adımlı wizard)
  results/              5SE Results (5SE score → kriterler → attention → raf → mesafe → teşhis → IMPROVE)
  compare/              Improve my design → Before / After
  api/analyze           POST multipart → tam analiz (Analysis JSON)
  api/analyses/[id]     GET (sunucu önbelleği)
  api/analyses/[id]/optimize  POST → 1 optimize tasarım + re-test + delta
  api/status            GET mod/sağlayıcı bayrakları (secret içermez)
lib/
  types.ts              Domain tipleri, spec §14 JSON kontratı (FiveSeScores, FiveSeReport…)
  config.ts             Env okuma, mock fallback kararı
  pipeline.ts           18 adımlı iş akışı; measureVariant() original ve optimized için ortak
  attention/            AttentionProvider arayüzü + mock / attentionInsight / fengGui adaptörleri
  image/                sharp: normalize, buildShelf (3 dizilim), simulateDistance, saliency, features
  engine/               aoi (vision model / heuristic), scoring (5 kriter), report (teşhis, brief)
  ai/                   openaiEngine (structured JSON), openaiImage (tek optimize tasarım), fiveSePrompt
  store/                Sunucu içi LRU önbellek (DB yok)
  client/               IndexedDB kalıcılığı, görsel küçültme, env yardımcıları
```

**Provider değiştirilebilirlik:** attention sağlayıcısı `AttentionProvider` arayüzünün arkasındadır (`predictSinglePack`, `predictShelf`). Yeni bir servis eklemek = `lib/attention/providers/` altına bir dosya + `index.ts`'te kayıt.

**Tahmin bütçesi:** proje başına 4 tahmin orijinal (1 tekil + 3 raf) + 4 optimize = 8. 5m/3m/1m ek tahmin kullanmaz (backend simülasyonu + sezgisel/vision değerlendirme).

---

## Skorlama özeti

- **Uniqueness** 30/20/20/15/15 · **Continuity & Consistency** (yalnızca referans yüklenirse; yoksa N/A, 0 verilmez) 30/30/25/15 · **Product Clarity** 30/20/35/15 · **Attention & Stand-out** = %40 tekil + %60 raf · **Consumer Distance Clarity** 30/30/40.
- **Shelf Performance Index** = ortalama ana ambalaj dikkat payı / 33,3 × 100 (100'ü aşabilir).
- **Overall 5SE** = 5 (continuity varsa) veya 4 kriterin ortalaması; rapor hangi sayıdan hesaplandığını belirtir.
- Attention Insight'ın vermediği hiçbir metrik (ör. cognitive demand) üretilmez.

---

## Mock ↔ Live nasıl ayrışır

| Bileşen | Mock | Live |
| --- | --- | --- |
| Tekil / raf dikkat | `MockAttentionProvider` — kontrast + doygunluk + merkez önyargısı saliency'si; `isMock: true`, 0 transaction | `AttentionInsightProvider` — `POST /studies` (tasks: focus, clarity_score), poll, heatmap/focus görselleri, `POST /aoi` ile yüzde payları |
| AOI kutuları | Standart ambalaj yerleşimi varsayımı (`heuristic`) | OpenAI vision (`json_schema`) ile logo / ürün adı / vaat / görsel tespiti |
| 5SE raporu | Kural tabanlı motor (`rule_based_mock`) | Kural tabanlı baseline + OpenAI structured engine; ölçülen değerler (SPI, paylar, Attention & Stand-out) model tarafından değiştirilemez |
| Optimize tasarım | Orijinalin işaretli türevi | `gpt-image-1` edit — silüet, logo, marka rengi korunur |

---

## Deploy

- **Vercel:** repo'yu bağla, env değişkenlerini gir (`USE_MOCK_DATA=true` ile anahtarsız çalışır). Ayrıntı: `DEPLOY-VERCEL.md`.
- **Statik önizleme (sandbox):** `scripts/build-static-preview.sh` API'siz statik bundle üretir (`.next-export/`), API ayrı bir `next start` sürecinden proxy ile alınır. Vercel'de kullanılmaz.

---

## Yol haritası

- **Phase 2:** Attention Insight anahtarı ile canlı test; `focus_score` alanının yanıt şemasındaki yerinin doğrulanması.
- **Phase 3:** Raf testinde Attention Insight `shelves` study type + AOI transaction optimizasyonu.
- **Phase 4:** Optimize tasarım için görsel üretim kalite döngüsü (brief → üret → re-test → gerekirse ikinci deneme).
- Supabase (auth, proje kaydı, signed URL'ler), PDF rapor, ekip paylaşımı.
