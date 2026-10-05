// Generates three synthetic packaging fronts for local/mock testing (no real brands).
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";

mkdirSync("public/samples", { recursive: true });

function pack({ bg, accent, brand, product, claim, shape }) {
  const body =
    shape === "bottle"
      ? `<path d="M270 40h180v90c60 30 90 90 90 160v470c0 30-20 50-50 50H230c-30 0-50-20-50-50V290c0-70 30-130 90-160z" fill="${bg}"/>`
      : shape === "pouch"
      ? `<path d="M120 90c0-30 20-50 50-50h380c30 0 50 20 50 50v600c0 40-30 70-70 70H190c-40 0-70-30-70-70z" fill="${bg}"/>`
      : `<rect x="110" y="40" width="500" height="740" rx="18" fill="${bg}"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="820" viewBox="0 0 720 820">
    <rect width="720" height="820" fill="#ffffff"/>
    ${body}
    <rect x="180" y="150" width="360" height="90" rx="14" fill="${accent}"/>
    <text x="360" y="212" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="58" fill="#ffffff" text-anchor="middle" letter-spacing="3">${brand}</text>
    <ellipse cx="360" cy="460" rx="170" ry="150" fill="#fff" opacity="0.92"/>
    <ellipse cx="360" cy="470" rx="120" ry="100" fill="${accent}" opacity="0.65"/>
    <circle cx="315" cy="440" r="26" fill="#fff" opacity="0.8"/>
    <text x="360" y="640" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="42" fill="#1d1d1d" text-anchor="middle">${product}</text>
    <text x="360" y="700" font-family="Arial, Helvetica, sans-serif" font-size="26" fill="#333" text-anchor="middle">${claim}</text>
    <rect x="200" y="735" width="320" height="8" rx="4" fill="${accent}" opacity="0.5"/>
  </svg>`;
  return sharp(Buffer.from(svg)).jpeg({ quality: 88 }).toBuffer();
}

const specs = [
  ["main.jpg", { bg: "#5ECCFD", accent: "#0413EC", brand: "NORDIKA", product: "Süzme Yoğurt", claim: "%10 yağlı · 500 g", shape: "tub" }],
  ["competitor1.jpg", { bg: "#F4E7C6", accent: "#C0392B", brand: "ÇİFTLİKÇİ", product: "Kaymaklı Yoğurt", claim: "Geleneksel lezzet · 500 g", shape: "tub" }],
  ["competitor2.jpg", { bg: "#E8F5E9", accent: "#1E8449", brand: "YEŞİLOVA", product: "Organik Yoğurt", claim: "Sertifikalı organik · 500 g", shape: "tub" }],
  ["previous.jpg", { bg: "#9ADFFF", accent: "#0A2FA8", brand: "NORDIKA", product: "Yoğurt", claim: "500 g", shape: "tub" }],
  ["sku.jpg", { bg: "#5ECCFD", accent: "#FFAB40", brand: "NORDIKA", product: "Kefir", claim: "Probiyotik · 1 L", shape: "bottle" }],
];
for (const [name, spec] of specs) writeFileSync(`public/samples/${name}`, await pack(spec));
console.log("samples written");
