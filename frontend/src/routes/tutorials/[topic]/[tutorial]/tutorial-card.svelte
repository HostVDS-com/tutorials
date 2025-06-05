<script lang="ts">
	import type { Tutorial } from '../../topics';
	import type { PageData } from './$types';
	import * as Card from '@/components/ui/card';

	let {
		tutorial
	}: {
		tutorial: Tutorial;
	} = $props();
</script>

<Card.Root class="h-36 w-full" title={tutorial.title}>
	<Card.Header>
		<Card.Title class="line-clamp-2 text-sm">{tutorial.title}</Card.Title>
		<Card.Description class="ellipsis line-clamp-3 overflow-hidden text-xs font-normal"
			>{tutorial.description}</Card.Description
		>
	</Card.Header>
</Card.Root>
