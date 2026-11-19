'use strict';
(() => {
  const svg = document.querySelector('.animated-table');
  const target = window.PSICODROMICA_GEOMETRY?.narrative[5];
  if (!svg || !target) return;
  const path = svg.querySelector('.table-thread');
  const core = svg.querySelector('.table-core');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const source = target.map((_, i) => [180 + 408 * i / (target.length - 1), 318]);
  let frame, started, visible = false, last = -1;
  function paint(t) {
    if (last === t) return;
    last = t;
    const eased = t * t * (3 - 2 * t);
    path.setAttribute('d', source.map((p, i) => `${i ? 'L' : 'M'}${(p[0] + (target[i][0] - p[0]) * eased).toFixed(2)} ${(p[1] + (target[i][1] - p[1]) * eased).toFixed(2)}`).join(' '));
    core.style.opacity = Math.max(0, (eased - .7) / .3);
    svg.dataset.formation = String(t);
  }
  function tick(now) {
    started ??= now;
    const phase = ((now - started) % 8800) / 8800;
    const t = phase < .1 ? 0 : phase < .4 ? (phase - .1) / .3 : phase < .8 ? 1 : (1 - phase) / .2;
    paint(t); frame = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame);
    svg.dataset.animationState = reduced.matches ? 'static' : visible && !document.hidden ? 'running' : 'paused';
    if (reduced.matches) paint(1);
    else if (visible && !document.hidden) { started = undefined; frame = requestAnimationFrame(tick); }
  }
  paint(reduced.matches ? 1 : 0);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, { threshold: .2 }).observe(svg);
  reduced.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  sync();
})();
