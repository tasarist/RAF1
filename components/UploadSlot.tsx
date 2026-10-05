"use client";

import { useEffect, useId, useState } from "react";

export interface SlotFile {
  file: File;
  preview: string;
}

interface Props {
  title: string;
  subtitle: string;
  required?: boolean;
  value: SlotFile | null;
  onChange: (f: SlotFile | null) => void;
  compact?: boolean;
}

export function UploadSlot({ title, subtitle, required, value, onChange, compact }: Props) {
  const id = useId();
  const [drag, setDrag] = useState(false);
  useEffect(() => () => { if (value) URL.revokeObjectURL(value.preview); }, [value]);

  const accept = (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    if (!/^image\/(png|jpeg|webp)$/.test(f.type)) {
      alert("Lütfen PNG, JPG veya WEBP yükleyin.");
      return;
    }
    onChange({ file: f, preview: URL.createObjectURL(f) });
  };

  return (
    <label
      htmlFor={id}
      className={`upload ${drag ? "is-drag" : ""} ${value ? "has-file" : ""} ${compact ? "upload--optional" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); accept(e.dataTransfer.files); }}
    >
      <input id={id} type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => accept(e.target.files)} aria-label={title} />
      <div className="upload__head">
        <div>
          <div className="upload__title">{title}</div>
          <div className="upload__sub">{subtitle}</div>
        </div>
        <span className={`badge ${required ? "badge--info" : "badge--muted"}`}>{required ? "ZORUNLU" : "OPSİYONEL"}</span>
      </div>
      <div className="upload__preview">
        {value ? <img src={value.preview} alt={`${title} önizleme`} /> : <span>Sürükle-bırak veya tıkla<br /><span className="tiny">PNG · JPG · WEBP · ön yüz, düz zemin</span></span>}
      </div>
      {value ? (
        <div className="upload__foot">
          <span>{value.file.name} · {(value.file.size / 1024).toFixed(0)} KB</span>
          <button type="button" className="upload__remove" onClick={(e) => { e.preventDefault(); onChange(null); }}>Kaldır</button>
        </div>
      ) : null}
    </label>
  );
}
