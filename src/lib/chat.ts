import { PUBLIC_BASE_URL as BASE_URL, PUBLIC_PORT as PORT, PUBLIC_API_ENDPOINT_CHAT as API_ENDPOINT_CHAT } from "$env/static/public";

// Build full API URL
function buildApiUrl(endpoint: string): string {
	return `${BASE_URL}${PORT}${endpoint}`;
}

// Generic API error class
export class ApiError extends Error {
	constructor(
		message: string,
		public status?: number,
		public response?: Response
	) {
		super(message);
		this.name = 'ApiError';
	}
}

// Generic fetch wrapper with error handling
async function apiRequest<T>(
	url: string,
	options: RequestInit = {}
): Promise<T> {
	try {
		const response = await fetch(url, {
			headers: {
				'Content-Type': 'application/json',
				...options.headers,
			},
			...options,
		});

		if (!response.ok) {
			throw new ApiError(
				`API request failed: ${response.status} ${response.statusText}`,
				response.status,
				response
			);
		}

		return await response.json();
	} catch (error) {
		if (error instanceof ApiError) {
			throw error;
		}
		throw new ApiError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}

export interface OpenAIResponse {
	response: string;
}

export async function fetchOpenAI(prompt: string): Promise<OpenAIResponse> {
	const url = buildApiUrl(API_ENDPOINT_CHAT);
	return apiRequest<OpenAIResponse>(url, {
		method: 'POST',
		body: JSON.stringify({ prompt: prompt }),
	});
}
