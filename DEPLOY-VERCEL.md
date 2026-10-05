# Vercel'e deploy

## GitHub üzerinden (önerilen)

1. Bu repo (`tasarist/RAF1`) GitHub'da güncel olsun.
2. vercel.com → **Add New → Project** → GitHub hesabını bağla → `RAF1` reposunu seç.
3. Framework: **Next.js** (otomatik algılanır). Build komutu `next build`, output varsayılan.
4. **Environment Variables**:

   | Key | Value |
   | --- | --- |
   | `USE_MOCK_DATA` | `true` (anahtarsız mock demo) |
   | `ATTENTION_PROVIDER` | `attention_insight` |
   | `ATTENTION_INSIGHT_API_KEY` | anahtar geldiğinde |
   | `OPENAI_API_KEY` | anahtar geldiğinde |
   | `OPENAI_MODEL` | `gpt-4.1-mini` |
   | `OPENAI_IMAGE_MODEL` | `gpt-image-1` |

   Canlıya geçmek için `USE_MOCK_DATA=false` yap ve yeniden deploy et. Anahtar eksikse sistem kendiliğinden mock'a döner, hata vermez.

5. **Deploy.**

## Dikkat edilecekler

- `app/api/analyze` ve `app/api/analyses/[id]/optimize` route'ları `maxDuration = 300` ister; Hobby planda üst sınır 60 s olabilir. Mock modda analiz < 2 s sürer; canlı Attention Insight polling'i için Pro plan önerilir.
- İstek boyutu sınırı ~4,5 MB: istemci görselleri 1200 px'e küçültüp JPEG olarak gönderir; sunucu ayrıca 4 MB/dosya doğrular.
- `sharp` Vercel'in Node 20 runtime'ında hazır çalışır (`serverExternalPackages` ayarlı).
- Sonuçlar tarayıcıda (IndexedDB) tutulur; sunucu önbelleği fonksiyon soğuduğunda silinir. Kalıcı kayıt için Supabase sonraki fazda.

## Subdomain

Settings → Domains → `ai.tasarist.co` → Vercel'in verdiği CNAME kaydını tasarist.co DNS paneline ekle.

## Alternatif: Vercel CLI

```bash
npm i -g vercel
vercel link
vercel env add USE_MOCK_DATA production   # true
vercel --prod
```
