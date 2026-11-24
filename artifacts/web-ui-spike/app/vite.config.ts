import { sveltekit } from '@sveltejs/kit/vite';
import adapter from '@sveltejs/adapter-node';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const brandIcons = fileURLToPath(new URL('./node_modules/@unset-sh/brand/icons/tabler', import.meta.url));

export default defineConfig({
	// tw-animate-css exports only a "style" condition; an externalised SSR import
	// resolves with Node conditions and fails, so bundle it in the SSR build.
	ssr: { noExternal: ['tw-animate-css'] },
	plugins: [
		tailwindcss(),
		sveltekit({
			adapter: adapter(),
			alias: {
				// shadcn-svelte files import $lib, which SvelteKit 3 removed (#lib replaces it).
				'$lib': 'src/lib',
				'$brand-icons': brandIcons,
				// brand's data-theme drives the theme; see src/lib/theme/mode.svelte.ts.
				'mode-watcher': 'src/lib/theme/mode.svelte.ts'
			},
			csp: {
				mode: 'nonce',
				directives: {
					'default-src': ['self'],
					'script-src': ['self'],
					'style-src': ['self'],
					'img-src': ['self', 'data:'],
					'font-src': ['self'],
					'connect-src': ['self'],
					'object-src': ['none'],
					'base-uri': ['self'],
					'form-action': ['self'],
					'frame-ancestors': ['none']
				}
			}
		})
	]
});
