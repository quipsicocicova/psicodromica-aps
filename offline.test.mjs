import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
assert.ok(process.env.OFFLINE_DIR, 'Set OFFLINE_DIR to the folder extracted from the ZIP (containing index.html).');
const base = pathToFileURL(resolve(process.env.OFFLINE_DIR) + '/').href;
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  const context = await browser.newContext({ offline: true, viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = [], remote = [], failed = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => { if (/^https?:/.test(r.url())) remote.push(r.url()); });
  page.on('requestfailed', r => failed.push(r.url()));
  await page.goto(base + 'index.html');
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.evaluate(() => document.fonts.check('16px Raleway')), true);
  await page.waitForFunction(() => document.querySelector('.story').dataset.intro === 'complete');
  assert.ok(await page.locator('#morph-line').evaluate(e => e.getTotalLength()) > 3500);
  for (const i of [1, 2, 3, 4, 7]) {
    await page.evaluate(i => { const s = document.querySelector('.story'); scrollTo({ top: (s.offsetHeight - s.querySelector('.story-sticky').offsetHeight) * i / 7, behavior: 'instant' }); }, i);
    await page.waitForTimeout(180);
    assert.equal(await page.locator('.story').getAttribute('data-chapter'), String(i));
    if (i === 1) assert.ok(await page.locator('#eye-detail').evaluate(e => Number(getComputedStyle(e).opacity)) > .99);
    if (i === 2) {
      assert.equal(await page.locator('.bubble-cloud').count(), 3);
      assert.equal(await page.locator('#discipline-bubbles').textContent(), 'Ψ');
    }
    if (i === 4) assert.ok(await page.locator('#morph-line').evaluate(e => e.getBBox().width) < 360);
    if (i === 7) {
      await page.waitForFunction(() => [...document.querySelectorAll('.gear-spark')].some(e => Number(getComputedStyle(e).opacity) > .2));
      await page.waitForFunction(() => document.querySelector('.story').dataset.logoState === 'complete');
      assert.equal(await page.locator('#story-logo path').count(), 2);
    }
    if (i === 3) {
      await page.waitForFunction(() => document.querySelector('#city-windows').dataset.state === 'lit');
      const city = await page.locator('#city-windows').evaluate(e => ({ opacity: Number(getComputedStyle(e).opacity), lit: Number(e.dataset.lit), all: e.children.length }));
      assert.ok(city.opacity > .99); assert.equal(city.lit, city.all);
    }
  }
  await page.locator('.skip-story').click();
  await page.waitForFunction(() => document.querySelector('[data-header-action]').textContent === 'Rivedi il racconto');
  await page.locator('.header-nav a[href="about.html"]').click();
  assert.ok(page.url().endsWith('about.html'));
  assert.equal(await page.locator('.about-initiatives a').count(), 2);
  assert.equal(await page.locator('main > section:last-child .contact-action').getAttribute('href'), 'iscrizione.html');
  await page.locator('.about-initiatives').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'artifacts/about-two-initiatives.png' });
  for (const file of ['tavole-rotonde.html', 'osservatorio.html', 'iscrizione.html', 'parole.html', 'ricerca.html', 'confini.html', 'il-filo-animato.html']) {
    await page.goto(base + file);
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('footer .footer-description').count(), 1);
    if (file === 'iscrizione.html') assert.equal(await page.locator('#signup-title em').textContent(), 'tu');
    if (file !== 'il-filo-animato.html') assert.equal(await page.locator('.site-symbol').count(), 1, 'Internal logo is available offline');
    if (file === 'tavole-rotonde.html') {
      await page.waitForFunction(() => document.querySelector('.animated-table').dataset.formation === '1');
      const canonical = await page.evaluate(() => PSICODROMICA_GEOMETRY.narrative[5].map(([x,y],i) => `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' '));
      assert.equal(await page.locator('.table-thread').getAttribute('d'), canonical);
    }
    assert.equal(await page.evaluate(() => [...document.images].every(i => i.complete && i.naturalWidth > 0)), true);
    assert.equal(await page.evaluate(() => document.fonts.check('16px Raleway')), true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + 'index.html#associazione');
  await page.locator('footer').scrollIntoViewIfNeeded();
  await page.waitForTimeout(350);
  await page.screenshot({ path: 'artifacts/updated-mobile-footer.png' });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390);
  assert.deepEqual(errors, []); assert.deepEqual(remote, []); assert.deepEqual(failed, []);
  console.log('PASS: extracted ZIP via file://, offline mode enabled, 9 routes, layers, header and navigation, About links, local images/fonts/assets, mobile footer; zero remote requests, failed requests or JS errors.');
} finally { await browser.close(); }
