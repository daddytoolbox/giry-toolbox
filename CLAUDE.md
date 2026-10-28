# Giry toolbox — istruzioni per Claude

App personale (PWA) per genitori e futuri genitori, creata da Marco (account GitHub `daddytoolbox`).
Marchio: "un'app di Giry Corporation™". Pubblicata con GitHub Pages su https://daddytoolbox.github.io/giry-toolbox/ (repository `daddytoolbox/giry-toolbox`, ex `nido`)

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
- Palette: `data-sesso` su `<html>` (funzione `applicaTema` in app.js, aggiorna anche `theme-color`). Senza sesso: corallo originale. "Bosco" (m): verde bottiglia #2E6B57, petrolio, ocra. "Prugna" (f): prugna #6E3A6B, bordeaux, ocra. Fondo ispirato a Pantone 2026 Cloud Dancer, tinte da passerelle FW26; anche `--c0..--c5` sono ritinte in toni spenti. Varianti per tema scuro in styles.css.

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

## Note per l'utente
- Dipendente SSN in esclusiva: prima di qualsiasi monetizzazione serve parere dell'ufficio personale e commercialista.
- Play Store: possibile via Trusted Web Activity; servono dominio proprio o repo `daddytoolbox.github.io` per `assetlinks.json`, test chiuso con 12 tester per 14 giorni.
