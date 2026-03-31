/** Shared sort / filter helpers for assignment markdown tables. */

export function klientColIdx(headers: string[]): number {
  return headers.findIndex((h) => h.toLowerCase().includes("klient"));
}

export function prioritaetColIdx(headers: string[]): number {
  return headers.findIndex((h) => /priorit/i.test(h));
}

export function isPrioritaetHoch(cell: string): boolean {
  const s = cell.trim().toLowerCase();
  return s === "hoch" || s === "high" || s.includes("hoch");
}

export function prioritaetRank(cell: string): number {
  const s = cell.trim().toLowerCase();
  if (s === "hoch" || s === "high") return 0;
  if (s === "mittel" || s === "medium") return 1;
  if (s === "niedrig" || s === "low") return 2;
  if (s.includes("hoch")) return 0;
  if (s.includes("mittel")) return 1;
  if (s.includes("niedrig")) return 2;
  return 3;
}

export function sortAssignmentTableRows(parsed: {
  headers: string[];
  rows: string[][];
}): string[][] {
  const { rows, headers } = parsed;
  const pIdx = prioritaetColIdx(headers);
  const kIdx = klientColIdx(headers);
  if (pIdx < 0 && kIdx < 0) return rows;
  return [...rows].sort((a, b) => {
    if (pIdx >= 0) {
      const pr =
        prioritaetRank(a[pIdx] ?? "") - prioritaetRank(b[pIdx] ?? "");
      if (pr !== 0) return pr;
    }
    if (kIdx >= 0) {
      const ka = (a[kIdx] ?? "").trim();
      const kb = (b[kIdx] ?? "").trim();
      return ka.localeCompare(kb, "de", { sensitivity: "base" });
    }
    return 0;
  });
}

export function findVorherRowByKlient(
  klientKey: string,
  vorherParsed: { headers: string[]; rows: string[][] },
): string[] | undefined {
  const kIdx = klientColIdx(vorherParsed.headers);
  if (kIdx < 0) return undefined;
  const target = klientKey.trim().toLowerCase();
  return vorherParsed.rows.find(
    (r) => (r[kIdx] ?? "").trim().toLowerCase() === target,
  );
}

export function nachherRowGeaendertGegenueberVorher(
  nachherRow: string[],
  nachherHeaders: string[],
  vorherParsed: { headers: string[]; rows: string[][] },
): boolean {
  const kIdx = klientColIdx(nachherHeaders);
  if (kIdx < 0) return true;
  const k = (nachherRow[kIdx] ?? "").trim().toLowerCase();
  if (!k) return true;
  const vorherRow = findVorherRowByKlient(k, vorherParsed);
  if (!vorherRow) return true;
  const n = Math.min(nachherRow.length, vorherRow.length);
  for (let i = 0; i < n; i++) {
    if ((nachherRow[i] ?? "").trim() !== (vorherRow[i] ?? "").trim()) {
      return true;
    }
  }
  return nachherRow.length !== vorherRow.length;
}

export function rowNachherHochUndGeaendert(
  row: string[],
  headers: string[],
  vorherParsed: { headers: string[]; rows: string[][] },
): boolean {
  const pIdx = prioritaetColIdx(headers);
  if (pIdx < 0 || !isPrioritaetHoch(row[pIdx] ?? "")) return false;
  return nachherRowGeaendertGegenueberVorher(row, headers, vorherParsed);
}
