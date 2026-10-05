import "server-only";
import { randomUUID } from "node:crypto";
import type { AttentionPrediction, ImageAsset } from "@/lib/types";
import { assetToBuffer } from "@/lib/image/processing";
import type { AoiInput, AttentionProvider } from "../provider";

/**
 * Feng-GUI adapter, kept from the earlier sprint as a secondary provider to prove the
 * provider boundary is real. It only offers heatmap + focus/clear scores; it does not return
 * per-AOI attention, so AOI shares stay `null` and the engine lowers its confidence accordingly.
 */
export interface FengGuiOptions {
  apiKey: string;
  serviceUrl: string;
  username: string | null;
}

type RpcResponse<T> = { id: string; result?: T; error?: { message?: string } | null };

interface FengGuiImageAttentionResult {
  imageID?: string;
  outputImage?: string;
  focus?: number;
  clear?: number;
}

export class FengGuiProvider implements AttentionProvider {
  readonly name = "feng_gui" as const;

  constructor(private readonly opts: FengGuiOptions) {}

  private endpoint() {
    const base = this.opts.serviceUrl.replace(/\/+$/, "");
    return base.endsWith("/json/api.ashx") ? base : `${base}/json/api.ashx`;
  }

  private async call<T>(method: string, params: Record<string, unknown>) {
    const response = await fetch(this.endpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": this.opts.apiKey },
      body: JSON.stringify({ id: randomUUID(), method, params }),
    });
    const payload = (await response.json().catch(() => null)) as RpcResponse<T> | null;
    if (!response.ok) throw new Error(`Feng-GUI HTTP ${response.status}`);
    if (payload?.error) throw new Error(payload.error.message || "Feng-GUI API hatası");
    if (!payload || payload.result === undefined) throw new Error("Feng-GUI boş cevap döndürdü.");
    return payload.result;
  }

  private async analyze(image: ImageAsset, label: string) {
    const fileName = `${Date.now()}-${label.replace(/[^a-z0-9]+/gi, "-")}.jpg`;
    const uploaded = await this.call<string>("ImageUpload", { FileName: fileName, FileData: assetToBuffer(image).toString("base64") });
    const cleanName = String(uploaded || fileName).replace(/^\/+/, "");
    const inputImage = this.opts.username
      ? `${this.opts.serviceUrl.replace(/\/+$/, "")}/users/${encodeURIComponent(this.opts.username)}/files/images/${cleanName}`
      : `/${cleanName}`;
    return this.call<FengGuiImageAttentionResult>("ImageAttention", { InputImage: inputImage, ViewType: 0, ViewDistance: 0, AnalysisOptions: 0, OutputOptions: 0 });
  }

  private score(v: unknown) {
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(100, Math.max(0, Math.round(n))) : undefined;
  }

  async predictSinglePack(image: ImageAsset, aois: AoiInput[], label: string): Promise<AttentionPrediction> {
    const r = await this.analyze(image, label);
    return {
      provider: "feng_gui",
      studyId: r.imageID,
      heatmapUrl: r.outputImage,
      focusScore: this.score(r.focus),
      clarityScore: this.score(r.clear),
      aois: aois.map((a) => ({ ...a, attentionShare: null })),
      transactionsUsed: 1,
      isMock: false,
    };
  }

  async predictShelf(image: ImageAsset, aois: AoiInput[], label: string): Promise<AttentionPrediction> {
    const r = await this.analyze(image, label);
    return {
      provider: "feng_gui",
      studyId: r.imageID,
      heatmapUrl: r.outputImage,
      aois: aois.map((a) => ({ ...a, attentionShare: null })),
      transactionsUsed: 1,
      isMock: false,
    };
  }
}
