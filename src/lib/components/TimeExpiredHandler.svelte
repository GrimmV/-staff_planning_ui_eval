<script lang="ts">
  import { onDestroy } from "svelte";
  import TimeExpiredModal from "./TimeExpiredModal.svelte";
  import uploadClicks from "$lib/firebase";
  import type { Recommendation } from "$lib/types";

  const {
    current,
    currentTopKey,
    onExpirePick,
    onTimerRunningChange,
    onTimerSecondsChange,
  } = $props<{
    current: Recommendation | undefined;
    currentTopKey: string | undefined;
    onExpirePick: (payload: { mitarbeiter: string; klient: string }) => void;
    onTimerRunningChange?: (running: boolean) => void;
    onTimerSecondsChange?: (secondsLeft: number | null) => void;
  }>();

  let durationMinutes = $state(0);
  let durationSeconds = $state(0);

  let timerSecondsLeft = $state<number | null>(null);
  /** Recommendation row this timer applies to (fixed at start). */
  let timerSnap = $state<Recommendation | null>(null);
  let isTimerExpiryModalOpen = $state(false);
  let timerIntervalId: ReturnType<typeof setInterval> | null = null;

  function formatCountdown(totalSec: number): string {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function clearTimerInterval() {
    if (timerIntervalId) {
      clearInterval(timerIntervalId);
      timerIntervalId = null;
    }
  }

  function resetTimerUi() {
    clearTimerInterval();
    timerSecondsLeft = null;
    timerSnap = null;
  }

  function parseDurationTotalSec(): number {
    const m = Math.max(0, Math.floor(Number(durationMinutes) || 0));
    const s = Math.min(59, Math.max(0, Math.floor(Number(durationSeconds) || 0)));
    return m * 60 + s;
  }

  function startTimer() {
    const c = current;
    if (!c?.alternativeKlienten?.length) return;
    const totalSec = parseDurationTotalSec();
    if (totalSec <= 0) return;
    resetTimerUi();
    timerSnap = c;
    timerSecondsLeft = totalSec;
    uploadClicks({
      username: "default",
      action: "timerStart",
      mitarbeiter: c.mitarbeiter.id,
      klient: c.klient.id,
      durationSeconds: totalSec,
      alternativesCount: c.alternativeKlienten.length,
      datetime: new Date(),
    });
    let seconds = totalSec;
    timerIntervalId = setInterval(() => {
      seconds -= 1;
      timerSecondsLeft = seconds;
      if (seconds <= 0) {
        clearTimerInterval();
        timerSecondsLeft = null;
        isTimerExpiryModalOpen = true;
      }
    }, 1000);
  }

  function stopTimer() {
    isTimerExpiryModalOpen = false;
    resetTimerUi();
  }

  function handleModalPick(klientId: string) {
    const snap = timerSnap;
    if (!snap) {
      isTimerExpiryModalOpen = false;
      resetTimerUi();
      return;
    }
    onExpirePick({
      mitarbeiter: snap.mitarbeiter.id,
      klient: klientId,
    });
    isTimerExpiryModalOpen = false;
    resetTimerUi();
  }

  const timerSnapKey = $derived(
    timerSnap
      ? `${timerSnap.mitarbeiter.id}:${timerSnap.klient.id}`
      : undefined,
  );

  $effect(() => {
    if (!timerSnap) return;
    if (currentTopKey !== timerSnapKey) {
      isTimerExpiryModalOpen = false;
      resetTimerUi();
    }
  });

  onDestroy(() => {
    clearTimerInterval();
  });

  $effect(() => {
    onTimerRunningChange?.(timerSecondsLeft !== null);
  });

  $effect(() => {
    onTimerSecondsChange?.(timerSecondsLeft);
  });

  const durationInputsDisabled = $derived(
    timerSecondsLeft !== null || isTimerExpiryModalOpen,
  );

  const canStartTimer = $derived(
    parseDurationTotalSec() > 0 &&
      !isTimerExpiryModalOpen &&
      !!current?.alternativeKlienten?.length,
  );
</script>

<div class="flex flex-wrap items-center gap-3 text-sm text-base-content/70">
  {#if timerSecondsLeft !== null}
    <button
      type="button"
      class="btn btn-error btn-sm"
      onclick={stopTimer}
    >
      Timer stoppen
    </button>
  {:else}
    <button
      type="button"
      class="btn btn-outline btn-sm"
      disabled={!canStartTimer}
      onclick={startTimer}
    >
      Timer starten
    </button>
  {/if}
  <div class="flex items-center gap-2">
    <label class="flex items-center gap-1.5">
      <span class="text-xs text-base-content/60 whitespace-nowrap">Min</span>
      <input
        type="number"
        min="0"
        class="input input-bordered input-sm w-14 tabular-nums"
        disabled={durationInputsDisabled}
        bind:value={durationMinutes}
      />
    </label>
    <label class="flex items-center gap-1.5">
      <span class="text-xs text-base-content/60 whitespace-nowrap">Sek</span>
      <input
        type="number"
        min="0"
        max="59"
        class="input input-bordered input-sm w-14 tabular-nums"
        disabled={durationInputsDisabled}
        bind:value={durationSeconds}
      />
    </label>
  </div>
  {#if timerSecondsLeft !== null}
    <span class="font-mono tabular-nums text-base-content"
      >{formatCountdown(timerSecondsLeft)}</span
    >
  {/if}
</div>

{#if isTimerExpiryModalOpen && timerSnap}
  <TimeExpiredModal {timerSnap} onPick={handleModalPick} />
{/if}
