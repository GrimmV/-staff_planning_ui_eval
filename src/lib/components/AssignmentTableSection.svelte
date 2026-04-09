<script lang="ts">
  import { Check, X } from "@lucide/svelte";
  import {
    klientColIdx,
    prioritaetColIdx,
    isPrioritaetHoch,
    sortAssignmentTableRows,
    rowNachherHochUndGeaendert,
  } from "$lib/utils/assignmentTableFilter";

  let {
    parsed,
    variant,
    vorherKlientSet,
    nachherKlientSet,
    showQualiFitColumn = true,
    filterHochGeaendert = false,
    vorherParsedForCompare,
    filteredNachherKlientKeys = null,
  } = $props<{
    parsed: { headers: string[]; rows: string[][] };
    variant: "neu" | "alt";
    vorherKlientSet: ReadonlySet<string>;
    nachherKlientSet: ReadonlySet<string>;
    showQualiFitColumn?: boolean;
    /** Nachher only: keep rows with Priorität hoch that differ from Vorher (same Klient). */
    filterHochGeaendert?: boolean;
    vorherParsedForCompare?: { headers: string[]; rows: string[][] };
    /** Alt only: when filter on, keep rows whose Klient appears in filtered Nachher. */
    filteredNachherKlientKeys?: ReadonlySet<string> | null;
  }>();

  function klientTagBisColIdx(headers: string[]): number {
    return headers.findIndex((h) => {
      const l = h.toLowerCase();
      return l.includes("klient") && l.includes("tag") && l.includes("bis");
    });
  }

  function mitarbeiterTagBisColIdx(headers: string[]): number {
    return headers.findIndex((h) => {
      const l = h.toLowerCase();
      return (
        l.includes("mitarbeiter") && l.includes("tag") && l.includes("bis")
      );
    });
  }

  /** Same convention as AssignmentTablesSummary / popover copy. */
  function formatMitarbeiterTagBisDisplay(wert: string): string {
    const t = wert.trim();
    if (t === "23:59" || t === "23:59:00") return "Ganztägig";
    return wert;
  }

  function klientNichtVertretenBisColIdx(headers: string[]): number {
    return headers.findIndex((h) => {
      const l = h.toLowerCase();
      return (
        l.includes("klient") &&
        l.includes("nicht") &&
        l.includes("vertreten") &&
        l.includes("bis")
      );
    });
  }

  function mitarbeiterKannVertretenBisColIdx(headers: string[]): number {
    return headers.findIndex((h) => {
      const l = h.toLowerCase();
      return (
        l.includes("mitarbeiter") &&
        (l.includes("kann") || l.includes("vertreten")) &&
        l.includes("bis") &&
        !l.includes("tag")
      );
    });
  }

  function isQualiFitHeader(header: string): boolean {
    const h = header.toLowerCase();
    return (
      h.includes("quali-fit") || h.includes("quali fit") || h.includes("qualifit")
    );
  }

  /** All Erfahrung Klient / Schule columns (both listed when the table has two). */
  function erfahrungKlientSchuleSpaltenIndices(headers: string[]): number[] {
    const lower = headers.map((h) => h.toLowerCase());
    const indices: number[] = [];
    for (let i = 0; i < lower.length; i++) {
      const l = lower[i];
      if (!l.includes("erfahrung")) continue;
      if (
        l.includes("klient") ||
        l.includes("schule") ||
        l.includes("school") ||
        l.includes("/")
      ) {
        indices.push(i);
      }
    }
    if (indices.length === 0) {
      const j = lower.findIndex((l) => l.includes("erfahrung"));
      if (j >= 0) indices.push(j);
    }
    return indices;
  }

  /** Minutes from midnight for end-of-day comparison; null if not parseable. */
  function parseTimeToMinutes(wert: string): number | null {
    const t = wert.trim();
    if (!t) return null;
    if (/ganzt/i.test(t)) return 24 * 60 - 1;
    const m = t.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (!m) return null;
    const h = Number.parseInt(m[1], 10);
    const min = Number.parseInt(m[2], 10);
    const sec = m[3] ? Number.parseInt(m[3], 10) : 0;
    if (h > 23 || min > 59 || sec > 59) return null;
    return h * 60 + min + sec / 60;
  }

  type VertretenParsed = { kind: "time"; v: number } | { kind: "date"; v: number };

  function deMonatNameToIndex(name: string): number | undefined {
    const k = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "");
    const map: Record<string, number> = {
      januar: 0,
      februar: 1,
      marz: 2,
      april: 3,
      mai: 4,
      juni: 5,
      juli: 6,
      august: 7,
      september: 8,
      oktober: 9,
      november: 10,
      dezember: 11,
    };
    return map[k];
  }

  function parseVertretenCell(wert: string): VertretenParsed | null {
    const raw = wert.trim();
    if (!raw) return null;

    const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) {
      const d = new Date(
        Number(iso[1]),
        Number(iso[2]) - 1,
        Number(iso[3]),
        12,
        0,
        0,
      );
      return Number.isNaN(d.getTime()) ? null : { kind: "date", v: d.getTime() };
    }

    const dmy = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
    if (dmy) {
      let y = Number(dmy[3]);
      if (y < 100) y += 2000;
      const d = new Date(y, Number(dmy[2]) - 1, Number(dmy[1]), 12, 0, 0);
      return Number.isNaN(d.getTime()) ? null : { kind: "date", v: d.getTime() };
    }

    const named = raw.match(
      /^(\d{1,2})\.\s*([A-Za-zäöüÄÖÜ]+)(?:\s*['']?(\d{2,4}))?/i,
    );
    if (named) {
      const day = Number(named[1]);
      const monthIdx = deMonatNameToIndex(named[2]);
      if (monthIdx === undefined) return null;
      let y = named[3] ? Number(named[3]) : 2026;
      if (y < 100) y += 2000;
      const d = new Date(y, monthIdx, day, 12, 0, 0);
      return Number.isNaN(d.getTime()) ? null : { kind: "date", v: d.getTime() };
    }

    const tm = parseTimeToMinutes(raw);
    if (tm !== null) return { kind: "time", v: tm };
    return null;
  }

  function rowNachherTagBisConflict(
    row: string[],
    headers: string[],
  ): boolean {
    const pIdx = prioritaetColIdx(headers);
    const ktIdx = klientTagBisColIdx(headers);
    const mtIdx = mitarbeiterTagBisColIdx(headers);
    if (pIdx < 0 || ktIdx < 0 || mtIdx < 0) return false;
    if (!isPrioritaetHoch(row[pIdx] ?? "")) return false;
    const kM = parseTimeToMinutes(row[ktIdx] ?? "");
    const mM = parseTimeToMinutes(row[mtIdx] ?? "");
    if (kM === null || mM === null) return false;
    return kM > mM;
  }

  function rowNachherVertretenConflict(
    row: string[],
    headers: string[],
  ): boolean {
    const pIdx = prioritaetColIdx(headers);
    const kIdx = klientNichtVertretenBisColIdx(headers);
    const mIdx = mitarbeiterKannVertretenBisColIdx(headers);
    if (pIdx < 0 || kIdx < 0 || mIdx < 0) return false;
    if (!isPrioritaetHoch(row[pIdx] ?? "")) return false;
    const pk = parseVertretenCell(row[kIdx] ?? "");
    const pm = parseVertretenCell(row[mIdx] ?? "");
    if (!pk || !pm || pk.kind !== pm.kind) return false;
    return pk.v > pm.v;
  }

  const sortedRows = $derived(sortAssignmentTableRows(parsed));

  const displayRows = $derived.by(() => {
    if (variant === "neu") {
      if (!filterHochGeaendert || !vorherParsedForCompare) return sortedRows;
      return sortedRows.filter((row: string[]) =>
        rowNachherHochUndGeaendert(row, parsed.headers, vorherParsedForCompare),
      );
    }
    if (!filterHochGeaendert || !filteredNachherKlientKeys) return sortedRows;
    const kIdx = klientColIdx(parsed.headers);
    if (kIdx < 0) return sortedRows;
    return sortedRows.filter((row: string[]) => {
      const k = (row[kIdx] ?? "").trim().toLowerCase();
      return k && filteredNachherKlientKeys.has(k);
    });
  });

  const lastHochRowIdx = $derived.by(() => {
    if (filterHochGeaendert) return -1;
    const pIdx = prioritaetColIdx(parsed.headers);
    if (pIdx < 0) return -1;
    let last = -1;
    displayRows.forEach((row, i) => {
      if (isPrioritaetHoch(row[pIdx] ?? "")) last = i;
    });
    return last;
  });

  const showHochBlockSeparator = $derived.by(() => {
    if (lastHochRowIdx < 0) return false;
    const pIdx = prioritaetColIdx(parsed.headers);
    if (pIdx < 0) return false;
    return displayRows
      .slice(lastHochRowIdx + 1)
      .some((row) => !isPrioritaetHoch(row[pIdx] ?? ""));
  });

  function klientIsAdded(
    row: string[],
    headers: string[],
    vorherSet: ReadonlySet<string>,
  ): boolean {
    const kIdx = klientColIdx(headers);
    if (kIdx < 0) return false;
    const k = (row[kIdx] ?? "").trim().toLowerCase();
    if (!k) return false;
    return !vorherSet.has(k);
  }

  function klientIsRemoved(
    row: string[],
    headers: string[],
    nachherSet: ReadonlySet<string>,
  ): boolean {
    const kIdx = klientColIdx(headers);
    if (kIdx < 0) return false;
    const k = (row[kIdx] ?? "").trim().toLowerCase();
    if (!k) return false;
    return !nachherSet.has(k);
  }

  const isNeu = $derived(variant === "neu");
  const label = $derived(isNeu ? "Neu" : "Alt");
  const headerRowClass = $derived(
    isNeu ? "bg-primary/15" : "bg-secondary/15",
  );
  const headerTextClass = $derived(
    isNeu ? "font-semibold text-primary" : "font-semibold text-secondary",
  );
  const emptyMessage = $derived(
    isNeu ? "Keine Zuordnungen (Nachher)." : "Keine Zuordnungen (Vorher).",
  );
  const emptyFilterMessage = $derived(
    "Keine Zeilen mit Priorität hoch und Änderung gegenüber Vorher.",
  );
  const emptyFilterMessageAlt = $derived(
    "Keine passenden Vorher-Zeilen zu den gefilterten Nachher-Zuordnungen.",
  );
  const kCol = $derived(klientColIdx(parsed.headers));
  const klientTagBisCol = $derived(klientTagBisColIdx(parsed.headers));
  const mitarbeiterTagBisCol = $derived(mitarbeiterTagBisColIdx(parsed.headers));
  const klientNichtVertretenCol = $derived(
    klientNichtVertretenBisColIdx(parsed.headers),
  );
  const mitarbeiterKannVertretenCol = $derived(
    mitarbeiterKannVertretenBisColIdx(parsed.headers),
  );
  const prioritaetCol = $derived(prioritaetColIdx(parsed.headers));
  const erfahrungSpalten = $derived(
    erfahrungKlientSchuleSpaltenIndices(parsed.headers),
  );
  const visibleColIndices = $derived.by(() => {
    const indices = parsed.headers.map((_header: string, idx: number) => idx);
    if (showQualiFitColumn) return indices;
    return indices.filter(
      (idx: number) => !isQualiFitHeader(parsed.headers[idx] ?? ""),
    );
  });
</script>

{#if parsed.headers.length && parsed.rows.length}
  <tbody class={isNeu ? "border-b-2 border-base-300" : ""}>
    <tr class={headerRowClass}>
      <td
        colspan={Math.max(visibleColIndices.length, 1)}
        class="{headerTextClass} px-4 py-2"
      >
        {label}
      </td>
    </tr>
    <tr>
      {#each visibleColIndices as colIdx (colIdx)}
        <th class="font-semibold whitespace-nowrap">{parsed.headers[colIdx]}</th>
      {/each}
    </tr>
    {#if displayRows.length === 0 && filterHochGeaendert}
      <tr>
        <td
          colspan={Math.max(visibleColIndices.length, 1)}
          class="text-base-content/60 text-sm py-4"
        >
          {#if isNeu}
            {emptyFilterMessage}
          {:else}
            {emptyFilterMessageAlt}
          {/if}
        </td>
      </tr>
    {:else}
      {#each displayRows as row, rowIdx (rowIdx)}
        {@const tagBisConflict =
          isNeu && rowNachherTagBisConflict(row, parsed.headers)}
        {@const vertretenConflict =
          isNeu && rowNachherVertretenConflict(row, parsed.headers)}
        <tr
          class={showHochBlockSeparator && rowIdx === lastHochRowIdx
            ? "[&>td]:border-b-2 [&>td]:border-black"
            : ""}
        >
          {#each visibleColIndices as colIdx (colIdx)}
            {@const cell = row[colIdx] ?? ""}
            {@const tagBisRed =
              tagBisConflict &&
              (colIdx === klientTagBisCol || colIdx === mitarbeiterTagBisCol)}
            {@const erfahrungRed =
              isNeu &&
              prioritaetCol >= 0 &&
              isPrioritaetHoch(row[prioritaetCol] ?? "") &&
              erfahrungSpalten.includes(colIdx) &&
              (cell ?? "").trim().toLowerCase() === "keine"}
            {@const vertretenRed =
              vertretenConflict &&
              (colIdx === klientNichtVertretenCol ||
                colIdx === mitarbeiterKannVertretenCol)}
            {@const effectBg =
              tagBisRed || erfahrungRed || vertretenRed
                ? "!bg-gray-200"
                : ""}
            {@const showKlientBadge =
              colIdx === kCol && kCol >= 0
                ? isNeu
                  ? klientIsAdded(row, parsed.headers, vorherKlientSet)
                  : klientIsRemoved(row, parsed.headers, nachherKlientSet)
                : false}
            {@const displayCell =
              colIdx === mitarbeiterTagBisCol && mitarbeiterTagBisCol >= 0
                ? formatMitarbeiterTagBisDisplay(cell)
                : cell}
            <td class="whitespace-nowrap {effectBg}">
              {displayCell}{#if showKlientBadge}{#if isNeu}<Check
                  class="ml-1 inline-block size-6 shrink-0 text-success select-none font-bold"
                  aria-hidden="true"
                />{:else}<X
                  class="ml-1 inline-block size-6 shrink-0 text-error select-none font-bold"
                  aria-hidden="true"
                />{/if}{/if}
            </td>
          {/each}
        </tr>
      {/each}
    {/if}
  </tbody>
{:else}
  <tbody class={isNeu ? "border-b-2 border-base-300" : ""}>
    <tr class={headerRowClass}>
      <td class="{headerTextClass} px-4 py-2">{label}</td>
    </tr>
    <tr>
      <td class="text-base-content/60 text-sm">{emptyMessage}</td>
    </tr>
  </tbody>
{/if}
