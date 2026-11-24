import { readFileSync, readdirSync } from 'node:fs';
const dir = 'build/client/_app/immutable/assets/';
const sources = {
  'brand tokens.css': 'node_modules/@unset-sh/brand/dist/tokens.css',
  'brand shadcn.css': 'node_modules/@unset-sh/brand/dist/shadcn.css',
  'brand recipes.css': 'node_modules/@unset-sh/brand/dist/recipes.css',
  'brand tailwind.css': 'node_modules/@unset-sh/brand/dist/tailwind.css',
  'tailwindcss theme.css': 'node_modules/tailwindcss/theme.css',
  'tailwindcss preflight.css': 'node_modules/tailwindcss/preflight.css',
  'tailwindcss utilities (compiled JS)': 'node_modules/tailwindcss/dist/lib.js',
  'tw-animate-css': 'node_modules/tw-animate-css/dist/tw-animate.css',
  'svelte-sonner Toaster.svelte': 'node_modules/svelte-sonner/dist/Toaster.svelte',
  'app src/app.css': 'src/app.css',
};
const text = Object.fromEntries(Object.entries(sources).map(([k, p]) => [k, readFileSync(p, 'utf8').toLowerCase()]));
const re = /#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)|oklch\([^)]*\)/gi;
for (const f of readdirSync(dir).filter((f) => f.endsWith('.css'))) {
  const css = readFileSync(dir + f, 'utf8').toLowerCase();
  const lits = [...new Set(css.match(re) ?? [])];
  const by = {};
  for (const l of lits) { const k = Object.keys(text).filter((s) => text[s].includes(l)); const key = k.length ? k.join(' + ') : 'UNATTRIBUTED (minifier form)'; (by[key] ??= []).push(l); }
  console.log(`\n${f}: ${lits.length} distinct literals`); for (const [k, v] of Object.entries(by)) console.log(`  ${k}: ${v.length} → ${v.slice(0, 12).join(' ')}${v.length > 12 ? ' …' : ''}`);
  const fonts = [...new Set(css.match(/font-family:[^;}]*/g) ?? [])]; console.log('  font-family:', fonts);
}
