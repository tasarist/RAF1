import "server-only";
import type { FiveSeReport, ImageAsset, Issue, Recommendation } from "@/lib/types";
import { getConfig } from "@/lib/config";
import { clamp } from "@/lib/engine/scoring";
import type { EngineInput } from "@/lib/engine/report";
import { FIVE_SE_PROMPT_VERSION, FIVE_SE_SYSTEM_PROMPT } from "./fiveSePrompt";

/**
 * OpenAI structured-output engine.
 *
 * It receives the images + measured data + the rule-based baseline, and returns the 5SE JSON
 * contract. Measured facts (attention & stand-out, SPI, shares) are re-imposed after the call so the
 * model can never alter them. On any failure the caller keeps the rule-based report.
 */
const issueSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "evidence", "cause", "recommendation", "relatedCriteria"],
  properties: {
    title: { type: "string" },
    evidence: { type: "string" },
    cause: { type: "string" },
    recommendation: { type: "string" },
    relatedCriteria: {
      type: "array",
      items: { type: "string", enum: ["uniqueness", "continuity_consistency", "product_clarity", "attention_standout", "consumer_distance_clarity"] },
    },
  },
};

const criterionSchema = {
  type: "object",
  additionalProperties: false,
  required: ["score", "narrative", "confidence", "breakdown"],
  properties: {
    score: { type: ["number", "null"] },
    narrative: { type: "string" },
    confidence: { type: "string", enum: ["low", "medium", "high"] },
    breakdown: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["key", "score", "note"],
        properties: { key: { type: "string" }, score: { type: "number" }, note: { type: "string" } },
      },
    },
  },
};

const reportSchema = {
  type: "object",
  additionalProperties: false,
  required: ["criteria", "summary", "strengths", "issues", "recommendations", "optimized_design"],
  properties: {
    criteria: {
      type: "object",
      additionalProperties: false,
      required: ["uniqueness", "continuity_consistency", "product_clarity", "consumer_distance_clarity", "attention_standout_narrative"],
      properties: {
        uniqueness: criterionSchema,
        continuity_consistency: criterionSchema,
        product_clarity: criterionSchema,
        consumer_distance_clarity: criterionSchema,
        attention_standout_narrative: { type: "string" },
      },
    },
    summary: {
      type: "object",
      additionalProperties: false,
      required: ["overall_assessment", "strongest_area", "weakest_area"],
      properties: { overall_assessment: { type: "string" }, strongest_area: { type: "string" }, weakest_area: { type: "string" } },
    },
    strengths: { type: "array", items: { type: "string" } },
    issues: {
      type: "object",
      additionalProperties: false,
      required: ["critical", "important", "opportunities"],
      properties: { critical: { type: "array", items: issueSchema }, important: { type: "array", items: issueSchema }, opportunities: { type: "array", items: issueSchema } },
    },
    recommendations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["priority", "action", "expected_effect"],
        properties: { priority: { type: "integer" }, action: { type: "string" }, expected_effect: { type: "array", items: { type: "string" } } },
      },
    },
    optimized_design: {
      type: "object",
      additionalProperties: false,
      required: ["objective", "preserve", "change", "image_generation_prompt"],
      properties: {
        objective: { type: "string" },
        preserve: { type: "array", items: { type: "string" } },
        change: { type: "array", items: { type: "string" } },
        image_generation_prompt: { type: "string" },
      },
    },
  },
};

interface LlmReport {
  criteria: Record<"uniqueness" | "continuity_consistency" | "product_clarity" | "consumer_distance_clarity", { score: number | null; narrative: string; confidence: "low" | "medium" | "high"; breakdown: Array<{ key: string; score: number; note: string }> }> & { attention_standout_narrative: string };
  summary: FiveSeReport["summary"];
  strengths: string[];
  issues: { critical: Omit<Issue, "severity">[]; important: Omit<Issue, "severity">[]; opportunities: Omit<Issue, "severity">[] };
  recommendations: Array<{ priority: number; action: string; expected_effect: string[] }>;
  optimized_design: { objective: string; preserve: string[]; change: string[]; image_generation_prompt: string };
}

export interface OpenAiEngineImages {
  main: ImageAsset;
  competitor1: ImageAsset;
  competitor2: ImageAsset;
  previous?: ImageAsset;
  otherSkus: ImageAsset[];
  shelves: ImageAsset[];
  distance: ImageAsset[];
}

export async function runOpenAiEngine(input: EngineInput, baseline: FiveSeReport, images: OpenAiEngineImages): Promise<FiveSeReport> {
  const config = getConfig();
  if (!config.openai.apiKey) throw new Error("OPENAI_API_KEY tanımlı değil.");

  const measured = {
    attention_provider: input.singlePack.provider,
    focus_score: input.singlePack.focusScore ?? null,
    clarity_score: input.singlePack.clarityScore ?? null,
    aoi_attention_share: input.singlePack.aois.map((a) => ({ role: a.role, name: a.name, share_pct: a.attentionShare, source: a.source })),
    shelf_tests: input.shelf.tests.map((t) => ({ layout: t.layout, main: t.mainAttentionShare, competitor1: t.competitor1AttentionShare, competitor2: t.competitor2AttentionShare })),
    shelf_average_main_share: input.shelf.averageMainShare,
    shelf_performance_index: input.shelf.shelfPerformanceIndex,
    single_pack_attention_score: input.criteria.attention.singlePackAttention,
    attention_standout_score: input.criteria.attention.score,
    distance_stage_scores: input.distance.stages.map((s) => ({ stage: s.stage, score: s.score })),
    continuity_inputs_supplied: Boolean(images.previous || images.otherSkus.length),
  };

  const content: Array<Record<string, unknown>> = [
    { type: "input_text", text: `Project: ${JSON.stringify(input.project)}\nMEASURED DATA (facts):\n${JSON.stringify(measured, null, 1)}\nRULE-BASED BASELINE (you may revise judgement criteria, keep facts):\n${JSON.stringify({ scores: baseline.scores, issues: baseline.issues }, null, 1)}` },
    { type: "input_text", text: "Image 1: MAIN pack." },
    { type: "input_image", image_url: images.main.dataUrl, detail: "low" },
    { type: "input_text", text: `Image 2: competitor 1 (${input.project.competitor1BrandName}).` },
    { type: "input_image", image_url: images.competitor1.dataUrl, detail: "low" },
    { type: "input_text", text: `Image 3: competitor 2 (${input.project.competitor2BrandName}).` },
    { type: "input_image", image_url: images.competitor2.dataUrl, detail: "low" },
  ];
  if (images.previous) content.push({ type: "input_text", text: "Previous packaging:" }, { type: "input_image", image_url: images.previous.dataUrl, detail: "low" });
  images.otherSkus.slice(0, 3).forEach((s, i) => content.push({ type: "input_text", text: `Other SKU ${i + 1}:` }, { type: "input_image", image_url: s.dataUrl, detail: "low" }));
  images.shelves.forEach((s, i) => content.push({ type: "input_text", text: `Virtual shelf ${i + 1} (${input.shelf.tests[i]?.layout}).` }, { type: "input_image", image_url: s.dataUrl, detail: "low" }));
  images.distance.forEach((s, i) => content.push({ type: "input_text", text: `Distance simulation ${["5 m", "3 m", "1 m"][i]}.` }, { type: "input_image", image_url: s.dataUrl, detail: "low" }));

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.openai.apiKey}` },
    body: JSON.stringify({
      model: config.openai.model,
      store: false,
      input: [
        { role: "system", content: FIVE_SE_SYSTEM_PROMPT },
        { role: "user", content },
      ],
      text: { format: { type: "json_schema", name: "five_se_report", strict: true, schema: reportSchema } },
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const payload = (await res.json()) as { output_text?: string; output?: Array<{ content?: Array<{ type: string; text?: string }> }> };
  const text = payload.output_text ?? payload.output?.flatMap((o) => o.content ?? []).find((c) => c.type === "output_text")?.text;
  if (!text) throw new Error("OpenAI boş cevap döndürdü.");
  const llm = JSON.parse(text) as LlmReport;

  return mergeReports(input, baseline, llm, config.openai.model);
}

function mergeReports(input: EngineInput, baseline: FiveSeReport, llm: LlmReport, model: string): FiveSeReport {
  const continuityAllowed = input.criteria.continuity.score !== null;
  const pick = (key: keyof LlmReport["criteria"], fallback: number | null) => {
    if (key === "attention_standout_narrative") return fallback;
    const v = llm.criteria[key]?.score;
    return typeof v === "number" ? clamp(v) : fallback;
  };
  const uniqueness = pick("uniqueness", baseline.scores.uniqueness) as number;
  const productClarity = pick("product_clarity", baseline.scores.product_clarity) as number;
  const distance = pick("consumer_distance_clarity", baseline.scores.consumer_distance_clarity) as number;
  const continuity = continuityAllowed ? (pick("continuity_consistency", baseline.scores.continuity_consistency) as number | null) : null;
  const attention = baseline.scores.attention_standout; // measured, immutable

  const scored = [uniqueness, continuity, productClarity, attention, distance].filter((v): v is number => typeof v === "number");
  const overall = clamp(scored.reduce((a, b) => a + b, 0) / scored.length);

  const criteria = baseline.criteria.map((c) => {
    if (c.key === "attention_standout") return { ...c, narrative: llm.criteria.attention_standout_narrative || c.narrative };
    const l = llm.criteria[c.key as Exclude<keyof LlmReport["criteria"], "attention_standout_narrative">];
    if (!l) return c;
    const score = c.key === "continuity_consistency" ? continuity : c.key === "uniqueness" ? uniqueness : c.key === "product_clarity" ? productClarity : distance;
    return {
      ...c,
      score,
      narrative: l.narrative || c.narrative,
      confidence: l.confidence ?? c.confidence,
      breakdown: c.breakdown.map((b) => {
        const lb = l.breakdown?.find((x) => x.key === b.key);
        return lb ? { ...b, score: clamp(lb.score), note: lb.note || b.note } : b;
      }),
    };
  });

  const tag = (severity: Issue["severity"]) => (items: Omit<Issue, "severity">[] = []) => items.map((i) => ({ ...i, severity }));
  const recommendations: Recommendation[] = (llm.recommendations ?? []).map((r, i) => ({ priority: r.priority || i + 1, action: r.action, expectedEffect: r.expected_effect ?? [] }));

  return {
    scores: {
      uniqueness,
      continuity_consistency: continuity,
      product_clarity: productClarity,
      single_pack_attention: baseline.scores.single_pack_attention,
      shelf_performance_index: baseline.scores.shelf_performance_index,
      attention_standout: attention,
      consumer_distance_clarity: distance,
      overall_5se_score: overall,
    },
    criteriaCounted: scored.length >= 5 ? 5 : 4,
    criteria,
    summary: llm.summary ?? baseline.summary,
    strengths: llm.strengths?.length ? llm.strengths : baseline.strengths,
    issues: {
      critical: tag("critical")(llm.issues?.critical),
      important: tag("important")(llm.issues?.important),
      opportunities: tag("opportunity")(llm.issues?.opportunities),
    },
    recommendations: recommendations.length ? recommendations : baseline.recommendations,
    optimized_design: llm.optimized_design
      ? { objective: llm.optimized_design.objective, preserve: llm.optimized_design.preserve, change: llm.optimized_design.change, imageGenerationPrompt: llm.optimized_design.image_generation_prompt }
      : baseline.optimized_design,
    engine: {
      name: "openai_structured",
      model,
      confidence: input.isMock ? "low" : "medium",
      notes: [...baseline.engine.notes.filter((n) => !n.startsWith("Mock modu") || input.isMock), `Prompt v${FIVE_SE_PROMPT_VERSION}. Attention & Stand-out ve SPI ölçülen değerlerdir; model bunları değiştiremez.`],
    },
  };
}
