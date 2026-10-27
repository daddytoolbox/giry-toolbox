/* Nido – PWA per genitori e futuri genitori */
(() => {
  "use strict";

  const $app = document.getElementById("app");
  const DAY = 86400000;
  let C = null;      // contenuti
  let E = null;      // eventi

  // ---------- storage sicuro ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem("nido:" + k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem("nido:" + k, JSON.stringify(v)); } catch {} }
  };

  // ---------- utilità ----------
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  function rich(lines) {
    let html = "", inList = false;
    for (const l of lines) {
      if (l.startsWith("- ")) {
        if (!inList) { html += "<ul>"; inList = true; }
        html += `<li>${inline(l.slice(2))}</li>`;
      } else {
        if (inList) { html += "</ul>"; inList = false; }
        html += `<p>${inline(l)}</p>`;
      }
    }
    return html + (inList ? "</ul>" : "");
  }
  const fonti = list => !list?.length ? "" : `
    <div class="card sources"><strong>Fonti</strong><ol>
      ${list.map(f => `<li><a href="${esc(f.u)}" target="_blank" rel="noopener">${esc(f.t)}</a></li>`).join("")}
    </ol></div>`;
  const fmtData = iso => new Date(iso + "T12:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });

  // ---------- marchio ----------
  const giry = (cls = "") => `<div class="giry ${cls}" aria-label="Giry Corporation">
    <svg class="giry-mark" viewBox="0 0 48 48" aria-hidden="true">
      <defs><linearGradient id="gg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E9825B"/><stop offset="1" stop-color="#C85B6B"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#gg)"/>
      <path d="M33.5 17.5A11 11 0 1 0 35 26h-10" fill="none" stroke="#FFF8EE" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M31.5 9.5l1.2 2.6 2.8.4-2 2 .5 2.8-2.5-1.3-2.5 1.3.5-2.8-2-2 2.8-.4z" fill="#FFE2A8"/>
    </svg>
    <div class="giry-text"><span class="giry-name">Giry</span><span class="giry-sub">Corporation<sup>™</sup></span></div>
  </div>`;

  // ---------- fase corrente ----------
  function fase() {
    const p = store.get("profilo", null);
    if (!p?.data) return null;
    const oggi = new Date(); oggi.setHours(12, 0, 0, 0);
    const rif = new Date(p.data + "T12:00:00");
    if (p.stato === "attesa") {
      const giorniAlParto = Math.round((rif - oggi) / DAY);
      if (giorniAlParto < -14) {
        // data presunta passata da più di due settimane: suggerisci di aggiornare
        return { stato: "attesa", settimana: 42, scaduta: true, giorni: giorniAlParto, p };
      }
      const giorniGest = 280 - giorniAlParto;
      const settimana = Math.max(0, Math.floor(giorniGest / 7));
      const giorno = Math.max(0, giorniGest % 7);
      const trimestre = settimana < 14 ? 1 : settimana < 28 ? 2 : 3;
      return { stato: "attesa", settimana, giorno, trimestre, giorni: giorniAlParto, p };
    }
    const giorniVita = Math.max(0, Math.round((oggi - rif) / DAY));
    const settimane = Math.floor(giorniVita / 7);
    const mesi = giorniVita / 30.44;
    return { stato: "nato", settimane, mesi, giorni: giorniVita, p };
  }

  function etichettaFase(f) {
    if (f.stato === "attesa") {
      if (f.scaduta) return "La data presunta è passata";
      return `${f.settimana}ª settimana${f.giorno ? ` + ${f.giorno}` : ""}`;
    }
    if (f.settimane < 9) return f.settimane === 0 ? `${f.giorni} giorni` : `${f.settimane} settimane`;
    const m = Math.floor(f.mesi);
    if (m < 24) return `${m} mesi`;
    const a = Math.floor(m / 12), r = m % 12;
    return `${a} anni${r ? ` e ${r} mesi` : ""}`;
  }

  // ---------- caricamento dati ----------
  async function carica() {
    const get = async u => (await fetch(u, { cache: "no-cache" })).json();
    try { C = await get("contenuti.json"); } catch { C = null; }
    try { E = await get("eventi.json"); } catch { E = { eventi: [] }; }
  }

  // ---------- viste ----------
  function vistaProfilo(primoAvvio) {
    const p = store.get("profilo", { stato: "attesa", data: "", nome: "", citta: "Torino" });
    $app.innerHTML = `
      ${primoAvvio ? `<p class="eyebrow">Benvenuti</p><h1>Il vostro nido</h1>
      <p class="lead">Due informazioni e l'app si adatta da sola, settimana dopo settimana.</p>`
      : `<a class="back" href="#/oggi">← Indietro</a><h1>Impostazioni</h1>`}
      <form id="f" class="card">
        <label>Situazione</label>
        <div class="seg">
          <label><input type="radio" name="stato" value="attesa" ${p.stato === "attesa" ? "checked" : ""}><span>In attesa</span></label>
          <label><input type="radio" name="stato" value="nato" ${p.stato === "nato" ? "checked" : ""}><span>È nato</span></label>
        </div>
        <label for="data" id="lbl-data">${p.stato === "nato" ? "Data di nascita" : "Data presunta del parto"}</label>
        <input type="date" id="data" name="data" value="${esc(p.data)}" required>
        <label for="nome">Nome del bimbo o soprannome <span style="color:var(--ink-2);font-weight:400">(facoltativo)</span></label>
        <input type="text" id="nome" name="nome" value="${esc(p.nome)}" placeholder="Es. Fagiolino" maxlength="30">
        <label for="citta">Città</label>
        <input type="text" id="citta" name="citta" value="${esc(p.citta || "Torino")}">
        <button class="btn" type="submit">${primoAvvio ? "Iniziamo" : "Salva"}</button>
        ${primoAvvio ? "" : `<button class="btn ghost" type="button" id="reset">Azzera le liste spuntate</button>`}
      </form>
      <p class="foot">I dati restano solo su questo telefono.</p>
      <div class="made"><span>un'app di</span>${giry()}</div>`;
    const f = document.getElementById("f");
    f.addEventListener("change", e => {
      if (e.target.name === "stato") document.getElementById("lbl-data").textContent = e.target.value === "nato" ? "Data di nascita" : "Data presunta del parto";
    });
    f.addEventListener("submit", e => {
      e.preventDefault();
      const d = new FormData(f);
      store.set("profilo", { stato: d.get("stato"), data: d.get("data"), nome: (d.get("nome") || "").trim(), citta: (d.get("citta") || "").trim() });
      location.hash = "#/oggi";
      render();
    });
    document.getElementById("reset")?.addEventListener("click", () => {
      if (confirm("Vuoi togliere tutte le spunte dalle liste?")) { store.set("check", {}); alert("Fatto."); }
    });
  }

  function bloccoSettimana(f) {
    const chiave = f.stato === "attesa" ? f.settimana : f.settimane;
    return C.settimane.find(s => s.stato === f.stato && chiave >= s.da && chiave <= s.a);
  }

  function vistaOggi(f) {
    const p = f.p;
    const s = bloccoSettimana(f);
    const deco = `<svg class="hero-deco" viewBox="0 0 200 200" aria-hidden="true">
      <circle cx="160" cy="30" r="70" fill="currentColor" opacity=".10"/>
      <circle cx="190" cy="150" r="46" fill="currentColor" opacity=".08"/>
    </svg>`;
    let hero;
    if (f.stato === "attesa") {
      const pct = Math.min(100, Math.round((f.settimana * 7 + (f.giorno || 0)) / 280 * 100));
      const mancano = f.giorni > 0 ? `Mancano circa <strong>${f.giorni} giorni</strong>` : "Ci siamo quasi";
      hero = `<section class="hero">${deco}
        <p class="eyebrow">${f.scaduta ? "" : `${f.trimestre}º trimestre · `}${esc(p.nome || "In arrivo")}</p>
        ${f.scaduta ? `<h1>${etichettaFase(f)}</h1>
          <p class="hero-sub">È nato? Aggiorna la data nelle <a href="#/profilo">impostazioni</a>.</p>` : `
        <div class="hero-row">
          <div><div class="big">${f.settimana}<sup>ª</sup></div><p class="unit">settimana${f.giorno ? ` + ${f.giorno} giorni` : ""}</p></div>
          <div class="ring" style="--p:${pct}"><span>${pct}<small>%</small></span></div>
        </div>
        <p class="hero-sub">${mancano}</p>`}
      </section>`;
    } else {
      const et = etichettaFase(f);
      const m = et.match(/^(\d+)\s(.*)$/);
      hero = `<section class="hero">${deco}
        <p class="eyebrow">${esc(p.nome || "Il vostro bimbo")}</p>
        ${m ? `<div class="big">${m[1]}</div><p class="unit">${esc(m[2])}</p>` : `<h1>${esc(et)}</h1>`}
        <p class="hero-sub">Nato il ${fmtData(p.data)}</p>
      </section>`;
    }

    // idea attività del giorno, a rotazione
    const giornoAnno = Math.floor(Date.now() / DAY);
    let idea = null, ideaTitolo = "";
    if (f.stato === "attesa") {
      const tutte = C.perTe.categorie.filter(c => c.id !== "dopo").flatMap(c => c.idee.filter(i => !i.trim || i.trim.includes(f.trimestre)));
      idea = tutte[giornoAnno % tutte.length]; ideaTitolo = "Un'idea per te oggi";
    } else {
      const fascia = C.attivitaBimbo.find(a => f.mesi >= a.da && f.mesi < a.a) || C.attivitaBimbo.at(-1);
      idea = fascia.idee[giornoAnno % fascia.idee.length]; ideaTitolo = "Un gioco per oggi";
    }

    const eventi = filtraEventi(f).slice(0, 2);
    $app.innerHTML = `
      ${hero}
      ${s ? `<div class="card phase">
        <p class="eyebrow">Questa fase</p>
        <h2 style="margin-top:4px">${esc(s.titolo)}</h2>
        <p>${esc(s.testo)}</p>
        <ul class="todo">${s.todo.map(t => `<li>${esc(t)}</li>`).join("")}</ul>
      </div>` : ""}
      ${idea ? `<div class="card idea-card">
        <span class="spark" aria-hidden="true">✦</span>
        <p class="eyebrow">${ideaTitolo}</p>
        <h3>${esc(idea.t)}</h3><p>${esc(idea.d)}</p>
      </div>` : ""}
      ${eventi.length ? `<h2>In zona</h2>${eventi.map(cardEvento).join("")}
        <a class="back" href="#/attivita">Tutte le attività →</a>` : ""}
      <h2>Da leggere ora</h2>
      <div class="grid">${schedePerFase(f).slice(0, 4).map(tile).join("")}</div>
      <div class="made"><span>un'app di</span>${giry()}</div>
    `;
  }

  function schedePerFase(f) {
    const ordine = f.stato === "attesa"
      ? ["Prima della nascita", "Primi mesi", "Da 0 anni", "3-12 mesi", "1-3 anni"]
      : f.mesi < 3 ? ["Primi mesi", "Da 0 anni", "3-12 mesi", "Prima della nascita", "1-3 anni"]
      : f.mesi < 12 ? ["3-12 mesi", "Da 0 anni", "Primi mesi", "1-3 anni", "Prima della nascita"]
      : ["1-3 anni", "Da 0 anni", "3-12 mesi", "Primi mesi", "Prima della nascita"];
    return [...C.schede].sort((a, b) => ordine.indexOf(a.fase) - ordine.indexOf(b.fase));
  }

  const tinta = id => "t" + ([...id].reduce((a, c) => a + c.charCodeAt(0), 0) % 5);
  const tile = s => `<a class="tile ${tinta(s.id)}" href="#/guida/${esc(s.id)}"><span class="emo">${s.icona}</span><h3>${esc(s.titolo)}</h3><small>${esc(s.sommario)}</small></a>`;

  function vistaGuide(f) {
    const fasi = [...new Set(schedePerFase(f).map(s => s.fase))];
    $app.innerHTML = `
      <h1>Guide</h1>
      <p class="lead">Puericultura pratica, con le fonti in fondo a ogni scheda.</p>
      ${fasi.map(fs => `<h2>${esc(fs)}</h2><div class="grid">${C.schede.filter(s => s.fase === fs).map(tile).join("")}</div>`).join("")}
    `;
  }

  function vistaGuida(id) {
    const s = C.schede.find(x => x.id === id);
    if (!s) { location.hash = "#/guide"; return; }
    $app.innerHTML = `
      <a class="back" href="#/guide">← Guide</a>
      <p class="eyebrow">${esc(s.fase)}</p>
      <h1>${s.icona} ${esc(s.titolo)}</h1>
      <div class="card article">${rich(s.testo)}</div>
      ${fonti(s.fonti)}
      <p class="foot">Informazioni generali: per dubbi sul tuo bambino il riferimento è il pediatra.</p>
    `;
    window.scrollTo(0, 0);
  }

  function vistaPerTe(f) {
    const cats = C.perTe.categorie;
    const scelta = store.get("perteCat", "tutte");
    const visibili = cats.filter(c => scelta === "tutte" || c.id === scelta);
    const filtraIdee = idee => idee.filter(i => {
      if (f.stato === "attesa") return !i.nato && (!i.trim || i.trim.includes(f.trimestre));
      return true;
    });
    // dopo la nascita la categoria "dopo" va in cima
    const ordinate = f.stato === "nato" ? [...visibili].sort((a, b) => (b.id === "dopo") - (a.id === "dopo")) : visibili;
    $app.innerHTML = `
      <h1>Per te</h1>
      <p class="lead">${esc(C.perTe.intro)}</p>
      <div class="chips" role="group" aria-label="Filtra">
        <button class="chip" data-c="tutte" aria-pressed="${scelta === "tutte"}">Tutte</button>
        ${cats.map(c => `<button class="chip" data-c="${c.id}" aria-pressed="${scelta === c.id}">${c.icona} ${esc(c.nome)}</button>`).join("")}
      </div>
      ${ordinate.map(c => {
        const idee = filtraIdee(c.idee);
        if (!idee.length) return "";
        return `<div class="card">
          <h2 style="margin-top:0">${c.icona} ${esc(c.nome)}</h2>
          ${idee.map(i => `<div class="idea" style="padding:8px 0"><span class="dot"></span><div><h3>${esc(i.t)}</h3><p>${esc(i.d)}</p></div></div>`).join("")}
          ${c.avvertenza ? `<p style="margin-top:12px;font-size:14px;color:var(--ink-2)">${esc(c.avvertenza)}</p>` : ""}
        </div>${fonti(c.fonti)}`;
      }).join("")}
      ${filtraEventi(f, "gravidanza").length && f.stato === "attesa" ? `<h2>In zona</h2>${filtraEventi(f, "gravidanza").map(cardEvento).join("")}` : ""}
      <div class="card note">${esc(C.perTe.nota)}</div>
    `;
    $app.querySelectorAll(".chip").forEach(b => b.addEventListener("click", () => { store.set("perteCat", b.dataset.c); vistaPerTe(f); }));
  }

  function filtraEventi(f, solo) {
    const lista = E?.eventi || [];
    const oggi = new Date().toISOString().slice(0, 10);
    return lista.filter(e => {
      if (e.data && e.data < oggi) return false;
      if (solo) return e.eta === solo;
      if (e.eta === "tutti") return true;
      if (f.stato === "attesa") return e.eta === "gravidanza";
      if (e.eta === "gravidanza") return false;
      const [da, a] = (e.eta || "0-99").split("-").map(Number);
      const anni = f.mesi / 12;
      return anni >= (da || 0) && anni < (a || 99);
    }).sort((x, y) => (x.data || "9999").localeCompare(y.data || "9999"));
  }

  function cardEvento(e) {
    const quando = e.data ? fmtData(e.data) + (e.ora ? `, ${e.ora}` : "") : e.quando;
    return `<div class="card event">
      <div class="meta"><span class="tag">${esc(e.tipo || "Evento")}</span>${e.gratuito ? `<span class="tag warm">Gratis</span>` : ""}</div>
      <h3>${esc(e.titolo)}</h3>
      <p class="meta">${esc(quando || "")}${e.dove ? ` · ${esc(e.dove)}` : ""}</p>
      ${e.descr ? `<p>${esc(e.descr)}</p>` : ""}
      ${e.link ? `<a class="go" href="${esc(e.link)}" target="_blank" rel="noopener">Dettagli →</a>` : ""}
    </div>`;
  }

  function vistaAttivita(f) {
    const fasce = C.attivitaBimbo;
    const auto = f.stato === "nato" ? (fasce.find(a => f.mesi >= a.da && f.mesi < a.a) || fasce.at(-1)) : fasce[0];
    const sel = store.get("fascia", null);
    const fascia = fasce.find(a => a.nome === sel) || auto;
    const eventi = filtraEventi(f);
    $app.innerHTML = `
      <h1>Attività</h1>
      <p class="lead">${f.stato === "attesa" ? "Da tenere pronte per quando arriverà. Le iniziative per la gravidanza sono in Per te." : "Idee da fare a casa e iniziative in zona, adatte all'età."}</p>
      <h2>In zona${E?.citta ? ` · ${esc(E.citta)}` : ""}</h2>
      ${eventi.length ? eventi.map(cardEvento).join("") : `<div class="card empty">Nessuna iniziativa in elenco per questa fase.</div>`}
      ${E?.aggiornato ? `<p class="foot" style="margin-top:4px">Aggiornato il ${fmtData(E.aggiornato)}</p>` : ""}
      <h2>Idee a casa</h2>
      <div class="chips" role="group" aria-label="Età">
        ${fasce.map(a => `<button class="chip" data-f="${esc(a.nome)}" aria-pressed="${a === fascia}">${esc(a.nome)}${a === auto && f.stato === "nato" ? " (ora)" : ""}</button>`).join("")}
      </div>
      <div class="card">
        ${fascia.idee.map(i => `<div class="idea" style="padding:8px 0"><span class="dot"></span><div><h3>${esc(i.t)}</h3><p>${esc(i.d)}</p></div></div>`).join("")}
      </div>
    `;
    $app.querySelectorAll(".chip").forEach(b => b.addEventListener("click", () => { store.set("fascia", b.dataset.f); vistaAttivita(f); }));
  }

  function vistaListe() {
    const check = store.get("check", {});
    $app.innerHTML = `
      <h1>Liste</h1>
      <p class="lead">Spunta man mano: resta salvato su questo telefono.</p>
      ${C.liste.map(l => {
        const fatte = l.voci.filter((_, i) => check[`${l.id}:${i}`]).length;
        return `<h2>${esc(l.nome)} <span class="count">${fatte}/${l.voci.length}</span></h2>
        <div class="card">
          ${l.voci.map((v, i) => `<label class="check"><input type="checkbox" data-k="${l.id}:${i}" ${check[`${l.id}:${i}`] ? "checked" : ""}><span>${esc(v)}</span></label>`).join("")}
          ${l.nota ? `<p style="margin-top:10px;font-size:14px;color:var(--ink-2)">${esc(l.nota)}</p>` : ""}
        </div>`;
      }).join("")}
    `;
    $app.querySelectorAll("input[type=checkbox]").forEach(cb => cb.addEventListener("change", () => {
      const c = store.get("check", {});
      if (cb.checked) c[cb.dataset.k] = 1; else delete c[cb.dataset.k];
      store.set("check", c);
      vistaListe();
    }));
  }

  // ---------- router ----------
  function render() {
    if (!C) { $app.innerHTML = `<div class="empty">Impossibile caricare i contenuti. Controlla la connessione e riapri l'app.</div>`; return; }
    const [, rotta = "oggi", arg] = location.hash.split("/");
    const f = fase();
    document.querySelectorAll(".tabbar a").forEach(a => a.classList.toggle("on", a.dataset.tab === rotta || (rotta === "guida" && a.dataset.tab === "guide")));
    if (!f || rotta === "profilo") return vistaProfilo(!f);
    switch (rotta) {
      case "guide": vistaGuide(f); break;
      case "guida": vistaGuida(arg); break;
      case "perte": vistaPerTe(f); break;
      case "attivita": vistaAttivita(f); break;
      case "liste": vistaListe(); break;
      default: vistaOggi(f);
    }
    if (rotta !== "guida") window.scrollTo(0, 0);
  }

  document.getElementById("btn-profilo").addEventListener("click", () => { location.hash = "#/profilo"; });
  window.addEventListener("hashchange", render);

  carica().then(render);

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
})();
