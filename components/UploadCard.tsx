"use client";

import { useEffect, useState } from "react";

export function UploadCard({
  title,
  subtitle,
  helper,
  file,
  onChange,
}: {
  title: string;
  subtitle: string;
  helper?: string;
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <label className="uploadCard">
      <div className="uploadTop">
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </div>

      <div className="preview">
        {previewUrl ? <img src={previewUrl} alt={`${title} önizleme`} /> : null}
      </div>

      <div className="uploadBottom">
        <div className="fileName">{file ? file.name : `PNG, JPG veya WEBP · ${helper ?? "görsel"}`}</div>
        <span className="uploadPill">{file ? "Görseli değiştir" : "Görsel yükle"}</span>
      </div>

      <input
        className="hiddenInput"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
    </label>
  );
}
