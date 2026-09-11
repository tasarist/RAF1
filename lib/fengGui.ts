import { randomUUID } from "node:crypto";
import type { SinglePackAttentionResult } from "./types";

type RpcError = {
  name?: string;
  message?: string;
  errors?: Array<{ name?: string; message?: string }>;
};

type RpcResponse<T> = {
  id: string;
  result?: T;
  error?: RpcError | null;
};

type FengGuiAccountInfo = {
  userName?: string;
  email?: string;
  roles?: string;
  status?: number;
  used?: number;
  credit?: number;
  service?: string;
  storageQuota?: number;
  storageUsed?: number;
  storageRetention?: number;
};

type FengGuiHotspot = {
  x?: number;
  y?: number;
  maxValue?: number;
};

type FengGuiImageAttentionResult = {
  serviceVersion?: string;
  version?: string;
  imageID?: string;
  inputImage?: string;
  outputImage?: string;
  outputAttentionImage?: string;
  outputOpacityReport?: string;
  outputGazeplotReport?: string;
  outputAOIsReport?: string;
  outputAestheticsReport?: string;
  analysisResult?: number;
  overall?: number;
  complexity?: number;
  clear?: number;
  focus?: number;
  exciting?: number;
  balance?: number;
  approach?: number;
  withdraw?: number;
  memory?: number;
  hotspots?: FengGuiHotspot[];
};

const DEFAULT_SERVICE_URL = "https://service.feng-gui.com";

function getApiKey() {
  const apiKey = process.env.FENG_GUI_API_KEY?.trim();
  if (!apiKey) throw new Error("FENG_GUI_API_KEY ortam değişkeni tanımlı değil.");
  return apiKey;
}

function getServiceBase() {
  return (process.env.FENG_GUI_SERVICE_URL?.trim() || DEFAULT_SERVICE_URL).replace(/\/+$/, "");
}

function getEndpoint() {
  const base = getServiceBase();
  return base.endsWith("/json/api.ashx") ? base : `${base}/json/api.ashx`;
}

async function callFengGui<T>(method: string, params: Record<string, unknown> = {}) {
  const response = await fetch(getEndpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": getApiKey(),
    },
    body: JSON.stringify({ id: randomUUID(), method, params }),
  });

  const payload = await response.json().catch(() => null) as RpcResponse<T> | null;
  if (!response.ok) throw new Error(`Feng-GUI HTTP ${response.status} hatası döndü.`);

  if (payload?.error) {
    const nested = payload.error.errors?.map((error) => error.message).filter(Boolean).join(" ");
    throw new Error(payload.error.message || nested || "Feng-GUI API hatası oluştu.");
  }

  if (!payload || payload.result === undefined) throw new Error("Feng-GUI boş cevap döndürdü.");
  return payload.result;
}

function score(value: unknown) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return undefined;
  return Math.min(100, Math.max(0, Math.round(numeric)));
}

function extensionForType(type: string) {
  if (type === "image/jpeg") return ".jpg";
  if (type === "image/webp") return ".webp";
  return ".png";
}

function safeFileName(file: File) {
  const fallbackExt = extensionForType(file.type);
  const rawName = file.name.split(/[\\/]/).pop() || `pack${fallbackExt}`;
  let normalized = rawName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!/\.[a-z0-9]+$/i.test(normalized)) normalized += fallbackExt;
  return `${Date.now()}-${normalized}`.slice(0, 100);
}

function encodePath(path: string) {
  return path.split("/").filter(Boolean).map(encodeURIComponent).join("/");
}

export async function getFengGuiAccountInfo() {
  const userIdOrEmail = process.env.FENG_GUI_USERNAME?.trim();
  return callFengGui<FengGuiAccountInfo>(
    "GetAccountInfo",
    userIdOrEmail ? { UserIdOrEmail: userIdOrEmail } : {},
  );
}

export async function uploadFengGuiImage(file: File) {
  const fileData = Buffer.from(await file.arrayBuffer()).toString("base64");
  const requestedName = safeFileName(file);
  const uploadedName = await callFengGui<string>("ImageUpload", {
    FileName: requestedName,
    FileData: fileData,
  });

  const cleanName = String(uploadedName || requestedName).replace(/^\/+/, "");
  const account = await getFengGuiAccountInfo().catch(() => null);
  const userName = process.env.FENG_GUI_USERNAME?.trim() || account?.userName;
  const service = (account?.service || getServiceBase()).replace(/\/+$/, "");

  return {
    imageId: `/${cleanName}`,
    inputImage: userName ? `${service}/users/${encodeURIComponent(userName)}/files/images/${encodePath(cleanName)}` : `/${cleanName}`,
    uploadedFileName: cleanName,
  };
}

export async function analyzeFengGuiImageUrl(inputImage: string) {
  return callFengGui<FengGuiImageAttentionResult>("ImageAttention", {
    InputImage: inputImage,
    ViewType: 0,
    ViewDistance: 0,
    AnalysisOptions: Number(process.env.FENG_GUI_ANALYSIS_OPTIONS || 0),
    OutputOptions: Number(process.env.FENG_GUI_OUTPUT_OPTIONS || 0),
  });
}

export async function analyzeSinglePackWithFengGui(file: File): Promise<SinglePackAttentionResult> {
  const uploaded = await uploadFengGuiImage(file);
  const analysis = await analyzeFengGuiImageUrl(uploaded.inputImage);

  return {
    provider: "feng_gui",
    providerImageId: analysis.imageID || uploaded.imageId,
    uploadedImageUrl: analysis.inputImage || uploaded.inputImage,
    heatmapUrl: analysis.outputImage,
    rawAttentionUrl: analysis.outputAttentionImage,
    opacityReportUrl: analysis.outputOpacityReport,
    gazeplotReportUrl: analysis.outputGazeplotReport,
    aoiReportUrl: analysis.outputAOIsReport,
    aestheticsReportUrl: analysis.outputAestheticsReport,
    overallScore: score(analysis.overall),
    focusScore: score(analysis.focus),
    clarityScore: score(analysis.clear),
    complexityScore: score(analysis.complexity),
    memoryScore: score(analysis.memory),
    excitingScore: score(analysis.exciting),
    balanceScore: score(analysis.balance),
    hotspots: analysis.hotspots
      ?.filter((hotspot) => typeof hotspot.x === "number" && typeof hotspot.y === "number")
      .slice(0, 10)
      .map((hotspot) => ({
        x: hotspot.x as number,
        y: hotspot.y as number,
        maxValue: typeof hotspot.maxValue === "number" ? hotspot.maxValue : undefined,
      })),
  };
}
