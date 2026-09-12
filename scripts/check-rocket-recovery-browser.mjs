import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.PLAYWRIGHT_PACKAGE ||
    'C:/Users/tekke/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
);
await mkdir('work/rocket-recovery/qa', { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ||
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: [
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--autoplay-policy=no-user-gesture-required',
  ],
});
const page = await browser.newPage({
  viewport: { width: 1600, height: 1100 },
  deviceScaleFactor: 1,
});
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
try {
  await page.goto('http://localhost:3000/rocket-recovery');
  await page
    .getByRole('button', { name: 'Run recovery', exact: true })
    .waitFor();
  await page.waitForFunction(
    () => !document.querySelector('.rr-run')?.disabled,
  );
  await page.screenshot({
    path: 'work/rocket-recovery/qa/desktop.png',
    fullPage: true,
  });
  await page
    .locator('.rr-canvas canvas')
    .first()
    .screenshot({ path: 'work/rocket-recovery/qa/scene.png' });
  await page.getByRole('button', { name: 'Run recovery', exact: true }).click();
  await page.waitForFunction(
    () =>
      document
        .querySelector('.rr-result')
        ?.textContent.includes('Booster caught'),
    {},
    { timeout: 30000 },
  );
  await page.screenshot({
    path: 'work/rocket-recovery/qa/caught.png',
    fullPage: true,
  });
  await page
    .getByRole('button', { name: 'Falcon 9 Leg landing', exact: true })
    .click();
  await page.getByRole('tab', { name: /Legs & catch/ }).click();
  await page.screenshot({
    path: 'work/rocket-recovery/qa/legs.png',
    fullPage: true,
  });
  await page
    .getByRole('slider', { name: 'Landing leg deployment', exact: true })
    .fill('0');
  await page
    .getByRole('slider', { name: 'Landing leg deployment', exact: true })
    .fill('100');
  await page.getByRole('tab', { name: /Thrust & steering/ }).click();
  await page
    .getByRole('slider', { name: 'Separate engine assembly', exact: true })
    .fill('55');
  await page.screenshot({
    path: 'work/rocket-recovery/qa/engines.png',
    fullPage: true,
  });
  await page.getByRole('tab', { name: /Grid fins/ }).click();
  await page.getByRole('slider', { name: 'Fin angle', exact: true }).fill('23');
  await page.screenshot({
    path: 'work/rocket-recovery/qa/fins.png',
    fullPage: true,
  });
  await page.getByRole('tab', { name: /Earth & sites/ }).click();
  await page.screenshot({
    path: 'work/rocket-recovery/qa/earth.png',
    fullPage: true,
  });
  await page.getByRole('tab', { name: /Recovery/ }).click();
  await page.getByRole('checkbox', { name: 'Automatic ignition' }).uncheck();
  await page
    .getByRole('slider', { name: 'Ignition altitude', exact: true })
    .fill('25');
  await page.getByRole('button', { name: 'Run recovery', exact: true }).click();
  await page.waitForFunction(
    () => document.querySelector('.rr-result.failure'),
    {},
    { timeout: 20000 },
  );
  await page.screenshot({
    path: 'work/rocket-recovery/qa/failed-landing.png',
    fullPage: true,
  });
  await page.getByRole('button', { name: /Watch the 60s Short/ }).click();
  await page.getByRole('button', { name: 'Pause Short', exact: true }).click();
  for (const [time, name] of [
    [2, 'hook'],
    [16, 'fins'],
    [24, 'engines'],
    [34, 'legs'],
    [44, 'catch'],
    [58, 'outro'],
  ]) {
    await page
      .getByRole('slider', { name: 'Short timeline', exact: true })
      .fill(String(time));
    await page.screenshot({
      path: 'work/rocket-recovery/qa/short-' + name + '.png',
      fullPage: true,
    });
  }
  await page.getByRole('button', { name: 'Exit Short', exact: true }).click();
  await page.getByRole('button', { name: 'Record Short', exact: true }).click();
  await page.waitForFunction(() =>
    document.querySelector('.rr-transport')?.textContent.includes('0:05'),
  );
  await page
    .getByRole('button', { name: 'Stop recording', exact: true })
    .click();
  const link = page.getByRole('link', {
    name: 'Download your recording',
    exact: true,
  });
  await link.waitFor();
  const downloadPromise = page.waitForEvent('download');
  await link.click();
  const downloaded = await downloadPromise;
  await downloaded.saveAs(
    resolve(
      'work/rocket-recovery/qa/recording-check.' +
        (downloaded.suggestedFilename().endsWith('.mp4') ? 'mp4' : 'webm'),
    ),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://localhost:3000/rocket-recovery');
  await page.waitForFunction(
    () => !document.querySelector('.rr-run')?.disabled,
  );
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    ),
    false,
    'Mobile horizontal overflow',
  );
  await page.screenshot({
    path: 'work/rocket-recovery/qa/mobile.png',
    fullPage: true,
  });
  const fatal = errors.filter(
    (e) => !e.includes('favicon') && !e.includes('ERR_CONNECTION_CLOSED'),
  );
  await writeFile(
    'work/rocket-recovery/qa/browser-results.json',
    JSON.stringify(
      {
        errors: fatal,
        checks: [
          'Desktop model',
          'Automatic catch',
          'Leg controls',
          'Engine separation',
          'Fin steering',
          'Late ignition failure',
          'Six portrait shots',
          'Recording/download',
          'Mobile overflow',
        ],
      },
      null,
      2,
    ),
  );
  assert.deepEqual(fatal, []);
  console.log(
    'Browser checks passed: controls, landing outcomes, six portrait shots, recording and mobile layout.',
  );
} catch (error) {
  await page
    .screenshot({
      path: 'work/rocket-recovery/qa/failure-state.png',
      fullPage: true,
    })
    .catch(() => {});
  console.error(
    JSON.stringify({
      errors,
      notice: await page
        .locator('.rr-notice')
        .textContent()
        .catch(() => null),
    }),
  );
  throw error;
} finally {
  await browser.close();
}
