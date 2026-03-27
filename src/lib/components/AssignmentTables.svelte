<script lang="ts">
  import { SvelteSet } from "svelte/reactivity";
  import type { SignificantAssignment } from "$lib/types";
  import AssignmentTableSection from "./AssignmentTableSection.svelte";

  const {
    vorherParsed,
    nachherParsed,
    änderungen = [],
  } = $props<{
    vorherParsed: { headers: string[]; rows: string[][] };
    nachherParsed: { headers: string[]; rows: string[][] };
    änderungen: SignificantAssignment[];
  }>();

  const klientColIdx = (headers: string[]): number =>
    headers.findIndex((h) => h.toLowerCase().includes("klient"));

  function klientSetFromTable(parsed: {
    headers: string[];
    rows: string[][];
  }): SvelteSet<string> {
    const kIdx = klientColIdx(parsed.headers);
    if (kIdx < 0) return new SvelteSet<string>();
    const set = new SvelteSet<string>();
    for (const row of parsed.rows) {
      const k = (row[kIdx] ?? "").trim().toLowerCase();
      if (k) set.add(k);
    }
    return set;
  }

  const vorherKlientSet = $derived(klientSetFromTable(vorherParsed));
  const nachherKlientSet = $derived(klientSetFromTable(nachherParsed));
</script>

<div class="rounded-xl border border-base-300 bg-base-100 overflow-hidden">
  <div class="overflow-x-auto">
    <table class="table table-zebra table-pin-rows">
      <AssignmentTableSection
        parsed={nachherParsed}
        variant="neu"
        änderungen={änderungen ?? []}
        {vorherKlientSet}
        {nachherKlientSet}
      />
      <AssignmentTableSection
        parsed={vorherParsed}
        variant="alt"
        änderungen={änderungen ?? []}
        {vorherKlientSet}
        {nachherKlientSet}
      />
    </table>
  </div>
</div>
