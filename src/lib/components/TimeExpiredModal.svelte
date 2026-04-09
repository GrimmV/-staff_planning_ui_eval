<script lang="ts">
  import type { Recommendation } from "$lib/types";

  const { timerSnap, onPick } = $props<{
    timerSnap: Recommendation;
    onPick: (klientId: string) => void;
  }>();
</script>

<div
  class="fixed inset-0 z-[100] flex items-center justify-center p-4"
  role="dialog"
  aria-modal="true"
  aria-labelledby="timer-expiry-title"
>
  <div class="absolute inset-0 bg-base-300/80 backdrop-blur-sm"></div>
  <div
    class="relative z-10 w-full max-w-lg rounded-xl border border-base-300 bg-base-100 p-6 shadow-2xl"
  >
    <h2 id="timer-expiry-title" class="text-lg font-semibold mb-2">
      Zeit abgelaufen
    </h2>
    <p class="text-sm text-base-content/80 mb-4">
      Bitte wähle einen der alternativen Klienten für {timerSnap.mitarbeiter
        .name}:
    </p>
    <div class="flex flex-col gap-2">
      {#each timerSnap.alternativeKlienten ?? [] as alt (alt.id)}
        <button
          type="button"
          class="btn btn-primary justify-between"
          onclick={() => onPick(alt.id)}
        >
          <span class="truncate text-left">{alt.name}</span>
          {#if alt.prioritaet}
            <span class="badge badge-sm badge-outline shrink-0"
              >{alt.prioritaet}</span
            >
          {/if}
        </button>
      {/each}
    </div>
  </div>
</div>
