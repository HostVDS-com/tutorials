<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn, type WithElementRef } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
	bind:this={ref}
	data-slot="card"
	class={cn(
		'bg-card text-card-foreground flex flex-col gap-6 rounded-xl py-6 shadow-sm shadow-gray-200 transition-shadow duration-75 hover:shadow-md hover:shadow-gray-200',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</div>
