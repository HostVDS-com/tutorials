<script lang="ts">
	import type { LayoutProps } from './$types';
	import { page } from '$app/state';
	import { getCollection } from '../context.svelte';
	import { getLocale } from '../../paraglide/runtime';
	const { topic } = page.params;

	const collection = getCollection();
	const currTopic = $derived(collection[getLocale()].find((t) => t.slug === topic));

	let { children, data }: LayoutProps = $props();
</script>

{#if !currTopic}
	<div class="flex flex-col gap-2">
		<div class="mb-2 flex flex-col gap-5">
			<h1 class="text-4xl font-semibold">This page does not exist yet</h1>
		</div>
	</div>
{:else}
	<div class="w-full">
		<div class="flex max-w-[900px] flex-col gap-5">
			{#key page.url}
				<!-- <div class="mb-2 flex flex-col gap-5"> -->
				<!-- 	<h1 class="text-4xl font-semibold">{currTopic?.title}</h1> -->
				<!-- </div> -->
				<div class="mb-2 flex w-full flex-col gap-5">
					{@render children()}
				</div>
			{/key}
		</div>
	</div>
{/if}
