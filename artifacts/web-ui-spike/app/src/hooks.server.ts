import type { Handle } from '@sveltejs/kit';

// Spike only: pick the theme from ?theme= so both themes are server-rendered.
export const handle: Handle = ({ event, resolve }) => {
	const theme = event.url.searchParams.get('theme') === 'light' ? 'light' : 'dark';
	return resolve(event, { transformPageChunk: ({ html }) => html.replace('%unset.theme%', theme) });
};
