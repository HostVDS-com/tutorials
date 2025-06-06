<script lang="ts">
	import { onMount } from 'svelte';
	import Globe from '@lucide/svelte/icons/globe';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	export interface Option {
		label: string;
		value: string;
	}

	let {
		options,
		selected = $bindable(''),
		placeholder,
		onchange,
		class: className
	}: {
		options: Option[];
		selected?: string;
		placeholder?: string;
		onchange?: (value: string) => void;
		class?: string;
	} = $props();

	let open = $state(false);

	function select(option: Option) {
		open = false;
		onchange?.(option.value);
	}

	let dropdownElement: HTMLDivElement | null = null;

	onMount(() => {
		const handleClick = (event: MouseEvent) => {
			if (open && dropdownElement && !dropdownElement.contains(event.target as Node)) {
				open = false;
			}
		};
		document.addEventListener('mousedown', handleClick);
		return () => document.removeEventListener('mousedown', handleClick);
	});
</script>

<div class={'relative ' + className} bind:this={dropdownElement}>
	<button
		type="button"
		class="flex w-full cursor-pointer items-center justify-between rounded text-white transition-opacity hover:opacity-75"
		onclick={() => (open = !open)}
	>
		<Globe class="h-4 w-4" />
		<ChevronDown class="ml-[1px]" size={10} />
	</button>

	{#if open}
		<ul
			class="animate-flipDown absolute z-10 mt-2 max-h-60 overflow-auto rounded border bg-white shadow-lg"
		>
			{#each options as option (option.value)}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
				<li
					class="cursor-pointer px-4 py-2 font-normal text-gray-800 transition hover:bg-gray-200"
					onclick={() => select(option)}
				>
					<span>{option.label}</span>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	@keyframes flipDown {
		0% {
			opacity: 0;
			transform: rotateX(-30deg);
		}
		100% {
			opacity: 1;
			transform: rotateX(0);
		}
	}
	.animate-flipDown {
		animation: flipDown 0.2s;
	}
</style>
