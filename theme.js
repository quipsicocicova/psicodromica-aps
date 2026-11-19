/* Blocking, local-only bootstrap: choose the palette before styles can paint. */
(() => {
  'use strict';
  const key = 'psicodromica-palette';
  const palettes = [
    { id: 'bosco', name: 'Bosco', description: 'acqua e giallo', background: '#0d241f' },
    { id: 'originale', name: 'Originale', description: 'blu notte e arancione', background: '#101923' },
    { id: 'blu-rosso', name: 'Blu e rosso', description: 'blu notte, ceruleo e rosso', background: '#101923' },
    { id: 'nero', name: 'Nero', description: 'nero, ocra e bordeaux', background: '#0b090a' }
  ];
  const root = document.documentElement;
  let selected = palettes.some(palette => palette.id === root.dataset.palette) ? root.dataset.palette : 'bosco';
  try {
    const stored = localStorage.getItem(key);
    if (palettes.some(palette => palette.id === stored)) selected = stored;
  } catch { /* Storage may be unavailable, notably on file://. */ }
  root.dataset.palette = selected;

  function updateChrome() {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = palettes.find(palette => palette.id === selected).background;
  }
  function mount() {
    updateChrome();
    // Reuse the original preloaded vectors; currentColor follows the light
    // internal header's ink in every palette. The HTML image is the no-JS fallback.
    const logoPaths = window.PSICODROMICA_GEOMETRY?.logo?.paths;
    if (logoPaths) document.querySelectorAll('.site-brand img').forEach(image => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '54 68 1105 839'); svg.setAttribute('class', 'site-symbol');
      svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
      logoPaths.forEach(({ d }) => {
        const path = document.createElementNS(svg.namespaceURI, 'path');
        path.setAttribute('d', d); path.setAttribute('fill-rule', 'evenodd'); svg.append(path);
      });
      image.replaceWith(svg);
    });
    const hosts = document.querySelectorAll('.story-header .header-nav, .site-nav');
    if (!hosts.length) return;
    const status = document.createElement('span');
    status.className = 'sr-only';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');
    document.body.append(status);

    function refresh() {
      root.dataset.palette = selected;
      updateChrome();
      document.querySelectorAll('.palette-picker button').forEach(button => {
        button.setAttribute('aria-pressed', String(button.dataset.paletteChoice === selected));
      });
    }
    hosts.forEach(host => {
      if (host.querySelector('.palette-picker')) return;
      const group = document.createElement('div');
      group.className = 'palette-picker';
      group.setAttribute('role', 'group');
      group.setAttribute('aria-label', 'Colori del sito');
      const label = document.createElement('span');
      label.className = 'palette-picker-label';
      label.textContent = 'Colori';
      group.append(label);
      palettes.forEach(palette => {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.paletteChoice = palette.id;
        button.setAttribute('aria-label', `${palette.name}: ${palette.description}`);
        button.title = `${palette.name}: ${palette.description}`;
        button.setAttribute('aria-pressed', String(palette.id === selected));
        const swatch = document.createElement('span');
        swatch.className = 'palette-swatch';
        swatch.setAttribute('aria-hidden', 'true');
        button.append(swatch);
        button.addEventListener('click', () => {
          selected = palette.id;
          try { localStorage.setItem(key, selected); } catch { /* Keep the choice for this page. */ }
          refresh();
          status.textContent = `Colori del sito: ${palette.name}.`;
        });
        group.append(button);
      });
      // These are ordinary Tab/Enter/Space buttons, not an arrow-key widget.
      // Keep arrow presses within this control away from the story shortcuts.
      group.addEventListener('keydown', event => {
        if (event.key.startsWith('Arrow')) event.stopPropagation();
      });
      host.append(group);
    });
    addEventListener('storage', event => {
      if (event.key !== key && event.key !== null) return;
      selected = palettes.some(palette => palette.id === event.newValue) ? event.newValue : 'bosco';
      refresh();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})();
