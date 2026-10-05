import "server-only";
import type { AttentionPrediction, ImageAsset } from "@/lib/types";
import { assetToBuffer } from "@/lib/image/processing";
import type { AoiInput, AttentionProvider } from "../provider";

/**
 * Attention Insight API v2 adapter.
 *
 * Contract (from the official Stoplight docs, v2.3.0):
 *   Base URL ............ https://ext-api.attentioninsight.com/api/v2
 *   Auth ................ header `Api-key: <key>`
 *   POST /studies ....... multipart: study_name, study_type, content_type, file, tasks[] (focus | clarity_score | auto_aoi | contrast)
 *                         → { success, message, data: { study_id } }
 *   GET  /studies/{id} .. → data.status ("finished" when done), data.tasks.*_status, data.aesthetics.clarity_score
 *   GET  /studies/{id}/status
 *   GET  /studies/{id}/image?image=heatmap|focus|saliency|aoi|aoi_heatmap|contrast → binary image
 *   POST /studies/{id}/aoi  { aois: [{ geometry: { x, y, width, height, type: "RECTANGLE" }, name }] } (percent coords, max 10, 1 transaction)
 *   GET  /studies/{id}/aoi  → { annotations: [{ data: { id, aoiValue, text }, geometry }] }
 *
 * Task support by study type (docs): general → focus, clarity_score, auto_aoi, contrast;
 * packaging → focus only; shelves → heatmap only. We therefore default single packs to `general`
 * so Clarity Score is available, and shelves to `shelves` + manual AOI calculation.
 *
 * Transactions: 1 (heatmap) + 1 per extra task + 1 per AOI request.
 */
export interface AttentionInsightOptions {
  apiKey: string;
  baseUrl: string;
  singlePackStudyType: string;
  shelfStudyType: string;
  pollIntervalMs: number;
  pollTimeoutMs: number;
}

interface StudyInfo {
  study_id: string;
  status: string;
  tasks?: Record<string, string>;
  aesthetics?: Record<string, unknown> | Array<Record<string, unknown>>;
  annotations?: unknown[];
}

interface AoiAnnotation {
  data?: { id?: string; aoiValue?: number; text?: string };
  geometry?: { x?: number; y?: number; width?: number; height?: number };
}

export class AttentionInsightError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "AttentionInsightError";
  }
}

export class AttentionInsightProvider implements AttentionProvider {
  readonly name = "attention_insight" as const;

  constructor(private readonly opts: AttentionInsightOptions) {}

  private headers(extra: Record<string, string> = {}) {
    return { Accept: "application/json", "Api-key": this.opts.apiKey, ...extra };
  }

  private url(path: string) {
    return `${this.opts.baseUrl.replace(/\/+$/, "")}${path}`;
  }

  private async json<T>(response: Response, context: string): Promise<T> {
    const text = await response.text();
    let payload: unknown = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      /* non-JSON body */
    }
    if (!response.ok) {
      const message = (payload as { message?: string } | null)?.message ?? text.slice(0, 200);
      throw new AttentionInsightError(`Attention Insight ${context} başarısız (${response.status}): ${message}`, response.status);
    }
    return payload as T;
  }

  async getProfile() {
    const res = await fetch(this.url("/profile"), { headers: this.headers() });
    return this.json<{ success: boolean; data: { company_name: string; plan: string; transactions: Array<{ limit: number; used: number; remaining: number }> } }>(res, "profile");
  }

  private async createStudy(image: ImageAsset, studyName: string, studyType: string, tasks: string[]) {
    const form = new FormData();
    form.append("study_name", studyName.slice(0, 80));
    form.append("study_type", studyType);
    form.append("content_type", "general");
    const buffer = assetToBuffer(image);
    form.append("file", new Blob([new Uint8Array(buffer)], { type: image.mime }), `pack.${image.mime === "image/png" ? "png" : "jpg"}`);
    for (const task of tasks) form.append("tasks[]", task);
    form.append("public_shared", "0");

    const res = await fetch(this.url("/studies"), { method: "POST", headers: this.headers(), body: form });
    const payload = await this.json<{ success: boolean; data?: { study_id?: string }; message?: string }>(res, "study oluşturma");
    const studyId = payload.data?.study_id;
    if (!studyId) throw new AttentionInsightError(`study_id dönmedi: ${payload.message ?? "bilinmeyen cevap"}`);
    return studyId;
  }

  private async waitForStudy(studyId: string): Promise<StudyInfo> {
    const started = Date.now();
    while (Date.now() - started < this.opts.pollTimeoutMs) {
      const res = await fetch(this.url(`/studies/${studyId}`), { headers: this.headers() });
      const payload = await this.json<{ data: StudyInfo }>(res, "study durumu");
      const status = payload.data?.status;
      if (status === "finished" || status === "done") return payload.data;
      if (status === "failed") throw new AttentionInsightError("Attention Insight analizi failed durumuna düştü.");
      await new Promise((r) => setTimeout(r, this.opts.pollIntervalMs));
    }
    throw new AttentionInsightError("Attention Insight analizi zaman aşımına uğradı.");
  }

  private async fetchImage(studyId: string, type: "heatmap" | "focus"): Promise<string | undefined> {
    const res = await fetch(this.url(`/studies/${studyId}/image?image=${type}`), { headers: this.headers() });
    if (!res.ok) return undefined;
    const contentType = res.headers.get("content-type") ?? "image/png";
    const buffer = Buffer.from(await res.arrayBuffer());
    if (contentType.includes("json")) {
      // Some deployments answer with a signed URL instead of binary.
      try {
        const parsed = JSON.parse(buffer.toString("utf8")) as { url?: string; data?: { url?: string } };
        return parsed.url ?? parsed.data?.url;
      } catch {
        return undefined;
      }
    }
    return `data:${contentType.split(";")[0]};base64,${buffer.toString("base64")}`;
  }

  private async calculateAois(studyId: string, aois: AoiInput[]) {
    if (!aois.length) return [] as AoiAnnotation[];
    const body = {
      aois: aois.slice(0, 10).map((a) => ({
        geometry: { x: a.x, y: a.y, width: a.width, height: a.height, type: "RECTANGLE" },
        name: a.name,
      })),
    };
    const res = await fetch(this.url(`/studies/${studyId}/aoi`), {
      method: "POST",
      headers: this.headers({ "Content-Type": "application/json" }),
      body: JSON.stringify(body),
    });
    await this.json(res, "AOI oluşturma");

    // AOI values are computed asynchronously ("try get AOIs after few seconds").
    const started = Date.now();
    while (Date.now() - started < 60000) {
      await new Promise((r) => setTimeout(r, 3000));
      const get = await fetch(this.url(`/studies/${studyId}/aoi`), { headers: this.headers() });
      const payload = await this.json<{ annotations?: AoiAnnotation[]; data?: { annotations?: AoiAnnotation[] } }>(get, "AOI okuma");
      const annotations = payload.annotations ?? payload.data?.annotations ?? [];
      if (annotations.length >= body.aois.length && annotations.every((a) => typeof a.data?.aoiValue === "number")) return annotations;
    }
    return [] as AoiAnnotation[];
  }

  private mapAois(inputs: AoiInput[], annotations: AoiAnnotation[]) {
    return inputs.map((a) => {
      const match =
        annotations.find((ann) => ann.data?.text === a.name) ??
        annotations.find(
          (ann) =>
            ann.geometry &&
            Math.abs((ann.geometry.x ?? -1) - a.x) < 0.6 &&
            Math.abs((ann.geometry.y ?? -1) - a.y) < 0.6,
        );
      const value = match?.data?.aoiValue;
      return { ...a, attentionShare: typeof value === "number" ? Math.round(value * 10) / 10 : null };
    });
  }

  private readScores(info: StudyInfo) {
    // Official python example reads study.aesthetics.clarity_score / clarity_description.
    const aesthetics = Array.isArray(info.aesthetics) ? Object.assign({}, ...info.aesthetics) : info.aesthetics ?? {};
    const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.round(v) : undefined);
    const clarityScore = num(aesthetics.clarity_score);
    // Focus score location is not spelled out in the docs; we probe the obvious keys and otherwise leave it undefined.
    const focusScore = num(aesthetics.focus_score) ?? num(aesthetics.focus) ?? num((info as unknown as Record<string, unknown>).focus_score);
    const clarityDescription = typeof aesthetics.clarity_description === "string" ? aesthetics.clarity_description : undefined;
    return { clarityScore, focusScore, clarityDescription };
  }

  async predictSinglePack(image: ImageAsset, aois: AoiInput[], label: string): Promise<AttentionPrediction> {
    const tasks = ["focus", "clarity_score"];
    const studyId = await this.createStudy(image, `5SE ${label}`, this.opts.singlePackStudyType, tasks);
    const info = await this.waitForStudy(studyId);
    const [heatmapUrl, focusMapUrl, annotations] = await Promise.all([
      this.fetchImage(studyId, "heatmap"),
      this.fetchImage(studyId, "focus"),
      this.calculateAois(studyId, aois),
    ]);
    const scores = this.readScores(info);
    return {
      provider: "attention_insight",
      studyId,
      heatmapUrl,
      focusMapUrl,
      ...scores,
      aois: this.mapAois(aois, annotations),
      transactionsUsed: 1 + tasks.length + (aois.length ? 1 : 0),
      isMock: false,
    };
  }

  async predictShelf(image: ImageAsset, aois: AoiInput[], label: string): Promise<AttentionPrediction> {
    const studyId = await this.createStudy(image, `5SE shelf ${label}`, this.opts.shelfStudyType, []);
    await this.waitForStudy(studyId);
    const [heatmapUrl, annotations] = await Promise.all([this.fetchImage(studyId, "heatmap"), this.calculateAois(studyId, aois)]);
    return {
      provider: "attention_insight",
      studyId,
      heatmapUrl,
      aois: this.mapAois(aois, annotations),
      transactionsUsed: 1 + (aois.length ? 1 : 0),
      isMock: false,
    };
  }
}
