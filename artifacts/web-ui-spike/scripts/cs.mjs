import { chromium } from 'playwright';
const b = await chromium.launch();
for (const scheme of ['light', 'dark']) for (const theme of ['light', 'dark']) {
  const p = await b.newPage({ colorScheme: scheme });
  await p.goto('http://localhost:4173/?theme=' + theme, { waitUntil: 'networkidle' }); await p.waitForTimeout(300);
  const a = await p.evaluate(() => [document.documentElement.dataset.theme, document.documentElement.style.colorScheme, getComputedStyle(document.documentElement).colorScheme, document.documentElement.className, localStorage.getItem('mode-watcher-mode'), document.querySelector('[data-sonner-toaster]')?.dataset.sonnerTheme]);
  await p.click('#theme'); await p.waitForTimeout(300);
  const c = await p.evaluate(() => [document.documentElement.dataset.theme, getComputedStyle(document.documentElement).colorScheme, document.querySelector('[data-sonner-toaster]')?.dataset.sonnerTheme]);
  console.log(`os=${scheme} server=${theme}`, a, '→ toggled', c); await p.close();
}
await b.close();
