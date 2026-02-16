<script lang="ts">
  import type { FeldStatsValue } from "$lib/types";
  import type { DiffStats } from "$lib/types";
  const { stats } = $props<{ stats: DiffStats }>();

  export type ChangeItem = { label: string; from: number; to: number };

  
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
      if (typeof vV === "number" && typeof vN === "number") {
        items.push({ label: label(k), from: vV, to: vN });
      } else if (
        typeof vV === "object" &&
        vV !== null &&
        typeof vN === "object" &&
        vN !== null
      ) {
        const subV = vV as Record<string, number>;
        const subN = vN as Record<string, number>;
        const subKeys = new Set([...Object.keys(subV), ...Object.keys(subN)]);
        for (const sk of subKeys) {
          items.push({
            label: `${label(k)}: ${label(sk)}`,
            from: subV[sk] ?? 0,
            to: subN[sk] ?? 0,
          });
        }
      } else {
        items.push({
          label: label(k),
          from: typeof vV === "number" ? vV : 0,
          to: typeof vN === "number" ? vN : 0,
        });
      }
    }
    return items;
  }

  function label(key: string): string {
    return key;
  }
</script>

<h3 class="text-lg font-semibold text-base-content">Veränderungen</h3>
<div class="space-y-2">
  {#each Object.entries(stats.felder ?? {}) as [fieldName, fieldDiff] (fieldName)}
    {@const changes = getChanges(fieldDiff.entfernt, fieldDiff.hinzugefügt)}
    {@const sorted = [...changes].sort(
      (a, b) => (a.from === a.to ? 1 : 0) - (b.from === b.to ? 1 : 0),
    )}
    {#if sorted.length > 0}
      <div
        class="flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-lg bg-base-200 px-3 py-2 text-sm"
      >
        <span class="font-medium shrink-0">{fieldName}</span>
        <span class="flex flex-wrap gap-x-3 gap-y-0.5">
          {#each sorted as c (c.label)}
            <span class="text-base-content/90">
              {console.log("c.label", c.label)}
              <span class="opacity-80"
                >{c.label.startsWith("Aufteilung: ")
                  ? c.label.slice(12)
                  : c.label}:</span
              >
              {#if c.from === c.to}
                <span>{c.to}</span>
              {:else}
                <span class="text-success">{c.from}</span>
                <span class="opacity-60">→</span>
                <span class="text-error">{c.to}</span>
              {/if}
            </span>
          {/each}
        </span>
      </div>
    {/if}
  {/each}
</div>
