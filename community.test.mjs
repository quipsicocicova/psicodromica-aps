import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const base = process.env.TEST_URL || 'http://localhost:5176';
  const tokenColor = name => page.evaluate(name => {
    const el = document.createElement('span'); el.style.color = `var(${name})`;
    document.body.append(el); const color = getComputedStyle(el).color; el.remove(); return color;
  }, name);
  const errors = [], posts = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (request.method() === 'POST') posts.push(request.url()); });
  await page.goto(new URL('about.html', base).href);
  assert.equal(await page.locator('.about .page-actions').count(), 0);
  const invitation = page.locator('main > section:last-child');
  assert.equal(await invitation.getAttribute('class'), 'contact about-membership');
  assert.equal(await invitation.getAttribute('aria-labelledby'), 'about-membership-title');
  assert.equal(await page.locator('#about-membership-title').count(), 1);
  assert.equal(await invitation.locator('h2').innerText(), 'Il prossimo filo\npotresti essere tu.');
  assert.equal(await invitation.locator('h2 em').innerText(), 'potresti essere tu.');
  assert.equal(await invitation.locator('.overline').innerText(), 'C’È SPAZIO PER UNO SGUARDO IN PIÙ');
  assert.equal(await invitation.locator('.pill-link.contact-action').getAttribute('href'), 'iscrizione.html');
  assert.equal(await invitation.evaluate(el => el.previousElementSibling.classList.contains('team-section')), true);
  assert.equal(await page.locator('.contact-line').count(), 1, 'Keep only the existing decorative footer line');
  assert.equal(await invitation.evaluate(el => Boolean(el.compareDocumentPosition(document.querySelector('footer')) & Node.DOCUMENT_POSITION_FOLLOWING)), true);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    const heading = await invitation.locator('h2').boundingBox();
    const action = await invitation.locator('.contact-action').boundingBox();
    assert.ok(heading.x + heading.width <= action.x, `Invitation action stays beside the heading at ${width}px`);
    assert.ok(action.x + action.width <= width, `Invitation action fits at ${width}px`);
    assert.equal(await invitation.locator('.contact-action').evaluate(el => getComputedStyle(el).backgroundColor), await tokenColor('--cta'));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `About must not overflow at ${width}px`);
  }
  assert.deepEqual(await page.locator('.value-copy h3').allTextContents(), ['Contaminazione', 'Curiosità', 'Rigore scientifico', 'Concretezza']);
  for (const name of ['contaminazione', 'curiosita', 'rigore', 'concretezza']) {
    const path = page.locator(`[data-value="${name}"]`);
    await path.scrollIntoViewIfNeeded();
    await page.waitForFunction(name => document.querySelector(`[data-value="${name}"]`).ownerSVGElement.dataset.animationState === 'running', name);
    const before = await path.getAttribute('d');
    // Each loop deliberately holds its completed shape. Wait for an actual
    // transition rather than comparing two instants that may share that hold.
    await page.waitForFunction(({ name, before }) => document.querySelector(`[data-value="${name}"]`).getAttribute('d') !== before, { name, before }, { timeout: 8000 });
    assert.notEqual(await path.getAttribute('d'), before, `${name} thread must transform`);
    assert.equal((await path.getAttribute('d')).match(/M/g).length, 1);
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => [...document.querySelectorAll('.value-art')].every(el => el.dataset.animationState === 'static'));
  assert.deepEqual(await page.locator('.value-art').evaluateAll(nodes => nodes.map(el => el.dataset.animationState)), ['static', 'static', 'static', 'static']);
  const staticPaths = await page.locator('[data-value]').evaluateAll(nodes => nodes.map(el => el.getAttribute('d')));
  await page.waitForTimeout(250);
  assert.deepEqual(await page.locator('[data-value]').evaluateAll(nodes => nodes.map(el => el.getAttribute('d'))), staticPaths);

  await page.goto(new URL('iscrizione.html', base).href);
  assert.equal(await page.locator('#signup-title').innerText(), 'Il prossimo filo\npotresti essere tu.');
  assert.deepEqual(await page.locator('#signup-title em').allTextContents(), ['tu']);
  const signupColors = await page.locator('#signup-title').evaluate(el => ({
    surrounding: [...el.childNodes].filter(node => node.nodeType === Node.TEXT_NODE).map(node => ({ text: node.textContent, color: getComputedStyle(node.parentElement).color })),
    emphasis: getComputedStyle(el.querySelector('em')).color,
  }));
  const ice = await tokenColor('--ice');
  assert.deepEqual(signupColors.surrounding, [
    { text: 'Il prossimo filo', color: ice },
    { text: 'potresti essere ', color: ice },
    { text: '.', color: ice },
  ]);
  assert.equal(signupColors.emphasis, await tokenColor('--orange'));
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Signup must not overflow at ${width}px`);
  }
  assert.equal(await page.locator('#membership-form button[type="submit"]').isEnabled(), true);
  assert.equal(await page.locator('#membership-result').isVisible(), false);
  await page.locator('#membership-form button[type="submit"]').click();
  assert.equal(await page.locator('#membership-form').evaluate(el => el.checkValidity()), false);
  await page.locator('#first-name').fill('   ');
  await page.locator('#last-name').fill('Prova');
  await page.locator('#email').fill('demo@example.invalid');
  await page.locator('[name="conferma"]').check();
  await page.locator('#membership-form button[type="submit"]').click();
  assert.match(await page.locator('#first-name').evaluate(el => el.validationMessage), /Inserisci/);
  await page.locator('#first-name').fill('Nome di prova');
  await page.locator('#email').fill('non-email');
  await page.locator('#membership-form button[type="submit"]').click();
  assert.equal(await page.locator('#email').evaluate(el => el.validity.typeMismatch), true);
  await page.locator('#email').fill('demo@example.invalid');
  await page.locator('[name="conferma"]').uncheck();
  await page.locator('#membership-form button[type="submit"]').click();
  assert.equal(await page.locator('#membership-result').isVisible(), false);
  await page.locator('[name="conferma"]').check();
  await page.locator('#discipline').selectOption({ label: 'Filosofia' });
  const sampleText = '<img src=x onerror=alert(1)> Interesse al confronto.';
  await page.locator('#motivation').fill(sampleText);
  await page.locator('#membership-form button[type="submit"]').click();
  assert.equal(await page.locator('#membership-result').isVisible(), true);
  assert.match(await page.locator('#result-title').innerText(), /non ancora inviata/);
  assert.equal(await page.locator('#membership-summary img').count(), 0);
  assert.ok((await page.locator('#membership-summary').innerText()).includes(sampleText));
  assert.equal(await page.locator('#result-title').evaluate(el => document.activeElement === el), true);
  assert.match(await page.locator('#download-request').getAttribute('href'), /^blob:/);
  const requestText = await page.locator('#download-request').evaluate(async el => (await fetch(el.href)).text());
  assert.match(requestText, /COPIA LOCALE — NON INVIATA/);
  assert.match(requestText, /Nome: Nome di prova/);
  assert.match(requestText, /Ambito di interesse: Filosofia/);
  const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#download-request').click()]);
  assert.equal(download.suggestedFilename(), 'richiesta-iscrizione-psicodromica-aps.txt');
  await page.locator('#edit-request').click();
  assert.equal(await page.locator('#membership-result').isVisible(), false);
  assert.equal(await page.locator('#download-request').getAttribute('href'), null);
  assert.equal(await page.locator('#first-name').evaluate(el => document.activeElement === el), true);
  assert.deepEqual(posts, [], 'The local form must never send data to an unconfigured destination');
  assert.equal(await page.evaluate(() => localStorage.length + sessionStorage.length), 0);
  assert.deepEqual(await page.context().cookies(), []);
  assert.equal(await page.locator('.form-submit button').evaluate(el => getComputedStyle(el).backgroundColor), await tokenColor('--cta'));

  await page.goto(base + '/#associazione');
  assert.equal(await page.locator('.bulb-glow').evaluate(el => getComputedStyle(el).fill), await tokenColor('--light'));
  assert.match(await page.locator('.arrival-bottom p').innerText(), /psichiatria, psicologia, neuroscienze,[\s\S]*filosofia, sociologia, pedagogia, ecc\./);
  await page.locator('[data-chapter="7"]').click();
  assert.equal(await page.locator('.story').getAttribute('data-gear-motion'), 'static');
  assert.equal(await page.locator('#gear-assembly').evaluate(el => el.getAnimations().length), 0);
  assert.deepEqual(errors, []);
  console.log('PASS: final About invitation, responsive layouts, signup word-only emphasis, manifesto animations, reduced motion, no action row, form validation and safe preview, local download, no fake submission or persistence, blue buttons, yellow light, disciplines, static reduced-motion gear.');
} finally { await browser.close(); }
