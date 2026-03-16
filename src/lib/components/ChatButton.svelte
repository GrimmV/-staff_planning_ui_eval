<script lang="ts">
	import { MessageSquare, X } from '@lucide/svelte';
	import { fetchOpenAI, type OpenAIResponse } from '$lib/chat';

	interface Props {
		context?: string;
		label?: string;
		placeholder?: string;
		buttonClass?: string;
		dialogTitle?: string;
		onopen?: () => void;
		onclose?: () => void;
		onresponse?: (event: { prompt: string; response: string }) => void;
	}

	let {
		context = "",
		label = 'Ask',
		placeholder = 'Type your request…',
		buttonClass = '',
		dialogTitle = 'Your Request',
		onopen,
		onclose,
		onresponse
	}: Props = $props();

	let isOpen = $state(false);
	let prompt = $state('');
	let isLoading = $state(false);
	let errorMessage: string | null = $state(null);
	let responseText: string | null = $state(null);
	let rootEl: HTMLDivElement | null = $state(null);

	// viewport coordinates of button's top-left
	let anchorBottom = $state(0);
	let anchorRight = $state(0);

	function positionToButton() {
		if (!rootEl) return;
		const r = rootEl.getBoundingClientRect();
		anchorBottom = r.bottom;
		anchorRight = r.right;
	}

	function openDialog() {
		positionToButton();
		isOpen = true;
		onopen?.();
	}

	function closeDialog() {
		isOpen = false;
		onclose?.();
	}

	function toggleDialog() {
		isOpen = !isOpen;
		if (isOpen) {
			openDialog();
		} else {
			closeDialog();
		}
	}

	function resetState() {
		prompt = '';
		isLoading = false;
		errorMessage = null;
		responseText = null;
	}

	async function submitPrompt() {
		if (!prompt || prompt.trim().length === 0 || isLoading) return;
		isLoading = true;
		errorMessage = null;
		responseText = null;
		try {
			const fullPrompt = "Context: " + 
			context + "\n\n" + "User request: " + 
			prompt + "\n\n";
			// "This is a single-turn conversation. Do not make follow-up suggestions.";
			const result: OpenAIResponse = await fetchOpenAI(fullPrompt);
			responseText = result.response;
			onresponse?.({ prompt: prompt.trim(), response: responseText ?? '' });
		} catch (e) {
			errorMessage = e instanceof Error ? e.message : 'Something went wrong';
		} finally {
			isLoading = false;
		}
	}

	
	// keep in place on resize/scroll
	function handleWindowChange() {
		if (isOpen) positionToButton();
	}

	// Move an element to document.body to avoid clipping by parent overflow/transform
	function portal(node: HTMLElement) {
		const originalParent = node.parentNode as Node | null;
		const placeholder = document.createComment('portal-placeholder');
		if (originalParent) {
			originalParent.insertBefore(placeholder, node);
		}
		document.body.appendChild(node);
		return {
			destroy() {
				if (node.parentNode === document.body) {
					document.body.removeChild(node);
				}
				if (originalParent && placeholder.parentNode === originalParent) {
					placeholder.parentNode.removeChild(placeholder);
				}
			}
		};
	}
</script>

<svelte:window onscroll={handleWindowChange} onresize={handleWindowChange} />

<div class="relative inline-block" bind:this={rootEl}>
	<button
		class="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:outline-none {buttonClass}"
		onclick={toggleDialog}
		data-testid="chatbutton-open"
	>
		<MessageSquare class="h-4 w-4" />
		{label}
	</button>

	{#if isOpen}
		<div 
		role="dialog"
		aria-label="Chat with the system"
		tabindex="-1"
		class="fixed z-[9999] w-84 rounded-lg border border-gray-200 bg-white shadow-xl p-2"
		style="
			bottom: {anchorBottom - 380}px;
			right: {anchorRight + 130}px;
			transform: translate(-8px, -8px) translate(-100%, -100%);
		"
		use:portal
		>
			<div class="mb-2 flex items-center justify-between">
				<h3 class="text-base font-semibold text-gray-900">{dialogTitle}</h3>
				<button class="rounded p-1 text-gray-500 hover:bg-gray-100" onclick={closeDialog} aria-label="Close">
					<X class="h-5 w-5" />
				</button>
			</div>

			{#if responseText === null}
				<div class="space-y-3">
					<!-- <label for="chat-input" class="block text-sm font-medium text-gray-700">Your request</label> -->
					<textarea
						id="chat-input"
						bind:value={prompt}
						{placeholder}
						class="h-28 w-full resize-none rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:bg-gray-50"
						disabled={isLoading}
					></textarea>

					{#if errorMessage}
						<p class="text-sm text-red-600">{errorMessage}</p>
					{/if}

					<div class="mt-2 flex items-center justify-end gap-2">
						<button class="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100" onclick={() => { resetState(); closeDialog(); }}>Cancel</button>
						<button
							class="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
							onclick={submitPrompt}
							disabled={isLoading || !prompt.trim()}
							data-testid="chatbutton-submit"
						>
							{#if isLoading}
								<svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
								<span>Sending…</span>
							{:else}
								<span>Send</span>
							{/if}
						</button>
					</div>
				</div>
			{:else}
				<div class="space-y-3 h-full">
					<label class="block text-sm font-medium text-gray-700">{prompt}</label>
					<div class="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm whitespace-pre-wrap text-gray-800 max-h-64 overflow-y-auto">{responseText}</div>
					<div class="flex items-center justify-end gap-2">
						<button class="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100" onclick={() => { resetState(); }}>Ask another</button>
						<button class="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700" onclick={() => { resetState(); closeDialog(); }}>Close</button>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>