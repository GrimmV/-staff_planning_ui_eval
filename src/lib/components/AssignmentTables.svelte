<script lang="ts">
  import { Check, X } from "@lucide/svelte";
  import { SvelteSet } from "svelte/reactivity";
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
  const prioritaetColIdx = (headers: string[]): number =>
    headers.findIndex((h) => /priorit/i.test(h));

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

  const vorherKlientSet = $derived(klientSetFromTable(vorherParsed));
  const nachherKlientSet = $derived(klientSetFromTable(nachherParsed));

  /** Added Klient: in Nachher but not in Vorher — show green check in Neu table. */
  function klientIsAdded(
    row: string[],
    headers: string[],
    vorherKlientSet: SvelteSet<string>,
  ): boolean {
    const kIdx = klientColIdx(headers);
    if (kIdx < 0) return false;
    const k = (row[kIdx] ?? "").trim().toLowerCase();
    if (!k) return false;
    return !vorherKlientSet.has(k);
  }

  /** Removed Klient: in Vorher but not in Nachher — show red X in Alt table. */
  function klientIsRemoved(
    row: string[],
    headers: string[],
    nachherKlientSet: SvelteSet<string>,
  ): boolean {
    const kIdx = klientColIdx(headers);
    if (kIdx < 0) return false;
    const k = (row[kIdx] ?? "").trim().toLowerCase();
    if (!k) return false;
    return !nachherKlientSet.has(k);
  }

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
    if (colIdx === prioritaetColIdx(headers)) return null;
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

  /** Background classes for änderungen cell effects; Vorher inverts green/red. */
  function effectBgClasses(
    effect: "positiv" | "negativ" | "neutral" | null,
    invertPosNeg: boolean,
  ): string {
    if (!effect) return "";
    if (effect === "neutral") return "!bg-base-content/10";
    if (effect === "positiv") {
      return invertPosNeg ? "!bg-error/25" : "!bg-success/25";
    }
    return invertPosNeg ? "!bg-success/25" : "!bg-error/25";
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
            {@const kColNachher = klientColIdx(nachherParsed.headers)}
            <tr>
              {#each row as cell, colIdx (colIdx)}
                {@const effect = getCellEffect(
                  row,
                  nachherParsed.headers,
                  colIdx,
                  änderungen ?? [],
                )}
                {@const effectBg = effectBgClasses(effect, false)}
                {@const showAddedKlient =
                  colIdx === kColNachher && kColNachher >= 0
                    ? klientIsAdded(row, nachherParsed.headers, vorherKlientSet)
                    : false}
                <td class="whitespace-nowrap {effectBg}">
                  {cell}{#if showAddedKlient}<Check
                      class="ml-1 inline-block size-6 shrink-0 text-success select-none font-bold"
                      aria-hidden="true"
                    />{/if}
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
            {@const kColVorher = klientColIdx(vorherParsed.headers)}
            <tr>
              {#each row as cell, colIdx (colIdx)}
                {@const effect = getCellEffect(
                  row,
                  vorherParsed.headers,
                  colIdx,
                  änderungen ?? [],
                )}
                {@const effectBg = effectBgClasses(effect, true)}
                {@const showRemovedKlient =
                  colIdx === kColVorher && kColVorher >= 0
                    ? klientIsRemoved(
                        row,
                        vorherParsed.headers,
                        nachherKlientSet,
                      )
                    : false}
                <td class="whitespace-nowrap {effectBg}">
                  {cell}{#if showRemovedKlient}<X
                      class="ml-1 inline-block size-6 shrink-0 text-error select-none font-bold"
                      aria-hidden="true"
                    />{/if}
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
