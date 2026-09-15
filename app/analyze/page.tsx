"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { UploadCard } from "@/components/UploadCard";
import { Results } from "@/components/Results";
import type { AnalyzeApiResponse } from "@/lib/types";

type FileKey = "mainPack" | "competitor1" | "competitor2";
type BrandKey = "brandName" | "competitor1BrandName" | "competitor2BrandName";
type AnalyzeErrorResponse = { error?: string };

const MAX_FILE_BYTES = 1.2 * 1024 * 1024;
const MAX_TOTAL_UPLOAD_BYTES = 3.5 * 1024 * 1024;

function formatMb(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateUploadSize(files: File[]) {
  const oversized = files.find((file) => file.size > MAX_FILE_BYTES);
  if (oversized) {
    return `${oversized.name} ${formatMb(MAX_FILE_BYTES)} canlı MVP sınırını aşıyor. Lütfen görseli küçültüp tekrar yükleyin.`;
  }

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  if (totalSize > MAX_TOTAL_UPLOAD_BYTES) {
    return `Üç görselin toplamı ${formatMb(MAX_TOTAL_UPLOAD_BYTES)} sınırını aşıyor. Lütfen görselleri biraz sıkıştırın.`;
  }

  return null;
}

async function parseAnalyzeResponse(response: Response): Promise<AnalyzeApiResponse | AnalyzeErrorResponse> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  if (response.status === 413 || text.includes("FUNCTION_PAYLOAD_TOO_LARGE")) {
    return {
      error: "Görseller canlı yükleme sınırını aşıyor. Lütfen her görseli yaklaşık 1.2 MB altına küçültün.",
    };
  }

  return { error: text || "Analiz başlatılamadı." };
}

export default function AnalyzePage() {
  const [category, setCategory] = useState("");
  const [productName, setProductName] = useState("");
  const [brandNames, setBrandNames] = useState<Record<BrandKey, string>>({
    brandName: "",
    competitor1BrandName: "",
    competitor2BrandName: "",
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
    setFiles((current) => ({ ...current, [key]: file }));
  };

  const updateBrandName = (key: BrandKey, value: string) => {
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

    const selectedFiles = [files.mainPack, files.competitor1, files.competitor2] as File[];
    const sizeError = validateUploadSize(selectedFiles);
    if (sizeError) {
      setError(sizeError);
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
      const json = await parseAnalyzeResponse(response);
      if (!response.ok) {
        const message = "error" in json ? json.error : null;
        throw new Error(message || "Analiz başlatılamadı.");
      }
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
          <div className="navTag">MVP v0.2 · Feng-GUI canlı</div>
        </nav>

        <header className="pageTitle">
          <div className="eyebrow">Yeni analiz</div>
          <h1>Üç ambalajı yükleyin.</h1>
          <p>
            Ana tasarımınızı ve iki rakibi ekleyin. Marka adlarını elle girin;
            sonuç ekranında tüm raf karşılaştırmaları bu isimlerle gösterilir.
            Canlı MVP için görselleri 1024×1024 piksel olarak hazırlayın ve her dosyayı 1.2 MB altında tutun.
          </p>
        </header>

        <form onSubmit={submit}>
          <div className="formMeta projectMeta">
            <Field label="Kategori" value={category} setValue={setCategory} placeholder="Örn. Meyve suyu" />
            <Field label="Ürün adı" value={productName} setValue={setProductName} placeholder="Örn. Portakal" />
          </div>

          <div className="uploadGrid">
            <UploadCard title="ANA TASARIM" subtitle="Test edilecek ambalaj" helper="1024×1024 px önerilir · Maks. 1.2 MB" file={files.mainPack} onChange={(f) => updateFile("mainPack", f)} />
            <UploadCard title="RAKİP 1" subtitle="Karşılaştırma ambalajı" helper="1024×1024 px önerilir · Maks. 1.2 MB" file={files.competitor1} onChange={(f) => updateFile("competitor1", f)} />
            <UploadCard title="RAKİP 2" subtitle="Karşılaştırma ambalajı" helper="1024×1024 px önerilir · Maks. 1.2 MB" file={files.competitor2} onChange={(f) => updateFile("competitor2", f)} />
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
            <div className="statusNote">v0.1 dosyaları kalıcı depolamaz; büyük görseller bir sonraki sprintte desteklenecek.</div>
          </div>
        </form>

        {data ? <Results data={data} mainPackFile={files.mainPack} /> : null}
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
