<script lang="ts">
	import { page } from '$app/state';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
	import { compile } from 'mdsvex';

	import { getCollection } from '../context.svelte';
	const { topic } = page.params;
	import * as Card from '@/components/ui/card';
	import TutorialCard from './[tutorial]/tutorial-card.svelte';
	import { getLocale, localizeHref } from '../../paraglide/runtime';
	import Link from '@/components/link.svelte';
	import { topicLangs } from '../../helpers';
	import { m } from '../../paraglide/messages';

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
		{#if currTopic.title}
			<h1
				class="mt-2 mb-5 flex w-full flex-row flex-wrap content-center items-center justify-between px-1 text-5xl font-semibold whitespace-pre-wrap"
			>
				{currTopic.title}
			</h1>
		{/if}
		{#if currTopic.description}
			<p
				class="text-md mb-5 flex w-full flex-row flex-wrap content-center items-center justify-between px-1 whitespace-pre-wrap"
			>
				{currTopic.description}
			</p>
		{/if}
		<div class="mb-2 flex flex-col gap-5">
			<h2 class="text-4xl font-semibold">{m.tutorials()}</h2>
		</div>
		<div
			class="container flex w-full flex-row flex-wrap content-center items-center justify-between gap-2"
		>
			{#if currTopic.tutorials.length == 0}
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
										href={localizeHref(`/${topic.slug}`, { locale: lang })}
										class="flex flex-row items-center gap-2 text-sky-700 transition-opacity duration-75 hover:opacity-70"
									>
										<span>{topic.title}</span>
									</a>
								</div>
							{/if}
						{/each}
					</div>
				</div>
			{/if}
			{#each currTopic.tutorials as tutorial}
				<Link
					href="/{topic}/{tutorial.slug}"
					class="h-32 w-full flex-none transition-opacity duration-75 hover:opacity-70 md:flex-1/3 lg:flex-1/5"
				>
					<TutorialCard {tutorial} />
				</Link>
			{/each}
		</div>
	</div>
{/if}
