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
          <div className="scoreValue">N/A</div>
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

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div className="barRow">
      <div className="barTop"><span>{label}</span><strong>{value}%</strong></div>
      <div className="barTrack"><div className="barFill" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div>
    </div>
  );
}

export function Results({ data }: { data: AnalyzeApiResponse }) {
  const r = data.result;
  const shelfAverage = Math.round((r.shelfTests.reduce((sum, x) => sum + x.mainAttentionShare, 0) / r.shelfTests.length) * 10) / 10;
  const bestShelf = r.shelfTests.reduce((best, test) => test.mainAttentionShare > best.mainAttentionShare ? test : best, r.shelfTests[0]);
  const attention = r.singlePackAttention;

  return (
    <section className="results">
      <div className="resultsHeader">
        <div>
          <div className="eyebrow">Analysis result</div>
          <h2>{data.project.brandName} · {data.project.productName}</h2>
        </div>
        <div className="mockBadge">Mock data · gerçek API henüz bağlı değil</div>
      </div>

      <div className="resultHero">
        <div className="heroScore">
          <span>Overall 5SE Score</span>
          <strong>{r.scores.overall5seScore}</strong>
          <em>/100</em>
        </div>
        <div className="heroCopy">
          <div className={`scoreBand ${scoreTone(r.scores.overall5seScore)}`}>{scoreLabel(r.scores.overall5seScore)} performans</div>
          <p>{r.summary}</p>
        </div>
        <div className="heroStats">
          <div><span>Shelf Index</span><strong>{r.scores.shelfPerformanceIndex}</strong></div>
          <div><span>Avg. Attention Share</span><strong>{shelfAverage}%</strong></div>
          <div><span>Best Position</span><strong>{shelfLabel(bestShelf.layout).replace("Ana tasarım ", "")}</strong></div>
        </div>
      </div>

      <div className="scoreGrid expanded">
        <MetricCard label="Uniqueness" value={r.scores.uniqueness} note="Rakibe göre ayrışma" />
        <MetricCard label="Product Clarity" value={r.scores.productClarity} note="Ürün ve vaat netliği" />
        <MetricCard label="Single Pack Attention" value={r.scores.singlePackAttention} note="Tekil dikkat yönetimi" />
        <MetricCard label="Attention & Stand-out" value={r.scores.attentionStandout} note="Raf + tekil performans" primary />
        <MetricCard label="Distance Clarity" value={r.scores.consumerDistanceClarity} note="5m / 3m / 1m akışı" />
        <MetricCard label="Continuity" value={r.scores.continuityConsistency} />
      </div>

      <div className="resultsColumns">
        <article className="panel span2">
          <div className="panelTitle">
            <div>
              <span>Raf performansı</span>
              <h3>Üç pozisyonda dikkat payı</h3>
            </div>
            <strong>{r.scores.shelfPerformanceIndex} index</strong>
          </div>
          <div className="shelfList">
            {r.shelfTests.map((test) => (
              <div className="shelfItem" key={test.layout}>
                <div className="shelfItemTitle">{shelfLabel(test.layout)}</div>
                <Bar label="Your pack" value={test.mainAttentionShare} />
                <Bar label="Competitor 1" value={test.competitor1AttentionShare} />
                <Bar label="Competitor 2" value={test.competitor2AttentionShare} />
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
            <div><span>Focus</span><strong>{attention?.focusScore ?? "N/A"}</strong></div>
            <div><span>Clarity</span><strong>{attention?.clarityScore ?? "N/A"}</strong></div>
          </div>
          <div className="aoiList">
            {attention?.aoi?.logo !== undefined ? <Bar label="Logo attention" value={attention.aoi.logo} /> : null}
            {attention?.aoi?.productName !== undefined ? <Bar label="Product name" value={attention.aoi.productName} /> : null}
            {attention?.aoi?.mainClaim !== undefined ? <Bar label="Main claim" value={attention.aoi.mainClaim} /> : null}
            {attention?.aoi?.productVisual !== undefined ? <Bar label="Product visual" value={attention.aoi.productVisual} /> : null}
          </div>
        </article>
      </div>

      <div className="diagnosisGrid">
        <article className="panel issuePanel critical">
          <span>Critical</span>
          <ul>{r.criticalIssues.map((x) => <li key={x}>{x}</li>)}</ul>
        </article>
        <article className="panel issuePanel important">
          <span>Important</span>
          <ul>{r.importantIssues.map((x) => <li key={x}>{x}</li>)}</ul>
        </article>
        <article className="panel issuePanel opportunity">
          <span>Opportunity</span>
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
          <span>Sonraki sprint</span>
          <strong>Attention Insight API bağlandığında bu panel gerçek heatmap, focus map ve AOI yüzdeleriyle beslenecek.</strong>
        </div>
        <button className="button" type="button" disabled>Optimize Design · yakında</button>
      </div>
    </section>
  );
}
