<script lang="ts">
	import { page } from '$app/state';

	import { getCollection } from '../../context.svelte';
	const { topic, tutorial } = page.params;

	import TutorialCard from './tutorial-card.svelte';
	import { getLocale, localizeHref } from '../../../paraglide/runtime';
	import { tutorialLangs } from '../../../helpers';
	import { m } from '../../../paraglide/messages';
	import Link from '@/components/link.svelte';

	const collection = getCollection();
	const currTopic = $derived(collection[getLocale()].find((t) => t.slug === topic));
	const currTutorial = $derived(currTopic?.tutorials.find((t) => t.slug === tutorial));

	const currTutorialInOtherLanguages = $derived.by(() => {
		return tutorialLangs(tutorial, topic, collection);
	});

	let mdContainer = $state<HTMLDivElement>();

	const toc = $derived.by(() => {
		const content = currTutorial?.content;

		if (!content) return [];
		if (!mdContainer) return [];

		return [...mdContainer.querySelectorAll('h1, h2, h3, h4, h5, h6')].map((h) => {
			return {
				title: h.textContent,
				level: h.tagName.toLowerCase().replace('h', ''),
				id: h.id
			};
		});
	});

	const relatedTutorials = $derived(
		currTopic?.tutorials.filter((t) => t.slug !== currTutorial?.slug) ?? []
	);

	function firstImage() {
		return currTutorial?.content.match(/!\[.*?\]\((.*?)\)/)?.[1];
	}
</script>

<svelte:head>
	<meta name="keywords" content={currTutorial?.tags.join(', ')} />

	<meta property="og:title" content={currTutorial?.title ?? ''} />
	{#if currTutorial?.description}
		<meta property="og:description" content={currTutorial?.description} />
	{/if}
	{#if currTutorial?.cover}
		<meta property="og:image" content={currTutorial?.cover} />
	{/if}
	<meta property="og:url" content="https://tutorials.hostvds.com" />
</svelte:head>
{#snippet tags()}
	{#each currTutorial?.tags ?? [] as tag (tag)}
		<div
			class="min-w-10 rounded bg-gray-400/90 px-[0.4rem] py-[0.1rem] text-center font-mono text-[0.65rem] font-bold text-white"
		>
			{tag}
		</div>
	{/each}
{/snippet}

{#if !currTutorial}
	{#if currTutorialInOtherLanguages.length > 0}
		<div class="flex flex-col gap-2">
			<div class="mt-4 flex flex-col gap-5">
				<h2 class="text-4xl font-semibold">
					{m.articleNotTranslated()}
				</h2>
				<div class="text-lg font-semibold">{m.seeInOtherLanguages()}</div>
			</div>

			{#each currTutorialInOtherLanguages as [lang, tut]}
				<div class="flex flex-row gap-2">
					<span class="font-semibold uppercase">{lang}</span>
					<a
						href={localizeHref(`/${topic}/${tutorial}`, { locale: lang })}
						class="flex flex-row items-center gap-2 text-sky-700 transition-opacity duration-75 hover:opacity-70"
					>
						<span>{tut.title}</span>
					</a>
				</div>
			{/each}
			<div class="flex flex-col gap-2">
				<div class="flex flex-col gap-2">
					<div class="my-4 flex flex-col gap-5">
						<a
							target="_blank"
							class="text-sky-700 transition-opacity duration-75 hover:opacity-70"
							href={`https://github.com/HostVDS-com/tutorials/tree/main/topics/${topic}/${tutorial}`}
							><div class="text-md font-semibold">{m.helpWithTranslation()}</div></a
						>
					</div>
				</div>
			</div>
		</div>
	{:else}
		<div class="flex flex-col gap-2">
			<div class="my-4 flex flex-col gap-5">
				<h1 class="text-4xl font-semibold">{m.thisPageDoesNotExistYet()}</h1>
			</div>
		</div>
	{/if}
{/if}

{#if currTopic && currTutorial}
	<div class="mt-5"></div>
	<div class="flex flex-col gap-5">
		<h1 class="text-5xl font-bold">{currTutorial.title}</h1>
	</div>
	<div class="flex flex-row gap-2">
		{@render tags()}
	</div>
	<!-- <div class="mb-5"></div> -->
	<div
		class="tutorial text-md container flex w-full flex-row flex-wrap content-center items-center justify-between gap-2"
	>
		<div bind:this={mdContainer} class="w-full text-pretty">
			{@html currTutorial.markdown}
		</div>
	</div>
	<div class="flex flex-row gap-2">
		{@render tags()}
	</div>
	{#if relatedTutorials.length > 0}
		<div class="flex w-full">
			<h2 class="m-auto text-xl font-semibold">{m.moreFromTheTopic()}</h2>
		</div>
		<div
			class="container flex w-full flex-row flex-wrap content-center items-center justify-between gap-2"
		>
			{#each relatedTutorials as tutorial}
				<Link
					href="/{topic}/{tutorial.slug}"
					class="h-32 w-full flex-none transition-opacity duration-75 hover:opacity-70 md:flex-1/3 lg:flex-1/5"
				>
					<TutorialCard {tutorial} />
				</Link>
			{/each}
		</div>
	{/if}
{/if}
