<script lang="ts">
	import { page } from '$app/state';

	import { getCollection } from '../context.svelte';
	const { topic } = page.params;
	import TutorialCard from './[tutorial]/tutorial-card.svelte';
	import { getLocale, localizeHref } from '../../../paraglide/runtime';
	import Link from '@/components/link.svelte';
	import { topicLangs } from '../../../helpers';
	import { m } from '../../../paraglide/messages';

	const collection = getCollection();
	const currTopic = $derived(collection[getLocale()].find((t) => t.slug === topic));

	const currTopicInOtherLanguages = $derived.by(() => {
		return topicLangs(topic, collection);
	});
</script>

{#if currTopic}
	<div
		class="container flex w-full flex-row flex-wrap content-center items-center justify-between gap-2"
	>
		<h1
			class="mt-2 mb-5 flex w-full flex-row flex-wrap content-center items-center justify-between px-1 text-4xl font-black whitespace-pre-wrap"
		>
			{currTopic.title}
		</h1>

		<p
			class="text-md mb-5 flex w-full flex-row flex-wrap content-center items-center justify-between px-1 text-lg whitespace-pre-wrap opacity-80"
		>
			{currTopic.description}
		</p>

		<div class="mb-2 flex flex-col gap-5">
			<h2 class="text-4xl font-semibold">{m.tutorials()}</h2>
		</div>

		<div class="container flex w-full flex-row flex-wrap content-center items-center">
			{#if currTopic.tutorials.length == 0}
				{@render noTutorials()}
			{:else}
				{#each currTopic.tutorials as tutorial}
					<Link
						href="/tutorials/{topic}/{tutorial.slug}"
						class="w-full p-1 md:w-1/2 lg:w-1/3 xl:w-1/3"
					>
						<TutorialCard {tutorial} />
					</Link>
				{/each}
			{/if}
		</div>
	</div>
{/if}

{#snippet noTutorials()}
	<div class="flex flex-col gap-5">
		<div class="text-md">
			{m.noTutorials()}
		</div>

		<div class="text-md mt-5">{m.seeInOtherLanguages()}</div>

		<div class="flex flex-col gap-1">
			{#each currTopicInOtherLanguages as [lang, topic]}
				{#if lang !== getLocale()}
					<div class="flex flex-row gap-2">
						<span class="font-semibold uppercase">{lang}</span>
						<a
							href={localizeHref(`/tutorials/${topic.slug}`, { locale: lang })}
							class="flex flex-row items-center gap-2 text-sky-700 transition-opacity duration-75 hover:opacity-70"
						>
							<span>{topic.title}</span>
						</a>
					</div>
				{/if}
			{/each}
		</div>
	</div>
{/snippet}
