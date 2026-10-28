# Giry toolbox — istruzioni per Claude

App personale (PWA) per genitori e futuri genitori, creata da Marco (account GitHub `daddytoolbox`).
Marchio: "un'app di Giry Corporation™". Pubblicata con GitHub Pages su https://daddytoolbox.github.io/giry-toolbox/

## Lingua e stile
- Rispondere e scrivere i contenuti in **italiano**.
- Consigli diretti, niente frasi di circostanza, segnalare quando un dato può essere cambiato.
- Contenuti di puericultura: solo fonti autorevoli e citabili (OMS, AAP/HealthyChildren, NHS, Ministero della Salute, ISS, Lullaby Trust, riviste peer-reviewed), con link. Informare, non valutare il singolo caso (no consigli clinici personalizzati).

## Struttura (tutti i file nella radice, niente sottocartelle)
- `index.html` – guscio, barra in alto, `<nav id="tabbar">` riempita da JS
- `app.js` – tutta la logica (router hash `#/oggi`, `#/guide`, `#/guida/<id>`, `#/organizza`, `#/mamma`, `#/papa`, `#/attivita`, `#/vicino`, `#/liste`, `#/profilo`)
- `styles.css` – font Nunito, colori sezione `--c0..--c5`, tema scuro automatico
- `contenuti.json` – tutti i testi: `settimane`, `schede` (guide con fonti), `perTe` (mamma), `attivitaBimbo`, `liste`, `organizza` (stagioni, taglie, consigli smart), `papa`
- `eventi.json` – iniziative locali (per ora Torino), campi: titolo, quando|data, dove, eta ("gravidanza" | "0-3" | "tutti"), tipo, descr, link, gratuito
- `sw.js` – service worker; **incrementare `VERSIONE` (nido-vN) e i `?v=N` in index.html a ogni rilascio**
- `manifest.webmanifest`, `icon-192.png`, `icon-512.png`
- I dati utente stanno in localStorage con prefisso `nido:` (non cambiarlo: si perderebbero profilo e spunte)

## Funzioni chiave
- Profilo: stato (attesa/nato), data presunta o di nascita, sesso (m/f/vuoto), nome, città
- Organizza: stagioni calcolate dalle date; taglie 50→92 con date previste (correzione ±0,25 mesi per sesso, curve OMS); lista regali copiabile
- Vicino a te: Photon (photon.komoot.io/reverse con osm_tag per categoria, 3 richieste in parallelo, timeout 8 s, risultati progressivi, cache 7 giorni). Overpass è stato abbandonato (errore 406).
- Sesso: usato solo per taglie, igiene al cambio (guida bagnetto) e testi. Mai per colori o stereotipi.

## Da fare (priorità)
1. **Sezione Acquisti smart** (valore aggiunto dell'app). Criteri:
   - Peso massimo ai test di laboratorio indipendenti: ADAC/Stiftung Warentest/TCS/ÖAMTC (seggiolini, maggio e ottobre), Stiftung Warentest, Öko-Test (sostanze nocive), Altroconsumo, Which?
   - Sicurezza: richiami Safety Gate UE (escludere prodotti richiamati)
   - Norme: R129, EN 1888, EN 716, EN 13209, EN 16781; tessili OEKO-TEX 100 classe I, GOTS
   - Prezzo: miglior rapporto punteggio/prezzo (idealo.it)
   - Recensioni utenti: solo come spareggio sui difetti ricorrenti
   - **Zero peso al marchio e alle mode da social.** A parità di qualità, certificazioni e prezzo **preferire marchi piccoli "da intenditori"**; ma dove esistono crash test un piccolo non testato non batte un grande testato.
   - Prime categorie: seggiolino auto, passeggino/trio, culla/next-to-me, marsupio, baby monitor, pannolini. Per tessili: criteri e certificazioni più che modelli.
   - Ogni consiglio: fonte, data del test, fascia di prezzo.
2. **Aggiornamenti automatici** (attività programmate): settimanale = richiami Safety Gate, prezzi, eventi family Torino in `eventi.json`; mensile = nuovi test pubblicati.
3. Eventi locali per altre città, una alla volta.

## Note per l'utente
- Dipendente SSN in esclusiva: prima di qualsiasi monetizzazione serve parere dell'ufficio personale e commercialista.
- Play Store: possibile via Trusted Web Activity; servono dominio proprio o repo `daddytoolbox.github.io` per `assetlinks.json`, test chiuso con 12 tester per 14 giorni.
