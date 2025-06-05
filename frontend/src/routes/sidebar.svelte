<script lang="ts">
	import type { Collection, ContentsItem } from './topics';
	import { page } from '$app/state';
	import { cn } from '@/utils';
	import github from '@/static/github.svg';
	import { getLocale } from '../paraglide/runtime';
	import { m } from '../paraglide/messages';
	import Link from '@/components/link.svelte';

	let {
		collection,
		contents
	}: {
		collection: Collection;
		contents?: ContentsItem[];
	} = $props();

	const topics = $derived(collection[getLocale()].filter((t) => t.tutorials.length > 0));
	let currTopicSlug = $derived(page.params.topic);

	const contentsFilter = $derived.by(() => {
		if (!contents) return [];
		return contents.filter((t, i) => t.level > 1 || i > 0);
	});
</script>

<div class="sticky top-[100px] flex flex-col gap-2 p-2">
	{#if contents}
		<!-- render table of content -->
		<div class="mb-2 flex flex-col gap-5">
			<div class="px-2 text-xl font-bold text-gray-800">{m.content()}</div>
		</div>
		<div class="flex flex-col gap-1">
			{#each contentsFilter as content}
				<a
					href={`#${content.id}`}
					class={cn(
						'hovers:bg-gray-200 flex cursor-pointer flex-col rounded px-3 py-1 text-gray-500 transition-colors duration-100 hover:text-gray-900'
					)}
				>
					<div class="text-md font-semibold">{content.title}</div>
				</a>
			{/each}
		</div>
	{:else}
		<!-- render topics list -->
		<div class="mb-2 flex flex-col gap-5">
			<div class="px-2 text-xl font-bold text-gray-800">
				{m.topics()}
			</div>
		</div>

		<div class="flex flex-col gap-1">
			{#each topics as topic}
				<Link
					href={`/${topic.slug}`}
					class={cn(
						'flex cursor-pointer flex-col rounded px-3 py-2 text-gray-800 hover:bg-gray-200',
						{ ' bg-gray-200 text-sky-500': topic.slug === currTopicSlug }
					)}
				>
					<div class="text-md font-semibold">{topic.title}</div>
				</Link>
			{/each}
		</div>
		<div class="mt-10 h-full"></div>
		<div class="flex w-full flex-col gap-1 px-3 text-xs">
			<a
				class="flex flex-col text-gray-800 hover:text-sky-500"
				href="https://hostvds.com"
				target="_blank"
			>
				<div class="flex w-full flex-col gap-1 text-xs">Community Tutorials by HostVDS</div>
			</a>
		</div>
		<div class="flex flex-col gap-1 px-3 align-middle text-xs">
			<a
				href="https://github.com/HostVDS-com/tutorials"
				target="_blank"
				class="flex flex-row items-center text-gray-800 hover:text-sky-500"
			>
				<span>{m.contribute()}</span>
				<img src={github} alt="GitHub" class="ml-[2px] h-3 w-3" />
			</a>
		</div>
	{/if}
</div>
