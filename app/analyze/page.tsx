"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { UploadCard } from "@/components/UploadCard";
import { Results } from "@/components/Results";
import type { AnalyzeApiResponse } from "@/lib/types";

type FileKey = "mainPack" | "competitor1" | "competitor2";

export default function AnalyzePage() {
  const [category, setCategory] = useState("");
  const [brandName, setBrandName] = useState("");
  const [productName, setProductName] = useState("");
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
    form.append("brandName", brandName);
    form.append("productName", productName);
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
          <Link href="/" className="brand">5SE<span>™</span> Packaging Intelligence</Link>
          <div className="navTag">MVP v0.1 · Mock engine</div>
        </nav>

        <header className="pageTitle">
          <div className="eyebrow">New analysis</div>
          <h1>Üç ambalajı yükleyin.</h1>
          <p>
            Bu sürüm analiz akışını ve sonuç ekranını doğrulamak için mock veri kullanır.
            Attention Insight ve OpenAI bağlantıları sonraki sprintte aktif edilir.
          </p>
        </header>

        <form onSubmit={submit}>
          <div className="formMeta">
            <Field label="Kategori" value={category} setValue={setCategory} placeholder="Örn. Meyve suyu" />
            <Field label="Marka" value={brandName} setValue={setBrandName} placeholder="Örn. Juss" />
            <Field label="Ürün" value={productName} setValue={setProductName} placeholder="Örn. Portakal" />
          </div>

          <div className="uploadGrid">
            <UploadCard title="YOUR PACK" subtitle="Ana tasarım" file={files.mainPack} onChange={(f) => updateFile("mainPack", f)} />
            <UploadCard title="COMPETITOR 1" subtitle="Rakip ambalaj" file={files.competitor1} onChange={(f) => updateFile("competitor1", f)} />
            <UploadCard title="COMPETITOR 2" subtitle="Rakip ambalaj" file={files.competitor2} onChange={(f) => updateFile("competitor2", f)} />
          </div>

          {error ? <div className="alert error">{error}</div> : null}

          <div className="formFooter">
            <button className="button primary" type="submit" disabled={loading}>
              {loading ? "Analiz ediliyor…" : "Analyze"}
            </button>
            <div className="statusNote">v0.1 dosyaları kalıcı depolamaz.</div>
          </div>
        </form>

        {data ? <Results data={data} /> : null}
        <footer className="footer">5SE™ MVP v0.1 · Prototype build</footer>
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
