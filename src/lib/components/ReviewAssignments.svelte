<script lang="ts">
  import type { SignificantAssignment } from '$lib/types';
  const { nachher, vorher, significantAssignments = [] } = $props<{
    /** Markdown table string, or array of strings (e.g. from API) */
    nachher?: string | string[] | unknown;
    /** Markdown table string, or array of strings (e.g. from API) */
    vorher?: string | string[] | unknown;
    /** Names to highlight (e.g. assessment.significant_assignments) – rows with matching Mitarbeiter are highlighted */
    significantAssignments?: SignificantAssignment[];
  }>();

  /** Normalize API value to a single markdown string */
  function toMarkdownString(v: string | string[] | unknown): string {
    if (v == null) return '';
    if (typeof v === 'string') return v;
    if (Array.isArray(v)) return v.map((x) => (typeof x === 'string' ? x : '')).filter(Boolean).join('\n');
    return '';
  }

  /** Parse a markdown table string into headers and rows */
  function parseMarkdownTable(md: string): { headers: string[]; rows: string[][] } {
    const str = md?.trim?.() ?? '';
    if (!str) return { headers: [], rows: [] };
    const lines = str.split(/\n/).filter(Boolean);
    if (lines.length < 2) return { headers: [], rows: [] };

    const parseRow = (line: string): string[] =>
      line
        .split('|')
        .map((c) => c.trim())
        .filter((c) => c !== '');

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

  const mitarbeiterColIdx = (headers: string[]): number =>
    headers.findIndex((h) => h.toLowerCase().includes('mitarbeiter'));
  const klientColIdx = (headers: string[]): number =>
    headers.findIndex((h) => h.toLowerCase().includes('klient'));

  /** Check if cell should be highlighted. Mitarbeiter: always when row matches. Klient: never. Others: when in spalten_namen. */
  function isCellSignificant(
    row: string[],
    headers: string[],
    colIdx: number,
    significant: SignificantAssignment[]
  ): boolean {
    if (!significant.length) return false;
    const maIdx = mitarbeiterColIdx(headers);
    if (maIdx < 0) return false;
    const mitarbeiter = (row[maIdx] ?? '').trim().toLowerCase();
    if (!mitarbeiter) return false;
    const rowMatches = significant.some((s) => s.ma.toLowerCase() === mitarbeiter);
    if (!rowMatches) return false;

    if (colIdx === klientColIdx(headers)) return false;
    if (colIdx === maIdx) return true;

    const header = (headers[colIdx] ?? '').trim();
    if (!header) return false;
    return significant.some(
      (s) =>
        s.ma.toLowerCase() === mitarbeiter &&
        s.spalten_namen.some(
          (col) => col.trim().toLowerCase() === header.toLowerCase()
        )
    );
  }
</script>

<div class="space-y-8">
  <h3 class="text-lg font-semibold text-base-content">Zuordnungen</h3>

  <!-- Vorher -->
  <div class="space-y-3">
    <h4 class="text-base font-medium flex items-center gap-2">
      <span class="badge badge-ghost badge-sm">Vorher</span>
    </h4>
    {#if vorherParsed.headers.length && vorherParsed.rows.length}
      <div class="rounded-xl border border-base-300 bg-base-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="table table-zebra table-pin-rows">
            <thead>
              <tr>
                {#each vorherParsed.headers as h (h)}
                  <th class="font-semibold whitespace-nowrap">{h}</th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each vorherParsed.rows as row, rowIdx (rowIdx)}
                <tr>
                  {#each row as cell, colIdx (colIdx)}
                    {@const highlighted = isCellSignificant(
                      row,
                      vorherParsed.headers,
                      colIdx,
                      significantAssignments
                    )}
                    <td
                      class="whitespace-nowrap {highlighted ? '!bg-warning/30' : ''}"
                    >
                      {cell}
                    </td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {:else}
      <p class="text-base-content/60 text-sm">Keine Zuordnungen (Vorher).</p>
    {/if}
  </div>

  <!-- Nachher -->
  <div class="space-y-3">
    <h4 class="text-base font-medium flex items-center gap-2">
      <span class="badge badge-primary badge-sm">Nachher</span>
    </h4>
    {#if nachherParsed.headers.length && nachherParsed.rows.length}
      <div class="rounded-xl border border-base-300 bg-base-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="table table-zebra table-pin-rows">
            <thead>
              <tr>
                {#each nachherParsed.headers as h (h)}
                  <th class="font-semibold whitespace-nowrap">{h}</th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each nachherParsed.rows as row, rowIdx (rowIdx)}
                <tr>
                  {#each row as cell, colIdx (colIdx)}
                    {@const highlighted = isCellSignificant(
                      row,
                      nachherParsed.headers,
                      colIdx,
                      significantAssignments
                    )}
                    <td
                      class="whitespace-nowrap {highlighted ? '!bg-warning/30' : ''}"
                    >
                      {cell}
                    </td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {:else}
      <p class="text-base-content/60 text-sm">Keine Zuordnungen (Nachher).</p>
    {/if}
  </div>
</div>
