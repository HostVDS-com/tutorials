<script lang="ts">
	import Link from '@/components/link.svelte';
	import { getLocale } from '../paraglide/runtime';
	import { getCollection } from './context.svelte';
	const collections = getCollection();
	import * as Card from '@/components/ui/card';
	import { m } from '../paraglide/messages';

	const topics = $derived(collections[getLocale()].filter((t) => t.tutorials.length > 0));
</script>

<div class="flex w-full flex-col gap-2">
	<div class="mb-2 flex flex-col gap-5">
		<h1 class="text-4xl font-semibold">Community Tutorials</h1>
	</div>

	<div class="text-md mb-5 flex flex-col gap-5">
		{m.welcome()}
	</div>

	<div class="text-md mb-5 flex flex-col gap-5">
		<a
			class="text-sky-600 hover:text-sky-600"
			href="https://github.com/HostVDS-com/tutorials"
			target="_blank">{m.plsSupport()}</a
		>
	</div>

	<div class="mb-2 flex flex-col gap-5">
		<h2 class="text-4xl font-semibold">{m.topics()}</h2>
	</div>

	{#if !topics.length}
		<div class="text-md mb-5 flex flex-col gap-5">
			{m.noTopicsLang()}
		</div>
	{/if}

	<div class="flex w-full flex-row flex-wrap content-center items-center justify-between gap-2">
		{#each topics as topic}
			<Link href="/{topic.slug}" class="h-32 w-full flex-none md:flex-1/3 lg:flex-1/5">
				<Card.Root
					class="h-32 w-full flex-none transition-shadow duration-100 hover:shadow-lg hover:shadow-gray-300 md:flex-1/3 lg:flex-1/5"
				>
					<Card.Header>
						<Card.Title>{topic.title}</Card.Title>
						<Card.Description class="h-16 overflow-hidden">{topic.description}</Card.Description>
					</Card.Header>
				</Card.Root>
			</Link>
		{/each}
	</div>
</div>
