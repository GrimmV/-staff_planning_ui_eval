<script lang="ts">
  import type {
    FeldStatsValue,
    FeldDiff,
    DiffStats,
    FelderDiffMap,
  } from "$lib/types";
  import {
    felderMapWithoutKlientenPrioritaet,
    klientenCountFromFelderMap,
    PRIORITAET_KEINE_AENDERUNGEN_MSG,
    sectionTitleWithKlientenCount,
  } from "$lib/utils/reviewStatsDisplay";
  const { stats } = $props<{
    stats: DiffStats;
  }>();

  /** DaisyUI collapse: Priorität hoch open by default; mittel/niedrig closed. */
  let priorityCollapseOpen = $state<boolean[]>([true, false, false]);

  export type ChangeItem = {
    label: string;
    from: number | string;
    to: number | string;
  };

  function toDisplayValue(v: FeldStatsValue | undefined): number | string {
    if (typeof v === "number" || typeof v === "string") return v;
    return 0;
  }

  function getChanges(
    entfernt?: Record<string, FeldStatsValue>,
    hinzugefügt?: Record<string, FeldStatsValue>,
  ): ChangeItem[] {
    const items: ChangeItem[] = [];
    const vorher = entfernt ?? {};
    const nachher = hinzugefügt ?? {};
    const keys = new Set([...Object.keys(vorher), ...Object.keys(nachher)]);

    for (const k of keys) {
      const vV = vorher[k];
      const vN = nachher[k];
      if (
        (typeof vV === "number" || typeof vV === "string") &&
        (typeof vN === "number" || typeof vN === "string")
      ) {
        items.push({ label: label(k), from: vV, to: vN });
      } else if (
        typeof vV === "object" &&
        vV !== null &&
        typeof vN === "object" &&
        vN !== null
      ) {
        const subV = vV as Record<string, number | string | FeldStatsValue>;
        const subN = vN as Record<string, number | string | FeldStatsValue>;
        const subKeys = new Set([...Object.keys(subV), ...Object.keys(subN)]);
        for (const sk of subKeys) {
          items.push({
            label: `${label(k)}: ${label(sk)}`,
            from: toDisplayValue(subV[sk]),
            to: toDisplayValue(subN[sk]),
          });
        }
      } else {
        items.push({
          label: label(k),
          from: toDisplayValue(vV),
          to: toDisplayValue(vN),
        });
      }
    }
    return items;
  }

  function label(key: string): string {
    return key;
  }

  const PRIORITY_SECTIONS = [
    { key: "hoch" as const, title: "Priorität hoch" },
    { key: "mittel" as const, title: "Priorität mittel" },
    { key: "niedrig" as const, title: "Priorität niedrig" },
  ];

  function felderMapForPriority(
    s: DiffStats,
    key: (typeof PRIORITY_SECTIONS)[number]["key"],
  ): FelderDiffMap {
    return s[key]?.felder ?? {};
  }

  function felderMapHasVisibleChanges(felderMap: FelderDiffMap): boolean {
    const visible = felderMapWithoutKlientenPrioritaet(felderMap);
    for (const fieldDiff of Object.values(visible)) {
      const d = fieldDiff as FeldDiff;
      if (getChanges(d.entfernt, d.hinzugefügt).length > 0) return true;
    }
    return false;
  }
</script>

<div class="space-y-4">
  <h3 class="text-lg font-semibold text-base-content">
    Statistische Veränderungen
  </h3>

  {#snippet felderBlock(
    felderMap: FelderDiffMap,
    key: (typeof PRIORITY_SECTIONS)[number]["key"],
  )}
    {@const displayFelderMap = felderMapWithoutKlientenPrioritaet(felderMap)}
    <div class="space-y-2">
      {#each Object.entries(displayFelderMap) as [fieldName, fieldDiff] (`${key}-${fieldName}`)}
        {@const diff = fieldDiff as FeldDiff}
        {@const changes = getChanges(diff.entfernt, diff.hinzugefügt)}
        {@const sorted = [...changes].sort(
          (a, b) =>
            (a.from === a.to ? 1 : 0) - (b.from === b.to ? 1 : 0),
        )}
        {#if sorted.length > 0}
          <div
            class="flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-lg bg-base-200 px-3 py-2 text-sm"
          >
            <span class="font-medium shrink-0">{fieldName}</span>
            <span class="flex flex-wrap gap-x-3 gap-y-0.5">
              {#each sorted as c (c.label + key)}
                <span class="text-base-content/90">
                  <span class="opacity-80"
                    >{c.label.startsWith("aufteilung: ")
                      ? c.label.slice(12)
                      : c.label}:</span
                  >
                  {#if c.from === c.to}
                    <span>{c.to}</span>
                  {:else}
                    <span class="bg-cyan-100 rounded-md p-1">
                      <span>{c.from}</span>
                      <span class="opacity-60">→</span>
                      <span>{c.to}</span>
                    </span>
                  {/if}
                </span>
              {/each}
            </span>
          </div>
        {/if}
      {/each}
    </div>
    {#if Object.keys(displayFelderMap).length === 0}
      <p class="text-base-content/50 text-sm">Keine Einträge.</p>
    {:else if !felderMapHasVisibleChanges(felderMap)}
      <p class="text-base-content/50 text-sm">
        {PRIORITAET_KEINE_AENDERUNGEN_MSG}
      </p>
    {/if}
  {/snippet}

  <div class="space-y-4">
    {#each PRIORITY_SECTIONS as section, i (section.key)}
      {@const key = section.key}
      {@const title = section.title}
      {@const felderMap = felderMapForPriority(stats, key)}
      {@const sectionTitle = sectionTitleWithKlientenCount(
        title,
        felderMap,
        key,
      )}
      {@const klientenN = klientenCountFromFelderMap(felderMap, key)}
      <div
        class="collapse collapse-arrow rounded-lg border border-base-300/60 bg-base-100"
      >
        <input
          type="checkbox"
          class="min-h-0"
          bind:checked={priorityCollapseOpen[i]}
          aria-label="{sectionTitle} ein- oder ausklappen"
        />
        <div
          class="collapse-title text-sm font-semibold uppercase tracking-wide text-base-content/80 min-h-0 py-3"
        >
          {sectionTitle}
        </div>
        <div class="collapse-content space-y-2">
          {#if key !== "hoch" && klientenN === 0}
            <p class="text-base-content/50 text-sm">
              {PRIORITAET_KEINE_AENDERUNGEN_MSG}
            </p>
          {:else}
            {@render felderBlock(felderMap, key)}
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>
