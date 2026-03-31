<script lang="ts">
  import AssignmentsPopover from "./AssignmentsPopover.svelte";
  import RecommendationCard from "./RecommendationCard.svelte";
  import ReviewOverlay from "./ReviewOverlay.svelte";
  import type { Klient, Mitarbeiter } from "$lib/types";

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
    loading = true,
    error = null,
    useLLM = false,
  } = $props<{
    recommendations: RecommendationEntry[];
    onAssign?: (payload: { mitarbeiter: string; klient: string }) => void;
    onComplete?: () => void;
    ma_assignments?: string[];
    klient_assignments?: string[];
    loading?: boolean;
    error?: string | null;
    useLLM?: boolean;
  }>();

  /** Lower number = earlier in queue; Hoch first. */
  function prioritySortKey(p?: Klient["prioritaet"]): number {
    if (!p) return 99;
    const n = String(p).toLowerCase();
    if (n === "hoch") return 0;
    if (n === "mittel") return 1;
    if (n === "niedrig") return 2;
    return 50;
  }

  const orderedRecommendations = $derived(
    [...recommendations].sort(
      (a, b) =>
        prioritySortKey(a.klient.prioritaet) -
        prioritySortKey(b.klient.prioritaet),
    ),
  );

  const remaining = $derived(recommendations.length);
  const total = $derived(recommendations.length + klient_assignments.length);

  let assignedCount = $derived(ma_assignments.length);
  let isReviewOverlayOpen = $state(false);

  /** Labels for completed pairs (IDs from parent; names and Klient-Prio captured on assign). */
  let completedLabels = $state<
    { maName: string; klientName: string; klientPrioritaet?: Klient["prioritaet"] }[]
  >([]);

  const current = $derived(
    remaining > 0 ? orderedRecommendations[0] : undefined,
  );

  /** Stable identity for the top-of-queue recommendation (survives refetch with new object refs). */
  const currentTopKey = $derived(
    current
      ? `${current.mitarbeiter.id}:${current.klient.id}`
      : undefined,
  );

  let active_client = $state<string | undefined>(undefined);
  let active_mitarbeiter = $state<string | undefined>(undefined);
  let syncedTopKey = $state<string | undefined>(undefined);

  $effect(() => {
    const c = current;
    const key = currentTopKey;
    if (!c || !key) {
      active_client = undefined;
      active_mitarbeiter = undefined;
      syncedTopKey = undefined;
      return;
    }
    if (key === syncedTopKey) return;
    syncedTopKey = key;
    active_mitarbeiter = c.mitarbeiter.id;
    active_client = c.klient.id;
  });

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
    const c = current;
    if (c) {
      const { maName, klientName, klientPrioritaet } = resolveNamesFromCurrent(
        c,
        payload,
      );
      completedLabels = [
        ...completedLabels,
        { maName, klientName, klientPrioritaet },
      ];
    }
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

  $effect(() => {
    const n = ma_assignments.length;
    if (completedLabels.length > n) {
      completedLabels = completedLabels.slice(0, n);
    }
  });

  function resolveNamesFromCurrent(
    c: RecommendationEntry,
    payload: { mitarbeiter: string; klient: string },
  ): {
    maName: string;
    klientName: string;
    klientPrioritaet?: Klient["prioritaet"];
  } {
    const maName =
      c.mitarbeiter.id === payload.mitarbeiter
        ? c.mitarbeiter.name
        : payload.mitarbeiter;
    if (c.klient.id === payload.klient) {
      return {
        maName,
        klientName: c.klient.name,
        klientPrioritaet: c.klient.prioritaet,
      };
    }
    const alt = c.alternativeKlienten?.find((k) => k.id === payload.klient);
    return {
      maName,
      klientName: alt?.name ?? payload.klient,
      klientPrioritaet: alt?.prioritaet,
    };
  }
</script>

{#if remaining === 0 && !loading && !error}
  <div class="w-3xl mx-auto p-4 text-center text-base-content/70">
    Keine Empfehlungen vorhanden.
  </div>
{:else if loading}
  <div class="w-3xl mx-auto p-4 text-center text-base-content/70">
    <span>Lade Empfehlungen...</span>
  </div>
{:else if error}
  <div class="w-3xl mx-auto p-4 text-center text-base-content/70">
    <span>Fehler beim Laden der Empfehlungen: {error}</span>
  </div>
{:else}
  <section class="space-y-4 w-3xl mx-auto">
    <header class="space-y-2">
      <div
        class="flex items-center justify-between gap-2 text-sm text-base-content/70"
      >
        <span>Zuordnungen abgeschlossen: {assignedCount} / {total}</span>
        <AssignmentsPopover
          {ma_assignments}
          {klient_assignments}
          {completedLabels}
          recommendations={orderedRecommendations}
          {current}
        />
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
      {useLLM}
    />
  {/if}
{/if}
