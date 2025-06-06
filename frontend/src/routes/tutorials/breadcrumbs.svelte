<script lang="ts">
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import { page } from '$app/state';
	import { getCollection } from './context.svelte';
	import { getLocale } from '../../paraglide/runtime';
	import { m } from '../../paraglide/messages';

	const { params } = page;

	const collection = getCollection();
	function getTopic(slug: string) {
		return collection[getLocale()].find((t) => t.slug === slug);
	}

	const currTopicSlug = $derived(params.topic);
	const currTutorialSlug = $derived(params.tutorial);

	function getTutorial(topicSlug: string, slug: string) {
		const topic = getTopic(topicSlug);
		return topic?.tutorials.find((t) => t.slug === slug);
	}

	const currTopic = $derived.by(() => getTopic(currTopicSlug));
	const currTutorial = $derived.by(() => {
		return getTutorial(currTopicSlug, currTutorialSlug);
	});
</script>

<Breadcrumb.Root>
	<Breadcrumb.List class="flex-col items-start md:flex-row  md:items-center">
		{#if currTopic}
			<Breadcrumb.Item>
				<Breadcrumb.Link href="/tutorials/">{m.topics()}</Breadcrumb.Link>
			</Breadcrumb.Item>
			<Breadcrumb.Separator class="hidden md:inline"><ChevronRight /></Breadcrumb.Separator>
			<Breadcrumb.Item class="line-clamp-1 max-w-96 text-ellipsis">
				{#if currTutorial}
					<Breadcrumb.Link href={`/tutorials/${currTopic?.slug}`}
						>{currTopic?.title}</Breadcrumb.Link
					>
				{:else}
					{currTopic?.title}
				{/if}
			</Breadcrumb.Item>
		{/if}

		{#if currTutorial}
			<Breadcrumb.Separator class="hidden md:inline"><ChevronRight /></Breadcrumb.Separator>
			<Breadcrumb.Item class="line-clamp-1 max-w-96 text-ellipsis">
				{currTutorial?.title}
			</Breadcrumb.Item>
		{/if}
	</Breadcrumb.List>
</Breadcrumb.Root>
