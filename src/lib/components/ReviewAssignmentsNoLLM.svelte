<script lang="ts">
  import AssignmentTables from "./AssignmentTables.svelte";
  const { nachher, vorher } = $props<{
    /** Markdown table string, or array of strings (e.g. from API) */
    nachher?: string | string[] | unknown;
    /** Markdown table string, or array of strings (e.g. from API) */
    vorher?: string | string[] | unknown;
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
</script>

<div class="space-y-4">
  <h3 class="text-lg font-semibold text-base-content">Zuordnungen</h3>
  <AssignmentTables
    vorherParsed={vorherParsed}
    nachherParsed={nachherParsed}
    änderungen={[]}
  />
</div>
