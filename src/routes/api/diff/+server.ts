import { json } from '@sveltejs/kit';
import { fetchDiffs } from '$lib/server/diffs';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();

  const diffs = await fetchDiffs(body);

  return json(diffs);
}