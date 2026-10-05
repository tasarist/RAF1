import type { Issue } from "@/lib/types";

const LABEL: Record<Issue["severity"], string> = { critical: "Critical", important: "Important", opportunity: "Opportunity" };
const CRIT: Record<string, string> = {
  uniqueness: "Uniqueness",
  continuity_consistency: "Continuity",
  product_clarity: "Product Clarity",
  attention_standout: "Attention",
  consumer_distance_clarity: "Distance",
};

export function IssueList({ issues }: { issues: Issue[] }) {
  if (!issues.length) return <div className="empty"><strong>Bu seviyede bulgu yok.</strong></div>;
  return (
    <div className="stack">
      {issues.map((i, idx) => (
        <article key={idx} className={`card issue issue--${i.severity}`}>
          <div className="between">
            <h4>{i.title}</h4>
            <span className={`badge badge--${i.severity}`}>{LABEL[i.severity].toUpperCase()}</span>
          </div>
          <dl>
            <dt>Kanıt</dt>
            <dd>{i.evidence}</dd>
            <dt>Neden</dt>
            <dd>{i.cause}</dd>
            <dt>Öneri</dt>
            <dd className="rec">{i.recommendation}</dd>
          </dl>
          {i.relatedCriteria.length ? (
            <div className="pill-list">
              {i.relatedCriteria.map((c) => (
                <span key={c}>{CRIT[c] ?? c}</span>
              ))}
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}
