# Anteprima pubblica di Psicodromica APS

- Sito: https://quipsicocicova.github.io/psicodromica-aps/
- Repository: https://github.com/quipsicocicova/psicodromica-aps

L'anteprima è ospitata su GitHub Pages, dal branch `main`, cartella radice `/`.
Il file `.nojekyll` mantiene la pubblicazione statica senza elaborazione Jekyll.
HTML, CSS, JavaScript, immagini e font sono locali; non serve un backend.

## Aggiornare il sito

1. Modificare i file e verificare il risultato locale con `npm start`.
2. Se cambia la home, sincronizzare `index.html` e `il-filo-animato.html`, poi eseguire `npm run build:palettes`.
3. Se cambia la geometria canonica, eseguire `npm run build:geometry`.
4. Eseguire `npm test` con il server locale acceso.
5. Controllare il diff, creare un commit e pubblicarlo sul branch `main`.
6. Attendere il completamento della pubblicazione Pages prima di verificare il link pubblico.

Le modifiche salvate soltanto sul computer non aggiornano il sito pubblico.

## Materiale escluso dal repository

`.gitignore` esclude dipendenze, screenshot di lavoro, ZIP e backup, log,
configurazioni locali e lo strumento privato di caricamento del riferimento.
L'illustrazione di riferimento originale non fa parte delle risorse del sito.

## Stato dell'anteprima

Le fotografie del team sono dimostrative e le pagine editoriali sono anteprime,
come indicato sul sito. Non rappresentano persone o articoli dell'associazione.
Il modulo Iscrizione prepara solo una copia locale: non invia dati né conferma
un'iscrizione. Per attivare l'invio e trasformare questa anteprima in un sito
ufficiale servono materiali approvati, servizio di ricezione verificato,
contatti ufficiali e informativa privacy.
