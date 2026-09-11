"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { UploadCard } from "@/components/UploadCard";
import { Results } from "@/components/Results";
import type { AnalyzeApiResponse } from "@/lib/types";

type FileKey = "mainPack" | "competitor1" | "competitor2";
type BrandKey = "brandName" | "competitor1BrandName" | "competitor2BrandName";

const brandFieldByFile: Record<FileKey, BrandKey> = {
  mainPack: "brandName",
  competitor1: "competitor1BrandName",
  competitor2: "competitor2BrandName",
};

const ignoredFileWords = new Set([
  "ambalaj",
  "ana",
  "back",
  "competitor",
  "design",
  "final",
  "front",
  "gorsel",
  "görsel",
  "main",
  "mockup",
  "on",
  "pack",
  "package",
  "packaging",
  "rakip",
  "revize",
  "tasarim",
  "tasarım",
  "urun",
  "ürün",
  "versiyon",
  "version",
]);

function titleCaseWord(word: string) {
  const lower = word.toLocaleLowerCase("tr-TR");
  if (lower.length <= 2) return lower.toLocaleUpperCase("tr-TR");
  return lower.charAt(0).toLocaleUpperCase("tr-TR") + lower.slice(1);
}

function guessBrandName(fileName: string) {
  const baseName = fileName.replace(/\.[^/.]+$/, "");
  const words = baseName
    .replace(/[_-]+/g, " ")
    .replace(/[()[\]{}]/g, " ")
    .split(/\s+/)
    .map((word) => word.replace(/[^0-9A-Za-zÇĞİÖŞÜçğıöşü]/g, ""))
    .filter(Boolean)
    .filter((word) => {
      const normalized = word.toLocaleLowerCase("tr-TR");
      return !ignoredFileWords.has(normalized) && !/^\d+$/.test(normalized);
    });

  return words.slice(0, 2).map(titleCaseWord).join(" ");
}

export default function AnalyzePage() {
  const [category, setCategory] = useState("");
  const [productName, setProductName] = useState("");
  const [brandNames, setBrandNames] = useState<Record<BrandKey, string>>({
    brandName: "",
    competitor1BrandName: "",
    competitor2BrandName: "",
  });
  const [autoBrand, setAutoBrand] = useState<Record<BrandKey, boolean>>({
    brandName: true,
    competitor1BrandName: true,
    competitor2BrandName: true,
  });
  const [files, setFiles] = useState<Record<FileKey, File | null>>({
    mainPack: null,
    competitor1: null,
    competitor2: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyzeApiResponse | null>(null);

  const updateFile = (key: FileKey, file: File | null) => {
    const brandKey = brandFieldByFile[key];
    setFiles((current) => ({ ...current, [key]: file }));

    if (!file) return;
    const guessedBrand = guessBrandName(file.name);
    if (!guessedBrand) return;

    setBrandNames((current) => {
      if (!autoBrand[brandKey] && current[brandKey].trim()) return current;
      return { ...current, [brandKey]: guessedBrand };
    });
  };

  const updateBrandName = (key: BrandKey, value: string) => {
    setAutoBrand((current) => ({ ...current, [key]: false }));
    setBrandNames((current) => ({ ...current, [key]: value }));
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setData(null);

    if (!files.mainPack || !files.competitor1 || !files.competitor2) {
      setError("Ana ambalaj ve iki rakip görselini yüklemelisiniz.");
      return;
    }

    const form = new FormData();
    form.append("category", category);
    form.append("productName", productName);
    form.append("brandName", brandNames.brandName);
    form.append("competitor1BrandName", brandNames.competitor1BrandName);
    form.append("competitor2BrandName", brandNames.competitor2BrandName);
    form.append("mainPack", files.mainPack);
    form.append("competitor1", files.competitor1);
    form.append("competitor2", files.competitor2);

    try {
      setLoading(true);
      const response = await fetch("/api/analyze", { method: "POST", body: form });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Analiz başlatılamadı.");
      setData(json as AnalyzeApiResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Beklenmeyen hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <div className="container">
        <nav className="nav">
          <Link href="/" className="brand">5SE<span>™</span> Ambalaj Zekası</Link>
          <div className="navTag">MVP v0.1 · Demo motoru</div>
        </nav>

        <header className="pageTitle">
          <div className="eyebrow">Yeni analiz</div>
          <h1>Üç ambalajı yükleyin.</h1>
          <p>
            Bu sürüm analiz akışını ve sonuç ekranını doğrulamak için demo veri kullanır.
            Attention Insight ve OpenAI bağlantıları sonraki aşamada aktif edilir.
          </p>
        </header>

        <form onSubmit={submit}>
          <div className="formMeta projectMeta">
            <Field label="Kategori" value={category} setValue={setCategory} placeholder="Örn. Meyve suyu" />
            <Field label="Ürün adı" value={productName} setValue={setProductName} placeholder="Örn. Portakal" />
          </div>

          <div className="uploadGrid">
            <UploadCard title="ANA TASARIM" subtitle="Test edilecek ambalaj" file={files.mainPack} onChange={(f) => updateFile("mainPack", f)} />
            <UploadCard title="RAKİP 1" subtitle="Karşılaştırma ambalajı" file={files.competitor1} onChange={(f) => updateFile("competitor1", f)} />
            <UploadCard title="RAKİP 2" subtitle="Karşılaştırma ambalajı" file={files.competitor2} onChange={(f) => updateFile("competitor2", f)} />
          </div>

          <div className="formSectionLabel">Marka adları</div>
          <div className="brandFieldGrid">
            <Field label="Ana tasarım markası" value={brandNames.brandName} setValue={(value) => updateBrandName("brandName", value)} placeholder="Örn. Juss" />
            <Field label="Rakip 1 markası" value={brandNames.competitor1BrandName} setValue={(value) => updateBrandName("competitor1BrandName", value)} placeholder="Örn. Dimes" />
            <Field label="Rakip 2 markası" value={brandNames.competitor2BrandName} setValue={(value) => updateBrandName("competitor2BrandName", value)} placeholder="Örn. Cappy" />
          </div>

          {error ? <div className="alert error">{error}</div> : null}

          <div className="formFooter">
            <button className="button primary" type="submit" disabled={loading}>
              {loading ? "Analiz ediliyor..." : "Analiz Et"}
            </button>
            <div className="statusNote">v0.1 dosyaları kalıcı depolamaz.</div>
          </div>
        </form>

        {data ? <Results data={data} /> : null}
        <footer className="footer">5SE™ MVP v0.1 · Prototip sürüm</footer>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  setValue,
  placeholder,
}: {
  label: string;
  value: string;
  setValue: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input required value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} />
    </label>
  );
}
