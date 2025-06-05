<script lang="ts">
	import Link from '@/components/link.svelte';
	import { getLocale } from '../../paraglide/runtime';
	import { getCollection } from './context.svelte';
	const collections = getCollection();
	import * as Card from '@/components/ui/card';
	import { m } from '../../paraglide/messages';

	const topics = $derived(collections[getLocale()].filter((t) => t.tutorials.length > 0));
</script>

<div class="flex w-full flex-col gap-2">
	<div class="mb-3 flex flex-col gap-5">
		<h1 class="text-4xl font-black">Community Tutorials</h1>
	</div>

	<div class="text-md mb-5 flex flex-col gap-5 opacity-80">
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
		<h2 class="text-3xl font-semibold">{m.topics()}</h2>
	</div>

	{#if !topics.length}
		<div class="text-md mb-5 flex flex-col gap-5">
			{m.noTopicsLang()}
		</div>
	{/if}

	<div class="container flex w-full flex-row flex-wrap content-center items-center">
		{#each topics as topic}
			<Link href="/tutorials/{topic.slug}" class="w-full p-1 md:w-1/2 lg:w-1/3 xl:w-1/4">
				<Card.Root class="h-36 w-full ">
					<Card.Header>
						<Card.Title class="text-md line-clamp-1">{topic.title}</Card.Title>
						<Card.Description class="ellipsis line-clamp-3 overflow-hidden text-sm font-normal"
							>{topic.description}</Card.Description
						>
					</Card.Header>
				</Card.Root>
			</Link>
		{/each}
	</div>
</div>
