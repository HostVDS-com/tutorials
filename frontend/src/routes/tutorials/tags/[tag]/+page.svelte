<script lang="ts">
	import { page } from '$app/state';
	import Link from '@/components/link.svelte';
	import { m } from '../../../../paraglide/messages';
	import { getLocale } from '../../../../paraglide/runtime';
	import TutorialCard from '../../[topic]/[tutorial]/tutorial-card.svelte';
	import { getCollection } from '../../context.svelte';

	const tag = $derived(page.params.tag.toLowerCase().replaceAll(' ', '-'));

	const collection = getCollection();
	const list = $derived(
		collection[getLocale()]
			.map((topic) => ({
				topic: topic,
				tutorials: topic.tutorials.filter((tutorial) => tutorial.tags.includes(tag))
			}))
			.filter((item) => item.tutorials.length > 0)
	);

	let title = $derived(`${m.tutorialsByTag({ tag })} | Community Tutorials by HostVDS.com`);

	let relatedKeywords = $derived.by(() => {
		return [
			...new Set(
				list
					.map((item) => item.tutorials.map((tutorial) => tutorial.tags))
					.flat()
					.flat()
			)
		].join(', ');
	});
</script>

<svelte:head>
	<title>{title}</title>
	{#if relatedKeywords}
		<meta name="keywords" content={relatedKeywords} />
	{/if}

	<meta property="og:title" content={title} />

	<meta property="og:url" content="https://hostvds.com/tutorials" />
	<link
		href="https://fonts.googleapis.com/css2?family=Epilogue:ital,wght@0,100..900;1,100..900&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap&family=Fira+Code:wght@300..700&family=Nunito+Sans:ital,opsz,wght@0,6..12,200..1000;1,6..12,200..1000"
		rel="stylesheet"
	/>
</svelte:head>

<div
	class="container flex w-full flex-row flex-wrap content-center items-center justify-between gap-2"
>
	<h1
		class="mt-2 mb-5 flex w-full flex-row flex-wrap content-center items-center justify-between px-1 text-4xl font-black whitespace-pre-wrap"
	>
		{@html `<div>${m.tutorialsByTag({ tag: `<span class="bg-gray-400/90 text-white rounded px-3 py-0">${tag}</span>` })}</div>`}
	</h1>

	<div class="container flex w-full flex-row flex-wrap content-center items-center">
		{#if list.length == 0}
			{@render noTutorials()}
		{:else}
			{#each list as item}
				{#each item.tutorials as tutorial}
					<Link
						target="_blank"
						href="/tutorials/{item.topic.slug}/{tutorial.slug}"
						class="w-full p-1 md:w-1/2 lg:w-1/3 xl:w-1/3"
					>
						<TutorialCard {tutorial} />
					</Link>
				{/each}
			{/each}
		{/if}
	</div>
</div>

{#snippet noTutorials()}
	<div class="flex flex-col gap-5">
		<div class="text-2xl">
			{m.noTutorials()}
		</div>
	</div>
{/snippet}
