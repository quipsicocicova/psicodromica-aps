'use strict';
(() => {
  const paths = [...document.querySelectorAll('[data-value]')];
  const geometry = window.PSICODROMICA_GEOMETRY?.values;
  if (!paths.length || !geometry) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const states = paths.map((path, index) => ({
    path, svg: path.ownerSVGElement, index, visible: false,
    from: geometry[path.dataset.value].from,
    to: geometry[path.dataset.value].to
  }));
  let frame, started;
  function paint(state, t) {
    // At the hold, use the authored curve: brick corners stay crisp rather than
    // being bevelled by the finite interpolation samples. No runtime measuring.
    if (t === 1) { state.path.setAttribute('d', state.path.dataset.target); return; }
    const eased = t * t * (3 - 2 * t);
    state.path.setAttribute('d', state.from.map((p, i) => `${i ? 'L' : 'M'}${(p[0] + (state.to[i][0] - p[0]) * eased).toFixed(2)} ${(p[1] + (state.to[i][1] - p[1]) * eased).toFixed(2)}`).join(' '));
  }
  function tick(now) {
    started ??= now;
    for (const state of states) {
      if (!state.visible) continue;
      const phase = ((now - started + state.index * 700) % 8800) / 8800;
      const t = phase < .1 ? 0 : phase < .43 ? (phase - .1) / .33 : phase < .72 ? 1 : (1 - phase) / .28;
      paint(state, t);
    }
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame);
    for (const state of states) {
      state.svg.dataset.animationState = reduced.matches ? 'static' : state.visible && !document.hidden ? 'running' : 'paused';
      if (reduced.matches) paint(state, 1);
    }
    if (!reduced.matches && !document.hidden && states.some(state => state.visible)) frame = requestAnimationFrame(tick);
  }
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) states.find(state => state.svg === entry.target).visible = entry.isIntersecting;
    sync();
  }, { threshold: .15 });
  states.forEach(state => observer.observe(state.svg));
  reduced.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  sync();
})();
