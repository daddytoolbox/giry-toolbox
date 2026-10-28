# Giry toolbox — istruzioni per Claude

App personale (PWA) per genitori e futuri genitori, creata da Marco (account GitHub `daddytoolbox`).
Marchio: "un'app di Giry Corporation™". Pubblicata con GitHub Pages su https://daddytoolbox.github.io/giry-toolbox/ (repository `daddytoolbox/giry-toolbox`, ex `nido`)

## Missione (guida ogni scelta)
Dare a genitori e futuri genitori informazioni **affidabili e imparziali**, in alternativa alla disinformazione e alle pubblicità mascherate dei social. È "l'anti-Instagram per genitori del 2026". Di conseguenza:
- Nessuna pubblicità, nessun link affiliato, nessun prodotto sponsorizzato, nessun tracciamento degli utenti. I link ai prezzi (idealo) sono solo comparatori, senza commissioni.
- Ogni affermazione ha una fonte primaria verificabile (istituzioni, test di laboratorio, riviste peer-reviewed) e una data. Le fonti secondarie (giornali, blog di negozi) servono solo a ritrovare un dato primario, da dichiarare come tali e da sostituire appena possibile.
- Dire chiaramente quando un dato manca, è vecchio o non è verificabile: meglio un "non lo sappiamo" che un consiglio debole.
- Nessun influencer, nessun "lo usano tutti", nessuna classifica basata sulla popolarità.
- Tono sobrio e rispettoso: informare, non spaventare né colpevolizzare.

## Lingua e stile
- Rispondere e scrivere i contenuti in **italiano**.
- Consigli diretti, niente frasi di circostanza, segnalare quando un dato può essere cambiato.
- Contenuti di puericultura: solo fonti autorevoli e citabili (OMS, AAP/HealthyChildren, NHS, Ministero della Salute, ISS, Lullaby Trust, riviste peer-reviewed), con link. Informare, non valutare il singolo caso (no consigli clinici personalizzati).

## Struttura (tutti i file nella radice, niente sottocartelle)
- `index.html` – guscio, barra in alto, `<nav id="tabbar">` riempita da JS
- `app.js` – tutta la logica (router hash `#/oggi`, `#/guide`, `#/guida/<id>`, `#/organizza`, `#/acquisti`, `#/mamma`, `#/papa`, `#/attivita`, `#/vicino`, `#/liste`, `#/profilo`)
- `styles.css` – font Nunito, colori sezione `--c0..--c5`, tema scuro automatico
- `contenuti.json` – tutti i testi: `settimane`, `schede` (guide con fonti), `perTe` (mamma), `attivitaBimbo`, `liste`, `organizza` (stagioni, taglie, consigli smart), `papa`
- `acquisti.json` – Acquisti smart: `aggiornato`, `richiamiVerificati`, `metodo`, `categorie[]` (id, nome, emo, quando, norma, consigli, `gruppi[].scelte[]`, `evitare[]`, fonti; opzionali `nessunTest`, `avviso`), `tessili`, `fontiRichiami`. Ogni scelta: nome, voto, scala ("ADAC" | "Warentest" | "Altroconsumo"), fonte, data ("AAAA-MM"), prezzo, q (ricerca idealo), nota, link, flag `top`/`conv`/`piccolo`, opzionale `prezzoOggi` {valore, data "AAAA-MM-GG"} aggiornato dall'attività settimanale. Ogni voce da evitare: nome, motivo, data, link, `richiamo` (true se richiamo ufficiale)
- `eventi.json` – iniziative locali (per ora Torino), campi: titolo, quando|data, dove, eta ("gravidanza" | "0-3" | "tutti"), tipo, descr, link, gratuito
- `sw.js` – service worker; **incrementare `VERSIONE` (nido-vN) e i `?v=N` in index.html a ogni rilascio**
- `manifest.webmanifest`, `icon-192.png`, `icon-512.png`
- I dati utente stanno in localStorage con prefisso `nido:` (non cambiarlo: si perderebbero profilo e spunte)

## Funzioni chiave
- Profilo: stato (attesa/nato), data presunta o di nascita, sesso (m/f/vuoto), nome, città
- Organizza: stagioni calcolate dalle date; taglie 50→92 con date previste (correzione ±0,25 mesi per sesso, curve OMS); lista regali copiabile
- Vicino a te: Photon (photon.komoot.io/reverse con osm_tag per categoria, 3 richieste in parallelo, timeout 8 s, risultati progressivi, cache 7 giorni). Overpass è stato abbandonato (errore 406).
- Sesso: usato per taglie, igiene al cambio (guida bagnetto), testi e **palette** (richiesta di Marco, ott 2026). Mai rosa/azzurro da cliché né stereotipi nei contenuti.
- Palette: `data-sesso` su `<html>` (funzione `applicaTema` in app.js, aggiorna anche `theme-color`). Senza sesso: corallo originale. Con sesso: base mokka e beige, preferenza di Marco (niente colori accesi). "Mokka e salvia" (m): caffè #6B4F3F, beige, salvia. "Mokka e cipria" (f): caffè #7A5548, beige, rosa cipria/terracotta. Anche `--c0..--c5` sono ritinte in toni spenti; varianti per tema scuro in styles.css.
- Condividi: pulsante in alto e card in Impostazioni. Su telefono apre il pannello nativo (Web Share API); altrimenti un pannello con WhatsApp, Telegram, email, SMS, copia link e codice QR (`qr.png`, generato per l'URL dell'app: rigenerarlo se l'URL cambia).
- Installazione: in Impostazioni pulsante "Installa" (Android, `beforeinstallprompt`) o istruzioni per Safari su iPhone. Il manifest ha le scorciatoie Acquisti, Vicino, Liste.
- Mobile: input a 16 px (niente zoom su iOS), aree sicure, `touch-action: manipulation`, area di tocco minima di 40-52 px, riduzione delle animazioni se richiesta dal sistema. Provare sempre a 360 px di larghezza senza scroll orizzontale.

## Da fare (priorità)
1. **Sezione Acquisti smart** — FATTA (v10, 28/10/2026). Mantenere questi criteri a ogni aggiornamento:
   - Peso massimo ai test di laboratorio indipendenti: ADAC/Stiftung Warentest/TCS/ÖAMTC (seggiolini, maggio e ottobre), Stiftung Warentest, Öko-Test (sostanze nocive), Altroconsumo, Which?
   - Sicurezza: richiami Safety Gate UE (escludere prodotti richiamati)
   - Norme: R129, EN 1888, EN 716, EN 13209, EN 16781; tessili OEKO-TEX 100 classe I, GOTS
   - Prezzo: miglior rapporto punteggio/prezzo (idealo.it)
   - Recensioni utenti: solo come spareggio sui difetti ricorrenti
   - **Zero peso al marchio e alle mode da social.** A parità di qualità, certificazioni e prezzo **preferire marchi piccoli "da intenditori"**; ma dove esistono crash test un piccolo non testato non batte un grande testato.
   - Prime categorie: seggiolino auto, passeggino/trio, culla/next-to-me, marsupio, baby monitor, pannolini. Per tessili: criteri e certificazioni più che modelli.
   - Ogni consiglio: fonte, data del test, fascia di prezzo.
2. **Aggiornamenti automatici** — ATTIVI come attività programmate di Claude: settimanale (lunedì) = richiami Safety Gate, prezzi, eventi family Torino in `eventi.json`; mensile (giorno 2) = nuovi test pubblicati. Culla/next-to-me e baby monitor hanno test vecchi o assenti: priorità quando esce un test nuovo.
3. Eventi locali per altre città, una alla volta.
4. Coerenza con la missione: sostituire le fonti secondarie oggi usate in acquisti.json (blog del negozio mypram per i voti dei passeggini, articoli di giornale per marsupi e seggiolini) con fonti primarie quando accessibili; valutare una pagina "Perché ci puoi credere" (metodo, assenza di conflitti d'interesse, registro delle correzioni).

## Note per l'utente
- Dipendente SSN in esclusiva: prima di qualsiasi monetizzazione serve parere dell'ufficio personale e commercialista.
- Play Store: possibile via Trusted Web Activity; servono dominio proprio o repo `daddytoolbox.github.io` per `assetlinks.json`, test chiuso con 12 tester per 14 giorni.
