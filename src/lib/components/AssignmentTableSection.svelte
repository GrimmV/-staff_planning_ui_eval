<script lang="ts">
  import { Check, X } from "@lucide/svelte";
  import type { SignificantAssignment } from "$lib/types";

  const {
    parsed,
    variant,
    änderungen = [],
    vorherKlientSet,
    nachherKlientSet,
  } = $props<{
    parsed: { headers: string[]; rows: string[][] };
    variant: "neu" | "alt";
    änderungen?: SignificantAssignment[];
    vorherKlientSet: ReadonlySet<string>;
    nachherKlientSet: ReadonlySet<string>;
  }>();

  const mitarbeiterColIdx = (headers: string[]): number =>
    headers.findIndex((h) => h.toLowerCase().includes("mitarbeiter"));
  const klientColIdx = (headers: string[]): number =>
    headers.findIndex((h) => h.toLowerCase().includes("klient"));
  const prioritaetColIdx = (headers: string[]): number =>
    headers.findIndex((h) => /priorit/i.test(h));

  /** Sort order: hoch → mittel → niedrig; unknown values last. */
  function prioritaetRank(cell: string): number {
    const s = cell.trim().toLowerCase();
    if (s === "hoch" || s === "high") return 0;
    if (s === "mittel" || s === "medium") return 1;
    if (s === "niedrig" || s === "low") return 2;
    if (s.includes("hoch")) return 0;
    if (s.includes("mittel")) return 1;
    if (s.includes("niedrig")) return 2;
    return 3;
  }

  const sortedRows = $derived.by(() => {
    const rows = parsed.rows;
    const headers = parsed.headers;
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
  const effectInvert = $derived(!isNeu);
  const kCol = $derived(klientColIdx(parsed.headers));
</script>

{#if parsed.headers.length && parsed.rows.length}
  <tbody class={isNeu ? "border-b-2 border-base-300" : ""}>
    <tr class={headerRowClass}>
      <td
        colspan={Math.max(parsed.headers.length, 1)}
        class="{headerTextClass} px-4 py-2"
      >
        {label}
      </td>
    </tr>
    <tr>
      {#each parsed.headers as h (h)}
        <th class="font-semibold whitespace-nowrap">{h}</th>
      {/each}
    </tr>
    {#each sortedRows as row, rowIdx (rowIdx)}
      <tr>
        {#each row as cell, colIdx (colIdx)}
          {@const effect = getCellEffect(
            row,
            parsed.headers,
            colIdx,
            änderungen ?? [],
          )}
          {@const effectBg = effectBgClasses(effect, effectInvert)}
          {@const showKlientBadge =
            colIdx === kCol && kCol >= 0
              ? isNeu
                ? klientIsAdded(row, parsed.headers, vorherKlientSet)
                : klientIsRemoved(row, parsed.headers, nachherKlientSet)
              : false}
          <td class="whitespace-nowrap {effectBg}">
            {cell}{#if showKlientBadge}{#if isNeu}<Check
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
