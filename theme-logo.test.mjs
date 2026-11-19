import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
const base = process.env.OFFLINE_DIR ? pathToFileURL(resolve(process.env.OFFLINE_DIR) + '/').href : (process.env.TEST_URL || 'http://localhost:5176/');
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const sourceLogo = await readFile(new URL('assets/logo-psicodromica.svg', import.meta.url), 'utf8');
const originalPaths = [...sourceLogo.matchAll(/<path\b[^>]*\bd="([^"]+)"/g)].map(match => match[1]);
function contrast(a, b) {
  const luminance = color => color.match(/[\d.]+/g).slice(0, 3).map(Number).map(v => {
    v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;
  }).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
  const x = luminance(a), y = luminance(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
}
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, offline: Boolean(process.env.OFFLINE_DIR) });
  const page = await context.newPage();
  const errors = [], remote = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('requestfailed', r => errors.push(r.url()));
  page.on('request', r => { if (/^https?:/.test(r.url())) remote.push(r.url()); });
  await page.addInitScript(() => {
    window.curveMeasurements = 0;
    const original = SVGGeometryElement.prototype.getPointAtLength;
    SVGGeometryElement.prototype.getPointAtLength = function (...args) { window.curveMeasurements++; return original.apply(this, args); };
  });
  const go = file => page.goto(new URL(file, base).href);
  const jump = async i => {
    await page.evaluate(i => { const s = document.querySelector('.story'); scrollTo({ top: (s.offsetHeight - s.querySelector('.story-sticky').offsetHeight) * i / 7, behavior: 'instant' }); }, i);
    await page.waitForFunction(i => document.querySelector('.story').dataset.chapter === String(i), Math.round(i));
    await page.waitForTimeout(120);
  };
  await go('index.html');
  assert.equal(await page.locator('html').getAttribute('data-palette'), 'bosco');
  assert.equal(await page.locator('.palette-picker button').count(), 4);
  await page.waitForFunction(() => document.querySelector('.story').dataset.intro === 'complete');
  await jump(2); await page.waitForTimeout(750);
  const path = await page.locator('#morph-line').getAttribute('d');
  for (const id of ['nero', 'blu-rosso', 'originale', 'bosco']) {
    const scroll = await page.evaluate(() => scrollY);
    await page.locator(`[data-palette-choice="${id}"]`).click();
    assert.equal(await page.locator('html').getAttribute('data-palette'), id);
    assert.equal(await page.locator('.palette-picker [aria-pressed="true"]').count(), 1);
    assert.equal(await page.evaluate(() => scrollY), scroll, 'Switching colours never resets the story');
    assert.equal(await page.locator('#morph-line').getAttribute('d'), path);
    const clouds = await page.locator('.bubble-cloud').evaluateAll(nodes => nodes.map(el => getComputedStyle(el).fill));
    assert.equal(new Set(clouds).size, 3);
    const symbol = await page.locator('.bubble-symbol').first().evaluate(el => getComputedStyle(el).stroke);
    for (const fill of clouds) assert.ok(contrast(symbol, fill) >= 4.5, `${id}: cloud symbol contrast`);
    await page.screenshot({ path: `artifacts/switch-${id}-clouds.png` });
  }
  await page.locator('[data-palette-choice="nero"]').click();
  await jump(7);
  await page.waitForFunction(() => document.querySelector('.story').dataset.logoState === 'transforming');
  await page.waitForTimeout(1000);
  assert.notEqual(await page.locator('#morph-line').getAttribute('d'), path);
  // A resize during the live morph must not use the invalidated paint cache as position.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.waitForFunction(() => document.querySelector('.story').dataset.logoState === 'complete');
  assert.deepEqual(await page.locator('#story-logo path').evaluateAll(nodes => nodes.map(e => e.getAttribute('d'))), originalPaths);
  assert.equal(await page.locator('#morph-line').evaluate(e => getComputedStyle(e).opacity), '0');
  assert.equal(await page.locator('#story-logo').evaluate(e => getComputedStyle(e).opacity), '1');
  assert.equal(await page.locator('#logo-neural-reveal').getAttribute('x'), '54');
  await jump(6);
  assert.equal(await page.locator('#story-logo').evaluate(e => getComputedStyle(e).opacity), '0');
  assert.equal(await page.locator('#morph-line').evaluate(e => getComputedStyle(e).opacity), '1');
  await go('about.html');
  assert.equal(await page.locator('html').getAttribute('data-palette'), 'nero', 'Choice follows navigation');
  assert.equal(await page.locator('[data-palette-choice="nero"]').getAttribute('aria-pressed'), 'true');
  for (const id of ['bosco', 'originale', 'blu-rosso', 'nero']) {
    for (const file of ['about.html', 'tavole-rotonde.html', 'osservatorio.html', 'iscrizione.html']) {
      await go(file);
      await page.locator(`[data-palette-choice="${id}"]`).click();
      assert.equal(await page.locator('.site-symbol').count(), 1, `${file}: header symbol restored`);
      const symbolBox = await page.locator('.site-symbol').boundingBox();
      const nameBox = await page.locator('.site-brand>span').boundingBox();
      assert.ok(nameBox.x >= symbolBox.x + symbolBox.width, 'Header symbol sits beside the name, not above it');
      assert.deepEqual(await page.locator('.site-symbol path').evaluateAll(es => es.map(e => e.getAttribute('d'))), originalPaths);
      assert.equal(await page.locator('.site-symbol path').evaluateAll(es => es.every(e => getComputedStyle(e).fill === getComputedStyle(e.closest('.site-brand')).color)), true, `${id}: logo follows header ink`);
      for (const selector of ['.pill-link', '.read-label', '.form-submit button']) {
        const button = page.locator(selector).first();
        if (!await button.count()) continue;
        await button.evaluate(e => Promise.all(e.getAnimations().map(a => a.finished.catch(() => {}))));
        const pair = await button.evaluate(e => { const s = getComputedStyle(e); return [s.color, s.backgroundColor]; });
        assert.ok(contrast(...pair) >= 4.5, `${file}/${id}: ${selector} contrast`);
      }
    }
  }
  for (const width of [320, 390, 768, 1024, 1100, 1440]) {
    await page.setViewportSize({ width, height: width === 320 ? 568 : 900 });
    for (const file of ['index.html', 'about.html', 'iscrizione.html', 'osservatorio.html']) {
      await go(file);
      const menu = page.locator('.header-menu-toggle');
      if (await menu.isVisible()) await menu.click();
      const box = await page.locator('.palette-picker').boundingBox();
      assert.ok(box.x >= 0 && box.x + box.width <= width, `${file}/${width}: picker fits`);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.locator('[data-palette-choice="blu-rosso"]').click();
      assert.equal(await page.locator('html').getAttribute('data-palette'), 'blu-rosso');
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await go('index.html');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('[data-chapter="7"]').click();
  assert.equal(await page.locator('.story').getAttribute('data-logo-state'), 'complete');
  assert.equal(await page.locator('#story-logo').evaluate(e => getComputedStyle(e).opacity), '1');
  assert.equal(await page.locator('#gear-assembly').evaluate(e => e.getAnimations().length), 0);
  await page.locator('[data-chapter="6"]').click();
  assert.equal(await page.locator('#story-logo').evaluate(e => getComputedStyle(e).opacity), '0');
  assert.equal(await page.evaluate(() => window.curveMeasurements), 0);
  assert.deepEqual(errors, []);
  if (process.env.OFFLINE_DIR) assert.deepEqual(remote, []);
  const blocked = await browser.newContext();
  await blocked.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Denied', 'SecurityError'); } }));
  const denied = await blocked.newPage();
  await denied.goto(new URL('about.html', base).href);
  await denied.locator('[data-palette-choice="nero"]').click();
  assert.equal(await denied.locator('html').getAttribute('data-palette'), 'nero');
  const noJS = await browser.newContext({ javaScriptEnabled: false });
  const fallback = await noJS.newPage();
  await fallback.goto(new URL('about.html', base).href);
  assert.equal(await fallback.locator('.site-brand img').evaluate(e => e.complete && e.naturalWidth > 0), true, 'Logo remains present without JavaScript');
  console.log('PASS: one-click themes, persistence, unchanged story position, three cloud tones, contrast, original logo paths, morph/resize/reverse, responsive picker, reduced motion, blocked storage; zero runtime curve sampling/errors.');
} finally { await browser.close(); }
