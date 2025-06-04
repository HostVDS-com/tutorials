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
        }
    },

    kit: {
        alias: {
            "@/*": "./src/lib/*",
        },
        adapter: adapter()
    },

    extensions: [".svelte", ".svx"]
};

export default config;
