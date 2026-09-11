# Vercel'e yüklemek için kısa rehber

## Seçenek 1 — GitHub üzerinden (önerilen)

1. ZIP'i aç.
2. GitHub.com'da `5se-mvp` isimli yeni bir repo oluştur.
3. ZIP içindeki dosyaları repo'ya yükle.
4. vercel.com → Add New → Project.
5. GitHub hesabını bağla ve `5se-mvp` repo'sunu seç.
6. Environment Variables bölümüne:
   - `USE_MOCK_DATA` = `true`
7. Deploy.

## Subdomain

Vercel deploy sonrası:

Settings → Domains → `ai.tasarist.co`

Vercel'in verdiği DNS kaydını tasarist.co alan adı DNS paneline ekle.

> Normal FTP hesabı bu Next.js uygulamasını çalıştırmak için yeterli değildir; hosting Node.js desteği sunsa bile Vercel başlangıç için daha kolaydır.
