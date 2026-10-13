"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Verdict } from "@/components/pa/shared";
import { api } from "@/lib/pa/client";
import "../analyze/wizard.css";

type Row = {
  id: string; kind: "pack" | "competitors" | "shelf"; status: string; createdAt: string; step: string | null;
  project: { name: string; brand: string; category: string }; total: number | null; verdict: string | null;
};

const KIND: Record<Row["kind"], string> = { pack: "Ambalaj analizi", competitors: "Rakip Testi", shelf: "Raf Testi" };
const STATUS: Record<string, string> = { draft: "Devam ediyor", analyzed: "Analiz edildi", completed: "Tamamlandı" };

export default function AnalysesPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { api<Row[]>("/api/analyses").then(setRows).catch((e: Error) => setError(e.message)); }, []);

  return (
    <>
      <SiteHeader />
      <main className="wz container">
        <div className="wz-top">
          <div><span className="wz-eyebrow">Hesaptaki kayıtlar silinmez</span><h1>Analizlerim</h1></div>
          <Link href="/analyze" className="wz-btn">Yeni analiz</Link>
        </div>
        {error ? <p className="wz-error">{error}</p> : null}
        {rows && !rows.length ? <div className="wz-panel"><p>Henüz analiz yok. <Link href="/analyze" className="wz-link">İlk analizi başlatın</Link>.</p></div> : null}
        {rows?.length ? (
          <div className="wz-panel wz-scroll">
            <table className="wz-table">
              <thead><tr><th>Proje</th><th>Tür</th><th>Durum</th><th className="num">5SE™</th><th>Karar</th><th>Tarih</th><th /></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td><b>{r.project.name}</b><br /><span className="wz-muted small">{r.project.brand} · {r.project.category}</span></td>
                    <td>{KIND[r.kind]}</td>
                    <td>{STATUS[r.status] ?? r.status}</td>
                    <td className="num"><b>{r.total ?? "—"}</b></td>
                    <td>{r.kind === "pack" ? <Verdict verdict={r.verdict} /> : "—"}</td>
                    <td>{new Date(r.createdAt).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })}</td>
                    <td><Link className="wz-btn ghost small" href={`/analyze?resume=${r.id}`}>{r.status === "draft" ? "Devam et" : "Aç"}</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </main>
    </>
  );
}
