<script lang="ts">
	import type { LayoutProps } from './$types';
	import '../app.css';
	import type { Collection } from './topics';
	import { setCollection } from './context.svelte';
	import { onMount } from 'svelte';
	import { locales, localizeHref } from './../paraglide/runtime';
	import Sidebar from './sidebar.svelte';
	import Breadcrumbs from './breadcrumbs.svelte';
	import { page } from '$app/state';
	import { on } from 'svelte/events';
	import { scrollY } from 'svelte/reactivity/window';
	import Header from './header.svelte';
	import favicon from '@/static/favicon.png';
	import { cn } from '@/utils';
	import { getLocale } from '../paraglide/runtime';

	let { children, data }: LayoutProps = $props();
	let collection = $state(data?.collection ?? {});

	let width = $state(200);
	let sidebarContainer = $state<HTMLDivElement>();
	onMount(() => {
		width = sidebarContainer?.getBoundingClientRect()?.width ?? 0;
	});

	setCollection(collection);

	const topicSlug = $derived(page.params.topic);
	const tutorialSlug = $derived(page.params.tutorial);
	const currTopic = $derived(collection[getLocale() ?? 'en'].find((t) => t.slug === topicSlug));
	const currTutorial = $derived(currTopic?.tutorials.find((t) => t.slug === tutorialSlug));

	let description = $derived.by(() => {
		if (currTopic) {
			return currTopic.description;
		}
	});

	let title = $derived.by(() => {
		let base = 'Community Tutorials by HostVDS.com';

		if (currTopic) {
			base = `${currTopic.title} | ${base}`;
		}

		if (currTutorial) {
			base = `${currTutorial.title} | ${base}`;
		}

		return base;
	});
</script>

<svelte:head>
	<title>{title}</title>
	{#if description}
		<meta name="description" content={description} />
	{/if}
	<link
		href="https://fonts.googleapis.com/css2?family=Epilogue:ital,wght@0,100..900;1,100..900&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap&family=Fira+Code:wght@300..700"
		rel="stylesheet"
	/>
	<link rel="icon" href={favicon} />
</svelte:head>

<!-- generate static pages for all locales -->
<div style="display:none">
	{#each locales as locale}
		<a href={localizeHref(page.url.pathname, { locale })}>{locale}</a>
	{/each}
</div>

{#if getLocale()}
	{#key getLocale()}
		<main
			class={cn('m-auto h-full min-h-screen w-full px-0 2xl:container', {
				container: !currTutorial
			})}
		>
			<div
				class="flex h-full min-h-screen w-full flex-row gap-0 pt-[75px] md:gap-1 lg:gap-3 lg:px-5"
			>
				<div class="fixed top-0 right-0 left-0 z-10 flex h-[75px]">
					<Header {collection} />
				</div>
				{#if currTopic}
					<div bind:this={sidebarContainer} class="relative hidden md:flex md:w-5/12 lg:w-4/12">
						<div class="w-full">
							<Sidebar {collection} toc={currTutorial?.toc} />
						</div>
					</div>
				{/if}
				<div class={cn('mx-auto flex h-full w-full p-3 py-10')}>
					<div class="flex w-full flex-col">
						<div class="flex flex-row tracking-[-0.02em]">
							{#key page.url}
								<Breadcrumbs />
							{/key}
						</div>
						<div class="flex w-full flex-row py-5">
							{@render children()}
						</div>
					</div>
				</div>
				{#if currTutorial}
					<div bind:this={sidebarContainer} class="relative hidden lg:flex lg:w-4/12">
						<div class="w-full">
							<Sidebar {collection} />
						</div>
					</div>
				{/if}
			</div>
		</main>
	{/key}
{/if}
