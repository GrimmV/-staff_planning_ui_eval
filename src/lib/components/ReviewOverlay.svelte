<script lang="ts">
  const { onClose } = $props<{
    onClose: () => void;
  }>();
</script>

<div class="fixed inset-0 z-40 flex items-center justify-center">
  <div class="absolute inset-0 bg-base-300/70 backdrop-blur-sm"></div>

  <div class="relative z-50 w-full max-w-5xl mx-4 rounded-xl bg-base-100 shadow-2xl border border-base-300">
    <button
      type="button"
      class="btn btn-ghost btn-sm absolute right-3 top-3"
      aria-label="Schließen"
      onclick={onClose}
    >
      ✕
    </button>

    <div class="p-8 min-h-[300px] flex items-center justify-center text-base-content/70">
      <!-- Platzhalter-Inhalt für spätere Auswirkungsanalyse -->
    </div>
  </div>
</div>

