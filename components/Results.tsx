import type { ReactNode } from "react";
import type { AnalyzeApiResponse } from "@/lib/types";

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

export function Results({ data }: { data: AnalyzeApiResponse }) {
  const r = data.result;
  const shelfAverage = r.shelfTests.length
    ? Math.round((r.shelfTests.reduce((sum, x) => sum + x.mainAttentionShare, 0) / r.shelfTests.length) * 10) / 10
    : 0;
  const bestShelf = r.shelfTests.length
    ? r.shelfTests.reduce((best, test) => test.mainAttentionShare > best.mainAttentionShare ? test : best, r.shelfTests[0])
    : null;
  const attention = r.singlePackAttention;
  const brands = {
    main: data.project.brandName || "Ana Tasarım",
    competitor1: data.project.competitor1BrandName || "Rakip 1",
    competitor2: data.project.competitor2BrandName || "Rakip 2",
  };

  return (
    <section className="results">
      <div className="resultsHeader">
        <div>
          <div className="eyebrow">Analiz sonucu</div>
          <h2>{data.project.brandName} · {data.project.productName}</h2>
        </div>
        <div className="mockBadge">Demo veri · gerçek API henüz bağlı değil</div>
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
        <MetricCard label="Tekil Ambalaj Dikkati" value={r.scores.singlePackAttention} note="Dikkat yönetimi" />
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

        <article className="panel">
          <div className="panelTitle compact">
            <div>
              <span>Attention Insight</span>
              <h3>Tekil ambalaj sinyalleri</h3>
            </div>
          </div>
          <div className="miniMetrics">
            <div><span>Odak</span><strong>{attention?.focusScore ?? "Yok"}</strong></div>
            <div><span>Netlik</span><strong>{attention?.clarityScore ?? "Yok"}</strong></div>
          </div>
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
          <span>Sonraki aşama</span>
          <strong>Attention Insight API bağlandığında bu panel gerçek ısı haritası, odak haritası ve AOI yüzdeleriyle beslenecek.</strong>
        </div>
        <button className="button" type="button" disabled>Tasarımı Optimize Et · yakında</button>
      </div>
    </section>
  );
}
