<script lang="ts">
  import type { DiffsResponse } from "$lib/types";
  import ReviewStats from "./ReviewStats.svelte";
  import ReviewStatsNoLLM from "./ReviewStatsNoLLM.svelte";
  import ReviewAssignments from "./ReviewAssignments.svelte";
  import ReviewAssignmentsNoLLM from "./ReviewAssignmentsNoLLM.svelte";
  import Assessment from "./Assessment.svelte";

  type ReviewAlternativeRow = {
    mitarbeiterId: string;
    mitarbeiterName: string;
    klientId: string;
    klientName: string;
  };
  const {
    onClose,
    new_ma,
    new_client,
    ma_assignments,
    klient_assignments,
    onAccept,
    useLLM,
    alternatives = [],
    primaryAssignment,
    onAlternativeChange,
    timerSecondsLeft = null,
  } = $props<{
    onClose: () => void;
    new_ma: string;
    new_client: string;
    ma_assignments: string[];
    klient_assignments: string[];
    onAccept: (payload: { mitarbeiter: string; klient: string }) => void;
    useLLM: boolean;
    /** Nur alternative Klienten (ohne Hauptempfehlung); Pfeile wechseln nur zwischen diesen. */
    alternatives?: ReviewAlternativeRow[];
    /** Hauptempfehlung — nur für die Überschrift, wenn diese Zuordnung aktiv ist. */
    primaryAssignment?: ReviewAlternativeRow;
    onAlternativeChange?: (payload: {
      mitarbeiter: string;
      klient: string;
    }) => void;
    timerSecondsLeft?: number | null;
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

  const isViewingAlternative = $derived(
    alternatives.some((a: ReviewAlternativeRow) => a.klientId === new_client),
  );

  const canNavigateAlternatives = $derived(
    alternatives.length >= 1 && !!onAlternativeChange,
  );

  const assignmentHeadline = $derived.by(() => {
    const alt = alternatives.find(
      (a: ReviewAlternativeRow) => a.klientId === new_client,
    );
    if (alt?.mitarbeiterName && alt?.klientName) {
      return `${alt.mitarbeiterName} – ${alt.klientName}`;
    }
    if (
      primaryAssignment &&
      primaryAssignment.klientId === new_client &&
      primaryAssignment.mitarbeiterName &&
      primaryAssignment.klientName
    ) {
      return `${primaryAssignment.mitarbeiterName} – ${primaryAssignment.klientName}`;
    }
    return "";
  });

  function goToAlternative(delta: number) {
    if (!alternatives.length || !onAlternativeChange) return;
    const n = alternatives.length;
    if (!isViewingAlternative) {
      const entry = delta > 0 ? alternatives[0] : alternatives[n - 1];
      if (!entry) return;
      onAlternativeChange({
        mitarbeiter: entry.mitarbeiterId,
        klient: entry.klientId,
      });
      return;
    }
    const idx = alternatives.findIndex(
      (a: ReviewAlternativeRow) => a.klientId === new_client,
    );
    if (idx < 0) return;
    const next = (idx + delta + n) % n;
    const entry = alternatives[next];
    if (!entry) return;
    onAlternativeChange({
      mitarbeiter: entry.mitarbeiterId,
      klient: entry.klientId,
    });
  }

  function formatCountdown(totalSec: number): string {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  const isFinalThirtySeconds = $derived(
    timerSecondsLeft !== null && timerSecondsLeft <= 30,
  );
</script>

<div class="fixed inset-0 z-40 flex items-center justify-center">
  {#if timerSecondsLeft !== null}
    <div
      class="fixed bottom-4 right-4 z-[60] rounded-md px-3 py-2 text-sm font-semibold shadow-lg {isFinalThirtySeconds
        ? 'bg-error text-error-content'
        : 'bg-warning text-warning-content'}"
    >
      {formatCountdown(timerSecondsLeft)}
    </div>
  {/if}
  <div class="absolute inset-0 bg-base-300/70 backdrop-blur-sm"></div>

  <div
    class="relative z-50 w-full max-w-6xl mx-4 max-h-[90vh] rounded-xl bg-base-100 shadow-2xl border border-base-300 flex flex-col"
  >
    <button
      type="button"
      class="btn btn-ghost btn-sm absolute right-3 top-3 z-10"
      aria-label="Schließen"
      onclick={onClose}
    >
      ✕
    </button>

    {#if alternatives.length > 0}
      <div
        class="shrink-0 flex items-center gap-2 border-b border-base-300 px-4 pt-12 pb-3 pr-14"
      >
        {#if canNavigateAlternatives}
          <button
            type="button"
            class="btn btn-ghost btn-sm btn-square shrink-0"
            aria-label="Vorherige Alternative"
            onclick={() => goToAlternative(-1)}
          >
            ←
          </button>
        {:else}
          <span class="w-9 shrink-0" aria-hidden="true"></span>
        {/if}
        <p
          class="flex-1 min-w-0 text-center text-base font-semibold text-base-content truncate"
        >
          {assignmentHeadline || "Zuordnung"}
        </p>
        {#if canNavigateAlternatives}
          <button
            type="button"
            class="btn btn-ghost btn-sm btn-square shrink-0"
            aria-label="Nächste Alternative"
            onclick={() => goToAlternative(1)}
          >
            →
          </button>
        {:else}
          <span class="w-9 shrink-0" aria-hidden="true"></span>
        {/if}
      </div>
    {/if}

    <div
      class="p-8 overflow-auto flex-1 {alternatives.length > 0 ? 'pt-6' : 'pt-12'}"
    >
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
        {#if assessment && useLLM}
          <Assessment {assessment} diffsResponse={diffs[0]} />
        {/if}
        
        {#if useLLM}
        <!-- Felder: nur geänderte Werte -->
        <div
          class="collapse collapse-arrow bg-base-200 my-4 border border-base-300 rounded-lg"
        >
          <input type="checkbox" checked={false} />
          <div class="collapse-title font-semibold min-h-0 py-3">
            Statistik &amp; Änderungen
          </div>
          <div class="collapse-content">
            <ReviewStats {stats} summary={assessment?.statistiken} />
          </div>
        </div>
        {:else}
          <ReviewStatsNoLLM {stats} />
        {/if}


        {#if useLLM}
        <!-- Zuordnungstabellen Vorher/Nachher -->
        <div
          class="collapse collapse-arrow bg-base-200 my-4 border border-base-300 rounded-lg"
        >
          <input type="checkbox" checked={false} />
          <div class="collapse-title font-semibold min-h-0 py-3">
            Zuordnungen Vorher/Nachher
          </div>
          <div class="collapse-content">
            <ReviewAssignments
              vorher={diffs[0].vorher}
              nachher={diffs[0].nachher}
              änderungen={assessment?.änderungen}
            />
          </div>
        </div>
        {:else}
          <ReviewAssignmentsNoLLM
            vorher={diffs[0].vorher}
            nachher={diffs[0].nachher}
          />
        {/if}
        <button class="btn btn-primary" onclick={handleAccept}>
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
