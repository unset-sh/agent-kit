import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const resolved = JSON.parse(readFileSync(process.env.BRAND_RESOLVED ?? 'node_modules/@unset-sh/brand/dist/resolved.json'));
const base = process.argv[2] ?? 'http://localhost:4173/';
const hex = (h) => { h = h.replace('#', ''); if (h.length === 3) h = [...h].map((c) => c + c).join(''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
function parse(c) { // rgb()/rgba()/color(srgb ..)/oklab etc → [r,g,b,a] 0-255
  let m = c.match(/rgba?\(([^)]+)\)/); if (m) { const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] ?? 1]; }
  m = c.match(/color\(srgb ([^)]+)\)/); if (m) { const p = m[1].split(/[ /]+/).filter(Boolean).map(Number); return [p[0] * 255, p[1] * 255, p[2] * 255, p[3] ?? 1]; }
  return null; }
const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return +((x + 0.05) / (y + 0.05)).toFixed(2); };
const over = (fg, bg) => [0, 1, 2].map((i) => fg[i] * fg[3] + bg[i] * (1 - fg[3]));
function tokens(theme, rgb) { if (!rgb) return ''; if (rgb[3] === 0) return 'transparent';
  const names = Object.entries(resolved.themes[theme]).filter(([k, v]) => k.startsWith('palette.') && /^#/.test(v) && hex(v).every((n, i) => Math.abs(n - rgb[i]) < 2)).map(([k]) => k.slice(8));
  return (names.length ? names.join('|') : 'mix') + (rgb[3] < 1 ? ` @${(+rgb[3]).toFixed(2)}` : ''); }
const browser = await chromium.launch();
const rows = [];
for (const theme of ['dark', 'light']) {
  const page = await browser.newPage({ viewport: { width: 900, height: 1100 } });
  await page.goto(base + '?theme=' + theme, { waitUntil: 'networkidle' });
  const read = async (sel, state) => {
    const d = await page.evaluate((sel) => { const e = document.querySelector(sel); const s = getComputedStyle(e);
      // effective background: walk up until opaque
      const bgs = []; for (let n = e; n; n = n.parentElement) { const b = getComputedStyle(n).backgroundColor; bgs.push(b); }
      const cv = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
      const norm = (c) => { if (!c || c === 'none') return null; cv.clearRect(0, 0, 1, 1); cv.fillStyle = '#000'; cv.fillStyle = c; cv.fillRect(0, 0, 1, 1); const d = cv.getImageData(0, 0, 1, 1).data; return `rgba(${d[0]}, ${d[1]}, ${d[2]}, ${(d[3] / 255).toFixed(3)})`; };
      const parts = s.boxShadow === 'none' ? [] : s.boxShadow.split(/,(?![^(]*\))/).map((x) => { const col = x.match(/(rgba?\([^)]+\)|color\([^)]+\)|oklab\([^)]+\)|oklch\([^)]+\))/)?.[0]; const nums = x.replace(col, '').trim().split(/\s+/).map(parseFloat); return { col: norm(col), spread: nums[3] || 0 }; });
      const ring = parts.filter((p) => p.spread > 0).sort((a, b) => b.spread - a.spread)[0];
      return { color: norm(s.color), bg: norm(s.backgroundColor), border: norm(s.borderTopColor), ring: ring?.col, ringSpread: ring?.spread, outline: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0 ? norm(s.outlineColor) : null, outlineW: s.outlineWidth, opacity: s.opacity, bgs: bgs.map(norm), font: s.fontFamily.split(',')[0] }; }, sel);
    const fg = parse(d.color); let eff = [0, 0, 0, 0]; let solid = null;
    for (const b of d.bgs.map(parse).reverse()) { if (!b) continue; solid = solid ? over(b, solid) : (b[3] === 1 ? b.slice(0, 3) : null); }
    const bgRGB = solid ?? hex(resolved.themes[theme]['color.ground']);
    const ring = d.outline ? parse(d.outline) : d.ring ? parse(d.ring) : null; if (d.outline) d.ringSpread = 'outline ' + d.outlineW;
    rows.push({ theme, state, fg: tokens(theme, fg), bg: tokens(theme, parse(d.bg)), border: tokens(theme, parse(d.border)),
      ring: ring ? tokens(theme, ring) + ` ${d.ringSpread}` : '-', textContrast: ratio(over(fg, bgRGB), bgRGB) + (d.opacity !== '1' ? ` (opacity ${d.opacity})` : ''), ringContrast: ring ? ratio(over(ring, bgRGB), bgRGB) : '-', font: d.font });
  };
  for (const [i, v] of ['default', 'secondary', 'outline', 'ghost', 'destructive', 'link', 'disabled'].entries()) await read(`#buttons button:nth-child(${i + 1})`, `button ${v}`);
  await page.hover('#buttons button:nth-child(1)'); await page.waitForTimeout(250); await read('#buttons button:nth-child(1)', 'button default :hover');
  await page.hover('#buttons button:nth-child(3)'); await page.waitForTimeout(250); await read('#buttons button:nth-child(3)', 'button outline :hover');
  await page.mouse.move(0, 0);
  await page.focus('#theme'); await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab'); await page.waitForTimeout(250); await read('#theme', 'button outline :focus-visible');
  await read('#plain', 'input'); await read('#disabled', 'input disabled'); await read('#invalid', 'input aria-invalid');
  await page.click('#plain'); await page.waitForTimeout(250); await read('#plain', 'input :focus-visible');
  await read('#card [data-slot=card-title]', 'card title'); await read('#card [data-slot=card-description]', 'card description');
  await page.fill('#handle', 'x'); await page.click('#signin button[type=submit]'); await page.waitForSelector('[data-slot=field-error]');
  await read('[data-slot=field-error]', 'field error text'); await read('[data-slot=field-label]', 'field label invalid'); await read('[data-slot=field-description]', 'field description');
  await page.hover('#tooltip-trigger'); await page.waitForSelector('[data-slot=tooltip-content]'); await page.waitForTimeout(300); await read('[data-slot=tooltip-content]', 'tooltip open');
  await page.mouse.move(0, 0); await page.waitForTimeout(300);
  await page.click('#menu-trigger'); await page.waitForSelector('[data-slot=dropdown-menu-content]'); await page.waitForTimeout(300);
  await read('[data-slot=dropdown-menu-content]', 'menu open'); await page.keyboard.press('ArrowDown'); await page.waitForTimeout(100);
  await read('[data-slot=dropdown-menu-item][data-highlighted]', 'menu item highlighted');
  await read('[data-slot=dropdown-menu-item][data-disabled]', 'menu item disabled'); await read('[data-slot=dropdown-menu-item][data-variant=destructive]', 'menu item destructive');
  await page.keyboard.press('Escape');
  await page.click('#dialog-trigger'); await page.waitForSelector('[data-slot=dialog-content]'); await page.waitForTimeout(300);
  await read('[data-slot=dialog-content]', 'dialog open'); await read('[data-slot=dialog-description]', 'dialog description'); await read('[data-slot=dialog-overlay]', 'dialog overlay');
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  await page.click('#toast'); await page.waitForSelector('[data-sonner-toast]'); await page.waitForTimeout(500);
  await read('[data-sonner-toast]', 'toast'); await read('[data-sonner-toast] [data-description]', 'toast description');
  rows.push({ theme, state: 'html color-scheme', fg: await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme) });
  await page.close();
}
await browser.close();
console.log('| theme | state | text | background | border | ring | text contrast | ring contrast | font |');
console.log('|---|---|---|---|---|---|---|---|---|');
for (const r of rows) console.log(`| ${r.theme} | ${r.state} | ${r.fg ?? ''} | ${r.bg ?? ''} | ${r.border ?? ''} | ${r.ring ?? ''} | ${r.textContrast ?? ''} | ${r.ringContrast ?? ''} | ${r.font ?? ''} |`);
