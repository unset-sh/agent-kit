import { chromium } from 'playwright';
const b = await chromium.launch(); const p = await b.newPage(); const reqs = new Set();
p.on('request', (r) => reqs.add(new URL(r.url()).origin + ' ' + r.resourceType() + ' ' + new URL(r.url()).pathname.split('/').pop()));
await p.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
console.log(await p.evaluate(async () => { await document.fonts.ready; return [...document.fonts].map((f) => `${f.family} ${f.status}`); }));
console.log([...reqs].filter((r) => r.includes('font') || !r.startsWith('http://localhost:4173')));
await b.close();
