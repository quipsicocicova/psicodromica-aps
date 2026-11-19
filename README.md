# Psicodromica APS — Il filo che ci unisce (v6)

Sito narrativo autonomo, senza risorse esterne per i visitatori. Versioni precedenti conservate separatamente.

**Anteprima condivisibile:** https://quipsicocicova.github.io/psicodromica-aps/

Pubblicazione su GitHub Pages dal branch `main`. Istruzioni e stato dell’anteprima in [PUBBLICAZIONE.md](PUBBLICAZIONE.md).

## Racconto e testi

Otto passaggi visivi: cervello → occhio → persone → città → tavolo rotondo → intreccio → ingranaggio → logo originale. Lo scroll verticale guida un viaggio orizzontale reversibile; tempi e comportamento dello scorrimento nativo sono invariati.

I testi aggiornati seguono questa sequenza:

1. «Da dove si comincia a parlare di salute mentale?»; «Da quello che accade nel cervello.»; «Ma non basta.»
2. «Le neuroscienze hanno bisogno di allargare lo sguardo.»
3. «Alle persone. Alle relazioni.»
4. «Alle condizioni in cui la vita prende forma.» — sulla skyline, che viene conservata.
5. «Mettiamo allo stesso tavolo discipline diverse...»
6. «... perché ciascuna possa fare domande che da sole non si sarebbero poste.»
7. «Creando l’incastro perfetto tra tante prospettive diverse.»; sotto, in maiuscoletto grassetto: «perché anche le altre discipline hanno bisogno di più neuroscienze ;)».
8. «Psicodromica APS. Neuroscienze applicate: discipline in dialogo, pensiero in movimento».

APS è in apice nelle occorrenze visibili del nome. Il sottotitolo finale compare una volta sola. Il racconto illustra una visione, non ricostruisce episodi storici della fondazione.

## Disegni e movimento

- Una linea forma il cervello in circa 1,9 secondi; comandi e scroll possono interromperla liberamente. Il cervello riprende le curve intrecciate del riferimento privato, ridisegnate in vettoriale. L’immagine caricata non è inclusa nelle risorse pubbliche o negli ZIP.
- L’occhio ha una pupilla e un riflesso su un layer separato.
- Le tre nuvole restano ovali, piene, senza bordo, coda o nomi: ciascuna ha un colore distinto nella palette corrente. Medicina: bastone di Asclepio con un solo serpente, testa e occhio, senza ali. Gli altri simboli sono Ψ e un neurone.
- Le finestre della città si accendono progressivamente anche a scroll fermo; uscire azzera e rientrare riavvia l’effetto. Dimensioni, posizioni e luce soffusa sono conservate.
- Il tavolo mantiene otto sedie semicircolari vicine al bordo e un punto centrale diffuso/pulsante. È stato anticipato rispetto all’intreccio per accompagnare il nuovo testo sul tavolo.
- L’ingranaggio approvato nel settimo passaggio è invariato punto per punto. Nella chiusura accelera per due giri, emette alone e scintille e si trasforma nel logo, in un ciclo totale di 2,8 secondi. Il contorno si apre nella metà-ingranaggio; compaiono il riempimento e le ramificazioni, rivelate dal centro verso sinistra. I due tracciati finali sono copiati esattamente da `assets/logo-psicodromica.svg`, non ridisegnati. La colorazione segue la palette.
- Tornare indietro annulla la trasformazione e ripristina l’ingranaggio. Replay riavvia anche la formazione del cervello. Un resize durante il morph non interrompe la figura.
- Con movimento ridotto le figure sono complete e statiche, senza spin, scintille, pulsazione o formazione iniziale; l’ultimo passaggio mostra direttamente il logo.

`narrative.js` interpola un unico filo di 1600 punti, con layer indipendenti per i dettagli. `narrative.css` isola il layout; `experience.css` definisce header persistente, layer e gerarchie finali. La geometria canonica di tavolo e ingranaggio resta quella approvata, anche se l’ordine narrativo è cambiato: ora tra le due figure c’è l’intreccio.

## Quattro palette, un solo sito

La homepage principale parte da **Bosco** (verde scuro, acqua quasi fluo, giallo vivo). Il controllo **Colori** offre quattro pulsanti, ciascuno attivabile con un click:

- Bosco: verde scuro / acqua / giallo.
- Originale: blu notte / arancione / azzurro carta da zucchero (i colori iniziali).
- Blu e rosso: blu notte / ceruleo / rosso.
- Nero: nero / ocra / bordeaux.

Il controllo è nell’header; sul telefono si trova dentro **Menu**. È presente anche nelle pagine interne. Non ricarica la pagina, non cambia contenuti, geometria o scroll. Pulsanti nativi con nomi accessibili, indicatore di selezione, `aria-pressed`, focus visibile e annuncio del cambio. Frecce sul controllo non attivano i comandi del racconto.

`theme.js` imposta il tema prima del primo paint e monta il selettore. La preferenza viene conservata nel browser sotto `psicodromica-palette` (solo l’identificativo del colore, mai dati del modulo). Storage non disponibile: il cambio sulla pagina funziona comunque. `palette-variants.css` contiene esclusivamente colori; `theme.css` aggiunge selettore e adattamenti cromatici delle pagine interne. Contrasto dei pulsanti e dei simboli verificato nelle quattro palette.

Le pagine `home-bosco.html`, `home-originale.html`, `home-blu-rosso.html` e `home-nero.html` restano ingressi di anteprima con lo stesso selettore. Una preferenza già salvata ha precedenza. Prugna e Carta sono state rimosse. Rigenerare le copie dopo ogni modifica della home:

```sh
npm run build:palettes
```

## Aprire il sito

Aprire `index.html` o `il-filo-animato.html` direttamente nel browser. Per lo ZIP estrarre l’intera cartella, mantenendo tutti i file e `assets/` insieme. Nessuna installazione o connessione necessaria.

Anteprima di sviluppo con Node.js 20.11 o successivo:

```sh
npm start
```

http://localhost:5176; server disponibile anche sulla rete locale, porta configurabile tramite `PORT`.

- Un solo header persistente; «Salta il racconto» diventa «Rivedi il racconto» dopo l’ingresso nel sito. Menu mobile chiudibile con Escape.
- Navigazione anche con numeri dei capitoli, avanti/indietro, tastiera, trackpad e swipe. Alternativa statica con movimento ridotto.
- Solo due iniziative: Tavole Rotonde e Osservatorio. Le pagine editoriali sono anteprime dimostrative, non articoli pubblicati.
- About introduce il significato del manifesto con un breve paragrafo e quattro valori animati: Contaminazione, Curiosità, Rigore scientifico (lente d’ingrandimento) e Concretezza (muretto di mattoni, non più scala). Due link alle iniziative, sette schede team dimostrative e invito finale all’iscrizione. Le foto non ritraggono i membri reali: provenienza in `assets/portraits/README.md`.
- Nella testata Iscrizione solo «tu» usa il colore d’accento, non la seconda riga intera.
- Il box di avviso sopra il modulo è stato rimosso. Una nota discreta accanto al pulsante spiega che viene preparata una copia locale, senza invio all’associazione; restano dettagli privacy e stato esplicito del risultato. Il modulo valida i dati e prepara una sintesi sicura tramite `textContent` e un TXT locale, esplicitamente NON inviato. Nessun POST, cookie o persistenza dei dati personali. Per attivare l’invio servono destinazione verificata e informativa privacy ufficiale; nessun pagamento è configurato.
- Il footer contiene logo, credito, collegamento/replay, paragrafo unico associazione/disclaimer e copyright allineato a destra.

## Geometria precalcolata

`assets/thread-geometry.js` contiene sette figure canoniche da 1600 punti, il contorno del logo da 1600 punti e i due tracciati originali del simbolo, le forme della lampadina da 240 punti e del manifesto da 280. Nessuna chiamata runtime a `getPointAtLength()`. I layer finali non richiedono fetch, quindi funzionano anche con `file://`.

Per aggiornare le forme, modificare `geometry-source.mjs` e rigenerare; il contorno finale viene campionato direttamente dall’asset originale:

```sh
npm run build:geometry
```

Playwright/Chromium sono necessari soltanto durante sviluppo/generazione. L’avvio è controllato con CPU rallentata 4×: niente misurazioni SVG complesse nel browser del visitatore. Le misure sono di laboratorio, non garanzie per ogni rete o dispositivo.

## Ultime rifiniture

`polish.css` aumenta il tracking dei titoli di appena .005em rispetto ai valori precedenti e alza il nome della wordmark di 2px. «Discipline in dialogo, pensiero in movimento.» è il cappello della sezione di arrivo; il titolo va a capo dopo «Le idee» e dopo «non vivono», poi «da sole.» e «Nemmeno noi.». La nota del settimo passaggio è in maiuscoletto (`all-small-caps`) grassetto.

`paths.js` anima singolarmente i quattro box della home: inizialmente compare un filo davvero rettilineo; gli stessi 161 punti si trasformano nella struttura della scheda mentre emerge il contenuto. Non è un rettangolo già pronto svelato con il tratteggio. Il tracciato transitorio è neutro, sfuma e viene nascosto: nessuna cornice colorata permanente, restano solo i divisori sottili originali. Attivazione all’ingresso nel viewport, senza modificare lo scroll; focus da tastiera rivela subito il box. Con movimento ridotto i box sono statici e subito leggibili; senza JS il contenuto resta normalmente visibile. I tracciati finali del manifesto usano le curve originali durante la pausa, mantenendo netti gli angoli dei mattoni senza misurazioni SVG runtime.

`table.js` usa gli stessi 1600 punti del tavolo del racconto (`geometry.narrative[5]`): cerchio, otto sedie semicircolari ravvicinate e punto centrale pulsante. Una linea si trasforma nel tavolo completo, con pausa e ritorno; niente vecchio tavolo allungato o sedie rettangolari. L’animazione si ferma fuori vista/a scheda nascosta e mostra il tavolo completo con movimento ridotto.

Le testate interne includono il simbolo originale accanto al nome. L’immagine HTML resta come fallback senza JavaScript; `theme.js` riusa i due vettori precalcolati in un SVG `currentColor`, leggibile sul fondo chiaro e adattato alla palette. Non sono necessarie nuove richieste di rete. Il layout statico del racconto è largo un solo viewport, così il payoff resta leggibile anche con movimento ridotto.

## Test

Con il server acceso:

```sh
npm ci
npx playwright install chromium
npm test
```

- `startup.test.mjs`: avvio CPU 4× e durata massima dei task.
- `test.mjs`: testi, otto forme, transizioni, navigazione, reversibilità, sette viewport, nove pagine, APS, font, foto e footer.
- `community.test.mjs`: manifesto, CTA About, enfasi solo su «tu», validazione/sintesi/download sicuri e nessun invio o salvataggio del modulo.
- `effects.test.mjs`: formazione, tre nuvole, medicina, finestre temporizzate, sedie semicircolari, hash dell’ingranaggio approvato, alone/scintille, header/replay e movimento ridotto.
- `polish.test.mjs`: palette originale, tracking minimo, allineamento wordmark, nuovo payoff/cappello, nota responsive, box dal filo e fallback tastiera/movimento ridotto, quattro valori/lente/mattoni, modulo senza box di avviso e ARIA valido.
- `theme-logo.test.mjs`: quattro palette in un click senza spostare il racconto, preferenza tra pagine, contrasto, nuvole distinte, tracciati originali del logo, resize durante il morph, ritorno all’ingranaggio, selettore responsive e storage bloccato.

Verifica di una cartella ZIP estratta, browser offline, senza disabilitare la sicurezza:

```sh
OFFLINE_DIR=/percorso/psicodromica-aps-quattro-palette npm run test:offline
OFFLINE_DIR=/percorso/psicodromica-aps-quattro-palette node theme-logo.test.mjs
OFFLINE_DIR=/percorso/psicodromica-aps-quattro-palette node polish.test.mjs
```

Controllati navigazione, font e immagini locali, effetti, selettore, persistenza e assenza di richieste remote o errori. Screenshot di sviluppo in `artifacts/`, non inclusi nello ZIP.

Font Raleway locale, licenza SIL OFL inclusa. Prima della pubblicazione: materiali reali del team, testi approvati, contatti ufficiali, calendario, servizio di ricezione e informativa privacy.
