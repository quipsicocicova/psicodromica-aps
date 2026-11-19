'use strict';
(() => {
  const story = document.querySelector('[data-narrative]');
  const geometry = window.PSICODROMICA_GEOMETRY;
  if (!story || !geometry) return;
  // Geometry is prepared at build time. Never measure complex SVG curves here:
  // synchronous getPointAtLength calls used to block startup for many seconds.
  // Keep the city, but bring the table before the reciprocal questioning knot.
  const samples = [0, 1, 2, 3, 5, 4, 6, 6].map(index => geometry.narrative[index]);
  const count = samples[0].length;
  const straight = Array.from({ length: count }, (_, i) => [60 + 646 * i / (count - 1), 318]);
  const sticky = story.querySelector('.story-sticky');
  const track = story.querySelector('.story-track');
  const scenes = [...story.querySelectorAll('.scene')];
  const buttons = [...story.querySelectorAll('[data-chapter]')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 760px)');
  const art = story.querySelector('#line-art');
  const mobileLayout = { textBottoms: Array(8).fill(300), width: 0, controlsTop: 0 };
  // Optical spacing per chapter: retain brain/table, lower the flatter figures,
  // and reserve the complete light/spark envelope around the closing gear/logo.
  const mobilePadding = [24, 24, 24, 24, 24, 24, 90, 112];
  const mobileDrop = [0, .18, .14, .14, 0, .18, 0, 0];
  const line = story.querySelector('#morph-line');
  const tip = story.querySelector('#line-tip');
  const bore = story.querySelector('#gear-bore');
  const gearAssembly = story.querySelector('#gear-assembly');
  const gearAura = story.querySelector('#gear-aura');
  const logo = story.querySelector('#story-logo');
  const neuralReveal = story.querySelector('#logo-neural-reveal');
  const logoPaths = geometry.logo.paths.map(({ d, fill }, index) => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d); path.setAttribute('fill', fill);
    if (index === 1) path.setAttribute('clip-path', 'url(#logo-neural-clip)');
    logo.append(path); return path;
  });
  const sparkLayer = story.querySelector('#gear-sparks');
  const tableCore = story.querySelector('#table-core');
  const eyeDetail = story.querySelector('#eye-detail');
  const bubbles = story.querySelector('#discipline-bubbles');
  const city = story.querySelector('#city-windows');
  const caption = story.querySelector('#art-caption');
  const header = document.querySelector('.story-header');
  const headerAction = header.querySelector('.skip-story');
  const headerActionLabel = header.querySelector('[data-header-action]');
  const topCount = story.querySelector('#top-count');
  const counter = story.querySelector('.figure-counter');
  const announcement = story.querySelector('#chapter-announcement');
  const previousButtons = [...story.querySelectorAll('[data-prev]')];
  const nextButtons = [...story.querySelectorAll('.arrow-controls [data-next]')];
  const progress = story.querySelector('.journey-progress span');
  const titles = ['La mente', 'Lo sguardo', 'La rete', 'I contesti', 'Il confronto', 'L’intreccio', 'Prospettive diverse', 'Psicodromica APS'];
  const captions = ['IL PUNTO DI PARTENZA', 'ALLARGARE LO SGUARDO', 'PERSONE / RELAZIONI', 'LE CONDIZIONI IN CUI LA VITA PRENDE FORMA', 'DISCIPLINE ALLO STESSO TAVOLO', 'LE DOMANDE CHE NASCONO DALL’INCONTRO', 'TANTE PROSPETTIVE, UN NUOVO INCASTRO', ''];
  const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
  const ease = t => t * t * (3 - 2 * t);
  const boundsOf = points => points.reduce((b, [x, y]) => {
    b.minX = Math.min(b.minX, x); b.maxX = Math.max(b.maxX, x);
    b.minY = Math.min(b.minY, y); b.maxY = Math.max(b.maxY, y);
    return b;
  }, { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
  const brainBounds = boundsOf(samples[0]), gearBounds = boundsOf(samples[6]);
  let chapter = -1, beat = 0, manualBeat = 0, scheduled = false;
  let lastPosition = -1, lastFormation = -1, scrollRange = 1, storyTop = 0;
  let lastMobileFrame = '';
  let introProgress = reduced.matches ? 1 : 0, introFrame, introStarted;
  let spinPlayed = false, spinAnimation, auraAnimation, entered = false;
  let logoProgress = 0, lastLogoProgress = -1, logoFrame;
  let sparkAnimations = [], cityAnimations = [], cityActive = false, cityMotion, cityRun = 0;
  const windows = [], sparks = [];
  const buildings = [
    { xs: [116, 143, 170, 193], ys: [387, 419, 451] },
    { xs: [147, 168], ys: [323, 346] },
    { xs: [247, 274, 301], ys: [266, 300, 334, 368, 402, 436, 462] },
    { xs: [364, 390, 416], ys: [349, 382, 415, 448] },
    { xs: [383, 400], ys: [301, 322] },
    { xs: [472, 497], ys: [230, 264, 298, 332, 366, 400, 434, 461] },
    { xs: [555, 580, 605], ys: [374, 406, 438, 462] },
    { xs: [574, 590], ys: [323, 343] }
  ];
  for (const building of buildings) for (const y of building.ys) for (const x of building.xs) {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', x); rect.setAttribute('y', y);
    rect.setAttribute('width', '7'); rect.setAttribute('height', '10'); rect.setAttribute('rx', '1');
    rect.style.opacity = '0'; city.append(rect); windows.push(rect);
  }
  city.dataset.lit = '0'; city.dataset.state = 'idle';
  for (let i = 0; i < 18; i++) {
    const angle = i * Math.PI * (3 - Math.sqrt(5)), radius = 182 + i % 3 * 5;
    const anchor = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    anchor.setAttribute('transform', `translate(${384 + Math.cos(angle) * radius} ${318 + Math.sin(angle) * radius})`);
    const path = document.createElementNS(anchor.namespaceURI, 'path');
    path.setAttribute('class', 'gear-spark');
    path.setAttribute('d', i % 3 ? 'M-2.5 0H2.5M0-2.5V2.5' : 'M-4 0H4M0-1.5V1.5');
    anchor.append(path); sparkLayer.append(anchor);
    const distance = 54 + i % 4 * 12;
    sparks.push({ path, dx: Math.cos(angle) * distance, dy: Math.sin(angle) * distance, delay: 180 + i % 9 * 75, duration: 620 + i % 4 * 80 });
  }
  function syncCity(position) {
    const inRange = position > 2.5 && position < 3.5;
    if (!inRange) {
      if (cityActive) {
        cityRun++; cityAnimations.forEach(animation => animation.cancel()); cityAnimations = [];
        cityActive = false; windows.forEach(window => window.style.opacity = '0');
        city.dataset.lit = '0'; city.dataset.state = 'idle';
      }
      return;
    }
    if (!cityActive && position < 2.94) return;
    const motion = reduced.matches ? 'static' : 'animated';
    if (cityActive && cityMotion === motion) return;
    cityAnimations.forEach(animation => animation.cancel()); cityAnimations = [];
    const run = ++cityRun;
    cityActive = true; cityMotion = motion;
    windows.forEach(window => window.style.opacity = reduced.matches ? '1' : '0');
    city.dataset.lit = reduced.matches ? String(windows.length) : '0';
    city.dataset.state = reduced.matches ? 'static' : 'lighting';
    if (reduced.matches) return;
    let completed = 0;
    // Scatter the sequence across every building. Timed opacity alone changes:
    // positions, fill, size and the original soft glow stay untouched.
    cityAnimations = windows.map((window, i) => {
      const animation = window.animate([{ opacity: 0 }, { opacity: 1 }], { delay: (i * 37 % windows.length) * 32, duration: 360, easing: 'ease-out', fill: 'forwards' });
      animation.finished.then(() => {
        if (run !== cityRun) return;
        city.dataset.lit = String(++completed);
        if (completed === windows.length) city.dataset.state = 'lit';
      }).catch(() => {});
      return animation;
    });
  }
  function stopSparks() {
    sparkAnimations.forEach(animation => animation.cancel()); sparkAnimations = [];
    if (sparkLayer.dataset.state !== 'idle') sparkLayer.dataset.state = 'idle';
  }
  function measureMobile() {
    if (!mobile.matches) {
      lastMobileFrame = '';
      art.setAttribute('viewBox', '0 0 760 640');
      art.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      story.style.removeProperty('--mobile-art-top');
      story.style.removeProperty('--mobile-art-height');
      return;
    }
    // Read copy only on resize, font readiness or static chapter changes, never
    // on animation frames. Measure the last visible child, not a full-height box.
    scenes.forEach((scene, index) => {
      if (reduced.matches && !scene.classList.contains('is-current')) return;
      const children = [...scene.querySelector('.scene-content').children];
      const last = children.filter(child => child.getClientRects().length).at(-1);
      if (last) mobileLayout.textBottoms[index] = last.getBoundingClientRect().bottom - scene.getBoundingClientRect().top;
    });
    mobileLayout.width = sticky.clientWidth * .94;
    mobileLayout.controlsTop = story.querySelector('.story-controls').getBoundingClientRect().top - sticky.getBoundingClientRect().top;
    art.setAttribute('preserveAspectRatio', 'xMidYMin meet');
  }
  function layoutMobileArt(position, base, t, bounds) {
    if (!mobile.matches) return;
    if (position < .001) {
      // Do not zoom a zero-height intro line: keep its eventual brain framing.
      bounds = { ...brainBounds };
    }
    if (position >= 1 && position <= 3) {
      // Make room for the symbol clouds before they fade in, smoothly and in
      // reverse too; no sudden reframing when their opacity crosses zero.
      const cloudTop = position < 1.6 ? 205 + (48 - 205) * ease(clamp((position - 1) / .6))
        : position > 2.4 ? 48 + (157 - 48) * ease(clamp((position - 2.4) / .6)) : 48;
      bounds.minY = Math.min(bounds.minY, cloudTop);
    }
    if (position > 6) {
      const reveal = ease(clamp((position - 6) / .85));
      // Include both original logo paths, not only the animated half-gear.
      bounds.minX = Math.min(bounds.minX, gearBounds.minX + (140.9 - gearBounds.minX) * reveal);
      bounds.maxX = Math.max(bounds.maxX, gearBounds.maxX + (627.1 - gearBounds.maxX) * reveal);
      bounds.minY = Math.min(bounds.minY, gearBounds.minY + (133.42 - gearBounds.minY) * reveal);
      bounds.maxY = Math.max(bounds.maxY, gearBounds.maxY + (502.58 - gearBounds.maxY) * reveal);
    }
    const padding = mobilePadding[base] + (mobilePadding[base + 1] - mobilePadding[base]) * t;
    const width = bounds.maxX - bounds.minX + padding * 2;
    const height = bounds.maxY - bounds.minY + padding * 2;
    const copyBottom = mobileLayout.textBottoms[base] + (mobileLayout.textBottoms[base + 1] - mobileLayout.textBottoms[base]) * t;
    let top = copyBottom + 12;
    const captionRoom = innerHeight <= 740 ? 10 : 44;
    const available = Math.max(60, mobileLayout.controlsTop - captionRoom - top);
    const canvasHeight = Math.min(available, mobileLayout.width * height / width);
    const drop = mobileDrop[base] + (mobileDrop[base + 1] - mobileDrop[base]) * t;
    top += Math.max(0, available - canvasHeight) * drop;
    const viewBox = `${(bounds.minX - padding).toFixed(2)} ${(bounds.minY - padding).toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)}`;
    const frame = `${viewBox}/${top.toFixed(2)}/${canvasHeight.toFixed(2)}`;
    if (frame === lastMobileFrame) return;
    lastMobileFrame = frame;
    story.style.setProperty('--mobile-art-top', `${top.toFixed(2)}px`);
    story.style.setProperty('--mobile-art-height', `${canvasHeight.toFixed(2)}px`);
    // Bounds come from the points already being interpolated, not SVG curve
    // sampling. Desktop geometry, timings and native scrolling stay untouched.
    art.setAttribute('viewBox', viewBox);
  }
  function measure() {
    scrollRange = Math.max(1, story.offsetHeight - sticky.offsetHeight);
    storyTop = story.offsetTop;
    measureMobile(); lastPosition = -1;
  }
  function finishIntro() {
    cancelAnimationFrame(introFrame);
    introProgress = 1;
    story.dataset.intro = 'complete';
  }
  function paint(position) {
    const formation = position < .001 ? introProgress : 1;
    const morph = position >= 6.85 ? logoProgress : 0;
    if (Math.abs(lastPosition - position) < .0001 && Math.abs(lastFormation - formation) < .0001 && lastLogoProgress === morph) return;
    lastPosition = position; lastFormation = formation; lastLogoProgress = morph;
    const base = Math.min(6, Math.floor(position)), t = ease(clamp(position - base));
    const from = formation < 1 ? straight : samples[base];
    const to = formation < 1 ? samples[0] : samples[base + 1];
    const blend = formation < 1 ? formation : t;
    const parts = new Array(count);
    const bounds = mobile.matches ? { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity } : null;
    let x, y;
    for (let i = 0; i < count; i++) {
      x = from[i][0] + (to[i][0] - from[i][0]) * blend;
      y = from[i][1] + (to[i][1] - from[i][1]) * blend;
      if (morph > 0) {
        x += (geometry.logo.gear[i][0] - x) * morph;
        y += (geometry.logo.gear[i][1] - y) * morph;
      }
      if (bounds) {
        bounds.minX = Math.min(bounds.minX, x); bounds.maxX = Math.max(bounds.maxX, x);
        bounds.minY = Math.min(bounds.minY, y); bounds.maxY = Math.max(bounds.maxY, y);
      }
      parts[i] = `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`;
    }
    if (bounds) layoutMobileArt(position, base, t, bounds);
    line.setAttribute('d', parts.join(' '));
    tip.setAttribute('cx', x); tip.setAttribute('cy', y);
    const gearProgress = ease(clamp(position - 5));
    bore.setAttribute('r', 65 * gearProgress * (1 - morph)); bore.style.opacity = gearProgress * (1 - morph);
    line.style.opacity = morph === 1 ? 0 : 1 - clamp((morph - .8) / .2);
    logo.style.opacity = morph > 0 ? '1' : '0';
    logoPaths[0].style.opacity = morph === 1 ? 1 : clamp((morph - .55) / .45);
    logoPaths[1].style.opacity = clamp((morph - .35) / .45);
    const neuralX = morph === 1 ? 54 : 1159 - 1105 * clamp((morph - .3) / .7);
    neuralReveal.setAttribute('x', neuralX);
    neuralReveal.setAttribute('width', 1159 - neuralX);
    tip.style.opacity = 1 - clamp((position - 4.5) * 2);
    tableCore.style.opacity = clamp(1 - Math.abs(position - 4) * 2.5);
    eyeDetail.style.opacity = clamp(1 - Math.abs(position - 1) * 3);
    const bubbleOpacity = clamp(1 - Math.abs(position - 2) * 2.5);
    bubbles.style.opacity = bubbleOpacity;
    bubbles.classList.toggle('is-active', bubbleOpacity > .05);
    city.style.opacity = clamp(1 - Math.abs(position - 3) * 2);
  }
  function animateIntro(now) {
    introStarted ??= now;
    const t = clamp((now - introStarted - 100) / 1800);
    introProgress = ease(t);
    story.dataset.intro = t === 0 ? 'line' : t < 1 ? 'forming' : 'complete';
    paint(0);
    if (t < 1) introFrame = requestAnimationFrame(animateIntro);
  }
  function startIntro() {
    cancelAnimationFrame(introFrame); introStarted = undefined;
    introProgress = reduced.matches ? 1 : 0;
    story.dataset.intro = reduced.matches ? 'complete' : 'line';
    lastFormation = -1;
    paint(0);
    if (!reduced.matches) introFrame = requestAnimationFrame(animateIntro);
  }
  function syncSpin(position) {
    if (position < 6.85 || reduced.matches) {
      spinAnimation?.cancel(); auraAnimation?.cancel(); stopSparks(); cancelAnimationFrame(logoFrame);
      spinAnimation = undefined; auraAnimation = undefined;
      spinPlayed = false;
      logoProgress = reduced.matches && position >= 6.85 ? 1 : 0;
      story.dataset.logoState = logoProgress === 1 ? 'complete' : 'idle';
      story.dataset.gearMotion = reduced.matches ? 'static' : 'idle';
      return;
    }
    if (spinPlayed) return;
    spinPlayed = true; story.dataset.gearMotion = 'spinning';
    story.dataset.logoState = 'transforming';
    // Accelerate while the outline opens into the original half-gear. Rotation
    // settles before the neural branches spread, keeping the final mark upright.
    const animation = gearAssembly.animate([
      { transform: 'rotate(0deg)', easing: 'cubic-bezier(.55,0,.8,.4)' },
      { transform: 'rotate(720deg)', offset: .45 },
      { transform: 'rotate(720deg)' }
    ], { duration: 2800, fill: 'forwards' });
    const started = performance.now();
    function transformLogo(now) {
      if (spinAnimation !== animation) return;
      logoProgress = ease(clamp((now - started - 450) / 2100));
      paint(clamp(beat, 0, 7));
      if (now - started < 2800) logoFrame = requestAnimationFrame(transformLogo);
      else story.dataset.logoState = 'complete';
    }
    logoFrame = requestAnimationFrame(transformLogo);
    auraAnimation = gearAura.animate([{ opacity: 0 }, { opacity: 1, offset: .35 }, { opacity: 0 }], { duration: 2800, fill: 'forwards' });
    sparkLayer.dataset.state = 'sparking';
    sparkAnimations = sparks.map(spark => spark.path.animate([
      { opacity: 0, transform: 'translate(0px,0px) scale(.3)' },
      { opacity: 1, transform: `translate(${spark.dx * .15}px,${spark.dy * .15}px) scale(1)`, offset: .16 },
      { opacity: 0, transform: `translate(${spark.dx}px,${spark.dy}px) scale(.2)` }
    ], { duration: spark.duration, delay: spark.delay, easing: 'ease-out' }));
    spinAnimation = animation;
    animation.finished.then(() => {
      if (spinAnimation === animation) {
        cancelAnimationFrame(logoFrame); logoProgress = 1; paint(clamp(beat, 0, 7));
        story.dataset.gearMotion = 'stopped'; story.dataset.logoState = 'complete'; sparkLayer.dataset.state = 'idle';
      }
    }).catch(() => {});
  }
  function setChapter(index) {
    if (index === chapter) return;
    chapter = index;
    scenes.forEach((scene, i) => { scene.classList.toggle('is-current', index === i); scene.inert = index !== i; scene.setAttribute('aria-hidden', String(index !== i)); });
    buttons.forEach((button, i) => { button.classList.toggle('active', index === i); if (index === i) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current'); });
    topCount.textContent = String(index + 1).padStart(2, '0');
    counter.setAttribute('aria-label', `Figura ${index + 1} di 8`);
    caption.textContent = captions[index]; caption.hidden = index === 7;
    announcement.textContent = `Capitolo ${index + 1} di 8: ${titles[index]}`;
    story.dataset.chapter = String(index);
    if (reduced.matches && mobile.matches) measureMobile();
  }
  function updateHeader() {
    const isEntered = scrollY >= storyTop + story.offsetHeight - header.offsetHeight - 40;
    if (isEntered === entered && headerAction.dataset.mode) return;
    entered = isEntered;
    document.body.classList.toggle('site-entered', entered);
    headerActionLabel.textContent = entered ? 'Rivedi il racconto' : 'Salta il racconto';
    headerAction.href = entered ? '#inizio' : '#associazione';
    headerAction.dataset.mode = entered ? 'replay' : 'skip';
  }
  function render() {
    scheduled = false;
    beat = reduced.matches ? manualBeat : clamp((scrollY - storyTop) / scrollRange) * 7;
    const position = clamp(beat, 0, 7);
    if (position > .01 && introProgress < 1) finishIntro();
    track.style.transform = reduced.matches ? '' : `translate3d(${-position * innerWidth}px,0,0)`;
    setChapter(Math.round(position)); syncSpin(position); paint(position); syncCity(position);
    story.dataset.beat = String(Math.round(beat));
    previousButtons.forEach(button => button.disabled = beat < .25);
    nextButtons.forEach(button => button.disabled = beat > 6.75);
    progress.style.transform = `scaleX(${beat / 7})`;
    updateHeader();
  }
  function schedule() { if (!scheduled) { scheduled = true; requestAnimationFrame(render); } }
  function goToBeat(target, focus = false) {
    target = clamp(target, 0, 7);
    if (target > 0) finishIntro();
    if (reduced.matches) {
      manualBeat = target; render();
      if (focus) { const heading = scenes[chapter].querySelector('h1,h2'); heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
    } else scrollTo({ top: storyTop + scrollRange * target / 7, behavior: 'smooth' });
  }
  const next = () => goToBeat(Math.floor(beat + .15) + 1, true);
  const previous = () => goToBeat(Math.ceil(beat - .15) - 1, true);
  function replay() {
    manualBeat = 0; spinAnimation?.cancel(); auraAnimation?.cancel(); stopSparks(); cancelAnimationFrame(logoFrame); spinPlayed = false; logoProgress = 0;
    scrollTo({ top: storyTop, behavior: 'instant' });
    startIntro(); render();
  }
  buttons.forEach(button => button.addEventListener('click', () => goToBeat(Number(button.dataset.chapter), true)));
  story.querySelectorAll('[data-next]').forEach(button => button.addEventListener('click', next));
  previousButtons.forEach(button => button.addEventListener('click', previous));
  document.querySelectorAll('[data-replay]').forEach(button => button.addEventListener('click', replay));
  headerAction.addEventListener('click', event => { if (entered) { event.preventDefault(); replay(); } });
  header.querySelector('.wordmark').addEventListener('click', event => { event.preventDefault(); replay(); });
  const menuToggle = header.querySelector('.header-menu-toggle');
  const menu = header.querySelector('.header-nav');
  function closeMenu() { menuToggle.setAttribute('aria-expanded', 'false'); menu.classList.remove('is-open'); }
  menuToggle.addEventListener('click', () => { const open = menu.classList.toggle('is-open'); menuToggle.setAttribute('aria-expanded', String(open)); });
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  headerAction.addEventListener('click', closeMenu);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu();
    if (document.querySelector('dialog[open]') || event.altKey || event.ctrlKey || event.metaKey || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
    if (scrollY >= storyTop + story.offsetHeight - sticky.offsetHeight + 30) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); next(); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); previous(); }
  });
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', () => { measure(); lastPosition = -1; closeMenu(); schedule(); });
  reduced.addEventListener('change', () => { manualBeat = Math.round(beat); finishIntro(); measure(); lastPosition = -1; schedule(); });
  sticky.addEventListener('wheel', event => {
    if (reduced.matches || event.ctrlKey || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
    if (event.deltaX < 0 && scrollY <= storyTop || event.deltaX > 0 && scrollY >= storyTop + scrollRange) return;
    event.preventDefault();
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1;
    scrollBy({ top: event.deltaX * unit, behavior: 'instant' });
  }, { passive: false });
  let touchStart;
  sticky.addEventListener('touchstart', event => { const t = event.changedTouches[0]; touchStart = [t.clientX, t.clientY]; }, { passive: true });
  sticky.addEventListener('touchend', event => {
    if (!touchStart) return;
    const t = event.changedTouches[0], dx = t.clientX - touchStart[0], dy = t.clientY - touchStart[1];
    if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.7) dx < 0 ? next() : previous();
    touchStart = null;
  }, { passive: true });
  measure(); startIntro(); render();
  document.fonts.ready.then(() => { measure(); schedule(); });
})();
