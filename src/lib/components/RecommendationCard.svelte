<script lang="ts">
  import { onMount } from "svelte";
  import { formatDateGerman, floatToTime } from "$lib/utils/format";
  import type { Klient, Mitarbeiter } from "$lib/types";

  const {
    mitarbeiter,
    klient,
    alternativeKlienten = [],
    onAccept,
    onSelectAlternative,
    onOpenReview,
  } = $props<{
    mitarbeiter: string;
    klient: string;
    alternativeKlienten?: Klient[];
    onAccept?: (payload: { mitarbeiter: string; klient: string }) => void;
    onSelectAlternative?: (payload: {
      mitarbeiter: string;
      klient: string;
    }) => void;
    onOpenReview?: () => void;
  }>();

  const normalizeList = (
    value: string[] | string | undefined | null,
  ): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return String(value)
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  };

  const mitarbeiterQualis = $derived(
    normalizeList(mitarbeiter?.qualifikationen),
  );
  let selectedKlient = $state<Klient | undefined>(undefined);

  const currentKlient = $derived(selectedKlient ?? klient);
  const klientQualis = $derived(normalizeList(currentKlient?.qualifikationen));

  const getPriorityClass = (prioritaet: Klient["prioritaet"]) => {
    if (!prioritaet) return "badge-ghost";
    const p = prioritaet.toLowerCase();
    if (p.includes("hoch")) return "badge-error";
    if (p.includes("mittel")) return "badge-warning";
    if (p.includes("niedrig")) return "badge-success";
    return "badge-ghost";
  };

  const getFahrtzeit = (
    mitarbeiter: Mitarbeiter,
    klient: Klient,
  ): number | undefined => {
    const schoolName = klient?.schule;
    if (!schoolName) return undefined;
    const schulen = mitarbeiter?.schulen;
    if (!schulen) return undefined;
    const value = schulen[schoolName];
    return typeof value === "number" ? value : undefined;
  };

  const fahrtzeit = $derived(getFahrtzeit(mitarbeiter, currentKlient));

  const isAlternativeSelected = $derived(
    !!selectedKlient && selectedKlient !== klient,
  );

  let isReviewOpen = $state(false);
  let reviewContainer: HTMLDivElement | null = null;

  const handleDocumentClick = (event: MouseEvent) => {
    if (!isReviewOpen || !reviewContainer) return;
    const target = event.target as Node | null;
    if (target && !reviewContainer.contains(target)) {
      isReviewOpen = false;
    }
    };

  onMount(() => {
    document.addEventListener("click", handleDocumentClick);
    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  });

  const handleAccept = () => {
    onAccept?.({ mitarbeiter: mitarbeiter.id, klient: currentKlient.id });
    console.log("handleAccept", mitarbeiter.id, currentKlient.id);
  };

  const handleReviewAlternative = () => {
    isReviewOpen = true;
  };

  const handleSelectAlternative = (alternative: Klient) => {
    selectedKlient = alternative;

    onSelectAlternative?.({ mitarbeiter: mitarbeiter.id, klient: alternative.id });
  };

  const handleSelectMainKlient = () => {
    selectedKlient = undefined;
    isReviewOpen = false;
  };

  const handleContinueReview = () => {
    isReviewOpen = false;
    onOpenReview?.();
  };
</script>

<div
  class="card bg-base-100 shadow-xl border border-base-200 max-w-4xl mx-auto"
>
  <div class="card-body gap-6">
    <!-- Header: Mitarbeiter & Klient side by side -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Mitarbeiter -->
      <section class="space-y-2 ">
        <h2
          class="text-sm font-semibold uppercase tracking-wide text-base-content/60"
        >
          Mitarbeiter
        </h2>
        <div class="flex items-center justify-between gap-2">
          <p class="text-lg font-semibold">{mitarbeiter?.name}</p>
        </div>
        <p class="text-sm text-base-content/70">
          <span class="font-medium">Verfügbar bis:</span>
          <span class="ml-1">{formatDateGerman(mitarbeiter?.verfuegbar_bis)}</span>
        </p>
        {#if mitarbeiter?.zeitfenster}
          <p class="text-sm text-base-content/70">
            <span class="font-medium">Zeitfenster bis:</span>
            <span class="ml-1">{floatToTime(mitarbeiter.zeitfenster[1])} Uhr</span>
          </p>
        {/if}

        {#if mitarbeiterQualis.length}
          <div class="space-y-1">
            <p class="text-sm font-medium text-base-content/80">
              Qualifikationen
            </p>
            <div class="flex flex-wrap gap-2">
              {#each mitarbeiterQualis as quali, index (index)}
                <span class="badge badge-sm badge-outline">{quali}</span>
              {/each}
            </div>
          </div>
        {/if}

        {#if mitarbeiter?.klient_erfahrung?.length}
          <div class="space-y-1.5 rounded-lg bg-base-200/40 p-2">
            <p class="text-sm font-medium text-base-content/80">
              Klient-Erfahrungen
            </p>
            <ul class="space-y-0.5 text-xs text-base-content/80">
              {#each mitarbeiter.klient_erfahrung as erfahrung, index (index)}
                <li
                  class="flex items-center justify-between gap-2 py-0.5"
                >
                  <span class="font-medium">{erfahrung.name}</span>
                  <span class="badge badge-xs badge-outline text-[0.65rem]">
                    {erfahrung.tage} Tage
                  </span>
                </li>
              {/each}
            </ul>
          </div>
        {/if}

        {#if mitarbeiter?.schule_erfahrung?.length}
          <div class="space-y-1.5 rounded-lg bg-base-200/40 p-2">
            <p class="text-sm font-medium text-base-content/80">
              Schul-Erfahrungen
            </p>
            <ul class="space-y-0.5 text-xs text-base-content/80">
              {#each mitarbeiter.schule_erfahrung as erfahrung, index (index)}
                <li
                  class="flex items-center justify-between gap-2 py-0.5"
                >
                  <span class="font-medium">{erfahrung.name}</span>
                  <span class="badge badge-xs badge-outline text-[0.65rem]">
                    {erfahrung.tage} Tage
                  </span>
                </li>
              {/each}
            </ul>
          </div>
        {/if}

        {#if fahrtzeit != null}
          <p class="mt-2 text-sm text-base-content/70">
            <span class="font-medium">Fahrtzeit:</span>
            <span class="ml-1">{fahrtzeit} Minuten</span>
          </p>
        {/if}
      </section>

      <!-- Klient -->
      <section class="space-y-2 md:border-l md:border-base-200 md:pl-6 h-48 overflow-y-auto">
        <h2
          class="text-sm font-semibold uppercase tracking-wide text-base-content/60"
        >
          Klient
        </h2>
        <div class="flex items-center justify-between gap-2">
          <p class="text-lg font-semibold">{currentKlient?.name}</p>
          {#if currentKlient?.prioritaet}
            <span
              class={`badge badge-sm ${getPriorityClass(currentKlient.prioritaet)}`}
            >
              Prio: {currentKlient.prioritaet}
            </span>
          {/if}
        </div>

        {#if currentKlient?.nicht_vertreten_bis}
          <p class="text-sm text-base-content/70">
            <span class="font-medium">Nicht vertreten bis:</span>
            <span class="ml-1"
              >{formatDateGerman(currentKlient.nicht_vertreten_bis)}</span
            >
          </p>
        {/if}

        {#if currentKlient?.anwesenheit}
          <p class="text-sm text-base-content/70">
            <span class="font-medium">Anwesenheit heute:</span>
            <span class="ml-1">{floatToTime(currentKlient.anwesenheit[0])} bis {floatToTime(currentKlient.anwesenheit[1])} Uhr</span>
          </p>
        {/if}

        {#if klientQualis.length}
          <div class="space-y-1">
            <p class="text-sm font-medium text-base-content/80">
              Benötigte Qualifikationen
            </p>
            <div class="flex flex-wrap gap-2">
              {#each klientQualis as quali, index (index)}
                <span
                  class="badge badge-sm badge-outline badge-info/20 border-info/40 text-info-content"
                >
                  {quali}
                </span>
              {/each}
            </div>
          </div>
        {/if}

        {#if currentKlient?.schule}
          <p class="text-sm text-base-content/70">
            <span class="font-medium">Schule:</span>
            <span class="ml-1">{currentKlient.schule}</span>
          </p>
        {/if}
      </section>
    </div>

    <div class="divider my-0"></div>

    <!-- Recommendation & actions -->
    <section
      class="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
    >
      <div>
        <h3 class="text-base font-semibold flex items-center gap-2">
          <span>Empfehlung der KI</span>
        </h3>
        <button
          type="button"
          class="btn btn-sm {isAlternativeSelected ? 'btn-outline' : 'btn-primary'} justify-between min-w-[10rem]"
          onclick={handleSelectMainKlient}
        >
          <span class="truncate text-left">{klient.name}</span>
          {#if klient.prioritaet}
            <span
              class={`badge badge-xs ${getPriorityClass(klient.prioritaet)}`}
            >
              {klient.prioritaet}
            </span>
          {/if}
        </button>
      </div>

      <div
        class="relative flex flex-wrap gap-2 justify-end"
        bind:this={reviewContainer}
      >
        {#if !isAlternativeSelected}
          <button class="btn btn-primary btn-sm" onclick={handleAccept}>
            Zuordnung annehmen
          </button>
        {:else}
          <button
            class="btn btn-outline btn-sm"
            onclick={handleReviewAlternative}
          >
            Zuordnung prüfen
          </button>
        {/if}

        {#if isReviewOpen}
          <div
            class="absolute left-0 bottom-full mt-2 z-20 max-w-xs rounded-lg border border-base-300 bg-base-200 px-3 py-2 text-sm shadow-md w-96"
          >
            <p>
              Wenn du weiter klickst, prüfen wir, wie sich diese Zuordnung auf
              die folgenden Zuordnungen auswirkt.
            </p>
            <div class="mt-2 flex justify-end gap-2">
              <button
                class="btn btn-ghost btn-xs"
                onclick={() => (isReviewOpen = false)}
              >
                Abbrechen
              </button>
              <button
                class="btn btn-primary btn-xs"
                onclick={handleContinueReview}
              >
                Weiter
              </button>
            </div>
          </div>
        {/if}
      </div>
    </section>

    <!-- Alternativen -->
    {#if alternativeKlienten?.length}
      <section class="mt-2 space-y-2">
        <h3 class="text-sm font-semibold text-base-content/80">Alternativen</h3>
        <div class="flex flex-wrap gap-2">
          {#each alternativeKlienten as alternative, index (index)}
            <button
              type="button"
              class="btn btn-sm {alternative.name === currentKlient.name ? 'btn-primary' : 'btn-outline'} justify-between min-w-[10rem]"
              onclick={() => handleSelectAlternative(alternative)}
            >
              <span class="truncate text-left">{alternative.name}</span>
              {#if alternative.prioritaet}
                <span
                  class={`badge badge-xs ${getPriorityClass(alternative.prioritaet)}`}
                >
                  {alternative.prioritaet}
                </span>
              {/if}
            </button>
          {/each}
        </div>
      </section>
    {/if}
  </div>
</div>
