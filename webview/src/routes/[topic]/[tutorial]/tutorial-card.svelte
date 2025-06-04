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

<Card.Root class="flex-fone h-32 w-full md:flex-1/3 lg:flex-1/5">
	<Card.Header>
		<Card.Title>{tutorial.title}</Card.Title>
	</Card.Header>
</Card.Root>
