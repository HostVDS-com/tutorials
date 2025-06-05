import tailwindcss from "@tailwindcss/vite";
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [paraglideVitePlugin({
        project: './project.inlang',
        outdir: './src/paraglide',
        strategy: ['url', 'cookie', 'preferredLanguage', 'baseLocale'],
    }),
    tailwindcss(),
    sveltekit(),
    ],
    publicDir: "./static"
});
