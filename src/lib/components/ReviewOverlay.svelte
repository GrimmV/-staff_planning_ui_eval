<script lang="ts">
  import type { DiffsResponse, FeldStatsValue } from '$lib/types';

  const { onClose, new_ma, new_client, ma_assignments, klient_assignments } = $props<{
    onClose: () => void;
    new_ma: string;
    new_client: string;
    ma_assignments: string[];
    klient_assignments: string[];
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
          add_client: new_client,
          unavailable_mas: ma_assignments,
          unavailable_clients: klient_assignments
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
    console.log("ma_assignments", ma_assignments);
    console.log("klient_assignments", klient_assignments);
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

  type ChangeItem = { label: string; from: number; to: number };

  /** Compare vorher (entfernt) vs nachher (hinzugefügt), return all values (unchanged: same number, changed: from→to). */
  function getChanges(
    entfernt?: Record<string, FeldStatsValue>,
    hinzugefügt?: Record<string, FeldStatsValue>
  ): ChangeItem[] {
    const items: ChangeItem[] = [];
    const vorher = entfernt ?? {};
    const nachher = hinzugefügt ?? {};
    const keys = new Set([...Object.keys(vorher), ...Object.keys(nachher)]);

    for (const k of keys) {
      const vV = vorher[k];
      const vN = nachher[k];
      if (typeof vV === 'number' && typeof vN === 'number') {
        items.push({ label: label(k), from: vV, to: vN });
      } else if (typeof vV === 'object' && vV !== null && typeof vN === 'object' && vN !== null) {
        const subV = vV as Record<string, number>;
        const subN = vN as Record<string, number>;
        const subKeys = new Set([...Object.keys(subV), ...Object.keys(subN)]);
        for (const sk of subKeys) {
          items.push({
            label: `${label(k)}: ${label(sk)}`,
            from: subV[sk] ?? 0,
            to: subN[sk] ?? 0
          });
        }
      } else {
        items.push({
          label: label(k),
          from: typeof vV === 'number' ? vV : 0,
          to: typeof vN === 'number' ? vN : 0
        });
      }
    }
    return items;
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

        <!-- Felder: nur geänderte Werte -->
        <h3 class="text-lg font-semibold mb-3">Änderungen nach Kriterium</h3>
        <div class="space-y-2">
          {#each Object.entries(stats.felder ?? {}) as [fieldName, fieldDiff] (fieldName)}
            {@const changes = getChanges(fieldDiff.entfernt, fieldDiff.hinzugefügt)}
            {@const sorted = [...changes].sort((a, b) => (a.from === a.to ? 1 : 0) - (b.from === b.to ? 1 : 0))}
            {#if sorted.length > 0}
              <div class="flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-lg bg-base-200 px-3 py-2 text-sm">
                <span class="font-medium shrink-0">{fieldName}</span>
                <span class="flex flex-wrap gap-x-3 gap-y-0.5">
                  {#each sorted as c (c.label)}
                    <span class="text-base-content/90">
                      {console.log("c.label", c.label)}
                      <span class="opacity-80">{c.label.startsWith('Aufteilung: ') ? c.label.slice(12) : c.label}:</span>
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
      {:else}
        <div class="min-h-[200px] flex items-center justify-center text-base-content/70">
          Keine Statistikdaten vorhanden.
        </div>
      {/if}
    </div>
  </div>
</div>

