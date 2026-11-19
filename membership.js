'use strict';
(() => {
  const form = document.querySelector('#membership-form');
  if (!form) return;
  const result = document.querySelector('#membership-result');
  const summary = document.querySelector('#membership-summary');
  const download = document.querySelector('#download-request');
  let objectURL;
  function clearResult() {
    result.hidden = true;
    summary.replaceChildren();
    download.removeAttribute('href');
    if (objectURL) URL.revokeObjectURL(objectURL);
    objectURL = undefined;
  }
  form.querySelector('[type="submit"]').disabled = false;
  form.addEventListener('input', event => {
    event.target.setCustomValidity?.('');
    clearResult();
  });
  form.addEventListener('change', clearResult);
  form.addEventListener('submit', event => {
    event.preventDefault();
    for (const name of ['nome', 'cognome']) {
      const input = form.elements.namedItem(name);
      input.value = input.value.trim();
      input.setCustomValidity(input.value ? '' : 'Inserisci questo dato per continuare.');
    }
    if (!form.reportValidity()) return;
    clearResult();
    const data = new FormData(form);
    const entries = [
      ['Nome', data.get('nome').trim()],
      ['Cognome', data.get('cognome').trim()],
      ['Email', data.get('email').trim()],
      ['Ambito di interesse', data.get('ambito') || 'Non indicato'],
      ['Motivazione', data.get('motivazione').trim() || 'Non indicata']
    ];
    for (const [label, value] of entries) {
      const dt = document.createElement('dt'), dd = document.createElement('dd');
      dt.textContent = label; dd.textContent = value;
      summary.append(dt, dd);
    }
    // Local preparation only. No endpoint or privacy policy has been supplied:
    // never simulate a successful submission and never persist personal data.
    const text = ['RICHIESTA DI ISCRIZIONE A PSICODROMICA APS', 'COPIA LOCALE — NON INVIATA', '', ...entries.map(([label, value]) => `${label}: ${value}`), '', 'La richiesta non comporta iscrizione automatica o pagamento.', 'L’associazione dovrà ricevere la richiesta e ricontattare la persona per confermare l’iscrizione.'].join('\n');
    objectURL = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    download.href = objectURL;
    result.hidden = false;
    document.querySelector('#result-title').focus({ preventScroll: true });
    result.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  });
  document.querySelector('#edit-request').addEventListener('click', () => {
    clearResult();
    document.querySelector('#first-name').focus();
  });
  form.addEventListener('reset', clearResult);
  addEventListener('pagehide', () => { if (objectURL) URL.revokeObjectURL(objectURL); });
  addEventListener('pageshow', event => { if (event.persisted) clearResult(); });
})();
