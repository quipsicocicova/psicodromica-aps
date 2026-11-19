import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => {
    window.curveMeasurements = 0;
    const original = SVGGeometryElement.prototype.getPointAtLength;
    SVGGeometryElement.prototype.getPointAtLength = function (...args) { window.curveMeasurements++; return original.apply(this, args); };
  });
  await page.goto(process.env.TEST_URL || 'http://localhost:5176/');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => document.querySelector('.story').dataset.intro === 'complete');
  const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  async function jump(i) {
    await page.evaluate(i => { const s = document.querySelector('.story'); scrollTo({ top: s.offsetTop + (s.offsetHeight - s.querySelector('.story-sticky').offsetHeight) * i / 7, behavior: 'instant' }); }, i);
    await page.waitForFunction(i => document.querySelector('.story').dataset.chapter === String(i), i);
    await settle();
    if (i === 7) await page.waitForFunction(() => document.querySelector('.story').dataset.logoState === 'complete');
  }
  const copyBottom = () => page.locator('.scene.is-current .scene-content').evaluate(e => [...e.children].filter(e => e.getClientRects().length).at(-1).getBoundingClientRect().bottom);
  for (const [width, height] of [[390,844],[320,568],[360,640],[375,667],[375,812],[430,932],[760,900]]) {
    await page.setViewportSize({ width, height }); await settle();
    for (let i = 0; i < 8; i++) {
      await jump(i);
      let art = await page.locator(i === 7 ? '#story-logo' : '#morph-line').boundingBox();
      if (i === 2) {
        const bubbles = await page.locator('#discipline-bubbles').boundingBox();
        const bottom = Math.max(art.y + art.height, bubbles.y + bubbles.height);
        const right = Math.max(art.x + art.width, bubbles.x + bubbles.width);
        art = { x: Math.min(art.x, bubbles.x), y: Math.min(art.y, bubbles.y), width: right - Math.min(art.x, bubbles.x), height: bottom - Math.min(art.y, bubbles.y) };
      }
      const gap = art.y - await copyBottom();
      const controls = await page.locator('.story-controls').boundingBox();
      assert.ok(gap >= 10 && gap <= 72, `${width}×${height}, chapter ${i}: text→art gap ${gap.toFixed(1)}px`);
      assert.ok(art.y + art.height < controls.y - 8, `${width}, chapter ${i}: illustration clears the controls`);
      assert.ok(art.x >= 0 && art.x + art.width <= width + 1, `${width}, chapter ${i}: full figure remains on screen`);
      if (i === 0) {
        // A wide tablet's single column is height-limited, unlike a phone.
        const minimum = width > 600 ? .5 : height <= 740 ? .6 : .7;
        console.log(`Mobile ${width}×${height}: brain ${Math.round(art.width)}px; text→drawing gap ${Math.round(gap)}px`);
        assert.ok(art.width >= width * minimum, `${width}×${height}: the brain must be prominent, not tiny below the copy`);
      }
      if (width === 390 && [0,1,2,4,6,7].includes(i)) {
        if (i === 2) await page.locator('#discipline-bubbles').evaluate(e => Promise.all(e.getAnimations({ subtree: true }).map(a => a.finished)));
        await page.screenshot({ path: `artifacts/mobile-story-${i}.png` });
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
  }
  // Resizing back must restore the exact desktop SVG framing and drawing area.
  await page.setViewportSize({ width: 1440, height: 1000 }); await settle(); await jump(0);
  assert.equal(await page.locator('#line-art').getAttribute('viewBox'), '0 0 760 640');
  assert.equal(await page.locator('#line-art').getAttribute('preserveAspectRatio'), 'xMidYMid meet');
  const desktop = await page.locator('.drawing').boundingBox();
  assert.ok(Math.abs(desktop.width - 1440 * .51) < 1);
  assert.equal(desktop.y, 155);
  assert.equal(await page.locator('.story').evaluate(e => e.style.getPropertyValue('--mobile-art-top')), '');
  // Static/reduced-motion chapters use their own actual copy height as well.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' }); await settle();
  for (const i of [0,1,2,4,6,7]) {
    await page.locator(`button[data-chapter="${i}"]`).click(); await settle();
    const frame = await page.locator('.drawing').boundingBox();
    assert.ok(frame.y >= await copyBottom() + 10, `Static chapter ${i} follows its own copy`);
    assert.ok(frame.y + frame.height < (await page.locator('.story-controls').boundingBox()).y);
  }
  assert.equal(await page.evaluate(() => curveMeasurements), 0, 'Reframing must not introduce SVG curve sampling');
  assert.deepEqual(errors, []);
  console.log('PASS: larger mobile story art directly below copy, eight chapters/seven viewports, clouds/logo visible, controls clear, unchanged desktop framing, reduced-motion layout, zero runtime curve sampling/errors.');
} finally { await browser.close(); }
