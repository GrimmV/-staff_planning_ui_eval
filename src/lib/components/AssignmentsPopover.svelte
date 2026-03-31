<script lang="ts">
  import { List } from "@lucide/svelte";
  import type { Klient, Prioritaet, Recommendation } from "$lib/types";

  const {
    ma_assignments = [],
    klient_assignments = [],
    completedLabels = [],
    recommendations = [],
    current = undefined,
  } = $props<{
    ma_assignments?: string[];
    klient_assignments?: string[];
    completedLabels?: {
      maName: string;
      klientName: string;
      klientPrioritaet?: Prioritaet;
    }[];
    recommendations?: Recommendation[];
    current?: Recommendation;
  }>();

  const highlightMaName = $derived(current?.mitarbeiter.name);
  const highlightKlientNames = $derived(
    current
      ? new Set<string>([
          current.klient.name,
          ...(current.alternativeKlienten ?? []).map((k: Klient) => k.name),
        ])
      : new Set<string>(),
  );

  const completedRows = $derived(
    ma_assignments.map((maId: string, i: number) => ({
      maId,
      klientId: klient_assignments[i] ?? "",
      maName: completedLabels[i]?.maName ?? maId,
      klientName: completedLabels[i]?.klientName ?? klient_assignments[i] ?? "",
      klientPrioritaet: completedLabels[i]?.klientPrioritaet,
    })),
  );

  const pendingRows = $derived(
    recommendations.map((r: Recommendation) => ({
      maName: r.mitarbeiter.name,
      klientName: r.klient.name,
      alternatives: (r.alternativeKlienten ?? []).map((k: Klient) => ({
        name: k.name,
        prioritaet: k.prioritaet,
      })),
      isCurrent: r === current,
      klientPrioritaet: r.klient.prioritaet,
    })),
  );

  /** Matches RecommendationCard priority styling (Hoch / partial „hoch“). */
  function isPrioritaetHoch(p?: Prioritaet | Klient["prioritaet"]): boolean {
    if (!p) return false;
    return p.toLowerCase().includes("hoch");
  }

  
  const prioritaetHochPending = $derived(
    pendingRows.filter((row: { klientPrioritaet?: Prioritaet }) =>
      isPrioritaetHoch(row.klientPrioritaet),
    ).length,
  );

  const prioritaetHochCompleted = $derived(
    completedRows.filter((row: { klientPrioritaet?: Prioritaet }) =>
      isPrioritaetHoch(row.klientPrioritaet),
    ).length,
  );

  const hasAnyAssignments = $derived(
    completedRows.length > 0 || pendingRows.length > 0,
  );

  /** Completed Zuordnung whose Klient is also listed as an alternative on the current card. */
  function isAssignedKlientCurrentAlternative(row: {
    klientId: string;
    klientName: string;
  }): boolean {
    const alts = current?.alternativeKlienten;
    if (!alts?.length) return false;
    if (row.klientId && alts.some((k: Klient) => k.id === row.klientId)) return true;
    const norm = row.klientName.trim().toLowerCase();
    return alts.some((k: Klient) => k.name.trim().toLowerCase() === norm);
  }

  /** Ausstehend row: recommended or listed alternative matches a Klient on the current card's alternative list. */
  function pendingRowHasCurrentAlternativeKlient(row: {
    klientName: string;
    alternatives: { name: string }[];
  }): boolean {
    const alts = current?.alternativeKlienten;
    if (!alts?.length) return false;
    const names = new Set(
      alts.map((k: Klient) => k.name.trim().toLowerCase()),
    );
    const hit = (name: string) => names.has(name.trim().toLowerCase());
    if (hit(row.klientName)) return true;
    return false;
  }

  /** Warning-highlighted rows (same Klient as a current alternative), max 3, sorted by global list index. */
  const highlightedCopiesUnderCurrent = $derived.by(() => {
    type Copy =
      | {
          kind: "completed";
          enumerator: number;
          maName: string;
          klientName: string;
        }
      | {
          kind: "pending";
          enumerator: number;
          maName: string;
          klientName: string;
          alternatives: { name: string; prioritaet?: Prioritaet }[];
        };
    if (!current) return [] as Copy[];
    const out: Copy[] = [];
    for (let i = 0; i < completedRows.length; i++) {
      const row = completedRows[i];
      if (isAssignedKlientCurrentAlternative(row)) {
        out.push({
          kind: "completed",
          enumerator: i + 1,
          maName: row.maName,
          klientName: row.klientName,
        });
      }
    }
    for (let i = 0; i < pendingRows.length; i++) {
      const row = pendingRows[i];
      if (
        !row.isCurrent &&
        pendingRowHasCurrentAlternativeKlient(row)
      ) {
        out.push({
          kind: "pending",
          enumerator: completedRows.length + i + 1,
          maName: row.maName,
          klientName: row.klientName,
          alternatives: row.alternatives,
        });
      }
    }
    out.sort((a, b) => a.enumerator - b.enumerator);
    return out.slice(0, 3);
  });
</script>

<div class="dropdown dropdown-end">
  <button
    type="button"
    class="btn btn-ghost btn-sm gap-1"
    aria-label="Alle Zuordnungen anzeigen"
    aria-haspopup="dialog"
  >
    <List class="size-4" aria-hidden="true" />
    <span class="hidden sm:inline">Aktuelle Empfehlungen</span>
  </button>
  <div
    role="region"
    class="dropdown-content z-50 rounded-box bg-base-100 border border-base-300 shadow-lg w-[min(100vw-2rem,22rem)] max-h-[min(70vh,24rem)] overflow-y-auto p-3 mt-1"
    aria-label="Liste aller Zuordnungen"
  >
  <div class="flex flex-row justify-between gap-2">
      <p class="text-xs font-semibold uppercase tracking-wide text-base-content/50 mb-2">
        Alle Empfehlungen
      </p>
      <p class="text-[0.65rem] font-medium text-base-content/50 mb-1">
        Prio Hoch: {prioritaetHochCompleted} erledigt · {prioritaetHochPending} ausstehend
      </p>
    </div>
    {#if !hasAnyAssignments}
      <p class="text-sm text-base-content/60">Keine Empfehlungen vorhanden.</p>
    {:else}
      {#if completedRows.length}
        <p class="text-[0.65rem] font-medium text-base-content/50 mb-1">Erledigt</p>
        <ul class="space-y-2 mb-3 text-sm">
          {#each completedRows as row, i (i)}
            {@const marked = isAssignedKlientCurrentAlternative(row)}
            {@const prioHoch = isPrioritaetHoch(row.klientPrioritaet)}
            <li
              class="leading-snug rounded-lg px-2 py-2 -mx-1 text-sm {marked && prioHoch
                ? 'border-l-4 border-l-error bg-warning/25 ring-2 ring-warning/60 border border-warning/70 pl-2'
                : marked
                  ? 'bg-warning/25 ring-2 ring-warning/60 border border-warning/70'
                  : prioHoch
                    ? 'border-l-4 border-l-error bg-error/10 pl-2'
                    : ''}"
              title={[prioHoch ? "Klient mit Priorität Hoch" : null, marked
                ? "Klient erscheint als Alternative auf der aktuellen Empfehlungskarte"
                : null]
                .filter(Boolean)
                .join(" · ") || undefined}
            >
              <span class="text-base-content/50">{i + 1}.</span>
              <span class="font-medium text-base-content"> {row.maName}</span>
              <span class="text-base-content/50"> · </span>
              <span class="font-medium text-base-content">{row.klientName}</span>
              {#if prioHoch}
                <span class="badge badge-error badge-xs ml-1 align-middle" title="Priorität Hoch"
                  >Hoch</span
                >
              {/if}
            </li>
          {/each}
        </ul>
      {/if}
      {#if pendingRows.length}
        <p class="text-[0.65rem] font-medium text-base-content/50 mb-1">Ausstehend</p>
        <ul class="space-y-3 text-sm">
          {#each pendingRows as row, i (i)}
            {@const altOverlap =
              !row.isCurrent && pendingRowHasCurrentAlternativeKlient(row)}
            {@const prioHoch = isPrioritaetHoch(row.klientPrioritaet)}
            <li
              class="leading-snug rounded-r-lg pl-2 pr-2 py-2 -mx-1 border-l-2 {prioHoch && altOverlap
                ? 'border-l-error bg-warning/25 ring-2 ring-warning/60 border border-warning/70'
                : prioHoch
                  ? 'border-l-error bg-error/10'
                  : altOverlap
                    ? 'border-l-warning bg-warning/25 ring-2 ring-warning/60 border border-warning/70'
                    : row.isCurrent
                      ? 'border-base-300 bg-primary/15 ring-2 ring-primary/50 border border-primary/40'
                      : 'border-base-300'} {row.isCurrent && prioHoch
                ? 'ring-2 ring-primary/50 border border-primary/40'
                : ''}"
              title={[prioHoch ? "Klient mit Priorität Hoch" : null, altOverlap
                ? "Enthält einen Klienten, der als Alternative auf der aktuellen Karte vorkommt"
                : null]
                .filter(Boolean)
                .join(" · ") || undefined}
            >
              <span class="text-base-content/50">{completedRows.length + i + 1}.</span>
              <span
                class="font-medium"
                class:text-primary={row.isCurrent && highlightMaName === row.maName}
                class:font-semibold={row.isCurrent && highlightMaName === row.maName}
              >
                {" "}{row.maName}</span
              >
              <span class="text-base-content/50"> · </span>
              <span
                class="font-medium"
                class:text-primary={row.isCurrent &&
                  highlightKlientNames.has(row.klientName)}
                class:font-semibold={row.isCurrent &&
                  highlightKlientNames.has(row.klientName)}
              >
                {row.klientName}</span
              >
              {#if prioHoch}
                <span class="badge badge-error badge-xs ml-1 align-middle" title="Priorität Hoch"
                  >Hoch</span
                >
              {/if}
              {#if row.alternatives.length}
                <div class="mt-1 pl-0 text-xs text-base-content/70">
                  <span class="text-base-content/50">Alternativen: </span>
                  {#each row.alternatives as alt, j (j)}
                    {#if j > 0}<span class="text-base-content/40">, </span>{/if}
                    <span
                      class="font-medium"
                      class:text-primary={row.isCurrent &&
                        highlightKlientNames.has(alt.name)}
                      class:font-semibold={row.isCurrent &&
                        highlightKlientNames.has(alt.name)}
                    >
                      {alt.name}</span
                    >
                  {/each}
                </div>
              {/if}
              {#if row.isCurrent && highlightedCopiesUnderCurrent.length}
                <div
                  class="mt-2 pt-2 border-t border-base-300/60 space-y-2"
                  aria-label="Hervorgehobene Einträge aus der Gesamtliste"
                >
                  {#each highlightedCopiesUnderCurrent as copy (copy.enumerator + copy.kind)}
                    <div
                      class="rounded-lg px-2 py-1.5 -mx-0.5 text-xs leading-snug bg-warning/25 ring-1 ring-warning/50 border border-warning/60"
                    >
                      <span class="text-base-content/50">{copy.enumerator}.</span>
                      <span class="font-medium text-base-content"> {copy.maName}</span>
                      <span class="text-base-content/50"> · </span>
                      <span class="font-medium text-base-content">{copy.klientName}</span>
                      {#if copy.kind === "pending" && copy.alternatives.length}
                        <div class="mt-1 pl-0 text-[0.7rem] text-base-content/70">
                          <span class="text-base-content/50">Alternativen: </span>
                          {#each copy.alternatives as alt, j (j)}
                            {#if j > 0}<span class="text-base-content/40">, </span>{/if}
                            <span class="font-medium">{alt.name}</span>
                            <!-- {#if isPrioritaetHoch(alt.prioritaet)}
                              <span class="badge badge-error badge-xs px-1 py-0 ml-0.5 align-middle" title="Priorität Hoch"
                                >Hoch</span
                              >
                            {/if} -->
                          {/each}
                        </div>
                      {/if}
                    </div>
                  {/each}
                </div>
              {/if}
            </li>
          {/each}
        </ul>
      {/if}
    {/if}
  </div>
</div>
