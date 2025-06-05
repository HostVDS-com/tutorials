import { mdsvex } from "mdsvex";
import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    // Consult https://svelte.dev/docs/kit/integrations
    // for more information about preprocessors
    preprocess: [vitePreprocess(), mdsvex()],
    kit: {
        prerender: {
            handleHttpError: ({ path, referrer, message }) => {
                throw new Error(message);
            }
        },
        alias: {
            "@/*": "./src/lib/*",
        },
        adapter: adapter({
            fallback: '404.html',
            pages: "build"
        }),
        paths: {
            base: process.argv.includes('dev') ? '' : (process.env.BASE_PATH ?? "")
        }
    },

    extensions: [".svelte", ".svx"]
};

export default config;
