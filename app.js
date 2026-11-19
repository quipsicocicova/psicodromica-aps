'use strict';
// Shared behaviours for the home and its internal pages. The introductory
// narrative lives in narrative.js so it cannot affect the rest of the site.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const bulb = document.querySelector('[data-thread-morph]');
  if (bulb && window.PSICODROMICA_GEOMETRY?.bulb) {
    const svg = bulb.ownerSVGElement;
    const { from, to } = window.PSICODROMICA_GEOMETRY.bulb;
    let frame, started, visible = false;
    const paint = t => {
      const eased = t * t * (3 - 2 * t);
      bulb.setAttribute('d', from.map((p, i) => `${i ? 'L' : 'M'}${(p[0] + (to[i][0] - p[0]) * eased).toFixed(2)} ${(p[1] + (to[i][1] - p[1]) * eased).toFixed(2)}`).join(' '));
      svg.style.setProperty('--bulb-light', String(Math.max(0, (eased - .65) / .35)));
    };
    const tick = now => {
      if (!visible || reduced.matches) return;
      started ??= now;
      const phase = ((now - started) % 9000) / 9000;
      const t = phase < .12 ? 0 : phase < .4 ? (phase - .12) / .28 : phase < .78 ? 1 : (1 - phase) / .22;
      paint(t); frame = requestAnimationFrame(tick);
    };
    const sync = () => {
      cancelAnimationFrame(frame); started = undefined;
      svg.dataset.animationState = reduced.matches ? 'static' : visible && !document.hidden ? 'running' : 'paused';
      if (reduced.matches) paint(1);
      else if (visible && !document.hidden) frame = requestAnimationFrame(tick);
    };
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, { threshold: .15 }).observe(svg);
    reduced.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    sync();
  }
  const contents = {
    tavole: `<span class="dialog-label">TAVOLE ROTONDE / CONFRONTO TRA PARI</span><h2 id="dialog-title">Mettere le idee<br><em>allo stesso tavolo.</em></h2><p>Professionisti di discipline diverse si incontrano attorno a un tema. Le Tavole Rotonde sono uno spazio di confronto vicino alle mastermind: si condividono esperienze, si discutono prospettive e si costruiscono nuove domande.</p><p>Non un corso frontale. Non un incontro di consulenza clinica. Un’occasione per mettere in relazione competenze che spesso procedono su percorsi separati.</p><p class="dialog-note">Temi, calendario e modalità di partecipazione saranno aggiunti quando definiti. Su questa proposta di sito non sono aperte iscrizioni.</p>`,
    parole: `<span class="dialog-label">OSSERVATORIO / DIREZIONE EDITORIALE 01</span><h2 id="dialog-title">Le parole danno<br><em>forma allo sguardo.</em></h2><p>Come parliamo di salute mentale? Quali parole aiutano a comprendere e quali rischiano di rinforzare stereotipi?</p><p>Un percorso di articoli e interviste per esplorare il rapporto tra linguaggio, stigma e divulgazione, senza rinunciare alla precisione.</p><p class="dialog-note">Questo è uno spunto editoriale, non un articolo già pubblicato. I contenuti dell’Osservatorio sono in preparazione.</p>`,
    ricerca: `<span class="dialog-label">OSSERVATORIO / DIREZIONE EDITORIALE 02</span><h2 id="dialog-title">La ricerca non è<br><em>una scorciatoia.</em></h2><p>Che cosa ci insegna lo studio del sistema nervoso? Che cosa resta incerto? Come distinguere un risultato interessante da una promessa eccessiva?</p><p>Una direzione editoriale dedicata alle neuroscienze e alla salute mentale: metodi, scoperte e limiti della ricerca, raccontati in modo accessibile.</p><p class="dialog-note">Questo è uno spunto editoriale, non un articolo già pubblicato. I contenuti dell’Osservatorio sono in preparazione.</p>`,
    confini: `<span class="dialog-label">OSSERVATORIO / DIREZIONE EDITORIALE 03</span><h2 id="dialog-title">Dove finisce un sapere,<br><em>inizia un dialogo.</em></h2><p>Una stessa domanda può cambiare quando la si osserva attraverso discipline diverse.</p><p>Articoli e interviste per esplorare il confronto tra psichiatria, psicologia e neuroscienze: riconoscere le differenze, trovare connessioni, evitare risposte uniche a domande complesse.</p><p class="dialog-note">Questo è uno spunto editoriale, non un articolo già pubblicato. I contenuti dell’Osservatorio sono in preparazione.</p>`,
    connessione: `<span class="dialog-label">C’È SPAZIO PER UNO SGUARDO IN PIÙ</span><h2 id="dialog-title">Da quale filo<br><em>vuoi partire?</em></h2><p>Puoi esplorare gli incontri tra professionisti o lo spazio editoriale dedicato alla salute mentale.</p><div class="dialog-options"><a class="dialog-jump" href="tavole-rotonde.html">Il confronto delle Tavole Rotonde <span class="thread-icon" aria-hidden="true"></span></a><a class="dialog-jump" href="osservatorio.html">Articoli e interviste dell’Osservatorio <span class="thread-icon" aria-hidden="true"></span></a></div><p class="dialog-note">Questa è una proposta di interfaccia. Prima della pubblicazione saranno inseriti i contatti ufficiali e le modalità di adesione. Non vengono raccolti dati.</p>`
  };
  const dialog = document.querySelector('dialog');
  let opener;
  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-dialog]');
    if (trigger && contents[trigger.dataset.dialog]) {
      if (!dialog.open) opener = trigger;
      document.querySelector('#dialog-content').innerHTML = contents[trigger.dataset.dialog];
      if (!dialog.open) dialog.showModal();
      document.body.classList.add('modal-open');
      document.querySelector('.close-dialog').focus();
    }
    const jump = event.target.closest('[data-jump]');
    if (jump) {
      dialog.close();
      const target = document.getElementById(jump.dataset.jump);
      requestAnimationFrame(() => { target.scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth' }); target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); });
    }
  });
  document.querySelector('.close-dialog')?.addEventListener('click', () => dialog.close());
  dialog?.addEventListener('close', () => { document.body.classList.remove('modal-open'); opener?.focus({ preventScroll: true }); });
  dialog?.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
  });
  const year = document.querySelector('#year');
  if (year) year.textContent = new Date().getFullYear();
})();
