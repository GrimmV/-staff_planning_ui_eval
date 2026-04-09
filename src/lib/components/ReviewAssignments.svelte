<script lang="ts">
  import type { SignificantAssignment } from "$lib/types";
  import AssignmentTables from "./AssignmentTables.svelte";
  import AssignmentTablesSummary from "./AssignmentTablesSummary.svelte";
  const {
    nachher,
    vorher,
    änderungen = [],
  } = $props<{
    /** Markdown table string, or array of strings (e.g. from API) */
    nachher?: string | string[] | unknown;
    /** Markdown table string, or array of strings (e.g. from API) */
    vorher?: string | string[] | unknown;
    /** Names to highlight (e.g. assessment.significant_assignments) – rows with matching Mitarbeiter are highlighted */
    änderungen?: SignificantAssignment[];
  }>();

  /** Normalize API value to a single markdown string */
  function toMarkdownString(v: string | string[] | unknown): string {
    if (v == null) return "";
    if (typeof v === "string") return v;
    if (Array.isArray(v))
      return v
        .map((x) => (typeof x === "string" ? x : ""))
        .filter(Boolean)
        .join("\n");
    return "";
  }

  /** Parse a markdown table string into headers and rows */
  function parseMarkdownTable(md: string): {
    headers: string[];
    rows: string[][];
  } {
    const str = md?.trim?.() ?? "";
    if (!str) return { headers: [], rows: [] };
    const lines = str.split(/\n/).filter(Boolean);
    if (lines.length < 2) return { headers: [], rows: [] };

    const parseRow = (line: string): string[] =>
      line
        .split("|")
        .map((c) => c.trim())
        .filter((c) => c !== "");

    const headers = parseRow(lines[0]);
    const rows: string[][] = [];
    for (let i = 2; i < lines.length; i++) {
      const cells = parseRow(lines[i]);
      if (cells.length) rows.push(cells);
    }
    return { headers, rows };
  }

  const vorherParsed = $derived(parseMarkdownTable(toMarkdownString(vorher)));
  const nachherParsed = $derived(parseMarkdownTable(toMarkdownString(nachher)));

  let showTables = $state(false);
</script>

<div class="space-y-8">
  <div class="flex items-center justify-between gap-4 flex-wrap">
    <h3 class="text-lg font-semibold text-base-content">Zuordnungen</h3>
    <div class="join">
      <button
        type="button"
        class="join-item btn btn-sm {!showTables ? 'btn-active' : 'btn-ghost'}"
        onclick={() => (showTables = false)}
      >
        Zusammenfassung
      </button>
      <button
        type="button"
        class="join-item btn btn-sm {showTables ? 'btn-active' : 'btn-ghost'}"
        onclick={() => (showTables = true)}
      >
        Details
      </button>
    </div>
  </div>

  {#if showTables}
    <AssignmentTables vorherParsed={vorherParsed} nachherParsed={nachherParsed} />
  {:else}
    <!-- Summary view -->
    <div class="space-y-3">
      <h3 class="text-base font-medium flex items-center gap-2">Übersicht</h3>
      {#if änderungen?.length}
        <AssignmentTablesSummary
          änderungen={änderungen}
          nachherParsed={nachherParsed}
        />
      {:else}
        <p class="text-base-content/60 text-sm">Keine Änderungen.</p>
      {/if}
    </div>
  {/if}
</div>
