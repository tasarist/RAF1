import type { FiveSeAnalysisResult, ProjectMeta } from "@/lib/types";

type OpenAiResponsesPayload = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

type BriefPayload = {
  brief: string;
};

const DEFAULT_MODEL = "gpt-4o-mini";

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    brief: { type: "string" },
  },
  required: ["brief"],
};

function getOpenAiKey() {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error("OpenAI API anahtarı tanımlı değil.");
  }
  return key;
}

function getModel() {
  return process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;
}

function extractOutputText(payload: OpenAiResponsesPayload) {
  if (payload.output_text) return payload.output_text;

  return payload.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text)
    .filter(Boolean)
    .join("\n");
}

function listItems(items: string[], max = 5) {
  const clean = items.map((item) => item.trim()).filter(Boolean).slice(0, max);
  return clean.length ? clean.map((item) => `- ${item}`).join("\n") : "- Veri yok";
}

export async function generateOptimizationBrief(project: ProjectMeta, analysis: FiveSeAnalysisResult) {
  const model = getModel();
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getOpenAiKey()}`,
    },
    body: JSON.stringify({
      model,
      store: false,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: [
                "Sen kıdemli bir ambalaj tasarım direktörüsün.",
                "Görevin görsel üretmek değil, tasarımcıya ve görsel üretim modeline verilecek net bir optimizasyon brief'i yazmak.",
                "Brief Türkçe, kısa, uygulanabilir ve düzenlenebilir olmalı.",
                "Fiziksel ambalaj formunu değiştirmeyi asla önermeyeceksin; sadece grafik yüzey, etiket, renk, tipografi ve mesaj hiyerarşisini iyileştireceksin.",
              ].join(" "),
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: [
                `Kategori: ${project.category}`,
                `Marka: ${project.brandName}`,
                `Ürün: ${project.productName}`,
                "",
                "5SE skorları:",
                `- Genel 5SE: ${analysis.scores.overall5seScore}/100`,
                `- Özgünlük: ${analysis.scores.uniqueness}/100`,
                `- Ürün netliği: ${analysis.scores.productClarity}/100`,
                `- Tekil ambalaj dikkati: ${analysis.scores.singlePackAttention}/100`,
                `- Dikkat ve raf etkisi: ${analysis.scores.attentionStandout}/100`,
                `- Mesafe netliği: ${analysis.scores.consumerDistanceClarity}/100`,
                "",
                "Kritik sorunlar:",
                listItems(analysis.criticalIssues, 4),
                "",
                "Önemli sorunlar:",
                listItems(analysis.importantIssues, 4),
                "",
                "Mevcut öneriler:",
                listItems(analysis.recommendations, 5),
                "",
                "Şu başlıklarla tek bir brief yaz:",
                "1. Optimizasyon hedefi",
                "2. Kesinlikle korunacaklar",
                "3. Grafik tasarımda değiştirilecekler",
                "4. Mesaj hiyerarşisi",
                "5. Beklenen etki",
                "",
                "Brief 180-260 kelime arasında olsun. Net maddeler kullan.",
              ].join("\n"),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "optimization_brief",
          strict: true,
          schema,
        },
      },
    }),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(`OpenAI brief API ${response.status} hatası: ${message || "cevap okunamadı"}`);
  }

  const payload = await response.json() as OpenAiResponsesPayload;
  const outputText = extractOutputText(payload);
  if (!outputText) throw new Error("OpenAI boş brief cevabı döndürdü.");

  const parsed = JSON.parse(outputText) as BriefPayload;
  return {
    brief: parsed.brief.trim(),
    model,
  };
}
