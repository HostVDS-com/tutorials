<script lang="ts">
	import { page } from '$app/state';
	import github from '@/static/github-white.svg';
	import logo from '@/static/logo_white.svg';
	import { type AvailableLanguageTag } from '$lib/paraglide/runtime';
	import * as m from '../../paraglide/messages.js';
	import { reroute } from '../../hooks';
	import { getLocale, setLocale } from '../../paraglide/runtime';
	import Link from '@/components/link.svelte';

	function switchToLanguage(newLanguage: AvailableLanguageTag) {
		setLocale(newLanguage, { reload: true });
		reroute({ url: page.url });
	}
</script>

<div class="hostvds-bg flex w-full flex-row px-5 will-change-scroll md:px-3 lg:px-0">
	<div class="container m-auto flex flex-row items-center justify-between text-white">
		<!-- left side -->
		<div class="flex flex-row items-center text-xl">
			<!-- logo -->
			<Link class="flex flex-row items-center" href="/tutorials/">
				<img src={logo} alt="HostVDS Community Tutorials" class="h-[20px] w-auto md:h-[25px]" />
			</Link>
		</div>

		<!-- right side -->
		<div class="md:text-md flex flex-row items-center gap-2 text-xs md:gap-3">
			<!-- topics link -->
			<Link
				class="flex flex-col items-center transition-opacity hover:opacity-75"
				href="/tutorials/"
			>
				<div class="mt-1 ml-2 align-middle">{m.topics()}</div>
			</Link>

			<!-- hostvds link -->
			<a
				class="flex flex-col items-center transition-opacity hover:opacity-75"
				target="_blank"
				href="https://hostvds.com"
			>
				<div class="mt-1 ml-2 align-middle">{m.products()}</div>
			</a>

			<!-- language switcher -->
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

			<!-- github link -->
			<a
				class="flex flex-col items-center transition-opacity hover:opacity-75"
				target="_blank"
				href="https://github.com/HostVDS-com/tutorials"
			>
				<img src={github} alt="GitHub" class="mt-[3px] h-3 md:h-4" />
			</a>
		</div>
	</div>
</div>
