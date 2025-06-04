<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import type { HTMLAnchorAttributes } from 'svelte/elements';
	import { deLocalizeHref, localizeHref } from '../../paraglide/runtime';

	let { href, children, ...restProps }: { href: string } & HTMLAnchorAttributes = $props();
</script>

<a href={localizeHref(href)} {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</a>
