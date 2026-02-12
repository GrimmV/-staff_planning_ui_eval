<script lang="ts">
  import { RecommendationFlow } from "$lib";
  import type { Recommendation } from "$lib/types";

  const ma_assignments: string[] = $state([]);
  const klient_assignments: string[] = $state([]);

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

<main class="min-h-screen bg-base-200 flex items-center justify-center p-4">
  <RecommendationFlow
    {recommendations}
    onAssign={({ mitarbeiter, klient, index, isAlternative }) => {
      console.log("zugeordnet", { mitarbeiter, klient, index, isAlternative });
      ma_assignments.push(mitarbeiter.id);
      klient_assignments.push(klient.id);
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
