import { getEngine } from "./engine";
import { DIM_KEYS, DIM_LABELS } from "./scoring";
import type { Analysis, Rec } from "./types";

// Bulgular ve öneriler yalnızca ölçülmüş değerlerden türetilir; her öneri gerçek ölçümü ve hedefi gösterir.

export function buildFindings(pack: Analysis): string[] {
  const s = pack.scores;
  const d = pack.scoreDetail;
  if (!s || !d) return [];
  const out: string[] = [];
  for (const k of DIM_KEYS) {
    const v = s.dims[k];
    if (v == null) out.push(`${DIM_LABELS[k]}: veri yok, toplama katılmadı.`);
    else if (v >= 75) out.push(`${DIM_LABELS[k]} güçlü (${v}).`);
    else if (v < 55) out.push(`${DIM_LABELS[k]} riskli bölgede (${v}).`);
  }
  for (const row of d.reflect.rows) {
    if (row.share < row.target * 0.8) out.push(`${row.label} bakış payı %${row.share}, hedef %${row.target}: yeterince görülmüyor.`);
    else if (row.share > row.target * 1.5) out.push(`${row.label} bakış payı %${row.share}, hedefin (%${row.target}) çok üstünde: diğer mesajlardan dikkat çalıyor.`);
  }
  if (d.exciting.source === "shelf" && d.exciting.share != null) {
    out.push(`Raftaki dikkat payı %${d.exciting.share}; adil pay %${d.exciting.fairShare} (${d.exciting.brands} marka).`);
  }
  const rows = pack.compare ?? [];
  if (rows.length > 1 && rows[0].total != null) {
    const better = rows.slice(1).filter((r) => r.total != null && r.total > (rows[0].total as number));
    out.push(better.length ? `Toplamda geride kalınan rakip: ${better.map((r) => `${r.label} (${r.total})`).join(", ")}.` : "Toplam skorda iki rakibin de önünde.");
  }
  return out;
}

export function buildRecs(pack: Analysis): Rec[] {
  const s = pack.scores;
  const d = pack.scoreDetail;
  if (!s || !d) return [];
  const target = getEngine(pack.engineVersion).rules.recTarget;
  const recs: Rec[] = [];
  const pr = (v: number): Rec["priority"] => (v < 55 ? "Yüksek" : v < 75 ? "Orta" : "Düşük");

  const dba = s.before.dba;
  if (dba != null && dba < target) recs.push({
    id: "dba", dim: "dba", priority: pr(dba),
    title: "Ayırıcı marka varlıklarını güçlendir",
    detail: "Logo bloğunu, marka rengini ve tekrar eden şekil kodunu daha belirgin ve tutarlı kullan.",
    measure: `Ölçüm: DBA ${dba} · hedef en az ${target}`,
    prompt: "Make the brand logo block larger and more distinctive; strengthen the signature brand color and recurring brand shape so the pack is recognizable from distance.",
  });

  for (const row of d.reflect.rows) {
    if (row.closeness >= target) continue;
    const low = row.share < row.target;
    recs.push({
      id: `reflect-${row.type}`, dim: "reflect", priority: pr(row.closeness),
      title: low ? `${row.label} alanını öne çıkar` : `${row.label} alanının baskınlığını azalt`,
      detail: low
        ? `${row.label} yeterince bakış almıyor. Boyut, kontrast ve konumla görünürlüğünü artır.`
        : `${row.label} hedefin üzerinde dikkat çekiyor; diğer mesajlara yer aç.`,
      measure: `Ölçüm: bakış payı %${row.share} · hedef %${row.target} · yakınlık ${row.closeness} (hedef en az ${target})`,
      prompt: low
        ? `Increase the visibility of the ${row.type} element: larger size, higher contrast, cleaner surrounding space.`
        : `Reduce the visual dominance of the ${row.type} element so other key messages get attention.`,
    });
  }

  const ex = s.before.exciting;
  if (ex != null && ex < target) recs.push({
    id: "exciting", dim: "exciting", priority: pr(ex),
    title: "Rafta öne çıkışı artır",
    detail: d.exciting.source === "shelf"
      ? "Rakiplere göre ayrışan renk bloğu ve daha güçlü silüet/kontrast ile raf payını büyüt."
      : "Daha canlı kontrast ve net bir odak noktası ile ilgi çekiciliği artır.",
    measure: d.exciting.source === "shelf"
      ? `Ölçüm: raf payı %${d.exciting.share} (adil %${d.exciting.fairShare}) · skor ${ex} · hedef en az ${target}`
      : `Ölçüm: ${ex} · hedef en az ${target}`,
    prompt: "Increase shelf standout: bolder color blocking that contrasts with competitors, a single strong focal point, higher overall contrast.",
  });

  const con = s.before.consumer;
  if (con != null && con < target) recs.push({
    id: "consumer", dim: "consumer", priority: pr(con),
    title: "Görsel hiyerarşiyi sadeleştir",
    detail: "Tüketicinin gözünü dağıtan küçük unsurları azalt; tek bir okuma sırası kur (marka → ürün → fayda).",
    measure: `Ölçüm: Genel dikkat ${con} · hedef en az ${target}`,
    prompt: "Simplify the visual hierarchy: remove clutter, establish a clear reading order brand → product name → key benefit, increase whitespace.",
  });

  const cs = s.before.consistency;
  if (cs != null && cs < target) recs.push({
    id: "consistency", dim: "consistency", priority: pr(cs),
    title: "Aile tutarlılığını koru",
    detail: "Logo yerleşimi, renk sistemi ve tipografiyi varyantlar/eski tasarımla ortaklaştır.",
    measure: `Ölçüm: tutarlılık ${cs} · hedef en az ${target}`,
    prompt: "Keep the established brand family codes: same logo placement, color system and typography as the existing range.",
  });

  const order = { Yüksek: 0, Orta: 1, Düşük: 2 };
  return recs.sort((a, b) => order[a.priority] - order[b.priority]);
}
