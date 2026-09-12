import { createRequire } from 'node:module';
import { resolve } from 'node:path';
const require = createRequire(import.meta.url),
  { chromium } = require(
    process.env.PLAYWRIGHT_PACKAGE ||
      'C:/Users/tekke/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
  );
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ||
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
try {
  const page = await browser.newPage({
    viewport: { width: 1400, height: 1000 },
  });
  page.on('pageerror', (e) => console.error(e.message));

  await page.goto('http://localhost:3000/rocket-recovery');
  await page.waitForFunction(
    () => !document.querySelector('.rr-run')?.disabled,
  );
  await page.getByRole('button', { name: 'Record Short', exact: true }).click();
  await page.waitForFunction(
    () => document.querySelector('.rr-transport')?.textContent.includes('0:03'),
    {},
    { timeout: 45000 },
  );
  await page
    .getByRole('button', { name: 'Stop recording', exact: true })
    .click();
  await page.screenshot({
    path: 'work/rocket-recovery/qa/recording-stop.png',
    fullPage: true,
  });
  const link = page.getByRole('link', {
    name: 'Download your recording',
    exact: true,
  });
  await link.waitFor({ timeout: 15000 });
  const promise = page.waitForEvent('download');
  await link.click();
  const download = await promise;
  await download.saveAs(
    resolve('work/rocket-recovery/qa/' + download.suggestedFilename()),
  );
  console.log('Recording verified: ' + download.suggestedFilename());
} finally {
  await browser.close();
}
