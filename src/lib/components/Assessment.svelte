<script lang="ts">
  import type { Assessment, SignificantAssignment, RelevantChange, StatisticsChange } from "$lib/types";
  import ChatButton from "./ChatButton.svelte";
  const { assessment } = $props<{ assessment: Assessment }>();

  let showLong = $state(false);

  const scoreOptions = [
    {
      id: "akzeptieren" as const,
      label: "Akzeptieren",
      activeClass: "badge-success",
    },
    {
      id: "eher akzeptieren" as const,
      label: "Eher akzeptieren",
      activeClass: "badge-info",
    },
    {
      id: "eher ablehnen" as const,
      label: "Eher ablehnen",
      activeClass: "badge-warning",
    },
    { id: "ablehnen" as const, label: "Ablehnen", activeClass: "badge-error" },
  ];
</script>

<h3 class="text-lg font-semibold text-base-content">KI Assistenz</h3>

<div class="mb-6 space-y-4">
  <div class="flex items-center gap-2 flex-wrap">
    Empfehlung:
    {#each scoreOptions as opt (opt.id)}
      <span
        class="badge {assessment.score === opt.id
          ? opt.activeClass
          : 'badge-ghost'}"
      >
        {opt.label}
      </span>
    {/each}
  </div>

  <div class="flex items-center justify-between gap-4 flex-wrap">
    <div class="flex items-center gap-2">
      <ChatButton context={"Bewertung: " + assessment.score + "\n\n" + "Erklärung: " + assessment.assessment + "\n\n" + "Änderungen: " + assessment.änderungen.map((a: SignificantAssignment) => a.relevant_changes.map((c: RelevantChange) => c.relevant_spalte + ": " + c.änderung).join(", ")).join(", ") + "\n\n" + "Statistiken: " + assessment.statistiken.relevant_changes.map((c: StatisticsChange) => c.relevant_feature + ": " + c.änderung).join(", ")} />
    </div>
    <div class="join">
      <button
        type="button"
        class="join-item btn btn-sm {!showLong ? 'btn-active' : 'btn-ghost'}"
        onclick={() => (showLong = false)}
      >
        Zusammenfassung
      </button>
      <button
        type="button"
        class="join-item btn btn-sm {showLong ? 'btn-active' : 'btn-ghost'}"
        onclick={() => (showLong = true)}
      >
        Details
      </button>
    </div>
  </div>
  <div class="rounded-lg bg-base-200 border border-base-300 px-4 py-3">
    <p class="text-base-content/90">
      {showLong ? assessment.assessment : assessment.short_assessment}
    </p>
  </div>
</div>
