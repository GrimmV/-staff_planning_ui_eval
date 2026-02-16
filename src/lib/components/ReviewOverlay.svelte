<script lang="ts">
  import type { DiffsResponse } from '$lib/types';
  import ReviewStats from './ReviewStats.svelte';
  import ReviewAssignments from './ReviewAssignments.svelte';

  const { onClose, new_ma, new_client, ma_assignments, klient_assignments, onAccept } = $props<{
    onClose: () => void;
    new_ma: string;
    new_client: string;
    ma_assignments: string[];
    klient_assignments: string[];
    onAccept: (payload: { mitarbeiter: string; klient: string }) => void;
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
      const data = (await res.json()) as DiffsResponse[];
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

  const stats = $derived(diffs[0]?.stats);
  const assessment = $derived(diffs[0]?.assessment);

  const scoreOptions = [
    { id: 'akzeptieren' as const, label: 'Akzeptieren', activeClass: 'badge-success' },
    { id: 'eher akzeptieren' as const, label: 'Eher akzeptieren', activeClass: 'badge-info' },
    { id: 'eher ablehnen' as const, label: 'Eher ablehnen', activeClass: 'badge-warning' },
    { id: 'ablehnen' as const, label: 'Ablehnen', activeClass: 'badge-error' }
  ];

  const handleAccept = () => {
    const payload = {
      mitarbeiter: new_ma,
      klient: new_client
    };
    console.log("handleAccept", payload);
    onAccept(payload);
  };
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
            <div class="stat-value text-primary">{stats.anzahl.gesamt_vorher}</div>
            <div class="stat-desc">Zuordnungen</div>
          </div>
          <div class="stat">
            <div class="stat-title">Nachher</div>
            <div class="stat-value">{stats.anzahl.gesamt_nachher}</div>
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
        <h3 class="text-2xl font-bold text-base-content">Automatische Bewertung</h3>
        <!-- Bewertung -->
        {#if assessment}
          <div class="mb-6 space-y-4">
            <div class="flex items-center gap-2 flex-wrap">
              {#each scoreOptions as opt (opt.id)}
                <span
                  class="badge {assessment.score === opt.id ? opt.activeClass : 'badge-ghost'}"
                >
                  {opt.label}
                </span>
              {/each}
            </div>
            <div
              class="collapse collapse-arrow bg-base-200 border border-base-300 rounded-lg overflow-hidden"
            >
              <input type="checkbox" />
              <div class="collapse-title min-h-0 py-4 font-medium">
                {assessment.short_assessment}
              </div>
              <div class="collapse-content">
                <p class="pt-2 text-base-content/90">{assessment.assessment}</p>
              </div>
            </div>
          </div>
        {/if}

        <!-- Felder: nur geänderte Werte -->
        <ReviewStats {stats} />

        <!-- Zuordnungstabellen Vorher/Nachher -->
        
          <div class="mt-8 pt-6 border-t border-base-300">
            <ReviewAssignments
              vorher={diffs[0].vorher}
              nachher={diffs[0].nachher}
              significantAssignments={assessment?.significant_assignments ?? []}
            />
          </div>
          <button class="btn btn-primary" onclick={() => onAccept({ mitarbeiter: new_ma, klient: new_client })}>
            Zuordnung annehmen
          </button>
      {:else}
        <div class="min-h-[200px] flex items-center justify-center text-base-content/70">
          Keine Statistikdaten vorhanden.
        </div>
      {/if}
    </div>
  </div>
</div>

