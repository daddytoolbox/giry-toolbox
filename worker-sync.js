// Giry toolbox – server di sincronizzazione (Cloudflare Worker + database D1)
// Da incollare nel pannello Cloudflare: Workers → giry-sync → Modifica codice.
// Serve un collegamento (binding) al database D1 chiamato esattamente DB.
//
// Privacy: i dati arrivano GIÀ CIFRATI dal telefono (AES-GCM). La chiave sta
// nel link d'invito dopo il simbolo #, che il browser non invia mai al server:
// qui si conserva solo un blocco illeggibile. Nessun log, nessun tracciamento.
//
// Richieste di nuove province (POST /richiesta): arriva SOLO la sigla della
// provincia e il suo nome. Si conserva un contatore per provincia e, alla prima
// richiesta, si apre una segnalazione (issue) su GitHub per avvisare Marco.
// Serve il segreto GITHUB_TOKEN (token con permesso Issues: lettura e scrittura
// solo sul repository giry-toolbox). Senza token le richieste vengono comunque
// contate e la segnalazione parte alla richiesta successiva dopo la configurazione.

const ORIGINI = ["https://daddytoolbox.github.io", "http://localhost:8770"];
const MAX = 512 * 1024; // dimensione massima di un profilo cifrato
const ID = /^[A-Za-z0-9_-]{22}$/;
const REPO = "daddytoolbox/giry-toolbox";
const MAX_NUOVE_AL_GIORNO = 10; // protezione anti-abuso: nuove segnalazioni al massimo al giorno

let pronto = false;
async function prepara(db) {
  if (pronto) return;
  await db.prepare("CREATE TABLE IF NOT EXISTS spazi (id TEXT PRIMARY KEY, token TEXT NOT NULL, dati TEXT NOT NULL, rev INTEGER NOT NULL, agg INTEGER NOT NULL)").run();
  await db.prepare("CREATE TABLE IF NOT EXISTS richieste (prov TEXT PRIMARY KEY, nome TEXT NOT NULL, n INTEGER NOT NULL, issue INTEGER, creato INTEGER NOT NULL, agg INTEGER NOT NULL)").run();
  pronto = true;
}
async function github(env, metodo, percorso, corpo) {
  const r = await fetch(`https://api.github.com/repos/${REPO}${percorso}`, {
    method: metodo,
    headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: "application/vnd.github+json", "User-Agent": "giry-sync", "Content-Type": "application/json" },
    body: JSON.stringify(corpo)
  });
  if (!r.ok) throw new Error("github " + r.status);
  return r.json();
}
const titolo = (nome, prov, n) => `[Provincia] ${nome} (${prov}) · ${n} ${n === 1 ? "richiesta" : "richieste"}`;
async function richiesta(req, env, json) {
  let c; try { c = await req.json(); } catch { return json({ errore: "formato non valido" }, 400); }
  const prov = String(c.prov || "").toUpperCase();
  const nome = String(c.nome || "").replace(/[^\p{L}\p{M} '’-]/gu, "").trim().slice(0, 40) || prov;
  if (!/^[A-Z]{2}$/.test(prov)) return json({ errore: "provincia non valida" }, 400);
  const ora = Date.now();
  let r = await env.DB.prepare("SELECT n, issue FROM richieste WHERE prov = ?").bind(prov).first();
  if (r) await env.DB.prepare("UPDATE richieste SET n = n + 1, agg = ? WHERE prov = ?").bind(ora, prov).run();
  else await env.DB.prepare("INSERT INTO richieste (prov, nome, n, issue, creato, agg) VALUES (?, ?, 1, NULL, ?, ?)").bind(prov, nome, ora, ora).run();
  const n = r ? r.n + 1 : 1;
  if (!env.GITHUB_TOKEN) return json({ ok: true, n });
  try {
    if (r && r.issue) {
      // stessa provincia: aggiorna solo il contatore nel titolo (nessuna nuova notifica)
      await github(env, "PATCH", `/issues/${r.issue}`, { title: titolo(nome, prov, n) });
    } else {
      const oggi = await env.DB.prepare("SELECT COUNT(*) AS k FROM richieste WHERE issue IS NOT NULL AND creato > ?").bind(ora - 86400000).first();
      if ((oggi?.k || 0) < MAX_NUOVE_AL_GIORNO) {
        const i = await github(env, "POST", "/issues", {
          title: titolo(nome, prov, n),
          body: `Qualcuno ha chiesto le attività per **${nome} (${prov})** dall'app.\n\nL'aggiornamento settimanale preparerà le risorse stabili per questa provincia (consultori e corsi preparto, biblioteche con Nati per Leggere, ludoteche e centri per le famiglie, musei con laboratori, piscine con acquaticità) e chiuderà questa segnalazione.\n\nPer rifiutarla basta chiuderla con un commento.\n\n_Dati ricevuti: solo sigla e nome della provincia._`
        });
        await env.DB.prepare("UPDATE richieste SET issue = ? WHERE prov = ?").bind(i.number, prov).run();
      }
    }
  } catch { /* GitHub non raggiungibile: il contatore resta, si riprova alla prossima richiesta */ }
  return json({ ok: true, n });
}
async function sha256(t) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
}

export default {
  async fetch(req, env) {
    const origine = req.headers.get("Origin") || "";
    const cors = {
      "Access-Control-Allow-Origin": ORIGINI.includes(origine) ? origine : ORIGINI[0],
      "Access-Control-Allow-Methods": "GET, PUT, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin"
    };
    const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" } });
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    const url = new URL(req.url);
    if (url.pathname === "/" || url.pathname === "/ping") return json({ ok: true, servizio: "giry-sync", segnalazioni: !!env.GITHUB_TOKEN });
    if (url.pathname === "/richiesta") {
      if (req.method !== "POST") return json({ errore: "metodo non ammesso" }, 405);
      if (!env.DB) return json({ errore: "database non collegato: aggiungi il binding D1 chiamato DB" }, 500);
      await prepara(env.DB);
      return richiesta(req, env, json);
    }
    const m = url.pathname.match(/^\/s\/([^/]+)$/);
    if (!m || !ID.test(m[1])) return json({ errore: "non trovato" }, 404);
    if (!env.DB) return json({ errore: "database non collegato: aggiungi il binding D1 chiamato DB" }, 500);
    await prepara(env.DB);
    const id = m[1];
    const riga = await env.DB.prepare("SELECT token, dati, rev, agg FROM spazi WHERE id = ?").bind(id).first();

    if (req.method === "GET") {
      if (!riga) return json({ errore: "non trovato" }, 404);
      if (url.searchParams.get("rev") === String(riga.rev)) return json({ rev: riga.rev, uguale: true });
      return json({ rev: riga.rev, agg: riga.agg, dati: riga.dati });
    }

    const tok = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    if (tok.length < 20) return json({ errore: "autorizzazione mancante" }, 401);
    const h = await sha256(tok);

    if (req.method === "PUT") {
      const testo = await req.text();
      if (testo.length > MAX) return json({ errore: "troppo grande" }, 413);
      let corpo; try { corpo = JSON.parse(testo); } catch { return json({ errore: "formato non valido" }, 400); }
      if (typeof corpo.dati !== "string" || !corpo.dati) return json({ errore: "dati mancanti" }, 400);
      const ora = Date.now();
      if (!riga) {
        await env.DB.prepare("INSERT INTO spazi (id, token, dati, rev, agg) VALUES (?, ?, ?, 1, ?)").bind(id, h, corpo.dati, ora).run();
        return json({ rev: 1 }, 201);
      }
      if (riga.token !== h) return json({ errore: "non autorizzato" }, 403);
      // aggiornamento solo se nessuno ha scritto nel frattempo (altrimenti il telefono riunisce e riprova)
      if (Number.isInteger(corpo.rev) && corpo.rev !== riga.rev) return json({ errore: "conflitto", rev: riga.rev, dati: riga.dati }, 409);
      const r = await env.DB.prepare("UPDATE spazi SET dati = ?, rev = rev + 1, agg = ? WHERE id = ? AND rev = ?").bind(corpo.dati, ora, id, riga.rev).run();
      if (!r.meta || r.meta.changes !== 1) {
        const ora2 = await env.DB.prepare("SELECT dati, rev FROM spazi WHERE id = ?").bind(id).first();
        return json({ errore: "conflitto", rev: ora2.rev, dati: ora2.dati }, 409);
      }
      return json({ rev: riga.rev + 1 });
    }

    if (req.method === "DELETE") {
      if (!riga) return json({ ok: true });
      if (riga.token !== h) return json({ errore: "non autorizzato" }, 403);
      await env.DB.prepare("DELETE FROM spazi WHERE id = ?").bind(id).run();
      return json({ ok: true });
    }
    return json({ errore: "metodo non ammesso" }, 405);
  }
};
