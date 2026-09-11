import type { AnalyzeApiResponse } from "@/lib/types";

function scoreLabel(value: number) {
  if (value >= 80) return "Çok güçlü";
  if (value >= 60) return "Güçlü";
  if (value >= 40) return "Orta";
  return "Zayıf";
}

export function Results({ data }: { data: AnalyzeApiResponse }) {
  const r = data.result;
  const scores = [
    { label: "Overall 5SE", value: r.scores.overall5seScore, primary: true },
    { label: "Uniqueness", value: r.scores.uniqueness },
    { label: "Product Clarity", value: r.scores.productClarity },
    { label: "Attention & Stand-out", value: r.scores.attentionStandout },
    { label: "Distance Clarity", value: r.scores.consumerDistanceClarity },
  ];

  return (
    <section className="results">
      <div className="resultsHeader">
        <div>
          <div className="eyebrow">Analysis result</div>
          <h2>{data.project.brandName} · {data.project.productName}</h2>
        </div>
        <div className="mockBadge">Mock data · gerçek API henüz bağlı değil</div>
      </div>

      <div className="scoreGrid">
        {scores.map((score) => (
          <div key={score.label} className={`scoreCard ${score.primary ? "primary" : ""}`}>
            <div className="scoreLabel">{score.label}</div>
            <div>
              <div className="scoreValue">{score.value}<small>/100</small></div>
              <div className="scoreLabel">{scoreLabel(score.value)}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="summary">{r.summary}</div>

      <div className="detailGrid">
        <article className="detail">
          <h3>Güçlü yönler</h3>
          <ul>{r.strengths.map((x) => <li key={x}>{x}</li>)}</ul>
        </article>
        <article className="detail">
          <h3>Critical / Important</h3>
          <ul>
            {r.criticalIssues.map((x) => <li key={`c-${x}`}>{x}</li>)}
            {r.importantIssues.map((x) => <li key={`i-${x}`}>{x}</li>)}
          </ul>
        </article>
        <article className="detail">
          <h3>Öneriler</h3>
          <ul>{r.recommendations.map((x) => <li key={x}>{x}</li>)}</ul>
        </article>
      </div>

      <div className="shelfTable">
        <div className="shelfRow">
          <div>Raf testi</div><div>Your pack</div><div>Competitor 1</div><div>Competitor 2</div>
        </div>
        {r.shelfTests.map((test) => (
          <div className="shelfRow" key={test.layout}>
            <div>{test.layout.replaceAll("_", " ")}</div>
            <div>{test.mainAttentionShare}%</div>
            <div>{test.competitor1AttentionShare}%</div>
            <div>{test.competitor2AttentionShare}%</div>
          </div>
        ))}
      </div>
    </section>
  );
}
