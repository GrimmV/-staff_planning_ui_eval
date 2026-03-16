<script lang="ts">
  import { RecommendationFlow } from "$lib";
  import type { Recommendation } from "$lib/types";

  let ma_assignments = $state<string[]>([]);
  let klient_assignments = $state<string[]>([]);

  let recommendations = $state<Recommendation[]>([]);
  let loading = $state(false);
  let error = $state<string | null>(null);

  async function loadRecommendations() {
    loading = true;
    error = null;
    const res = await fetch('/api/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        unavailable_mas: ma_assignments,
        unavailable_clients: klient_assignments,
      })
    });

    recommendations = await res.json();
    loading = false;
  }

  $effect(() => {
    loadRecommendations();
  });
</script>

<main class="min-h-screen bg-base-200 flex flex-col items-center justify-center p-4">
  <div role="tablist" class="tabs tabs-box w-full">
    <input
      type="radio"
      name="recommendation_tabs"
      role="tab"
      class="tab"
      aria-label="Standard"
      checked
    />
    <div role="tabpanel" class="tab-content bg-base-100 border-base-300 rounded-box p-6 w-full">
      <RecommendationFlow
        {recommendations}
        useLLM={false}
        onAssign={({ mitarbeiter, klient }) => {
          ma_assignments = [...ma_assignments, mitarbeiter];
          klient_assignments = [...klient_assignments, klient];
        }}
        onComplete={() => {
          console.log("alle Klienten wurden zugeordnet");
        }}
        {ma_assignments}
        {klient_assignments}
        {loading}
        {error}
      />
    </div>

    <input
      type="radio"
      name="recommendation_tabs"
      role="tab"
      class="tab"
      aria-label="Co-Pilot"
    />
    <div role="tabpanel" class="tab-content bg-base-100 border-base-300 rounded-box p-6 w-full">
      <RecommendationFlow
        {recommendations}
        useLLM={true}
        onAssign={({ mitarbeiter, klient }) => {
          ma_assignments = [...ma_assignments, mitarbeiter];
          klient_assignments = [...klient_assignments, klient];
        }}
        onComplete={() => {
          console.log("alle Klienten wurden zugeordnet");
        }}
        {ma_assignments}
        {klient_assignments}
        {loading}
        {error}
      />
    </div>
  </div>
</main>
