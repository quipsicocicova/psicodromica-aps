import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
const base = process.env.OFFLINE_DIR ? pathToFileURL(resolve(process.env.OFFLINE_DIR) + '/').href : (process.env.TEST_URL || 'http://localhost:5176/');
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  const context = await browser.newContext({ offline: Boolean(process.env.OFFLINE_DIR), viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = [], remote = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('requestfailed', r => errors.push(r.url()));
  page.on('request', r => { if (/^https?:/.test(r.url())) remote.push(r.url()); });
  const go = file => page.goto(new URL(file, base).href);
  await go('index.html');
  assert.equal(await page.locator('.palette-picker button').count(), 4);
  await page.locator('[data-palette-choice="originale"]').click();
  assert.equal(await page.locator('html').getAttribute('data-palette'), 'originale');
  assert.equal(await page.locator('body').evaluate(e => getComputedStyle(e).backgroundColor), 'rgb(16, 25, 35)');
  assert.equal(await page.locator('#morph-line').evaluate(e => getComputedStyle(e).stroke), 'rgb(255, 133, 89)');
  assert.equal(await page.locator('.story-header .wordmark>span').evaluate(e => getComputedStyle(e).transform), 'matrix(1, 0, 0, 1, 0, -2)');
  const tracking = await page.locator('#chapter-0').evaluate(e => { const s = getComputedStyle(e); return parseFloat(s.letterSpacing) / parseFloat(s.fontSize); });
  assert.ok(Math.abs(tracking - (-.04)) < .0001, 'Only +.005em tracking on the main title');
  assert.equal(await page.locator('#chapter-5').innerText().then(t => t.replace(/\s+/g, ' ')), '... perché ciascuna possa fare domande che da sole non si sarebbero poste.');
  assert.equal(await page.locator('.closing-tagline').textContent(), 'Neuroscienze applicate: discipline in dialogo, pensiero in movimento');
  assert.equal(await page.locator('.arrival-eyebrow').textContent(), 'Discipline in dialogo, pensiero in movimento.');
  assert.equal(await page.locator('#arrival-title').evaluate(e => e.firstChild.textContent === 'Le idee' && e.firstChild.nextSibling.tagName === 'BR'), true);
  assert.deepEqual(await page.locator('#arrival-title').evaluate(e => [...e.childNodes].filter(n => n.nodeType === Node.TEXT_NODE).map(n => n.textContent)), ['Le idee', 'non vivono', 'da sole.']);
  assert.equal(await page.locator('.perspective-note').textContent(), 'perché anche le altre discipline hanno bisogno di più neuroscienze ;)');
  assert.equal(await page.locator('.path-grid>a[data-reveal="pending"]').count(), 4);
  await page.locator('.home-paths').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => [...document.querySelectorAll('.path-grid>a')].some(e => e.dataset.reveal === 'drawing'));
  assert.equal(await page.locator('.path-thread').count(), 4);
  const simpleLine = await page.locator('.path-thread path').first().getAttribute('d');
  assert.ok(await page.locator('.path-thread path').first().evaluate(e => e.getBBox().height) < 1, 'First a simple flat thread, not an existing rectangle');
  await page.waitForFunction(() => document.querySelector('.path-thread path').getBBox().height > 20);
  assert.notEqual(await page.locator('.path-thread path').first().getAttribute('d'), simpleLine, 'The path geometry really morphs; no dash-drawing of a pre-existing frame');
  await page.waitForFunction(() => [...document.querySelectorAll('.path-grid>a')].every(e => e.dataset.reveal === 'complete'));
  assert.equal(await page.locator('.path-grid h3').evaluateAll(es => es.every(e => getComputedStyle(e).opacity === '1')), true);
  assert.equal(await page.locator('.path-thread').evaluateAll(es => es.every(e => getComputedStyle(e).display === 'none')), true, 'No coloured frames remain');
  assert.equal(await page.locator('.perspective-note').evaluate(e => getComputedStyle(e).fontVariantCaps), 'all-small-caps');
  assert.equal(await page.locator('.perspective-note').evaluate(e => getComputedStyle(e).fontWeight), '700');
  // Keyboard focus reveals immediately instead of leaving an invisible link focused.
  await go('index.html');
  await page.locator('.path-grid>a').first().focus();
  assert.equal(await page.locator('.path-grid>a').first().getAttribute('data-reveal'), 'complete');
  for (const [width, height] of [[320,568], [390,844], [768,1024], [1024,768], [1440,1000]]) {
    await page.setViewportSize({ width, height });
    await go('index.html');
    await page.evaluate(() => { const s = document.querySelector('.story'); scrollTo({ top: (s.offsetHeight - s.querySelector('.story-sticky').offsetHeight) * 6 / 7, behavior: 'instant' }); });
    await page.waitForFunction(() => document.querySelector('.story').dataset.chapter === '6');
    const note = await page.locator('.perspective-note').boundingBox();
    const controls = await page.locator('.story-controls').boundingBox();
    assert.ok(note.y + note.height < controls.y, `Small note fits at ${width}`);
    if (width <= 760) {
      const drawing = await page.locator('.drawing').boundingBox();
      assert.ok(note.y + note.height < drawing.y, `Note does not collide with drawing at ${width}`);
    }
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await go('index.html');
    await page.locator('[data-chapter="7"]').click();
    for (const selector of ['#chapter-7', '.closing-tagline']) {
      const box = await page.locator(selector).boundingBox();
      assert.ok(box.x >= 0 && box.x + box.width <= width, `${selector}: reduced-motion text fits ${width}`);
    }
  }
  assert.equal(await page.locator('.path-grid>a[data-reveal="static"]').count(), 4);
  assert.equal(await page.locator('.path-thread path').evaluateAll(es => es.every(e => e.getAnimations().length === 0)), true);
  await go('about.html');
  assert.match(await page.locator('.manifesto-intro').innerText(), /Un manifesto rende espliciti/);
  assert.equal(await page.locator('.manifesto-intro sup.aps').count(), 1);
  assert.deepEqual(await page.locator('.value-copy h3').allTextContents(), ['Contaminazione', 'Curiosità', 'Rigore scientifico', 'Concretezza']);
  for (const id of ['rigore', 'concretezza']) {
    const path = page.locator(`[data-value="${id}"]`);
    assert.equal(await path.getAttribute('d'), await path.getAttribute('data-target'), 'Static final curves retain authored corners');
    assert.equal((await path.getAttribute('d')).match(/M/g).length, 1);
  }
  assert.match(await page.locator('#rigore-art').textContent(), /lente/);
  assert.match(await page.locator('#concretezza-art').textContent(), /muretto/);
  await go('iscrizione.html');
  assert.equal(await page.locator('#form-availability').count(), 0);
  assert.match(await page.locator('#form-local-hint').textContent(), /nessun dato viene ancora inviato/);
  const descriptions = await page.locator('#membership-form').getAttribute('aria-describedby');
  for (const id of descriptions.split(' ')) assert.equal(await page.locator(`#${id}`).count(), 1);
  assert.deepEqual(errors, []);
  if (process.env.OFFLINE_DIR) assert.deepEqual(remote, []);
  console.log('PASS: original navy/orange palette, subtle tracking, optical logo alignment, revised story/payoff/arrival, small note responsive, cards emerging from thread and keyboard/reduced-motion fallback, four manifesto values, lens/bricks, no warning box or broken ARIA; honest local form.');
} finally { await browser.close(); }
