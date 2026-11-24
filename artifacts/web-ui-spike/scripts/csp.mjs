import { chromium } from 'playwright';
const base = process.argv[2] ?? 'http://localhost:4173/';
const out = process.env.SHOTS ?? 'shots';
const browser = await chromium.launch();
const results = {};
for (const theme of ['dark', 'light']) {
  const page = await browser.newPage({ viewport: { width: 900, height: 1100 } });
  const violations = [];
  page.on('console', (m) => { if (/Content Security Policy|CSP/i.test(m.text())) violations.push(m.text()); });
  page.on('pageerror', (e) => violations.push('pageerror: ' + e.message));
  await page.exposeBinding('__csp', (_s, v) => violations.push(v));
  await page.addInitScript(() => document.addEventListener('securitypolicyviolation', (e) =>
    window.__csp(`EVENT ${e.effectiveDirective} blocked=${e.blockedURI} sample=${(e.sample||'').slice(0,80)} src=${e.sourceFile}:${e.lineNumber}`)));
  const step = async (name, fn) => { const before = violations.length; await fn(); await page.waitForTimeout(400);
    await page.screenshot({ path: `${out}/${theme}-${name}.png` }); results[`${theme}/${name}`] = violations.slice(before); };
  await step('load', () => page.goto(base + '?theme=' + theme, { waitUntil: 'networkidle' }));
  await step('focus-button', async () => { await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); });
  await step('hover-button', () => page.hover('#buttons button:nth-child(1)'));
  await step('focus-input', () => page.focus('#plain'));
  await step('focus-invalid', () => page.focus('#invalid'));
  await step('form-error', async () => { await page.fill('#handle', 'x'); await page.click('#signin button[type=submit]'); await page.waitForSelector('[data-slot=field-error]'); });
  await step('tooltip', async () => { await page.hover('#tooltip-trigger'); await page.waitForSelector('[data-slot=tooltip-content]'); });
  await step('menu', async () => { await page.click('#menu-trigger'); await page.waitForSelector('[data-slot=dropdown-menu-content]'); await page.keyboard.press('ArrowDown'); });
  await step('menu-closed', () => page.keyboard.press('Escape'));
  await step('dialog', async () => { await page.click('#dialog-trigger'); await page.waitForSelector('[data-slot=dialog-content]'); });
  // focus trap: tab many times, check focus stays in dialog
  const trapped = [];
  for (let i = 0; i < 6; i++) { await page.keyboard.press('Tab'); trapped.push(await page.evaluate(() => !!document.activeElement?.closest('[data-slot=dialog-content]'))); }
  await step('dialog-closed', () => page.keyboard.press('Escape'));
  const restored = await page.evaluate(() => document.activeElement?.id);
  await step('toast', async () => { await page.click('#toast'); await page.waitForSelector('[data-sonner-toast]'); });
  await step('toggle-theme', () => page.click('#theme'));
  results[`${theme}/focus-trap`] = { trapped, restoredTo: restored };
  results[`${theme}/inlineStyleAttrs`] = await page.evaluate(() => [...document.querySelectorAll('[style]')].map(e => `${e.tagName.toLowerCase()}[${e.dataset.slot ?? e.getAttribute('data-sonner-toaster') ?? ''}] ${e.getAttribute('style').slice(0,90)}`));
  results[`${theme}/styleElements`] = await page.evaluate(() => [...document.querySelectorAll('style')].map(s => (s.nonce ? 'nonce ' : 'NO-NONCE ') + s.textContent.slice(0, 80)));
  await page.close();
}
console.log(JSON.stringify(results, null, 1));
await browser.close();
