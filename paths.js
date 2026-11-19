'use strict';
(() => {
  const grid = document.querySelector('.path-grid');
  const cards = [...document.querySelectorAll('.path-grid>a')];
  if (!cards.length || !('IntersectionObserver' in window)) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const count = 161;
  // Arithmetic only: the same points flatten into a plain thread, then unfold
  // into a card. No SVG measurements, dash-drawing or persistent outline.
  const straight = Array.from({ length: count }, (_, i) => [1 + 298 * i / (count - 1), 180]);
  const corners = [[1, 1], [299, 1], [299, 359], [1, 359], [1, 1]];
  const outline = Array.from({ length: count }, (_, i) => {
    const at = i * 4 / (count - 1), segment = Math.min(3, Math.floor(at)), t = at - segment;
    return corners[segment].map((v, axis) => v + (corners[segment + 1][axis] - v) * t);
  });
  let frame;
  grid.dataset.threadState = reduced.matches ? 'static' : 'idle';
  const states = cards.map((card, index) => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'path-thread'); svg.setAttribute('viewBox', '0 0 300 360');
    svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS(svg.namespaceURI, 'path');
    svg.append(path); card.prepend(svg);
    const state = { card, svg, path, index, animations: [], last: -1, started: 0 };
    card.dataset.reveal = reduced.matches ? 'static' : 'pending';
    paint(state, 0); card.addEventListener('focusin', () => finish(state));
    return state;
  });
  function paint(state, t) {
    if (t === state.last) return;
    state.last = t;
    const eased = t * t * (3 - 2 * t);
    state.path.setAttribute('d', straight.map((p, i) => `${i ? 'L' : 'M'}${(p[0] + (outline[i][0] - p[0]) * eased).toFixed(2)} ${(p[1] + (outline[i][1] - p[1]) * eased).toFixed(2)}`).join(' '));
    state.svg.style.opacity = String(.6 * Math.min(1, (1 - t) / .3));
  }
  function finish(state) {
    state.card.dataset.reveal = reduced.matches ? 'static' : 'complete';
    state.card.dataset.threadPhase = 'complete'; state.svg.style.opacity = '0';
    state.animations.forEach(animation => animation.cancel()); state.animations = [];
    grid.dataset.threadState = reduced.matches ? 'static' : 'settled';
  }
  function tick(now) {
    frame = undefined;
    for (const state of states) {
      if (state.card.dataset.reveal !== 'drawing') continue;
      const elapsed = now - state.started;
      state.svg.style.visibility = elapsed < 0 ? 'hidden' : 'visible';
      const t = Math.max(0, Math.min(1, (elapsed - 550) / 1000));
      state.card.dataset.threadPhase = t === 0 ? 'line' : t < 1 ? 'morphing' : 'settling';
      paint(state, t);
      if (elapsed >= 1800) finish(state);
    }
    if (states.some(state => state.card.dataset.reveal === 'drawing')) frame = requestAnimationFrame(tick);
  }
  function reveal(state) {
    if (state.card.dataset.reveal !== 'pending') return;
    if (reduced.matches) { finish(state); return; }
    state.card.dataset.reveal = 'drawing';
    if (grid.dataset.threadState !== 'settled') grid.dataset.threadState = 'drawing';
    const delay = state.index * 120;
    state.started = performance.now() + delay;
    [...state.card.children].filter(el => !el.classList.contains('path-thread')).forEach((el, i) => {
      state.animations.push(el.animate([
        { opacity: 0, transform: 'translateY(6px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 550, delay: delay + 1000 + i * 60, easing: 'ease-out', fill: 'both' }));
    });
    if (frame === undefined) frame = requestAnimationFrame(tick);
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      reveal(states.find(state => state.card === entry.target)); observer.unobserve(entry.target);
    });
  }, { threshold: .15 });
  states.forEach(state => observer.observe(state.card));
  reduced.addEventListener('change', () => {
    if (!reduced.matches) return;
    cancelAnimationFrame(frame); frame = undefined; states.forEach(finish);
  });
})();
