// Giry toolbox – server di sincronizzazione (Cloudflare Worker + database D1)
// Da incollare nel pannello Cloudflare: Workers → giry-sync → Modifica codice.
// Serve un collegamento (binding) al database D1 chiamato esattamente DB.
//
// Privacy: i dati arrivano GIÀ CIFRATI dal telefono (AES-GCM). La chiave sta
// nel link d'invito dopo il simbolo #, che il browser non invia mai al server:
// qui si conserva solo un blocco illeggibile. Nessun log, nessun tracciamento.

const ORIGINI = ["https://daddytoolbox.github.io", "http://localhost:8770"];
const MAX = 512 * 1024; // dimensione massima di un profilo cifrato
const ID = /^[A-Za-z0-9_-]{22}$/;

let pronto = false;
async function prepara(db) {
  if (pronto) return;
  await db.prepare("CREATE TABLE IF NOT EXISTS spazi (id TEXT PRIMARY KEY, token TEXT NOT NULL, dati TEXT NOT NULL, rev INTEGER NOT NULL, agg INTEGER NOT NULL)").run();
  pronto = true;
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
      "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin"
    };
    const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" } });
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    const url = new URL(req.url);
    if (url.pathname === "/" || url.pathname === "/ping") return json({ ok: true, servizio: "giry-sync" });
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
