import type { FeldDiff, FelderDiffMap, FeldStatsValue } from "$lib/types";

export const KLIENTEN_PRIORITAET_FELD = "Klienten-Priorität";

export function isKlientenPrioritaetFieldName(name: string): boolean {
  return name.trim().toLowerCase() === KLIENTEN_PRIORITAET_FELD.toLowerCase();
}

/** Felder map for display rows (excludes Klienten-Priorität; count is shown in the section title). */
export function felderMapWithoutKlientenPrioritaet(
  felderMap: FelderDiffMap,
): FelderDiffMap {
  const out: FelderDiffMap = {};
  for (const [k, v] of Object.entries(felderMap)) {
    if (!isKlientenPrioritaetFieldName(k)) out[k] = v;
  }
  return out;
}

function readAufteilungCount(
  side: Record<string, FeldStatsValue> | undefined,
  priorityKey: "hoch" | "mittel" | "niedrig",
): number | undefined {
  if (!side) return undefined;
  const auft = side["aufteilung"];
  if (auft == null || typeof auft !== "object" || Array.isArray(auft)) {
    return undefined;
  }
  const n = (auft as Record<string, unknown>)[priorityKey];
  return typeof n === "number" ? n : undefined;
}

/** Klient count for this priority block from the Klienten-Priorität field (nachher prefers hinzugefügt). */
export function klientenCountFromFelderMap(
  felderMap: FelderDiffMap,
  priorityKey: "hoch" | "mittel" | "niedrig",
): number | undefined {
  let diff: FeldDiff | undefined;
  for (const [k, v] of Object.entries(felderMap)) {
    if (isKlientenPrioritaetFieldName(k)) {
      diff = v as FeldDiff;
      break;
    }
  }
  if (!diff) return undefined;
  return (
    readAufteilungCount(diff.hinzugefügt, priorityKey) ??
    readAufteilungCount(diff.entfernt, priorityKey)
  );
}

export function sectionTitleWithKlientenCount(
  baseTitle: string,
  felderMap: FelderDiffMap,
  priorityKey: "hoch" | "mittel" | "niedrig",
): string {
  const n = klientenCountFromFelderMap(felderMap, priorityKey);
  if (n === undefined) return baseTitle;
  const klienten = n === 1 ? "1 Klient" : `${n} Klienten`;
  return `${baseTitle} - ${klienten}`;
}

/** Shown when a priority block has 0 Klienten (mittel / niedrig accordions). */
export const PRIORITAET_KEINE_AENDERUNGEN_MSG =
  "Keine statistischen Änderungen in dieser Priorität.";
