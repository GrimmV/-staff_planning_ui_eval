import { json } from '@sveltejs/kit';
import { fetchRecommendations } from '$lib/server/recommendations';

export async function POST({ request }) {
  const body = await request.json();

  const recommendations = await fetchRecommendations(body);

  return json(recommendations);
}