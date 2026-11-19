import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const url = process.env.TEST_URL || 'http://localhost:5176';
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => document.querySelector('.story').dataset.intro === 'complete');
  await mkdir('artifacts', { recursive: true });
  const chapter = () => page.locator('.story').getAttribute('data-chapter');
  const jump = async (index) => {
    await page.evaluate(index => { const story = document.querySelector('.story'); window.scrollTo({ top: (story.offsetHeight - document.querySelector('.story-sticky').offsetHeight) * index / 7, behavior: 'instant' }); }, index);
    await page.waitForFunction(index => document.querySelector('.story').dataset.chapter === String(index), index);
    await page.waitForTimeout(100);
  };
  const expectedHeadings = [
    'Da dove si comincia a parlare di salute mentale?',
    'Le neuroscienze hanno bisogno di allargare lo sguardo.',
    'Alle persone. Alle relazioni.',
    'Alle condizioni in cui la vita prende forma.',
    'Mettiamo allo stesso tavolo discipline diverse...',
    '... perché ciascuna possa fare domande che da sole non si sarebbero poste.',
    'Creando l’incastro perfetto tra tante prospettive diverse.',
    'Psicodromica.'
  ];
  const shapes = [];
  for (let i = 0; i < 8; i++) {
    await jump(i);
    assert.equal(await chapter(), String(i));
    assert.equal((await page.locator(`#chapter-${i}`).innerText()).replace(/APS/g, '').replace(/\s+/g, ' ').trim(), expectedHeadings[i]);
    assert.equal(await page.locator('.scene:not([inert])').count(), 1);
    assert.equal(await page.locator('[aria-current="step"]').count(), 1);
    if (i === 7) await page.waitForFunction(() => document.querySelector('.story').dataset.logoState === 'complete');
    shapes.push(await page.locator('#morph-line').getAttribute('d'));
    await page.screenshot({ path: `artifacts/chapter-${i + 1}.png` });
  }
  assert.equal(new Set(shapes).size, 8, 'The eighth outline is the original logo half-gear, not a second identical gear');
  assert.notEqual(shapes[6], shapes[7]);
  assert.equal(await page.locator('#story-logo').evaluate(el => getComputedStyle(el).opacity), '1');
  assert.equal(await page.locator('#morph-line').evaluate(el => getComputedStyle(el).opacity), '0');
  await page.waitForFunction(() => document.querySelector('.story').dataset.gearMotion === 'stopped');
  const stoppedTransform = await page.locator('#gear-assembly').evaluate(el => getComputedStyle(el).transform);
  await page.waitForTimeout(250);
  assert.equal(await page.locator('#gear-assembly').evaluate(el => getComputedStyle(el).transform), stoppedTransform, 'Gear must stop after the closing acceleration');
  for (const index of [4, 6]) {
    const coordinates = shapes[index].match(/-?\d+(?:\.\d+)?/g).map(Number);
    const radii = [];
    for (let j = 0; j < coordinates.length; j += 2) radii.push(Math.hypot(coordinates[j] - 384, coordinates[j + 1] - 318));
    assert.ok(Math.min(...radii) > 144, 'No artificial line may cut from the outer contour to the central bore');
  }
  assert.equal(await page.locator('#chapter-7 sup.aps').count(), 1);
  assert.equal(await page.locator('#morph-line').count(), 1);
  assert.equal((await page.locator('.closing-tagline').innerText()).replace(/\s+/g, ' ').trim(), 'Neuroscienze applicate: discipline in dialogo, pensiero in movimento');
  for (const shape of shapes) {
    assert.equal((shape.match(/M/g) || []).length, 1, 'The illustration must be one continuous stroke');
    assert.equal((shape.match(/L/g) || []).length, 1599, 'The same 1600 points persist across every transformation');
  }
  assert.equal(await page.locator('.discipline-bubble').count(), 3, 'Three separate-layer discipline bubbles accompany the three people');
  await jump(0);
  assert.deepEqual(await page.locator('[data-brain-phrase]').evaluateAll(nodes => nodes.map(el => Number(getComputedStyle(el).opacity) > .99)), [true, true], 'Both brain phrases are visible immediately');
  assert.ok(await page.locator('#morph-line').evaluate(el => el.getTotalLength()) > 3500, 'The brain must retain the broad interwoven folds of the reference');
  assert.equal(await page.locator('.story-topline').innerText().then(t => t.replace(/\s+/g, ' ').trim()), '01 / 08');
  assert.deepEqual(await page.locator('.chapter-label').allTextContents().then(labels => labels.slice(0, 6)), ['01 / la mente', '02 / lo sguardo', '03 / la rete', '04 / i contesti', '05 / il confronto', '06 / l’intreccio']);
  await jump(1);
  assert.equal(await page.locator('#morph-line').getAttribute('d'), shapes[1], 'Morph must be reversible');
  await page.locator('[data-chapter="2"]').click();
  await page.waitForFunction(() => document.querySelector('.story').dataset.chapter === '2');
  await page.waitForTimeout(1100);
  await page.keyboard.press('ArrowLeft');
  await page.waitForFunction(() => document.querySelector('.story').dataset.chapter === '1');
  await page.waitForTimeout(1100);
  await page.locator('.skip-story').click();
  await page.waitForFunction(() => document.body.classList.contains('site-entered'));
  await page.locator('.header-nav a[href="tavole-rotonde.html"]').click();
  await page.waitForURL('**/tavole-rotonde.html');
  assert.match(await page.locator('main').innerText(), /allo stesso tavolo/);
  await page.locator('.site-nav a[href="osservatorio.html"]').click();
  await page.waitForURL('**/osservatorio.html');
  for (const topic of ['parole', 'ricerca', 'confini']) {
    await page.locator(`.editorial-card[href="${topic}.html"]`).click();
    await page.waitForURL(`**/${topic}.html`);
    assert.equal(await page.locator('article h1').count(), 1);
    assert.match(await page.locator('main').innerText(), /Anteprima editoriale/);
    await page.goBack();
  }
  await page.locator('.site-nav a[href="iscrizione.html"]').click();
  await page.waitForURL('**/iscrizione.html');
  assert.equal(await page.locator('#membership-form').count(), 1);
  assert.match(await page.locator('main').innerText(), /ricontattiamo per conoscerci/);
  await page.goto(url);
  for (const [width, height] of [[320,568],[390,844],[760,900],[768,1024],[1024,768],[1440,900],[1920,1080]]) {
    await page.setViewportSize({ width, height });
    await jump(0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Overflow at ${width}`);
    for (let i = 0; i < 8; i++) {
      await jump(i);
      const bounds = await page.locator(`.scene[data-scene="${i}"] .scene-content`).boundingBox();
      const controls = await page.locator('.story-controls').boundingBox();
      assert.ok(bounds.y + bounds.height < controls.y, `Chapter ${i + 1} overlaps controls at ${width}x${height}`);
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (let i = 0; i < 8; i++) { await jump(i); await page.screenshot({ path: `artifacts/mobile-${i + 1}.png` }); }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await page.locator('[data-chapter="3"]').click();
  assert.equal(await chapter(), '3');
  assert.equal(await page.locator('.story-track').evaluate(el => getComputedStyle(el).transform), 'none');
  await page.locator('.arrow-controls [data-prev]').click();
  assert.equal(await chapter(), '2');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  for (const path of ['/', '/il-filo-animato.html', '/about.html', '/osservatorio.html', '/tavole-rotonde.html', '/iscrizione.html', '/parole.html', '/ricerca.html', '/confini.html']) {
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(new URL(path, url).href);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${path} overflow at ${width}`);
      const undersized = await page.evaluate(() => [...document.querySelectorAll('body *')].filter(el => getComputedStyle(el).display !== 'none' && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(el).fontSize) < 10).map(el => el.outerHTML.slice(0, 130)));
      assert.deepEqual(undersized, [], `${path} fonts smaller than 10px at ${width}`);
      const missingAps = await page.evaluate(() => [...document.querySelectorAll('body *:not(script):not(style)')].filter(el => [...el.childNodes].some(n => n.nodeType === 3 && /psicodromica/i.test(n.textContent)) && el.id !== 'chapter-announcement' && !el.querySelector('sup.aps') && !/psicodromica APS/i.test(el.getAttribute('aria-label') || '')).map(el => el.outerHTML));
      assert.deepEqual(missingAps, [], `${path} brand missing APS`);
      assert.equal(await page.locator('footer').evaluate(el => getComputedStyle(el).borderTopWidth), '0px');
      assert.equal(await page.locator('.site-credit').getAttribute('href'), 'https://alessialobascio.it');
      for (const button of await page.locator('button').all()) assert.equal(await button.evaluate(el => getComputedStyle(el).borderTopLeftRadius), '5px');
      if (width === 390) await page.screenshot({ path: `artifacts/page-${path.replaceAll('/', '').replace('.html', '') || 'home'}-mobile.png`, fullPage: path !== '/' && path !== '/il-filo-animato.html' });
    }
  }
  await page.goto(url + '/about.html');
  assert.equal(await page.locator('.team-card').count(), 7);
  assert.equal(await page.locator('.team-card img').evaluateAll(imgs => imgs.every(img => img.complete && img.naturalWidth > 0)), true);
  assert.match(await page.locator('.team-note').innerText(), /dimostrative/);
  await page.goto(url + '/tavole-rotonde.html');
  await page.locator('.animated-table').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('.animated-table').dataset.animationState === 'running');
  const tableBefore = await page.locator('.table-thread').getAttribute('d');
  await page.waitForFunction(before => document.querySelector('.table-thread').getAttribute('d') !== before, tableBefore);
  await page.waitForFunction(() => document.querySelector('.animated-table').dataset.formation === '1');
  const narrativeTable = await page.evaluate(() => PSICODROMICA_GEOMETRY.narrative[5].map(([x,y],i) => `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' '));
  assert.equal(await page.locator('.table-thread').getAttribute('d'), narrativeTable, 'The internal page reuses the exact narrative table and semicircular chairs');
  assert.equal(await page.locator('.animated-table path').count(), 1);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await page.locator('.table-thread').evaluate(el => getComputedStyle(el).animationName), 'none');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto(url + '/il-filo-animato.html#associazione');
  await page.locator('.bulb-art').scrollIntoViewIfNeeded();
  const bulbBefore = await page.locator('.bulb-thread').getAttribute('d');
  await page.waitForTimeout(2000);
  assert.notEqual(await page.locator('.bulb-thread').getAttribute('d'), bulbBefore, 'Bulb thread must morph');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => document.querySelector('.bulb-art').dataset.animationState === 'static');
  const bulbStatic = await page.locator('.bulb-thread').getAttribute('d');
  await page.waitForTimeout(200);
  assert.equal(await page.locator('.bulb-thread').getAttribute('d'), bulbStatic);
  assert.equal(await page.locator('.arrival-content').innerText().then(t => t.includes('IL VIAGGIO CONTINUA. INSIEME.')), false);
  assert.match(await page.locator('.site-credit').innerText(), /Alessia Lobascio/);
  assert.deepEqual(errors, []);
  console.log('PASS: detailed brain, immediate phrases, 8 narrative chapters, clean radial contours, gear accelerates and stops, keyboard, articles, 7 story viewport sizes, 9 responsive routes, team placeholders, animations, reduced motion, APS, fonts, buttons, footer, no overflow or JS errors.');
} finally { await browser.close(); }
