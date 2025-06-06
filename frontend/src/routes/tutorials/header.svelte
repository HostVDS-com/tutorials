<script lang="ts">
	import { page } from '$app/state';
	import github from '@/static/github-white.svg';
	import logo from '@/static/logo_white.svg';
	import logoSmall from '@/static/logo.svg';
	import { type AvailableLanguageTag } from '$lib/paraglide/runtime';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import Globe from '@lucide/svelte/icons/globe';
	import * as m from '../../paraglide/messages.js';
	import { reroute } from '../../hooks';
	import { getLocale, setLocale } from '../../paraglide/runtime';
	import Link from '@/components/link.svelte';
	import Dropdown from '@/components/dropdown.svelte';
	import Button from '@/components/ui/button/button.svelte';
	import { cn } from '@/utils.js';

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
				<img
					src={logo}
					alt="HostVDS Community Tutorials"
					class="hidden h-[20px] w-[126px] md:inline md:h-[30px] md:w-[190px]"
				/>
				<img
					src={logoSmall}
					alt="HostVDS Community Tutorials"
					class="inline h-[60px] w-auto md:hidden"
				/>
			</Link>
		</div>

		<!-- right side -->
		<div class="md:text-md flex flex-row items-center gap-2 text-xs font-light md:gap-8">
			<!-- links -->
			<div
				class="md:text-md hidden flex-row items-center gap-2 text-xs font-light md:flex md:gap-10"
			>
				<!-- topics link -->
				<Link
					class="flex flex-col items-center uppercase transition-opacity hover:opacity-75"
					href="/tutorials/"
				>
					<div class="mt-1 ml-2 align-middle">{m.topics()}</div>
				</Link>

				<!-- hostvds link -->
				<a
					class="flex flex-row items-center uppercase transition-opacity hover:opacity-75"
					target="_blank"
					rel="external"
					href="https://hostvds.com"
				>
					<div class="mt-1 ml-2 align-middle">{m.products()}</div>
					<ExternalLink class="mt-[2px] ml-[2px] h-[10px] w-[10px]" />
				</a>
			</div>

			<!-- buttons -->
			<div class="md:text-md flex flex-row items-center gap-2 text-xs font-light md:gap-3">
				<a
					class="hidden flex-col items-center transition-opacity hover:opacity-75 md:flex"
					target="_blank"
					rel="external"
					href="https://hostvds.com/login"
				>
					<Button class="w-full bg-cyan-400 font-light uppercase hover:bg-cyan-400 hover:opacity-85"
						>Sing in</Button
					>
				</a>
				<a
					class="flex flex-col items-center uppercase transition-opacity hover:opacity-75"
					target="_blank"
					rel="external"
					href="https://hostvds.com/register"
				>
					<Button
						class={cn(
							'w-full border-cyan-500 bg-transparent p-0 font-light uppercase shadow-none hover:bg-cyan-400 hover:opacity-85 md:border-[1px] md:p-4',
							''
						)}>Sing up</Button
					>
				</a>

				<!-- github link -->
				<a
					class="ml-1 flex flex-col items-center uppercase transition-opacity hover:opacity-75"
					target="_blank"
					rel="external"
					href="https://github.com/HostVDS-com/tutorials"
				>
					<img src={github} alt="GitHub" class="h-3 md:h-4" />
				</a>

				<!-- language switcher -->
				<div class="ml-1 flex flex-col items-center">
					<div class="flex flex-row items-center align-baseline">
						{#if getLocale()}
							<Dropdown
								class="w-16_"
								options={[
									{ label: 'EN', value: 'en' },
									{ label: 'RU', value: 'ru' }
								]}
								onchange={(value) => switchToLanguage(value as any)}
								selected={getLocale()}
							/>
						{/if}
					</div>
				</div>
			</div>
			<!-- hostvds link -->
		</div>
	</div>
</div>
