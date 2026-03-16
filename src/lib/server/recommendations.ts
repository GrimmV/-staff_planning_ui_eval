import type { Recommendation } from '$lib/types';
import { PUBLIC_BASE_URL as BASE_URL, PUBLIC_PORT as PORT } from "$env/static/public";


const RECOMMENDATIONS_URL = BASE_URL + PORT + '/recommendations';

console.log("RECOMMENDATIONS_URL", RECOMMENDATIONS_URL);

export interface RecommendationRequestBody {
  unavailable_mas?: string[];
  unavailable_clients?: string[];
}

export async function fetchRecommendations(
  body: RecommendationRequestBody = {}
): Promise<Recommendation[]> {
  console.log("fetching recommendations", body);
  const response = await fetch(RECOMMENDATIONS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch recommendations: ${response.status} ${response.statusText}`
    );
  }

  const data = (await response.json()) as Recommendation[];
  return data;
}

