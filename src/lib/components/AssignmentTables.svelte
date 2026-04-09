<script lang="ts">
  import { SvelteSet } from "svelte/reactivity";
  import AssignmentTableSection from "./AssignmentTableSection.svelte";
  import {
    klientColIdx,
    rowNachherHochUndGeaendert,
    sortAssignmentTableRows,
  } from "$lib/utils/assignmentTableFilter";

  const { vorherParsed, nachherParsed } = $props<{
    vorherParsed: { headers: string[]; rows: string[][] };
    nachherParsed: { headers: string[]; rows: string[][] };
  }>();

  /** Nachher: show only Priorität hoch rows that differ from Vorher (same Klient). */
  let filterNurHochGeaendert = $state(true);

  function klientSetFromTable(parsed: {
    headers: string[];
    rows: string[][];
  }): SvelteSet<string> {
    const kIdx = klientColIdx(parsed.headers);
    if (kIdx < 0) return new SvelteSet<string>();
    const set = new SvelteSet<string>();
    for (const row of parsed.rows) {
      const k = (row[kIdx] ?? "").trim().toLowerCase();
      if (k) set.add(k);
    }
    return set;
  }

  function isQualiFitHeader(header: string): boolean {
    const h = header.toLowerCase();
    return (
      h.includes("quali-fit") || h.includes("quali fit") || h.includes("qualifit")
    );
  }

  function parseNumeric(cell: string): number | null {
    const normalized = cell.trim().replace(",", ".");
    if (!normalized) return null;
    const n = Number.parseFloat(normalized);
    return Number.isFinite(n) ? n : null;
  }

  function hasNegativeQualiFit(parsed: {
    headers: string[];
    rows: string[][];
  }): boolean {
    const qualiFitIndices = parsed.headers
      .map((header, idx) => (isQualiFitHeader(header) ? idx : -1))
      .filter((idx) => idx >= 0);
    if (qualiFitIndices.length === 0) return false;
    for (const row of parsed.rows) {
      for (const idx of qualiFitIndices) {
        const n = parseNumeric(row[idx] ?? "");
        if (n !== null && n < 0) return true;
      }
    }
    return false;
  }

  const vorherKlientSet = $derived(klientSetFromTable(vorherParsed));
  const nachherKlientSet = $derived(klientSetFromTable(nachherParsed));
  const showQualiFitColumn = $derived(
    hasNegativeQualiFit(vorherParsed) || hasNegativeQualiFit(nachherParsed),
  );

  const filteredNachherKlientKeys = $derived.by(() => {
    if (!filterNurHochGeaendert) return null;
    const sorted = sortAssignmentTableRows(nachherParsed);
    const keys = new Set<string>();
    const kIdx = klientColIdx(nachherParsed.headers);
    if (kIdx < 0) return keys;
    for (const row of sorted) {
      if (
        !rowNachherHochUndGeaendert(row, nachherParsed.headers, vorherParsed)
      ) {
        continue;
      }
      const k = (row[kIdx] ?? "").trim().toLowerCase();
      if (k) keys.add(k);
    }
    return keys;
  });
</script>

<div class="rounded-xl border border-base-300 bg-base-100 overflow-hidden">
  <div
    class="flex flex-wrap items-center justify-end gap-2 border-b border-base-300 bg-base-200/30 px-3 py-2"
  >
    {#if filterNurHochGeaendert}
      <p class="text-sm text-base-content/60">Zuordnungen mit Prioritäten mittel/niedrig sind ausgeblendet.</p>
    {/if}
    <button
      type="button"
      class="btn btn-sm btn-ghost"
      title="Nur Zeilen mit Priorität hoch, die sich gegenüber Vorher geändert haben (gleicher Klient)."
      aria-pressed={filterNurHochGeaendert}
      onclick={() => (filterNurHochGeaendert = !filterNurHochGeaendert)}
    >
      {filterNurHochGeaendert
        ? "Alle anzeigen"
        : "Nur Priorität hoch anzeigen"}
    </button>
  </div>
  <div class="overflow-x-auto">
    <table class="table table-zebra table-pin-rows">
      <AssignmentTableSection
        parsed={nachherParsed}
        variant="neu"
        {vorherKlientSet}
        {nachherKlientSet}
        showQualiFitColumn={showQualiFitColumn}
        filterHochGeaendert={filterNurHochGeaendert}
        vorherParsedForCompare={vorherParsed}
      />
      <AssignmentTableSection
        parsed={vorherParsed}
        variant="alt"
        {vorherKlientSet}
        {nachherKlientSet}
        showQualiFitColumn={showQualiFitColumn}
        filterHochGeaendert={filterNurHochGeaendert}
        filteredNachherKlientKeys={filteredNachherKlientKeys}
      />
    </table>
  </div>
</div>
