import type { DiffsResponse } from '$lib/types';

const DIFFS_URL = 'http://localhost:5000/retrieve_diff';

export interface DiffsRequestBody {
  add_client?: string;
  add_ma?: string;
  unavailable_mas?: string[];
  unavailable_clients?: string[];
}

export async function fetchDiffs(
  body: DiffsRequestBody = {}
): Promise<DiffsResponse[]> {
  console.log("fetching diffs", body);
  const response = await fetch(DIFFS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch diffs: ${response.status} ${response.statusText}`
    );
  }

  const data = (await response.json()) as DiffsResponse[];
  return data;
}

