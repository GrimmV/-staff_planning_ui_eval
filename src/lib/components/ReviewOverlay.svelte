<script lang="ts">
  import type { DiffsResponse } from "$lib/types";
  import ReviewStats from "./ReviewStats.svelte";
  import ReviewAssignments from "./ReviewAssignments.svelte";
  import Assessment from "./Assessment.svelte";
  const {
    onClose,
    new_ma,
    new_client,
    ma_assignments,
    klient_assignments,
    onAccept,
  } = $props<{
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
      const res = await fetch("/api/diff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          add_ma: new_ma,
          add_client: new_client,
          unavailable_mas: ma_assignments,
          unavailable_clients: klient_assignments,
        }),
      });
      if (!res.ok) throw new Error("Diff-Anfrage fehlgeschlagen");
      const data = (await res.json()) as DiffsResponse[];
      diffs = Array.isArray(data) ? data : [data];
    } catch (e) {
      error = e instanceof Error ? e.message : "Unbekannter Fehler";
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
      durchschnitt: "Durchschnitt",
      max: "Max",
      min: "Min",
      mit_erfahrung: "Mit Erfahrung",
      ohne_erfahrung: "Ohne Erfahrung",
      durchschnittlich_erfahrung: "Durchschnittl. Erfahrung",
      aufteilung: "Aufteilung",
      hoch: "Hoch",
      mittel: "Mittel",
      niedrig: "Niedrig",
      voller_zeitraum: "Voller Zeitraum",
      teilweiser_zeitraum: "Teilweiser Zeitraum",
      durchschnittlich_fehlend: "Durchschnittl. fehlend",
    };
    return labels[key] ?? key;
  }

  const stats = $derived(diffs[0]?.stats);
  const assessment = $derived(diffs[0]?.assessment);

  const handleAccept = () => {
    const payload = {
      mitarbeiter: new_ma,
      klient: new_client,
    };
    console.log("handleAccept", payload);
    onAccept(payload);
  };
</script>

<div class="fixed inset-0 z-40 flex items-center justify-center">
  <div class="absolute inset-0 bg-base-300/70 backdrop-blur-sm"></div>

  <div
    class="relative z-50 w-full max-w-5xl mx-4 max-h-[90vh] rounded-xl bg-base-100 shadow-2xl border border-base-300 flex flex-col"
  >
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
        <div
          class="flex flex-col items-center justify-center min-h-[200px] gap-4 text-base-content/70"
        >
          <span class="loading loading-spinner loading-lg text-primary"></span>
          <p>Lade Auswirkungsanalyse …</p>
        </div>
      {:else if error}
        <div class="alert alert-error shadow-lg">
          <span>{error}</span>
        </div>
      {:else if stats}
        <!-- Zusammenfassung: Anzahl -->
        <div
          class="stats stats-vertical sm:stats-horizontal shadow w-full mb-8"
        >
          <div class="stat">
            <div class="stat-title">Vorher</div>
            <div class="stat-value">{stats.anzahl.gesamt_vorher}</div>
            <div class="stat-desc">Zuordnungen</div>
          </div>
          <div class="stat">
            <div class="stat-title">Nachher</div>
            <div class="stat-value">{stats.anzahl.gesamt_nachher}</div>
            <div class="stat-desc">Zuordnungen</div>
          </div>
          <div class="stat">
            <div class="stat-value text-success">
              {stats.anzahl.hinzugefügt}
            </div>
            <div class="stat-desc">ersetzt</div>
          </div>
          <div class="stat">
            <div class="stat-value text-error">
              {stats.anzahl.entfernt - stats.anzahl.hinzugefügt}
            </div>
            <div class="stat-desc">entfernt</div>
          </div>
        </div>
        <!-- Bewertung -->
        {#if assessment}
          <Assessment {assessment} />
        {/if}

        <div
          class="flex flex-wrap items-center gap-3 text-sm text-base-content/80 mb-4"
        >
          <span class="font-medium">Legende:</span>
          <span class="flex items-center gap-1.5">
            <span
              class="inline-block w-4 h-4 rounded bg-success/25 border border-success/50"
              aria-hidden
            ></span>
            Positiver Effekt
          </span>
          <span class="flex items-center gap-1.5">
            <span
              class="inline-block w-4 h-4 rounded bg-error/25 border border-error/50"
              aria-hidden
            ></span>
            Negativer Effekt
          </span>
          <span class="flex items-center gap-1.5">
            <span
              class="inline-block w-4 h-4 rounded bg-base-content/10 border border-base-content/20"
              aria-hidden
            ></span>
            Neutraler Effekt
          </span>
        </div>

        <!-- Felder: nur geänderte Werte -->
        <ReviewStats {stats} summary={assessment?.statistiken} />

        <!-- Zuordnungstabellen Vorher/Nachher -->

        <div class="mt-8 pt-6 border-t border-base-300">
          <ReviewAssignments
            vorher={diffs[0].vorher}
            nachher={diffs[0].nachher}
            änderungen={assessment?.änderungen}
          />
        </div>
        <button
          class="btn btn-primary"
          onclick={handleAccept}
        >
          Zuordnung annehmen
        </button>
      {:else}
        <div
          class="min-h-[200px] flex items-center justify-center text-base-content/70"
        >
          Keine Statistikdaten vorhanden.
        </div>
      {/if}
    </div>
  </div>
</div>
