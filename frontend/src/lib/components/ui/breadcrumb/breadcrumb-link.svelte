<script lang="ts">
	import type { HTMLAnchorAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';
	import { cn, type WithElementRef } from '$lib/utils.js';
	import { localizeHref } from '../../../../paraglide/runtime';

	let {
		ref = $bindable(null),
		class: className,
		child,
		href = undefined,
		children,
		...restProps
	}: WithElementRef<HTMLAnchorAttributes> & {
		child?: Snippet<[{ props: HTMLAnchorAttributes }]>;
	} = $props();

	const attrs = $derived({
		'data-slot': 'breadcrumb-link',
		class: cn('hover:text-foreground transition-colors', className),
		href: localizeHref(href ?? ''),
		...restProps
	});
</script>

{#if child}
	{@render child({ props: attrs })}
{:else}
	<a bind:this={ref} {...attrs}>
		{@render children?.()}
	</a>
{/if}
