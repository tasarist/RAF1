import "server-only";
import { randomUUID } from "node:crypto";
import type { Analysis, ImageAsset, OptimizedDesignResult, PipelineStep, ProjectMeta, ShelfTestResult, VariantMeasurement } from "@/lib/types";
import { SHELF_LAYOUTS } from "@/lib/types";
import { getConfig } from "@/lib/config";
import { getAttentionProvider } from "@/lib/attention";
import type { AoiInput } from "@/lib/attention/provider";
import { buildShelf, normalizePack } from "@/lib/image/processing";
import { extractFeatures, type PackFeatures } from "@/lib/image/features";
import { detectPackAois } from "@/lib/engine/aoi";
import { computeShelfPerformance, scoreAttentionStandout, scoreContinuity, scoreDistanceClarity, scoreProductClarity, scoreUniqueness } from "@/lib/engine/scoring";
import { buildRuleBasedReport, type EngineInput } from "@/lib/engine/report";
import { runOpenAiEngine } from "@/lib/ai/openaiEngine";
import { generateOptimizedDesign } from "@/lib/ai/openaiImage";

export interface PipelineInputFiles {
  main: Buffer;
  competitor1: Buffer;
  competitor2: Buffer;
  previous?: Buffer;
  otherSkus: Buffer[];
}

class StepLogger {
  steps: PipelineStep[] = [];
  async run<T>(key: string, label: string, fn: () => Promise<T>, detail?: (r: T) => string): Promise<T> {
    const t = Date.now();
    try {
      const r = await fn();
      this.steps.push({ key, label, status: "done", durationMs: Date.now() - t, detail: detail?.(r) });
      return r;
    } catch (error) {
      this.steps.push({ key, label, status: "failed", durationMs: Date.now() - t, detail: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }
  skip(key: string, label: string, detail: string) {
    this.steps.push({ key, label, status: "skipped", durationMs: 0, detail });
  }
}

interface Context {
  project: ProjectMeta;
  competitors: { competitor1: ImageAsset; competitor2: ImageAsset };
  competitorFeatures: PackFeatures[];
  previousFeatures?: PackFeatures;
  skuFeatures: PackFeatures[];
  previous?: ImageAsset;
  otherSkus: ImageAsset[];
  log: StepLogger;
}

/**
 * Measure one design variant: single pack → AOIs → 3 shelves → SPI → 5m/3m/1m → 5SE report.
 * Used for the original and, later, for the optimized design (re-test).
 */
async function measureVariant(variant: "original" | "optimized", pack: ImageAsset, ctx: Context): Promise<VariantMeasurement> {
  const provider = getAttentionProvider();
  const config = getConfig();
  const { log, project } = ctx;
  const prefix = variant === "original" ? "" : "retest_";

  const mainFeatures = await log.run(`${prefix}features`, "Görsel özellikler çıkarılıyor", () => extractFeatures(pack));

  const detected = await log.run(`${prefix}aoi`, "Logo / ürün adı / vaat / ürün görseli tespiti", () => detectPackAois(pack, project), (r) => `${r.aois.length} AOI · kaynak: ${r.source}`);

  const singlePack = await log.run(`${prefix}single`, "Tekil ambalaj dikkat testi", () => provider.predictSinglePack(pack, detected.aois, `${project.brandName} ${variant}`), (r) => `Focus ${r.focusScore ?? "—"} · Clarity ${r.clarityScore ?? "—"} · ${r.isMock ? "mock" : r.provider}`);

  const shelfTests: ShelfTestResult[] = [];
  for (const layout of SHELF_LAYOUTS) {
    const test = await log.run(`${prefix}shelf_${layout}`, `Sanal raf: ${layout.replace("main_", "ana ambalaj ")}`, async () => {
      const built = await buildShelf({ main: pack, ...ctx.competitors }, layout);
      const aois: AoiInput[] = built.facings.map((f) => ({
        id: f.role,
        name: f.role === "main" ? project.brandName : f.role === "competitor1" ? project.competitor1BrandName : project.competitor2BrandName,
        role: "brand_block",
        x: f.x,
        y: f.y,
        width: f.width,
        height: f.height,
        source: "heuristic",
      }));
      const prediction = await provider.predictShelf(built.image, aois, layout);
      const get = (id: string) => prediction.aois.find((a) => a.id === id)?.attentionShare ?? 0;
      const result: ShelfTestResult = {
        layout,
        shelfImage: built.image,
        prediction,
        mainAttentionShare: get("main"),
        competitor1AttentionShare: get("competitor1"),
        competitor2AttentionShare: get("competitor2"),
      };
      return result;
    }, (r) => `ana ${r.mainAttentionShare}% · r1 ${r.competitor1AttentionShare}% · r2 ${r.competitor2AttentionShare}%`);
    shelfTests.push(test);
  }

  const shelf = computeShelfPerformance(shelfTests);
  log.steps.push({ key: `${prefix}spi`, label: "Shelf Performance Index hesaplandı", status: "done", durationMs: 0, detail: `ort. ${shelf.averageMainShare}% → SPI ${shelf.shelfPerformanceIndex}` });

  const distanceResult = await log.run(`${prefix}distance`, "5 m / 3 m / 1 m simülasyonu", () => scoreDistanceClarity(pack, singlePack, mainFeatures, ctx.competitorFeatures), (r) => r.distance.stages.map((s) => `${s.stage} ${s.score}`).join(" · "));

  const uniqueness = scoreUniqueness(mainFeatures, ctx.competitorFeatures);
  const continuity = scoreContinuity(mainFeatures, ctx.previousFeatures, ctx.skuFeatures);
  if (continuity.score === null) log.skip(`${prefix}continuity`, "Continuity & Consistency", "Eski ambalaj / SKU yüklenmedi → N/A");
  else log.steps.push({ key: `${prefix}continuity`, label: "Continuity & Consistency", status: "done", durationMs: 0, detail: `${continuity.score}` });
  const productClarity = scoreProductClarity(singlePack, mainFeatures, detected.source);
  const attention = scoreAttentionStandout(singlePack, shelf);

  const engineInput: EngineInput = {
    project,
    criteria: { uniqueness, continuity, productClarity, attention, distance: distanceResult.criterion },
    singlePack,
    shelf,
    distance: distanceResult.distance,
    aoiSource: detected.source,
    isMock: singlePack.isMock,
  };

  let report = await log.run(`${prefix}engine`, "5SE motoru çalışıyor", async () => buildRuleBasedReport(engineInput), (r) => `5SE ${r.scores.overall_5se_score} (${r.criteriaCounted} kriter)`);

  if (!config.useMockData && config.openai.apiKey) {
    try {
      report = await log.run(`${prefix}openai`, "OpenAI yapılandırılmış 5SE analizi", () =>
        runOpenAiEngine(engineInput, report, {
          main: pack,
          competitor1: ctx.competitors.competitor1,
          competitor2: ctx.competitors.competitor2,
          previous: ctx.previous,
          otherSkus: ctx.otherSkus,
          shelves: shelfTests.map((t) => t.shelfImage),
          distance: distanceResult.distance.stages.map((s) => s.simulation),
        }),
      );
    } catch (error) {
      console.error("[5SE] OpenAI engine failed, keeping rule-based report:", error);
    }
  } else {
    log.skip(`${prefix}openai`, "OpenAI yapılandırılmış 5SE analizi", config.useMockData ? "Mock modu — kural tabanlı motor kullanıldı" : "OPENAI_API_KEY yok — kural tabanlı motor kullanıldı");
  }

  return {
    variant,
    packImage: pack,
    singlePack,
    shelf,
    distance: distanceResult.distance,
    report,
    predictionsUsed: singlePack.transactionsUsed + shelfTests.reduce((s, t) => s + t.prediction.transactionsUsed, 0),
  };
}

async function buildContext(project: ProjectMeta, files: PipelineInputFiles, log: StepLogger) {
  const normalized = await log.run("normalize", "Ambalaj görselleri hazırlanıyor", async () => {
    const [main, competitor1, competitor2] = await Promise.all([normalizePack(files.main), normalizePack(files.competitor1), normalizePack(files.competitor2)]);
    const previous = files.previous ? await normalizePack(files.previous) : undefined;
    const otherSkus = await Promise.all(files.otherSkus.map((b) => normalizePack(b)));
    return { main, competitor1, competitor2, previous, otherSkus };
  }, (r) => `${3 + (r.previous ? 1 : 0) + r.otherSkus.length} görsel normalize edildi`);

  const [c1, c2] = await Promise.all([extractFeatures(normalized.competitor1), extractFeatures(normalized.competitor2)]);
  const previousFeatures = normalized.previous ? await extractFeatures(normalized.previous) : undefined;
  const skuFeatures = await Promise.all(normalized.otherSkus.map((s) => extractFeatures(s)));

  const ctx: Context = {
    project,
    competitors: { competitor1: normalized.competitor1, competitor2: normalized.competitor2 },
    competitorFeatures: [c1, c2],
    previousFeatures,
    skuFeatures,
    previous: normalized.previous,
    otherSkus: normalized.otherSkus,
    log,
  };
  return { ctx, normalized };
}

export async function runAnalysis(project: ProjectMeta, files: PipelineInputFiles): Promise<Analysis> {
  const log = new StepLogger();
  const config = getConfig();
  const { ctx, normalized } = await buildContext(project, files, log);
  const original = await measureVariant("original", normalized.main, ctx);

  return {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    mode: config.useMockData ? "mock" : "live",
    provider: getAttentionProvider().name,
    project,
    inputs: {
      main: normalized.main,
      competitor1: normalized.competitor1,
      competitor2: normalized.competitor2,
      previous: normalized.previous,
      otherSkus: normalized.otherSkus,
    },
    original,
    pipelineLog: log.steps,
  };
}

/**
 * Phase 4: generate ONE optimized design from the brief, then re-run the full measurement and
 * build the before/after delta. Negative deltas are reported as-is.
 */
export async function runOptimization(analysis: Analysis): Promise<OptimizedDesignResult> {
  const log = new StepLogger();
  const brief = analysis.original.report.optimized_design;

  const generated = await log.run("generate", "Optimize tasarım üretiliyor", () => generateOptimizedDesign(analysis.inputs.main, brief), (r) => r.generator.name);

  // Rebuild competitor context from stored inputs.
  const [c1, c2] = await Promise.all([extractFeatures(analysis.inputs.competitor1), extractFeatures(analysis.inputs.competitor2)]);
  const ctx: Context = {
    project: analysis.project,
    competitors: { competitor1: analysis.inputs.competitor1, competitor2: analysis.inputs.competitor2 },
    competitorFeatures: [c1, c2],
    previousFeatures: analysis.inputs.previous ? await extractFeatures(analysis.inputs.previous) : undefined,
    skuFeatures: await Promise.all(analysis.inputs.otherSkus.map((s) => extractFeatures(s))),
    previous: analysis.inputs.previous,
    otherSkus: analysis.inputs.otherSkus,
    log,
  };

  const measurement = await measureVariant("optimized", generated.image, ctx);
  const a = analysis.original.report.scores;
  const b = measurement.report.scores;

  return {
    measurement,
    brief,
    generator: generated.generator,
    delta: {
      overall_5se_score: b.overall_5se_score - a.overall_5se_score,
      uniqueness: b.uniqueness - a.uniqueness,
      product_clarity: b.product_clarity - a.product_clarity,
      attention_standout: b.attention_standout - a.attention_standout,
      consumer_distance_clarity: b.consumer_distance_clarity - a.consumer_distance_clarity,
      shelf_performance_index: b.shelf_performance_index - a.shelf_performance_index,
      continuity_consistency: a.continuity_consistency !== null && b.continuity_consistency !== null ? b.continuity_consistency - a.continuity_consistency : null,
    },
    createdAt: new Date().toISOString(),
  };
}
