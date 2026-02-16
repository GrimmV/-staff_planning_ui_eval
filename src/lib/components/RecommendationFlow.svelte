<script lang="ts">
  import RecommendationCard from "./RecommendationCard.svelte";
  import ReviewOverlay from "./ReviewOverlay.svelte";
  import type { Klient, Mitarbeiter } from "$lib/types";
  import { klient } from "$lib/sampleData";

  interface RecommendationEntry {
    mitarbeiter: Mitarbeiter;
    klient: Klient;
    alternativeKlienten?: Klient[];
  }

  const {
    recommendations = [],
    onAssign,
    onComplete,
    ma_assignments = [],
    klient_assignments = [],
    loading = false,
    error = null,
  } = $props<{
    recommendations: RecommendationEntry[];
    onAssign?: (payload: { mitarbeiter: string; klient: string }) => void;
    onComplete?: () => void;
    ma_assignments?: string[];
    klient_assignments?: string[];
    loading?: boolean;
    error?: string | null;
  }>();

  const remaining = $derived(recommendations.length);
  const total = $derived(recommendations.length + klient_assignments.length);

  let assignedCount = $derived(ma_assignments.length);
  let isReviewOverlayOpen = $state(false);

  const current = $derived(remaining > 0 ? recommendations[0] : undefined);
  let active_client = $state<string | undefined>(current?.klient.id);
  let active_mitarbeiter = $state<string | undefined>(current?.mitarbeiter.id);

  const advance = () => {
    const isLast = remaining === 0;
    if (isLast) onComplete?.();
  };

  const openReviewOverlay = () => {
    isReviewOverlayOpen = true;
  };

  const closeReviewOverlay = () => {
    isReviewOverlayOpen = false;
  };

  const handleAssign = (payload: { mitarbeiter: string; klient: string }) => {
    onAssign?.({ ...payload });
    advance();
  };

  const handleAccept = (payload: { mitarbeiter: string; klient: string }) => {
    isReviewOverlayOpen = false;
    console.log("handleAccept", payload);
    handleAssign(payload);
  };

  const handleSelectAlternative = (payload: {
    mitarbeiter: string;
    klient: string;
  }) => {
    active_client = payload.klient;
    active_mitarbeiter = payload.mitarbeiter;
  };
</script>

{#if remaining === 0}
  <div class="w-3xl mx-auto p-4 text-center text-base-content/70">
    Keine Empfehlungen vorhanden.
  </div>
{:else}
  <section class="space-y-4 w-3xl mx-auto">
    <header class="space-y-2">
      <div
        class="flex items-center justify-between text-sm text-base-content/70"
      >
        <span>Zuordnungen abgeschlossen: {assignedCount} / {total}</span>
        <!-- <span>Verbleibend: {remaining}</span> -->
      </div>
      <progress
        class="progress progress-primary w-full"
        value={assignedCount}
        max={total}
      ></progress>
    </header>
    {#if loading}
      <div class="w-3xl mx-auto p-4 text-center text-base-content/70">
        <span>Lade Empfehlungen...</span>
      </div>
    {:else if error}
      <div class="w-3xl mx-auto p-4 text-center text-base-content/70">
        <span>Fehler beim Laden der Empfehlungen: {error}</span>
      </div>
    {:else if !loading && !error && (remaining === 0 || !current)}
      <div class="alert alert-success">
        <span>Alle Klienten wurden zugeordnet.</span>
      </div>
    {:else}
      <RecommendationCard
        mitarbeiter={current.mitarbeiter}
        klient={current.klient}
        alternativeKlienten={current.alternativeKlienten}
        onAccept={handleAccept}
        onSelectAlternative={handleSelectAlternative}
        onOpenReview={openReviewOverlay}
      />
    {/if}
  </section>
  {#if isReviewOverlayOpen}
    <ReviewOverlay
      onClose={closeReviewOverlay}
      new_ma={active_mitarbeiter ?? ""}
      new_client={active_client ?? ""}
      onAccept={handleAccept}
      {ma_assignments}
      {klient_assignments}
    />
  {/if}
{/if}
