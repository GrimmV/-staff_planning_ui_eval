<script lang="ts">
  import { CircleCheck, CircleMinus, CircleX } from "@lucide/svelte";
  import type { RelevantChange, SignificantAssignment } from "$lib/types";

  const {
    änderungen,
    nachherParsed = { headers: [], rows: [] },
  } = $props<{
    änderungen: SignificantAssignment[];
    /** Nachher table: used for Klient priority and Mitarbeiter availability columns */
    nachherParsed?: { headers: string[]; rows: string[][] };
  }>();

  function mitarbeiterColIdx(headers: string[]): number {
    return headers.findIndex((h) => h.toLowerCase().includes("mitarbeiter"));
  }

  function prioritaetColIdx(headers: string[]): number {
    return headers.findIndex((h) => /priorit/i.test(h));
  }

  function findRowForMa(
    parsed: { headers: string[]; rows: string[][] },
    ma: string,
  ): string[] | undefined {
    const mi = mitarbeiterColIdx(parsed.headers);
    if (mi < 0) return undefined;
    const target = ma.trim().toLowerCase();
    return parsed.rows.find(
      (r) => (r[mi] ?? "").trim().toLowerCase() === target,
    );
  }

  function prioritaetForMa(ma: string): string | undefined {
    const row = findRowForMa(nachherParsed, ma);
    const pi = prioritaetColIdx(nachherParsed.headers);
    if (!row || pi < 0) return undefined;
    const v = (row[pi] ?? "").trim();
    return v || undefined;
  }

  function colIdxByHeaderLoose(
    headers: string[],
    exact: string,
    fallbackTest?: (h: string) => boolean,
  ): number {
    const e = exact.trim().toLowerCase();
    let i = headers.findIndex((h) => h.trim().toLowerCase() === e);
    if (i >= 0) return i;
    if (fallbackTest) {
      i = headers.findIndex((h) => fallbackTest(h.trim()));
    }
    return i;
  }

  /** End-of-day time shown as full-day availability */
  function formatMitarbeiterTagBisWert(wert: string): string {
    const t = wert.trim();
    if (t === "23:59" || t === "23:59:00") return "Ganztägig";
    return wert;
  }

  /**
   * For Klient availability columns, extra Mitarbeiter row (Klient line stays primary).
   */
  function mitarbeiterZusatzForRc(
    ma: string,
    rc: RelevantChange,
  ): { label: string; wert: string } | null {
    const sp = rc.relevant_spalte.trim().toLowerCase();
    let mitarbeiterHeader: string;
    let label: string;
    if (sp === "klient tag bis") {
      mitarbeiterHeader = "Mitarbeiter Tag bis";
      label = "Mitarbeiter Tag bis";
    } else if (sp === "klient nicht vertreten bis") {
      mitarbeiterHeader = "Mitarbeiter kann vertreten bis";
      label = "Mitarbeiter kann vertreten bis";
    } else {
      return null;
    }

    const row = findRowForMa(nachherParsed, ma);
    const headers = nachherParsed.headers;
    const colIdx = colIdxByHeaderLoose(
      headers,
      mitarbeiterHeader,
      (h) => {
        const l = h.toLowerCase();
        if (sp === "klient tag bis") {
          return (
            l.includes("mitarbeiter") &&
            l.includes("tag") &&
            l.includes("bis")
          );
        }
        return (
          l.includes("mitarbeiter") &&
          (l.includes("vertreten") || l.includes("kann")) &&
          l.includes("bis")
        );
      },
    );
    let wert =
      row && colIdx >= 0
        ? (row[colIdx] ?? "").trim() || "—"
        : "—";
    if (sp === "klient tag bis" && wert !== "—") {
      wert = formatMitarbeiterTagBisWert(wert);
    }
    return { label, wert };
  }

  /** Matches RecommendationCard priority badge styling */
  function prioritaetBadgeClass(prio: string): string {
    const p = prio.toLowerCase();
    if (p.includes("hoch")) return "badge-error";
    if (p.includes("mittel")) return "badge-warning";
    if (p.includes("niedrig")) return "badge-success";
    return "badge-ghost";
  }

  /** Sort order: hoch → mittel → niedrig; unknown last (same as AssignmentTableSection). */
  function prioritaetRank(cell: string): number {
    const s = cell.trim().toLowerCase();
    if (s === "hoch" || s === "high") return 0;
    if (s === "mittel" || s === "medium") return 1;
    if (s === "niedrig" || s === "low") return 2;
    if (s.includes("hoch")) return 0;
    if (s.includes("mittel")) return 1;
    if (s.includes("niedrig")) return 2;
    return 3;
  }

  function sortByKlientPrioritaet(
    list: SignificantAssignment[],
  ): SignificantAssignment[] {
    return [...list].sort((a, b) => {
      const pa = prioritaetRank(prioritaetForMa(a.ma) ?? "");
      const pb = prioritaetRank(prioritaetForMa(b.ma) ?? "");
      if (pa !== pb) return pa - pb;
      return a.ma.localeCompare(b.ma, "de", { sensitivity: "base" });
    });
  }

  const änderungenAktiv = $derived(
    sortByKlientPrioritaet(
      änderungen.filter((a: SignificantAssignment) => a.effect !== "neutral"),
    ),
  );
  const änderungenNeutral = $derived(
    sortByKlientPrioritaet(
      änderungen.filter((a: SignificantAssignment) => a.effect === "neutral"),
    ),
  );

  function effectIconLabel(effect: SignificantAssignment["effect"]): string {
    if (effect === "positiv") return "Positiver Effekt";
    if (effect === "negativ") return "Negativer Effekt";
    return "Neutraler Effekt";
  }

  function effectCardBorderClass(effect: SignificantAssignment["effect"]): string {
    if (effect === "positiv") return "border-2 border-success/55";
    if (effect === "negativ") return "border-2 border-error/55";
    return "border-2 border-base-content/40";
  }

  function effectBgRc(effect: RelevantChange["effect"]): string {
    return effect === "positiv"
      ? "bg-success/25 border border-success/50"
      : effect === "negativ"
        ? "bg-error/25 border border-error/50"
        : "bg-base-content/10 border border-base-content/20";
  }
</script>

<div class="space-y-6">
  {#if änderungenAktiv.length}
    <div class="grid grid-cols-2 gap-3">
      {#each änderungenAktiv as veränderung (veränderung.ma + "-aktiv")}
        {@const prio = prioritaetForMa(veränderung.ma)}
        <div
          class="relative overflow-hidden rounded-lg bg-transparent py-3 pl-4 pr-11 {effectCardBorderClass(
            veränderung.effect,
          )}"
        >
          <span
            class="pointer-events-none absolute right-3 top-3"
            title={effectIconLabel(veränderung.effect)}
            role="img"
            aria-label={effectIconLabel(veränderung.effect)}
          >
            {#if veränderung.effect === "positiv"}
              <CircleCheck
                class="size-5 stroke-2 text-success"
                aria-hidden="true"
              />
            {:else if veränderung.effect === "negativ"}
              <CircleX class="size-5 stroke-2 text-error" aria-hidden="true" />
            {:else}
              <CircleMinus
                class="size-5 stroke-2 text-base-content/55"
                aria-hidden="true"
              />
            {/if}
          </span>
          <div class="flex items-start gap-3">
            <div class="flex min-w-0 shrink-0 flex-col gap-2">
              <p class="font-semibold leading-snug text-base-content">
                {veränderung.ma}
              </p>
              {#if prio}
                <div
                  class="flex flex-col gap-1 rounded-lg bg-base-200/50 px-2 py-1.5 ring-1 ring-base-content/10"
                >
                  <span
                    class="text-[0.65rem] font-medium uppercase tracking-wider text-base-content/50"
                    >Priorität · Klient</span
                  >
                  <span
                    class="badge badge-sm w-fit border-0 font-medium {prioritaetBadgeClass(
                      prio,
                    )}"
                  >
                    {prio}
                  </span>
                </div>
              {/if}
            </div>
            <div class="min-w-0 flex-1 space-y-2">
              {#if veränderung.relevant_changes?.length}
                <ul class="space-y-2 text-sm">
                  {#each veränderung.relevant_changes as rc, i (rc.relevant_spalte + "-" + i)}
                    {@const maZusatz = mitarbeiterZusatzForRc(
                      veränderung.ma,
                      rc,
                    )}
                    {@const rcEffectBg = effectBgRc(rc.effect)}
                    <li class="space-y-1.5">
                      <div class="flex flex-wrap items-baseline gap-2">
                        <span
                          class="badge badge-xs border {rcEffectBg} font-normal"
                        >
                          {rc.relevant_spalte}
                        </span>
                        <span class="text-base-content">{rc.änderung}</span>
                      </div>
                      {#if maZusatz}
                        <div
                          class="flex flex-wrap items-baseline gap-2 border-l-2 border-base-content/20 pl-2.5 ml-0.5"
                        >
                          <span
                            class="badge badge-xs border {rcEffectBg} font-normal"
                          >
                            {maZusatz.label}
                          </span>
                          <span class="text-base-content/90"
                            >{maZusatz.wert}</span
                          >
                        </div>
                      {/if}
                    </li>
                  {/each}
                </ul>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  {#if änderungenNeutral.length}
    <div
      class="border-t border-base-content/15 pt-4 space-y-3"
      aria-label="Neutrale Änderungen"
    >
      <p class="text-xs font-medium uppercase tracking-wide text-base-content/50">
        Neutral
      </p>
      <div class="grid grid-cols-2 gap-3">
        {#each änderungenNeutral as veränderung (veränderung.ma + "-neutral")}
          {@const prio = prioritaetForMa(veränderung.ma)}
          <div
            class="relative overflow-hidden rounded-lg bg-transparent py-3 pl-4 pr-11 {effectCardBorderClass(
              veränderung.effect,
            )}"
          >
            <span
              class="pointer-events-none absolute right-3 top-3"
              title={effectIconLabel(veränderung.effect)}
              role="img"
              aria-label={effectIconLabel(veränderung.effect)}
            >
              {#if veränderung.effect === "positiv"}
                <CircleCheck
                  class="size-5 stroke-2 text-success"
                  aria-hidden="true"
                />
              {:else if veränderung.effect === "negativ"}
                <CircleX
                  class="size-5 stroke-2 text-error"
                  aria-hidden="true"
                />
              {:else}
                <CircleMinus
                  class="size-5 stroke-2 text-base-content/55"
                  aria-hidden="true"
                />
              {/if}
            </span>
            <div class="flex items-start gap-3">
              <div class="flex min-w-0 shrink-0 flex-col gap-2">
                <p class="font-semibold leading-snug text-base-content">
                  {veränderung.ma}
                </p>
                {#if prio}
                  <div
                    class="flex flex-col gap-1 rounded-lg bg-base-200/50 px-2 py-1.5 ring-1 ring-base-content/10"
                  >
                    <span
                      class="text-[0.65rem] font-medium uppercase tracking-wider text-base-content/50"
                      >Priorität · Klient</span
                    >
                    <span
                      class="badge badge-sm w-fit border-0 font-medium {prioritaetBadgeClass(
                        prio,
                      )}"
                    >
                      {prio}
                    </span>
                  </div>
                {/if}
              </div>
              <div class="min-w-0 flex-1 space-y-2">
                {#if veränderung.relevant_changes?.length}
                  <ul class="space-y-2 text-sm">
                    {#each veränderung.relevant_changes as rc, i (rc.relevant_spalte + "-" + i)}
                      {@const maZusatz = mitarbeiterZusatzForRc(
                        veränderung.ma,
                        rc,
                      )}
                      {@const rcEffectBg = effectBgRc(rc.effect)}
                      <li class="space-y-1.5">
                        <div class="flex flex-wrap items-baseline gap-2">
                          <span
                            class="badge badge-xs border {rcEffectBg} font-normal"
                          >
                            {rc.relevant_spalte}
                          </span>
                          <span class="text-base-content">{rc.änderung}</span>
                        </div>
                        {#if maZusatz}
                          <div
                            class="flex flex-wrap items-baseline gap-2 border-l-2 border-base-content/20 pl-2.5 ml-0.5"
                          >
                            <span
                              class="badge badge-xs border {rcEffectBg} font-normal"
                            >
                              {maZusatz.label}
                            </span>
                            <span class="text-base-content/90"
                              >{maZusatz.wert}</span
                            >
                          </div>
                        {/if}
                      </li>
                    {/each}
                  </ul>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
