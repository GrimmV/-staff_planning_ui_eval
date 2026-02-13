<script lang="ts">
  import type { DiffsResponse, FeldStatsValue } from '$lib/types';

  const { onClose, new_ma, new_client } = $props<{
    onClose: () => void;
    new_ma: string;
    new_client: string;
  }>();

  let diffs = $state<DiffsResponse[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  async function loadDiffs() {
    loading = true;
    error = null;
    try {
      const res = await fetch('/api/diff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          add_ma: new_ma,
          add_client: new_client
        })
      });
      if (!res.ok) throw new Error('Diff-Anfrage fehlgeschlagen');
      const data = await res.json();
      diffs = Array.isArray(data) ? data : [data];
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unbekannter Fehler';
      diffs = [];
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    loadDiffs();
  });

  /** Human-readable label for stat keys */
  function label(key: string): string {
    const labels: Record<string, string> = {
      durchschnitt: 'Durchschnitt',
      max: 'Max',
      min: 'Min',
      mit_erfahrung: 'Mit Erfahrung',
      ohne_erfahrung: 'Ohne Erfahrung',
      durchschnittlich_erfahrung: 'Durchschnittl. Erfahrung',
      aufteilung: 'Aufteilung',
      hoch: 'Hoch',
      mittel: 'Mittel',
      niedrig: 'Niedrig',
      voller_zeitraum: 'Voller Zeitraum',
      teilweiser_zeitraum: 'Teilweiser Zeitraum',
      durchschnittlich_fehlend: 'Durchschnittl. fehlend'
    };
    return labels[key] ?? key;
  }

  /** Render a single stat value (number or nested object) */
  function renderStatValue(value: FeldStatsValue): string | Record<string, number> {
    if (typeof value === 'number') return String(value);
    return value as Record<string, number>;
  }

  const stats = $derived(diffs[0]?.stats);
</script>

<div class="fixed inset-0 z-40 flex items-center justify-center">
  <div class="absolute inset-0 bg-base-300/70 backdrop-blur-sm"></div>

  <div class="relative z-50 w-full max-w-5xl mx-4 max-h-[90vh] rounded-xl bg-base-100 shadow-2xl border border-base-300 flex flex-col">
    <button
      type="button"
      class="btn btn-ghost btn-sm absolute right-3 top-3 z-10"
      aria-label="Schließen"
      onclick={onClose}
    >
      ✕
    </button>

    <div class="p-8 pt-12 overflow-auto flex-1">
      {#if loading}
        <div class="flex flex-col items-center justify-center min-h-[200px] gap-4 text-base-content/70">
          <span class="loading loading-spinner loading-lg text-primary"></span>
          <p>Lade Auswirkungsanalyse …</p>
        </div>
      {:else if error}
        <div class="alert alert-error shadow-lg">
          <span>{error}</span>
        </div>
      {:else if stats}
        <!-- Zusammenfassung: Anzahl -->
        <div class="stats stats-vertical sm:stats-horizontal shadow w-full mb-8">
          <div class="stat">
            <div class="stat-title">Vorher</div>
            <div class="stat-value text-primary">{stats.anzahl.alt}</div>
            <div class="stat-desc">Zuordnungen</div>
          </div>
          <div class="stat">
            <div class="stat-title">Nachher</div>
            <div class="stat-value">{stats.anzahl.neu}</div>
            <div class="stat-desc">Zuordnungen</div>
          </div>
          <div class="stat">
            <div class="stat-value text-error">{stats.anzahl.entfernt}</div>
            <div class="stat-desc">entfernt</div>
          </div>
          <div class="stat">
            <div class="stat-value text-success">{stats.anzahl.hinzugefügt}</div>
            <div class="stat-desc">neu</div>
          </div>
        </div>

        <!-- Felder: Änderungen pro Kriterium -->
        <h3 class="text-lg font-semibold mb-3">Änderungen nach Kriterium</h3>
        <div class="space-y-4">
          {#each Object.entries(stats.felder ?? {}) as [fieldName, fieldDiff] (fieldName)}
            <div class="rounded-lg bg-base-200 p-4">
              <div class="font-medium mb-3">{fieldName}</div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <!-- Vorher (links) -->
                <div class="rounded-lg bg-error/10 border border-error/30 p-4">
                  <div class="font-semibold text-error mb-2">Vorher</div>
                  {#if fieldDiff.entfernt && Object.keys(fieldDiff.entfernt).length > 0}
                    <ul class="space-y-1 text-sm">
                      {#each Object.entries(fieldDiff.entfernt) as [k, v] (k)}
                        {@const rendered = renderStatValue(v)}
                        {#if typeof rendered === 'string'}
                          <li><span class="opacity-80">{label(k)}:</span> <strong>{rendered}</strong></li>
                        {:else}
                          <li>
                            <span class="opacity-80">{label(k)}:</span>
                            <ul class="ml-3 mt-0.5">
                              {#each Object.entries(rendered) as [sk, sv] (sk)}
                                <li>{label(sk)}: <strong>{sv}</strong></li>
                              {/each}
                            </ul>
                          </li>
                        {/if}
                      {/each}
                    </ul>
                  {:else}
                    <p class="text-base-content/60 text-sm">—</p>
                  {/if}
                </div>
                <!-- Nachher (rechts) -->
                <div class="rounded-lg bg-success/10 border border-success/30 p-4">
                  <div class="font-semibold text-success mb-2">Nachher</div>
                  {#if fieldDiff.hinzugefügt && Object.keys(fieldDiff.hinzugefügt).length > 0}
                    <ul class="space-y-1 text-sm">
                      {#each Object.entries(fieldDiff.hinzugefügt) as [k, v] (k)}
                        {@const rendered = renderStatValue(v)}
                        {#if typeof rendered === 'string'}
                          <li><span class="opacity-80">{label(k)}:</span> <strong>{rendered}</strong></li>
                        {:else}
                          <li>
                            <span class="opacity-80">{label(k)}:</span>
                            <ul class="ml-3 mt-0.5">
                              {#each Object.entries(rendered) as [sk, sv] (sk)}
                                <li>{label(sk)}: <strong>{sv}</strong></li>
                              {/each}
                            </ul>
                          </li>
                        {/if}
                      {/each}
                    </ul>
                  {:else}
                    <p class="text-base-content/60 text-sm">—</p>
                  {/if}
                </div>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="min-h-[200px] flex items-center justify-center text-base-content/70">
          Keine Statistikdaten vorhanden.
        </div>
      {/if}
    </div>
  </div>
</div>

