"use client";

import { ReactNode, useEffect, useState } from "react";
import type { AnalyzeApiResponse, SinglePackAttentionResult } from "@/lib/types";

type OptimizedDesign = {
  optimizedImageUrl: string;
  prompt: string;
  model: string;
  quality: string;
  revisedPrompt?: string | null;
};

type OptimizeErrorResponse = {
  error?: string;
};

function scoreLabel(value: number) {
  if (value >= 80) return "Çok güçlü";
  if (value >= 60) return "Güçlü";
  if (value >= 40) return "Orta";
  return "Zayıf";
}

function scoreTone(value: number) {
  if (value >= 80) return "good";
  if (value >= 60) return "solid";
  if (value >= 40) return "warn";
  return "danger";
}

function shelfLabel(layout: string) {
  const labels: Record<string, string> = {
    main_left: "Ana tasarım solda",
    main_center: "Ana tasarım ortada",
    main_right: "Ana tasarım sağda",
  };
  return labels[layout] ?? layout.replaceAll("_", " ");
}

function metricValue(value?: number) {
  return typeof value === "number" ? value : "Yok";
}

function metricText(value?: number) {
  return typeof value === "number" ? `${value}/100` : "veri yok";
}

function fengGuiSummary(attention?: SinglePackAttentionResult) {
  if (!attention) {
    return "Feng-GUI verisi henüz gelmediği için bu bölüm demo sinyallerle gösteriliyor. Canlı analizde genel etki, odak, netlik ve karmaşıklık değerleri burada birlikte yorumlanacak.";
  }

  return `Feng-GUI genel skoru ${metricText(attention.overallScore)}, ambalajın ilk bakışta oluşturduğu toplam dikkat etkisini gösterir. Odak ${metricText(attention.focusScore)} ve netlik ${metricText(attention.clarityScore)} değerleri, dikkatin doğru alanlarda toplanıp toplanmadığını ve tasarımın ne kadar kolay çözüldüğünü anlatır. Karmaşıklık ${metricText(attention.complexityScore)} seviyesindedir; bu değer yükseldikçe mesajın hızlı anlaşılması zorlaşabilir.`;
}

function fengMetricTone(value?: number, reverse = false) {
  if (typeof value !== "number") return "muted";
  const effective = reverse ? 100 - value : value;
  if (effective >= 80) return "good";
  if (effective >= 60) return "solid";
  if (effective >= 40) return "warn";
  return "danger";
}

function MetricCard({ label, value, suffix = "/100", note, primary = false }: {
  label: string;
  value: number | null;
  suffix?: string;
  note?: string;
  primary?: boolean;
}) {
  if (value === null) {
    return (
      <article className="scoreCard disabled">
        <div className="scoreLabel">{label}</div>
        <div>
          <div className="scoreValue">Yok</div>
          <div className="scoreLabel">Referans görsel yok</div>
        </div>
      </article>
    );
  }

  return (
    <article className={`scoreCard ${primary ? "primary" : ""}`}>
      <div className="scoreLabel">{label}</div>
      <div>
        <div className="scoreValue">{value}<small>{suffix}</small></div>
        <div className={`scoreBand ${scoreTone(value)}`}>{note ?? scoreLabel(value)}</div>
      </div>
    </article>
  );
}

function Bar({ label, value }: { label: ReactNode; value: number }) {
  return (
    <div className="barRow">
      <div className="barTop"><span>{label}</span><strong>{value}%</strong></div>
      <div className="barTrack"><div className="barFill" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div>
    </div>
  );
}

function FengMetricBar({
  label,
  value,
  description,
  reverse = false,
}: {
  label: string;
  value?: number;
  description: string;
  reverse?: boolean;
}) {
  const displayValue = typeof value === "number" ? value : 0;

  return (
    <div className={`fengMetricBar ${fengMetricTone(value, reverse)}`}>
      <div className="fengMetricTop">
        <div>
          <strong>{label}</strong>
          <span>{description}</span>
        </div>
        <b>{typeof value === "number" ? value : "Yok"}</b>
      </div>
      <div className="fengTrack">
        <i style={{ width: `${Math.min(100, Math.max(0, displayValue))}%` }} />
      </div>
    </div>
  );
}

async function parseOptimizeResponse(response: Response): Promise<OptimizedDesign | OptimizeErrorResponse> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  return { error: await response.text() || "Tasarım üretilemedi." };
}

export function Results({ data, mainPackFile }: { data: AnalyzeApiResponse; mainPackFile?: File | null }) {
  const r = data.result;
  const [optimizing, setOptimizing] = useState(false);
  const [optimizeError, setOptimizeError] = useState<string | null>(null);
  const [optimizedDesign, setOptimizedDesign] = useState<OptimizedDesign | null>(null);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState<string | null>(null);
  const isLive = r.source === "feng_gui";
  const shelfAverage = r.shelfTests.length
    ? Math.round((r.shelfTests.reduce((sum, x) => sum + x.mainAttentionShare, 0) / r.shelfTests.length) * 10) / 10
    : 0;
  const bestShelf = r.shelfTests.length
    ? r.shelfTests.reduce((best, test) => test.mainAttentionShare > best.mainAttentionShare ? test : best, r.shelfTests[0])
    : null;
  const attention = r.singlePackAttention;
  const reportLinks = [
    { label: "Isı haritası", url: attention?.heatmapUrl },
    { label: "Dikkat haritası", url: attention?.rawAttentionUrl },
    { label: "Opacity raporu", url: attention?.opacityReportUrl },
    { label: "Gazeplot raporu", url: attention?.gazeplotReportUrl },
    { label: "AOI raporu", url: attention?.aoiReportUrl },
    { label: "Estetik raporu", url: attention?.aestheticsReportUrl },
  ].filter((link): link is { label: string; url: string } => Boolean(link.url));
  const fengGuiVisuals = [
    { label: "Isı haritası", url: attention?.heatmapUrl, description: "Dikkatin yoğunlaştığı alanlar" },
    { label: "Gazeplot raporu", url: attention?.gazeplotReportUrl, description: "Bakış sırası ve odak noktaları" },
  ].filter((visual): visual is { label: string; url: string; description: string } => Boolean(visual.url));
  const brands = {
    main: data.project.brandName || "Ana Tasarım",
    competitor1: data.project.competitor1BrandName || "Rakip 1",
    competitor2: data.project.competitor2BrandName || "Rakip 2",
  };

  useEffect(() => {
    if (!mainPackFile) {
      setOriginalPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(mainPackFile);
    setOriginalPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [mainPackFile]);

  async function optimizeDesign() {
    if (!mainPackFile) {
      setOptimizeError("Optimize tasarım için ana ambalaj görseli bulunamadı. Lütfen analizi tekrar çalıştırın.");
      return;
    }

    const form = new FormData();
    form.append("mainPack", mainPackFile);
    form.append("project", JSON.stringify(data.project));
    form.append("analysis", JSON.stringify(r));

    try {
      setOptimizing(true);
      setOptimizeError(null);
      const response = await fetch("/api/optimize", { method: "POST", body: form });
      const json = await parseOptimizeResponse(response);
      if (!response.ok) {
        const message = "error" in json ? json.error : null;
        throw new Error(message || "Tasarım üretilemedi.");
      }
      setOptimizedDesign(json as OptimizedDesign);
    } catch (error) {
      setOptimizeError(error instanceof Error ? error.message : "Beklenmeyen hata oluştu.");
    } finally {
      setOptimizing(false);
    }
  }

  return (
    <section className="results">
      <div className="resultsHeader">
        <div>
          <div className="eyebrow">Analiz sonucu</div>
          <h2>{data.project.brandName} · {data.project.productName}</h2>
        </div>
        <div className={`mockBadge ${isLive ? "live" : ""}`}>
          {r.aiEnhanced
            ? "Feng-GUI + GPT yorum · raf demo"
            : isLive ? "Feng-GUI canlı veri · raf demo" : "Demo veri · gerçek API kapalı"}
        </div>
      </div>

      <div className="resultHero">
        <div className="heroScore">
          <span>Genel 5SE Skoru</span>
          <strong>{r.scores.overall5seScore}</strong>
          <em>/100</em>
        </div>
        <div className="heroCopy">
          <div className={`scoreBand ${scoreTone(r.scores.overall5seScore)}`}>{scoreLabel(r.scores.overall5seScore)} performans</div>
          <p>{r.summary}</p>
        </div>
        <div className="heroStats">
          <div><span>Raf Endeksi</span><strong>{r.scores.shelfPerformanceIndex}</strong></div>
          <div><span>Ortalama Dikkat Payı</span><strong>{shelfAverage}%</strong></div>
          <div><span>En İyi Konum</span><strong>{bestShelf ? shelfLabel(bestShelf.layout).replace("Ana tasarım ", "") : "Yok"}</strong></div>
        </div>
      </div>

      <div className="scoreGrid expanded">
        <MetricCard label="Özgünlük" value={r.scores.uniqueness} note="Rakibe göre ayrışma" />
        <MetricCard label="Ürün Netliği" value={r.scores.productClarity} note="Ürün ve vaat netliği" />
        <MetricCard label="Tekil Ambalaj Dikkati" value={r.scores.singlePackAttention} note={isLive ? "Feng-GUI verisi" : "Dikkat yönetimi"} />
        <MetricCard label="Dikkat ve Raf Etkisi" value={r.scores.attentionStandout} note="Raf + tekil performans" primary />
        <MetricCard label="Mesafe Netliği" value={r.scores.consumerDistanceClarity} note="5m / 3m / 1m akışı" />
        <MetricCard label="Süreklilik" value={r.scores.continuityConsistency} />
      </div>

      <div className="resultsColumns">
        <article className="panel span2">
          <div className="panelTitle">
            <div>
              <span>Raf performansı</span>
              <h3>Üç konumda dikkat payı</h3>
            </div>
            <strong>{r.scores.shelfPerformanceIndex} endeks</strong>
          </div>
          <div className="shelfList">
            {r.shelfTests.map((test) => (
              <div className="shelfItem" key={test.layout}>
                <div className="shelfItemTitle">{shelfLabel(test.layout)}</div>
                <Bar label={<strong className="barBrand">{brands.main}</strong>} value={test.mainAttentionShare} />
                <Bar label={<strong className="barBrand">{brands.competitor1}</strong>} value={test.competitor1AttentionShare} />
                <Bar label={<strong className="barBrand">{brands.competitor2}</strong>} value={test.competitor2AttentionShare} />
              </div>
            ))}
          </div>
        </article>

        <article className="panel fengGuiPanel">
          <div className="panelTitle compact">
            <div>
              <span>{isLive ? "Feng-GUI canlı veri" : "Demo attention"}</span>
              <h3>Tekil ambalaj dikkat analizi</h3>
            </div>
          </div>
          <p className="fengGuiIntro">{fengGuiSummary(attention)}</p>

          <div className="fengMetricList">
            <FengMetricBar label="Genel" value={attention?.overallScore} description="Toplam dikkat performansı" />
            <FengMetricBar label="Odak" value={attention?.focusScore} description="Dikkatin ne kadar toplandığı" />
            <FengMetricBar label="Netlik" value={attention?.clarityScore} description="Mesajın kolay çözülebilmesi" />
            <FengMetricBar label="Karmaşıklık" value={attention?.complexityScore} description="Düşük olması daha iyidir" reverse />
          </div>

          <div className="miniMetrics expanded fengSecondaryMetrics">
            <div><span>Hafıza</span><strong>{metricValue(attention?.memoryScore)}</strong></div>
            <div><span>Yaklaşma</span><strong>{metricValue(attention?.approachScore)}</strong></div>
            <div><span>Geri çekilme</span><strong>{metricValue(attention?.withdrawScore)}</strong></div>
            <div><span>Heyecan</span><strong>{metricValue(attention?.excitingScore)}</strong></div>
            <div><span>Denge</span><strong>{metricValue(attention?.balanceScore)}</strong></div>
          </div>
          {fengGuiVisuals.length ? (
            <div className="fengVisualGrid">
              {fengGuiVisuals.map((visual) => (
                <figure className="fengVisualCard" key={visual.label}>
                  <div className="fengVisualImage">
                    <img src={visual.url} alt={`Feng-GUI ${visual.label}`} />
                  </div>
                  <figcaption>
                    <strong>{visual.label}</strong>
                    <span>{visual.description}</span>
                    <a href={visual.url} target="_blank" rel="noreferrer">Raporu aç</a>
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : null}
          {reportLinks.length ? (
            <div className="fengReportLinks">
              {reportLinks.map((link) => (
                <a key={link.label} href={link.url} target="_blank" rel="noreferrer">{link.label}</a>
              ))}
            </div>
          ) : null}
          <div className="aoiList">
            {attention?.aoi?.logo !== undefined ? <Bar label="Logo dikkati" value={attention.aoi.logo} /> : null}
            {attention?.aoi?.productName !== undefined ? <Bar label="Ürün adı" value={attention.aoi.productName} /> : null}
            {attention?.aoi?.mainClaim !== undefined ? <Bar label="Ana vaat" value={attention.aoi.mainClaim} /> : null}
            {attention?.aoi?.productVisual !== undefined ? <Bar label="Ürün görseli" value={attention.aoi.productVisual} /> : null}
          </div>
        </article>
      </div>

      <div className="diagnosisGrid">
        <article className="panel issuePanel critical">
          <span>Kritik</span>
          <ul>{r.criticalIssues.map((x) => <li key={x}>{x}</li>)}</ul>
        </article>
        <article className="panel issuePanel important">
          <span>Önemli</span>
          <ul>{r.importantIssues.map((x) => <li key={x}>{x}</li>)}</ul>
        </article>
        <article className="panel issuePanel opportunity">
          <span>Fırsat</span>
          <ul>{r.opportunities.map((x) => <li key={x}>{x}</li>)}</ul>
        </article>
      </div>

      <div className="detailGrid refined">
        <article className="detail">
          <h3>Güçlü yönler</h3>
          <ul>{r.strengths.map((x) => <li key={x}>{x}</li>)}</ul>
        </article>
        <article className="detail span2">
          <h3>İyileştirme yönü</h3>
          <ol>{r.recommendations.map((x) => <li key={x}>{x}</li>)}</ol>
        </article>
      </div>

      <div className="nextStepBox">
        <div>
          <span>Tasarım üret</span>
          <strong>
            {isLive
              ? "Analizde çıkan kritik sorunlara göre tek bir optimize grafik tasarım konsepti oluşturulur. Çıktı 1024×1024 kalır; şişe/kutu oranı, ambalaj formu, kontur ve genel yapı korunur. Yalnızca etiket, renk, tipografi ve mesaj hiyerarşisi iyileştirilir."
              : "Demo modda da optimize grafik konsept üretilebilir; canlı veriyle daha doğru tasarım brief'i oluşur."}
          </strong>
        </div>
        <button className="button" type="button" onClick={optimizeDesign} disabled={!mainPackFile || optimizing}>
          {optimizing ? "Tasarım üretiliyor..." : "Tasarımı Optimize Et"}
        </button>
      </div>

      {optimizeError ? <div className="alert error optimizeAlert">{optimizeError}</div> : null}

      {optimizedDesign ? (
        <article className="optimizedDesignPanel">
          <div className="panelTitle">
            <div>
              <span>Optimize tasarım konsepti</span>
              <h3>Analiz yorumlarına göre üretilen yeni yön</h3>
            </div>
            <strong>{optimizedDesign.quality} kalite</strong>
          </div>
          <div className="beforeAfterGrid">
            <div className="optimizedImageCard">
              <span>Orijinal</span>
              {originalPreviewUrl ? <img src={originalPreviewUrl} alt="Orijinal ambalaj" /> : <div className="imagePlaceholder">Orijinal görsel yok</div>}
            </div>
            <div className="optimizedImageCard featured">
              <span>Optimize konsept</span>
              <img src={optimizedDesign.optimizedImageUrl} alt="Optimize edilmiş ambalaj konsepti" />
            </div>
          </div>
          <p className="designDisclaimer">
            Bu çıktı üretime hazır final artwork değildir; 5SE teşhisine göre oluşturulmuş test edilebilir tasarım konseptidir.
            Çıktı 1024×1024 formatında kalır. Ambalajın fiziksel formu, konturu ve oranları korunmalı; değişiklik yalnızca grafik tasarım yüzeyinde değerlendirilmelidir.
            Bir sonraki aşamada bu görsel tekrar Feng-GUI ile ölçülüp orijinal tasarımla karşılaştırılabilir.
          </p>
        </article>
      ) : null}
    </section>
  );
}
