<script lang="ts">
  import type { Assessment, DiffsResponse } from "$lib/types";
  import ChatButton from "./ChatButton.svelte";
  import uploadClicks from "$lib/firebase";
  const { assessment, diffsResponse } = $props<{
    assessment: Assessment;
    diffsResponse: DiffsResponse;
  }>();

  let detailLevel = $state<0 | 1 | 2>(0);

  const scoreOptions = [
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

  const chatExplanation = $derived(
    [
      assessment.general_assessment,
      assessment.detail_level_1_assessment,
      assessment.detail_level_2_assessment,
    ]
      .filter(Boolean)
      .join("\n\n")
  );

  const handleDetailLevelChange = (level: 0 | 1 | 2) => {
    detailLevel = level;
    uploadClicks({
      username: "default",
      action: "detailLevelIncrease",
      detailLevel: level,
      datetime: new Date(),
    });
  };
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
      <ChatButton
        context={"Bewertung: " +
          assessment.score +
          "\n\n" +
          "Erklärung:\n" +
          chatExplanation +
          "\n\n" +
          "Daten:\n" +
          JSON.stringify(diffsResponse, null, 2)}
      />
    </div>
  </div>

  <div class="rounded-lg bg-base-200 border border-base-300 px-4 py-3 space-y-4">
    <p class="text-base-content/90 whitespace-pre-wrap">{assessment.general_assessment}</p>

    {#if detailLevel < 1}
      <button
        type="button"
        class="btn btn-link btn-xs text-base-content/50 hover:text-base-content/80 px-0 h-auto min-h-0 font-normal"
        onclick={() => handleDetailLevelChange(1)}
      >
        Zeige mehr
      </button>
    {/if}

    {#if detailLevel >= 1}
      <p class="text-base-content/90 whitespace-pre-wrap border-t border-base-300 pt-4">
        {assessment.detail_level_1_assessment}
      </p>
    {/if}

    {#if detailLevel === 1}
      <button
        type="button"
        class="btn btn-link btn-xs text-base-content/50 hover:text-base-content/80 px-0 h-auto min-h-0 font-normal"
        onclick={() => handleDetailLevelChange(2)}
      >
        Zeige mehr
      </button>
    {/if}

    {#if detailLevel >= 2}
      <p class="text-base-content/90 whitespace-pre-wrap border-t border-base-300 pt-4">
        {assessment.detail_level_2_assessment}
      </p>
    {/if}
  </div>
</div>
