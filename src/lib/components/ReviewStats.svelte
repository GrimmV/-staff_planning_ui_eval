<script lang="ts">
  import type {
    FeldStatsValue,
    FeldDiff,
    DiffStats,
    StatisticsSummary,
  } from "$lib/types";
  const { stats, summary } = $props<{
    stats: DiffStats;
    summary: StatisticsSummary;
  }>();

  export type ChangeItem = {
    label: string;
    from: number | string;
    to: number | string;
  };

  let showSummary = $state(true);

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
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between gap-4 flex-wrap">
    <h3 class="text-lg font-semibold text-base-content">
      Statistische Veränderungen
    </h3>
    <div class="join">
      <button
        type="button"
        class="join-item btn btn-sm {showSummary ? 'btn-active' : 'btn-ghost'}"
        onclick={() => (showSummary = true)}
      >
        Zusammenfassung
      </button>
      <button
        type="button"
        class="join-item btn btn-sm {!showSummary ? 'btn-active' : 'btn-ghost'}"
        onclick={() => (showSummary = false)}
      >
        Details
      </button>
    </div>
  </div>

  {#if showSummary}
    <!-- StatisticsSummary view -->
    <div class="space-y-3">
      {#if summary?.relevant_changes?.length}
        <div class="rounded-lg p-3">
          <ul class="space-y-2">
            {#each summary.relevant_changes as rc (rc.relevant_feature + rc.änderung)}
              {#if rc.effect !== "neutral"}
                {@const rcEffectBg =
                  rc.effect === "positiv"
                    ? "bg-success/25 border-success/50"
                    : rc.effect === "negativ"
                      ? "bg-error/25 border-error/50"
                      : "bg-base-content/10 border-base-content/20"}
                <li class="flex flex-wrap items-baseline gap-2 text-sm">
                  <span class="badge badge-xs border {rcEffectBg} font-normal"
                    >{rc.relevant_feature}</span
                  >
                  <span class="text-base-content">{rc.änderung}</span>
                </li>
              {/if}
            {/each}
          </ul>
        </div>
      {:else}
        <p class="text-base-content/60 text-sm">
          Keine Zusammenfassung verfügbar.
        </p>
      {/if}
    </div>
  {:else}
    <!-- Raw statistics overview -->
    <div class="space-y-2">
      {#each Object.entries(stats.felder ?? {}) as [fieldName, fieldDiff] (fieldName)}
        {@const diff = fieldDiff as FeldDiff}
        {@const changes = getChanges(diff.entfernt, diff.hinzugefügt)}
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
                  <span class="opacity-80"
                    >{c.label.startsWith("aufteilung: ")
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
  {/if}
</div>
