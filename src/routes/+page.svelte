<script lang="ts">
  import { RecommendationFlow } from "$lib";
  import type { Recommendation } from "$lib/types";

  let ma_assignments = $state<string[]>([]);
  let klient_assignments = $state<string[]>([]);

  let recommendations = $state<Recommendation[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  async function loadRecommendations() {
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

<main class="min-h-screen bg-base-200 flex items-center justify-center p-4">
  <RecommendationFlow
    {recommendations}
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
</main>
