"use client";

import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/client/env";
import type { PublicStatus } from "@/lib/config";

export function ModeBadge() {
  const [status, setStatus] = useState<PublicStatus | null>(null);
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    fetch(apiUrl("/api/status"))
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setStatus)
      .catch(() => setOffline(true));
  }, []);
  if (offline) return <span className="badge badge--critical" title="API sunucusuna ulaşılamadı"><i />API YOK</span>;
  if (!status) return <span className="badge badge--muted" style={{ minWidth: 92 }}>…</span>;
  if (status.mode === "mock") {
    return (
      <span className="badge badge--mock" title="USE_MOCK_DATA=true — gerçek attention API çağrısı yapılmıyor">
        <i />
        MOCK · PROTOTİP
      </span>
    );
  }
  return (
    <span className="badge badge--live" title={`Attention provider: ${status.attentionProvider}`}>
      <i />
      LIVE · {status.attentionProvider === "attention_insight" ? "ATTENTION INSIGHT" : status.attentionProvider.toUpperCase()}
    </span>
  );
}
