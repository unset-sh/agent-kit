// Stands in for mode-watcher, which the upstream Sonner wrapper imports for
// `mode.current`. brand's `data-theme` on <html> is the only theme source:
// mode-watcher would also write `color-scheme` and `data-theme` on <html> and
// inject a <style> element, which conflicts with brand and the CSP.
type Mode = 'light' | 'dark';

const read = (): Mode => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');

let current = $state<Mode | undefined>(undefined);

if (typeof document !== 'undefined') {
	current = read();
	new MutationObserver(() => (current = read())).observe(document.documentElement, {
		attributes: true,
		attributeFilter: ['data-theme']
	});
}

export const mode = {
	get current() {
		return current;
	}
};
