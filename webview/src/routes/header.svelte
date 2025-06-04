<script lang="ts">
	import type { Collection } from './topics';
	import { page } from '$app/state';
	import github from '@/static/github-white.svg';
	import logo from '@/static/logo.svg';
	import { type AvailableLanguageTag } from '$lib/paraglide/runtime';
	import * as m from '../paraglide/messages.js';
	import { reroute } from '../hooks';
	import { getLocale, setLocale } from '../paraglide/runtime';
	import Link from '@/components/link.svelte';

	let { collection }: { collection: Collection } = $props();

	let currTopicSlug = $derived(page.params.topic);

	function switchToLanguage(newLanguage: AvailableLanguageTag) {
		setLocale(newLanguage);
		reroute({ url: page.url });
		// setLanguageTag(newLanguage);
	}
</script>

<div
	class="flex w-full flex-row bg-sky-950/70 px-5 backdrop-blur-md will-change-scroll md:px-3 lg:px-0"
>
	<div class="container m-auto flex flex-row items-center justify-between text-white">
		<div class="flex flex-row items-center text-xl">
			<Link class="flex flex-row items-center" href="/">
				<img src={logo} alt="HostVDS Community Tutorials" class="h-[25px] md:h-[45px]" />
				<h3 class="mt-1 ml-2 hidden align-middle md:flex">Community Tutorials</h3>
			</Link>
		</div>
		<div class="md:text-md flex flex-row items-center gap-2 text-xs md:gap-3">
			<Link class="flex flex-col items-center transition-opacity hover:opacity-75" href="/">
				<div class="mt-1 ml-2 align-middle">{m.topics()}</div>
			</Link>
			<a
				class="flex flex-col items-center transition-opacity hover:opacity-75"
				target="_blank"
				href="https://hostvds.com"
			>
				<div class="mt-1 ml-2 align-middle">{m.products()}</div>
			</a>
			<a
				class="flex flex-col items-center transition-opacity hover:opacity-75"
				target="_blank"
				href="https://github.com/HostVDS-com/tutorials"
			>
				<img src={github} alt="GitHub" class="mt-[3px] h-3 md:h-4" />
			</a>
			<div class="flex flex-col items-center">
				<div class="flex flex-row items-center">
					{#if getLocale()}
						<label class="mt-1 mr-1 align-middle" for="language">{m.language()} </label>
						<select
							id="language"
							class="mt-1 w-auto align-middle font-bold transition-opacity hover:opacity-75"
							value={getLocale()}
							onchange={(e) => switchToLanguage(e.currentTarget.value as any)}
						>
							<option value="en">EN</option>
							<option value="ru">RU</option>
						</select>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
