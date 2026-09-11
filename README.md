# 5SE™ Packaging Intelligence — MVP v0.1

Bu paket doğrudan çalıştırılabilir/deploy edilebilir bir **Next.js prototipidir**.

## Bu sürüm ne yapıyor?

- Ana ambalaj + 2 rakip görseli yükleme
- Kategori / marka / ürün alanları
- Görsel önizleme
- `/api/analyze` backend doğrulaması
- Deterministik mock 5SE skorları
- 3 raf pozisyonu için mock attention share
- Strengths / issues / recommendations sonuç ekranı

> **Önemli:** Attention Insight ve OpenAI henüz canlı bağlı değildir. v0.1'in amacı ürün akışını ve veri modelini doğrulamaktır.

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

1. ZIP'i bilgisayarınızda açın.
2. Klasörü GitHub'da yeni bir repository'ye yükleyin.
3. Vercel hesabınızda **Add New → Project** deyin.
4. GitHub repository'yi seçin.
5. Vercel Next.js'i otomatik tanır.
6. Environment Variable ekleyin:

```text
USE_MOCK_DATA=true
```

7. Deploy'a basın.

## `ai.tasarist.co` bağlama

Deploy tamamlandıktan sonra Vercel projesinde:

**Settings → Domains → Add Domain → `ai.tasarist.co`**

Vercel size DNS tarafında eklemeniz gereken CNAME kaydını gösterecektir. Bu kayıt tasarist.co DNS yönetim paneline eklenir. FTP ile dosya kopyalamak gerekmez.

## Gelecek sprint

1. Attention Insight gerçek API adaptörü
2. 3 otomatik shelf composite görseli
3. AOI / heatmap verisi eşleştirme
4. OpenAI Responses API + structured JSON
5. 5m / 3m / 1m distance engine
6. Sonra tek optimize tasarım + re-test

## Gizlilik

Bu v0.1 yüklenen dosyaları kalıcı depolamaz. Sunucu isteği işler ve mock sonuç döndürür.
