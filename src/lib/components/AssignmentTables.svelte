<script lang="ts">
  import type { SignificantAssignment } from "$lib/types";
  const {
    vorherParsed,
    nachherParsed,
    änderungen = [],
  } = $props<{
    vorherParsed: { headers: string[]; rows: string[][] };
    nachherParsed: { headers: string[]; rows: string[][] };
    änderungen: SignificantAssignment[];
  }>();
  
  const mitarbeiterColIdx = (headers: string[]): number =>
    headers.findIndex((h) => h.toLowerCase().includes("mitarbeiter"));
  const klientColIdx = (headers: string[]): number =>
    headers.findIndex((h) => h.toLowerCase().includes("klient"));

  /** Get effect for a cell (positiv/negativ/neutral) when it matches a RelevantChange, else null. */
  function getCellEffect(
    row: string[],
    headers: string[],
    colIdx: number,
    significant: SignificantAssignment[],
  ): "positiv" | "negativ" | "neutral" | null {
    if (!significant.length) return null;
    const maIdx = mitarbeiterColIdx(headers);
    if (maIdx < 0) return null;
    const mitarbeiter = (row[maIdx] ?? "").trim().toLowerCase();
    if (!mitarbeiter) return null;
    if (colIdx === klientColIdx(headers)) return null;
    const header = (headers[colIdx] ?? "").trim();
    if (!header) return null;

    for (const s of significant) {
      if (s.ma.toLowerCase() !== mitarbeiter) continue;
      const rc = s.relevant_changes.find(
        (rc) =>
          rc.relevant_spalte.trim().toLowerCase() === header.toLowerCase(),
      );
      if (rc) return rc.effect;
    }
    return null;
  }
</script>

<div class="rounded-xl border border-base-300 bg-base-100 overflow-hidden">
  <div class="overflow-x-auto">
    <table class="table table-zebra table-pin-rows">
      <!-- Neu -->
      {#if nachherParsed.headers.length && nachherParsed.rows.length}
        <tbody class="border-b-2 border-base-300">
          <tr class="bg-primary/15">
            <td
              colspan={Math.max(nachherParsed.headers.length, 1)}
              class="font-semibold text-primary px-4 py-2"
            >
              Neu
            </td>
          </tr>
          <tr>
            {#each nachherParsed.headers as h (h)}
              <th class="font-semibold whitespace-nowrap">{h}</th>
            {/each}
          </tr>
          {#each nachherParsed.rows as row, rowIdx (rowIdx)}
            <tr>
              {#each row as cell, colIdx (colIdx)}
                {@const effect = getCellEffect(
                  row,
                  nachherParsed.headers,
                  colIdx,
                  änderungen ?? [],
                )}
                {@const effectBg =
                  effect === "positiv"
                    ? "!bg-success/25"
                    : effect === "negativ"
                      ? "!bg-error/25"
                      : effect === "neutral"
                        ? "!bg-base-content/10"
                        : ""}
                <td class="whitespace-nowrap {effectBg}">
                  {cell}
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      {:else}
        <tbody class="border-b-2 border-base-300">
          <tr class="bg-primary/15">
            <td class="font-semibold text-primary px-4 py-2">Neu</td>
          </tr>
          <tr>
            <td class="text-base-content/60 text-sm"
              >Keine Zuordnungen (Nachher).</td
            >
          </tr>
        </tbody>
      {/if}

      <!-- Alt -->
      {#if vorherParsed.headers.length && vorherParsed.rows.length}
        <tbody>
          <tr class="bg-secondary/15">
            <td
              colspan={Math.max(vorherParsed.headers.length, 1)}
              class="font-semibold text-secondary px-4 py-2"
            >
              Alt
            </td>
          </tr>
          <tr>
            {#each vorherParsed.headers as h (h)}
              <th class="font-semibold whitespace-nowrap">{h}</th>
            {/each}
          </tr>
          {#each vorherParsed.rows as row, rowIdx (rowIdx)}
            <tr>
              {#each row as cell, colIdx (colIdx)}
                {@const effect = getCellEffect(
                  row,
                  vorherParsed.headers,
                  colIdx,
                  änderungen ?? [],
                )}
                {@const effectBg =
                  effect === "positiv"
                    ? "!bg-success/25"
                    : effect === "negativ"
                      ? "!bg-error/25"
                      : effect === "neutral"
                        ? "!bg-base-content/10"
                        : ""}
                <td class="whitespace-nowrap {effectBg}">
                  {cell}
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      {:else}
        <tbody>
          <tr class="bg-secondary/15">
            <td class="font-semibold text-secondary px-4 py-2">Alt</td>
          </tr>
          <tr>
            <td class="text-base-content/60 text-sm"
              >Keine Zuordnungen (Vorher).</td
            >
          </tr>
        </tbody>
      {/if}
    </table>
  </div>
</div>
