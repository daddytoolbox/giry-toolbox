/* Giry toolbox – PWA per genitori e futuri genitori · Giry Corporation™ */
(() => {
  "use strict";

  const $app = document.getElementById("app");
  const $tab = document.getElementById("tabbar");
  const DAY = 86400000;
  let C = null, E = null;

  // ---------- storage ----------
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
      if (l.startsWith("- ")) { if (!inList) { html += "<ul class='dots'>"; inList = true; } html += `<li>${inline(l.slice(2))}</li>`; }
      else { if (inList) { html += "</ul>"; inList = false; } html += `<p>${inline(l)}</p>`; }
    }
    return html + (inList ? "</ul>" : "");
  }
  const fonti = list => !list?.length ? "" : `
    <details class="sources"><summary>Fonti (${list.length})</summary><ol>
      ${list.map(f => `<li><a href="${esc(f.u)}" target="_blank" rel="noopener">${esc(f.t)}</a></li>`).join("")}
    </ol></details>`;
  const oggi = () => { const d = new Date(); d.setHours(12, 0, 0, 0); return d; };
  const addDays = (d, n) => new Date(d.getTime() + n * DAY);
  const fmtData = iso => new Date(iso + "T12:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
  const mese = d => d.toLocaleDateString("it-IT", { month: "short" }).replace(".", "");
  const meseAnno = d => d.toLocaleDateString("it-IT", { month: "short", year: "numeric" }).replace(".", "");
  const lista = items => `<ul class="dots">${items.map(i => `<li>${inline(i)}</li>`).join("")}</ul>`;
  const ideaRow = i => `<div class="idea"><div><h3>${esc(i.t)}</h3><p>${esc(i.d)}</p></div></div>`;

  // ---------- marchio ----------
  const giry = (cls = "") => `<div class="giry ${cls}" aria-label="Giry Corporation">
    <svg class="giry-mark" viewBox="0 0 48 48" aria-hidden="true">
      <defs><linearGradient id="gg${cls}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF8A5C"/><stop offset="1" stop-color="#E5577A"/></linearGradient></defs>
      <rect width="48" height="48" rx="14" fill="url(#gg${cls})"/>
      <path d="M33.5 17.5A11 11 0 1 0 35 26h-10" fill="none" stroke="#FFF8EE" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M31.5 9.5l1.2 2.6 2.8.4-2 2 .5 2.8-2.5-1.3-2.5 1.3.5-2.8-2-2 2.8-.4z" fill="#FFE2A8"/>
    </svg>
    <div class="giry-text"><span class="giry-name">Giry</span><span class="giry-sub">Corporation<sup>™</sup></span></div>
  </div>`;
  const firma = () => `<div class="made"><span>un'app di</span>${giry()}</div>`;

  // ---------- sezioni ----------
  const SEZ = {
    oggi:      { nome: "Oggi",      emo: "☀️", col: "c0" },
    guide:     { nome: "Guide",     emo: "📖", col: "c3", sub: "Puericultura pratica con fonti" },
    organizza: { nome: "Organizza", emo: "🧺", col: "c2", sub: "Cosa comprare e quando" },
    mamma:     { nome: "Mamma",     emo: "🌷", col: "c4", sub: "Idee per stare bene" },
    papa:      { nome: "Papà",      emo: "🧔", col: "c1", sub: "Consigli e giochi" },
    attivita:  { nome: "Attività",  emo: "🎈", col: "c0", sub: "Giochi e iniziative in zona" },
    liste:     { nome: "Liste",     emo: "✅", col: "c5", sub: "Da spuntare" },
    vicino:    { nome: "Vicino a te", emo: "📍", col: "c5", sub: "Luoghi adatti all'età" }
  };
  const ICON = {
    oggi: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    guide: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/>',
    organizza: '<path d="M5 8h14l-1.2 11.2A2 2 0 0 1 15.8 21H8.2a2 2 0 0 1-2-1.8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    mamma: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    papa: '<circle cx="12" cy="7" r="3.5"/><path d="M5 21c1-4 3.8-6.5 7-6.5s6 2.5 7 6.5"/><path d="M9.5 11.5c1.5 1 3.5 1 5 0"/>',
    attivita: '<path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z"/>'
  };
  const testata = (k, titolo, sottotitolo) => `
    <header class="pagehead ${SEZ[k].col}">
      <span class="pe">${SEZ[k].emo}</span>
      <div><h1>${esc(titolo || SEZ[k].nome)}</h1>${sottotitolo ? `<p>${esc(sottotitolo)}</p>` : ""}</div>
    </header>`;

  // ---------- fase ----------
  function fase() {
    const p = store.get("profilo", null);
    if (!p?.data) return null;
    const rif = new Date(p.data + "T12:00:00");
    const t = oggi();
    if (p.stato === "attesa") {
      const giorniAlParto = Math.round((rif - t) / DAY);
      const nascita = rif;
      if (giorniAlParto < -14) return { stato: "attesa", settimana: 42, scaduta: true, giorni: giorniAlParto, nascita, p };
      const g = 280 - giorniAlParto;
      const settimana = Math.max(0, Math.floor(g / 7));
      return { stato: "attesa", settimana, giorno: Math.max(0, g % 7), trimestre: settimana < 14 ? 1 : settimana < 28 ? 2 : 3, giorni: giorniAlParto, nascita, p };
    }
    const giorni = Math.max(0, Math.round((t - rif) / DAY));
    return { stato: "nato", settimane: Math.floor(giorni / 7), mesi: giorni / 30.44, giorni, nascita: rif, p };
  }
  function etichetta(f) {
    if (f.stato === "attesa") return f.scaduta ? "La data presunta è passata" : `${f.settimana}ª settimana`;
    if (f.settimane < 9) return f.settimane === 0 ? `${f.giorni} giorni` : `${f.settimane} settimane`;
    const m = Math.floor(f.mesi);
    if (m < 24) return `${m} mesi`;
    const a = Math.floor(m / 12), r = m % 12;
    return `${a} anni${r ? ` e ${r} mesi` : ""}`;
  }

  // ---------- stagioni ----------
  const STAG = ["inverno", "inverno", "primavera", "primavera", "primavera", "estate", "estate", "estate", "autunno", "autunno", "autunno", "inverno"];
  const stagione = d => STAG[d.getMonth()];
  function stagioniTra(a, b) {
    const out = [];
    for (let d = new Date(a); d <= b; d = addDays(d, 10)) { const s = stagione(d); if (out.at(-1) !== s) out.push(s); }
    const s = stagione(b); if (out.at(-1) !== s) out.push(s);
    return out;
  }
  function prossimoCambio(d) {
    const s = stagione(d);
    let x = new Date(d);
    while (stagione(x) === s) x = addDays(x, 1);
    return x;
  }
  const chipStag = s => `<span class="schip s-${s}">${C.organizza.stagioni[s].icona} ${C.organizza.stagioni[s].nome}</span>`;
  const periodo = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
    ? meseAnno(a) : `${mese(a)}${a.getFullYear() !== b.getFullYear() ? " " + a.getFullYear() : ""} – ${meseAnno(b)}`;

  // ---------- dati ----------
  async function carica() {
    const get = async u => (await fetch(u, { cache: "no-cache" })).json();
    try { C = await get("contenuti.json"); } catch { C = null; }
    try { E = await get("eventi.json"); } catch { E = { eventi: [] }; }
  }

  // ---------- profilo ----------
  function vistaProfilo(primo) {
    const p = store.get("profilo", { stato: "attesa", data: "", nome: "", citta: "Torino" });
    $app.innerHTML = `
      ${primo ? `<div class="welcome"><img src="icon-512.png?v=6" alt=""><h1>Benvenuti in Giry toolbox</h1>
        <p>Due informazioni e l'app si adatta da sola, settimana dopo settimana.</p></div>`
        : `<a class="back" href="#/oggi">← Indietro</a><h1 class="plain">Impostazioni</h1>`}
      <form id="f" class="card">
        <label>Situazione</label>
        <div class="seg">
          <label><input type="radio" name="stato" value="attesa" ${p.stato === "attesa" ? "checked" : ""}><span>🤰 In attesa</span></label>
          <label><input type="radio" name="stato" value="nato" ${p.stato === "nato" ? "checked" : ""}><span>👶 È nato</span></label>
        </div>
        <label for="data" id="lbl-data">${p.stato === "nato" ? "Data di nascita" : "Data presunta del parto"}</label>
        <input type="date" id="data" name="data" value="${esc(p.data)}" required>
        <label for="nome">Nome o soprannome <span class="muted">(facoltativo)</span></label>
        <input type="text" id="nome" name="nome" value="${esc(p.nome)}" placeholder="Es. Fagiolino" maxlength="30">
        <label for="citta">Città</label>
        <input type="text" id="citta" name="citta" value="${esc(p.citta || "Torino")}">
        <button class="btn" type="submit">${primo ? "Iniziamo" : "Salva"}</button>
        ${primo ? "" : `<button class="btn ghost" type="button" id="reset">Azzera le liste spuntate</button>`}
      </form>
      <p class="foot">I dati restano solo su questo telefono.</p>
      ${firma()}`;
    const f = document.getElementById("f");
    f.addEventListener("change", e => { if (e.target.name === "stato") document.getElementById("lbl-data").textContent = e.target.value === "nato" ? "Data di nascita" : "Data presunta del parto"; });
    f.addEventListener("submit", e => {
      e.preventDefault();
      const d = new FormData(f);
      store.set("profilo", { stato: d.get("stato"), data: d.get("data"), nome: (d.get("nome") || "").trim(), citta: (d.get("citta") || "").trim() });
      location.hash = "#/oggi"; render();
    });
    document.getElementById("reset")?.addEventListener("click", () => { if (confirm("Vuoi togliere tutte le spunte?")) { store.set("check", {}); store.set("todo", {}); } });
  }

  // ---------- oggi ----------
  function bloccoSettimana(f) {
    const k = f.stato === "attesa" ? f.settimana : f.settimane;
    return C.settimane.find(s => s.stato === f.stato && k >= s.da && k <= s.a);
  }
  function vistaOggi(f) {
    const p = f.p, s = bloccoSettimana(f);
    let hero;
    if (f.stato === "attesa" && !f.scaduta) {
      const pct = Math.min(100, Math.round((f.settimana * 7 + (f.giorno || 0)) / 280 * 100));
      hero = `<section class="hero">
        <div class="hero-txt">
          <p class="kicker">${f.trimestre}º trimestre</p>
          <div class="big">${f.settimana}ª<small>settimana</small></div>
          <p class="hero-sub">${f.giorni > 0 ? `Mancano <strong>${f.giorni} giorni</strong> ${p.nome ? "a " + esc(p.nome) : "all'arrivo"}` : "Ci siamo quasi!"}</p>
        </div>
        <div class="ring" style="--p:${pct}"><span>${pct}%</span></div>
      </section>`;
    } else if (f.stato === "attesa") {
      hero = `<section class="hero"><div class="hero-txt"><div class="big sm">È nato?</div>
        <p class="hero-sub">Aggiorna la data nelle <a href="#/profilo">impostazioni</a>.</p></div></section>`;
    } else {
      const et = etichetta(f), m = et.match(/^(\d+)\s(.*)$/);
      hero = `<section class="hero">
        <div class="hero-txt">
          <p class="kicker">${p.nome ? esc(p.nome) : "Il vostro bimbo"} ha</p>
          <div class="big">${m ? `${m[1]}<small>${esc(m[2])}</small>` : esc(et)}</div>
          <p class="hero-sub">Nato il ${fmtData(p.data)}</p>
        </div>
        <div class="hero-emo">👶</div>
      </section>`;
    }

    const giorno = Math.floor(Date.now() / DAY);
    let idea, ideaTit;
    if (f.stato === "attesa") {
      const tutte = C.perTe.categorie.filter(c => c.id !== "dopo").flatMap(c => c.idee.filter(i => !i.trim || i.trim.includes(f.trimestre || 3)));
      idea = tutte[giorno % tutte.length]; ideaTit = "Un'idea per la mamma";
    } else {
      const fa = C.attivitaBimbo.find(a => f.mesi >= a.da && f.mesi < a.a) || C.attivitaBimbo.at(-1);
      idea = fa.idee[giorno % fa.idee.length]; ideaTit = "Il gioco di oggi";
    }

    const td = store.get("todo", {});
    const hub = ["vicino", "attivita", "organizza", "mamma", "papa", "guide"];
    const ev = filtraEventi(f)[0];
    const st = C.organizza.stagioni[stagione(oggi())];

    $app.innerHTML = `
      ${hero}
      <div class="hub">${hub.map(k => `<a class="hubtile ${SEZ[k].col}" href="#/${k}"><span>${SEZ[k].emo}</span>${SEZ[k].nome}</a>`).join("")}</div>

      ${s ? `<section class="card">
        <div class="row-h"><h2>${esc(s.titolo)}</h2><span class="pill">Questa fase</span></div>
        <p class="muted">${esc(s.testo)}</p>
        <div class="todos">${s.todo.map((t, i) => { const k = `${s.stato}${s.da}:${i}`; return `
          <label class="todo"><input type="checkbox" data-k="${k}" ${td[k] ? "checked" : ""}><span>${esc(t)}</span></label>`; }).join("")}</div>
      </section>` : ""}

      ${idea ? `<section class="card soft c1"><p class="kicker">${ideaTit}</p><h2>${esc(idea.t)}</h2><p>${esc(idea.d)}</p></section>` : ""}

      <a class="card link c2 soft" href="#/organizza">
        <p class="kicker">${st.icona} È ${st.nome.toLowerCase()}</p>
        <h2>Cosa comprare adesso</h2>
        <p>Abbigliamento giusto per la stagione, per te e per il bimbo →</p>
      </a>

      ${ev ? `<h2 class="sec">In zona</h2>${cardEvento(ev)}<a class="more" href="#/attivita">Altre iniziative →</a>` : ""}

      <h2 class="sec">Da leggere</h2>
      <div class="glist">${schedePerFase(f).slice(0, 3).map(riga).join("")}</div>
      ${firma()}`;

    $app.querySelectorAll(".todo input").forEach(cb => cb.addEventListener("change", () => {
      const t = store.get("todo", {}); if (cb.checked) t[cb.dataset.k] = 1; else delete t[cb.dataset.k]; store.set("todo", t);
    }));
  }

  // ---------- guide ----------
  function schedePerFase(f) {
    const ordine = f.stato === "attesa" ? ["Prima della nascita", "Primi mesi", "Da 0 anni", "3-12 mesi", "1-3 anni"]
      : f.mesi < 3 ? ["Primi mesi", "Da 0 anni", "3-12 mesi", "Prima della nascita", "1-3 anni"]
      : f.mesi < 12 ? ["3-12 mesi", "Da 0 anni", "Primi mesi", "1-3 anni", "Prima della nascita"]
      : ["1-3 anni", "Da 0 anni", "3-12 mesi", "Primi mesi", "Prima della nascita"];
    return [...C.schede].sort((a, b) => ordine.indexOf(a.fase) - ordine.indexOf(b.fase));
  }
  const tinta = id => "c" + ([...id].reduce((a, c) => a + c.charCodeAt(0), 0) % 6);
  const riga = s => `<a class="grow" href="#/guida/${esc(s.id)}"><span class="gi ${tinta(s.id)}">${s.icona}</span>
    <span class="gt"><strong>${esc(s.titolo)}</strong><small>${esc(s.sommario)}</small></span><span class="chev">›</span></a>`;
  function vistaGuide(f) {
    const fasi = [...new Set(schedePerFase(f).map(s => s.fase))];
    $app.innerHTML = testata("guide", "Guide", SEZ.guide.sub) +
      fasi.map(fs => `<h2 class="sec">${esc(fs)}</h2><div class="glist">${C.schede.filter(s => s.fase === fs).map(riga).join("")}</div>`).join("");
  }
  function vistaGuida(id) {
    const s = C.schede.find(x => x.id === id);
    if (!s) { location.hash = "#/guide"; return; }
    $app.innerHTML = `
      <a class="back" href="#/guide">← Guide</a>
      <header class="pagehead ${tinta(s.id)}"><span class="pe">${s.icona}</span><div><h1>${esc(s.titolo)}</h1><p>${esc(s.fase)}</p></div></header>
      <article class="card article">${rich(s.testo)}</article>
      ${fonti(s.fonti)}
      <p class="foot">Informazioni generali: per dubbi sul tuo bambino il riferimento è il pediatra.</p>`;
  }

  // ---------- organizza ----------
  function vistaOrganizza(f) {
    const O = C.organizza, t = oggi();
    const sNow = stagione(t), cambio = prossimoCambio(t);
    const B = f.nascita;
    const inizio = addDays(B, -280);

    // mamma
    let mammaHtml = "";
    const fasi = O.fasiMamma.map(fm => ({ ...fm, a0: addDays(inizio, fm.da * 7), a1: addDays(inizio, fm.a * 7) }))
      .filter(fm => fm.a1 >= t);
    if (fasi.length) {
      mammaHtml = `<h2 class="sec">🌷 Per la mamma</h2>` + fasi.map((fm, i) => {
        const ss = stagioniTra(fm.a0 < t ? t : fm.a0, fm.a1);
        const ora = fm.a0 <= t;
        return `<details class="card acc" ${i === 0 ? "open" : ""}>
          <summary><div><span class="pill ${ora ? "on" : ""}">${ora ? "Adesso" : periodo(fm.a0, fm.a1)}</span>
            <h3>${esc(fm.nome)}</h3><div class="schips">${ss.map(chipStag).join("")}</div></div></summary>
          <p class="muted">${esc(fm.nota)}</p>
          <p class="lbl">La base</p>${lista(fm.base)}
          ${ss.map(s => `<p class="lbl">${O.stagioni[s].icona} Per ${O.stagioni[s].nome.toLowerCase()}</p>${lista(O.stagioni[s].mamma)}`).join("")}
        </details>`;
      }).join("");
    }

    // bimbo per taglie
    const bande = O.taglie.map(tg => ({ ...tg, d0: addDays(B, tg.mesi[0] * 30.44), d1: addDays(B, tg.mesi[1] * 30.44) }))
      .filter(tg => tg.d1 >= t);
    const bimboHtml = bande.map((tg, i) => {
      const ss = stagioniTra(tg.d0 < t ? t : tg.d0, tg.d1);
      const mid = new Date((Math.max(tg.d0, t) + tg.d1.getTime()) / 2);
      const principale = stagione(mid);
      const ora = tg.d0 <= t && f.stato === "nato";
      return `<details class="card acc" ${i === 0 ? "open" : ""}>
        <summary><div class="taglia"><span class="tnum">${esc(tg.taglia)}</span>
          <div><span class="pill ${ora ? "on" : ""}">${ora ? "Adesso" : periodo(tg.d0, tg.d1)}</span>
          <div class="schips">${ss.map(chipStag).join("")}</div></div></div></summary>
        <p class="muted">${esc(tg.quanti)}</p>
        ${lista(O.stagioni[principale].bimbo)}
        ${ss.length > 1 ? `<p class="hint">Cambia stagione in questa taglia: meglio capi a strati che si aggiungono e si tolgono.</p>` : ""}
      </details>`;
    }).join("");

    // lista regali
    const regali = bande.filter(tg => tg.d0 > addDays(t, 30)).slice(0, 4)
      .map(tg => { const s = O.stagioni[stagione(new Date((tg.d0.getTime() + tg.d1.getTime()) / 2))]; return `Taglia ${tg.taglia} · ${s.nome.toLowerCase()} ${tg.d0.getFullYear()} ${s.icona}`; });

    $app.innerHTML = testata("organizza", "Organizza", "Cosa comprare, quando e per quale stagione") + `
      <section class="season s-${sNow}">
        <span class="sbig">${O.stagioni[sNow].icona}</span>
        <div><p class="kicker">Adesso</p><h2>${O.stagioni[sNow].nome}</h2>
        <p>Dal ${cambio.toLocaleDateString("it-IT", { day: "numeric", month: "long" })} ${O.stagioni[stagione(cambio)].nome.toLowerCase()} ${O.stagioni[stagione(cambio)].icona}</p></div>
      </section>
      ${mammaHtml}
      <h2 class="sec">👶 Per il bimbo, taglia per taglia</h2>
      <p class="muted small">Le date sono calcolate dalla ${f.stato === "attesa" ? "data presunta del parto" : "data di nascita"}: ogni bambino cresce a modo suo, controlla sempre la lunghezza in cm sull'etichetta.</p>
      ${bimboHtml}
      ${regali.length ? `<section class="card soft c4"><p class="kicker">🎁 Da chiedere in regalo</p>
        <p>Copia e manda a nonni e amici:</p>
        <div class="regali" id="regali">${regali.map(r => `<div>${esc(r)}</div>`).join("")}</div>
        <button class="btn small" id="copia">Copia la lista</button></section>` : ""}
      <h2 class="sec">💡 Consigli smart</h2>
      <div class="card">${C.organizza.smart.map(ideaRow).join("")}</div>
      <a class="card link soft c5" href="#/liste"><p class="kicker">✅ Liste</p><h2>Lista nascita, borsa, pratiche</h2><p>Da spuntare man mano →</p></a>
      <p class="hint">${esc(O.notaTog)}</p>
      ${fonti(O.fonti)}`;

    document.getElementById("copia")?.addEventListener("click", async e => {
      const testo = "Idee regalo per il bimbo:\n" + regali.map(r => "• " + r.replace(/\s[^\s]+$/, "")).join("\n");
      try { await navigator.clipboard.writeText(testo); e.target.textContent = "Copiata ✓"; }
      catch { if (navigator.share) navigator.share({ text: testo }).catch(() => {}); }
    });
  }

  // ---------- mamma ----------
  function vistaMamma(f) {
    const cats = C.perTe.categorie, scelta = store.get("perteCat", "tutte");
    const vis = cats.filter(c => scelta === "tutte" || c.id === scelta);
    const filtra = idee => idee.filter(i => f.stato === "attesa" ? !i.nato && (!i.trim || i.trim.includes(f.trimestre || 3)) : true);
    const ord = f.stato === "nato" ? [...vis].sort((a, b) => (b.id === "dopo") - (a.id === "dopo")) : vis;
    $app.innerHTML = testata("mamma", "Per la mamma", "Stare bene, uscire, conoscere persone") + `
      <p class="muted">${esc(C.perTe.intro)}</p>
      <div class="chips">
        <button class="chip" data-c="tutte" aria-pressed="${scelta === "tutte"}">Tutte</button>
        ${cats.map(c => `<button class="chip" data-c="${c.id}" aria-pressed="${scelta === c.id}">${c.icona} ${esc(c.nome)}</button>`).join("")}
      </div>
      ${ord.map(c => { const idee = filtra(c.idee); if (!idee.length) return ""; return `
        <section class="card"><h2>${c.icona} ${esc(c.nome)}</h2>${idee.map(ideaRow).join("")}
          ${c.avvertenza ? `<p class="hint">${esc(c.avvertenza)}</p>` : ""}${fonti(c.fonti)}</section>`; }).join("")}
      ${f.stato === "attesa" && filtraEventi(f, "gravidanza").length ? `<h2 class="sec">In zona</h2>${filtraEventi(f, "gravidanza").map(cardEvento).join("")}` : ""}
      <div class="card soft c4">${esc(C.perTe.nota)}</div>`;
    $app.querySelectorAll(".chip").forEach(b => b.addEventListener("click", () => { store.set("perteCat", b.dataset.c); vistaMamma(f); }));
  }

  // ---------- papà ----------
  function vistaPapa(f) {
    const P = C.papa;
    const fasi = f.stato === "attesa" ? P.fasi : [...P.fasi].reverse();
    const mesi = f.stato === "nato" ? f.mesi : 0;
    const auto = P.giochi.find(g => mesi >= g.da && mesi < g.a) || P.giochi.at(-1);
    const sel = P.giochi.find(g => g.nome === store.get("papaEta", "")) || auto;
    $app.innerHTML = testata("papa", "Per il papà", "Esserci davvero, dall'attesa ai primi anni") + `
      ${fasi.map((fa, i) => `<details class="card acc" ${i === 0 ? "open" : ""}>
        <summary><div><span class="pill ${fa.stato === f.stato ? "on" : ""}">${fa.stato === f.stato ? "Adesso" : (fa.stato === "attesa" ? "Prima" : "Dopo")}</span>
        <h3>${fa.icona} ${esc(fa.titolo)}</h3></div></summary>${lista(fa.punti)}</details>`).join("")}

      <h2 class="sec">🎲 Giochi che fanno crescere</h2>
      <div class="chips">${P.giochi.map(g => `<button class="chip" data-e="${esc(g.nome)}" aria-pressed="${g === sel}">${esc(g.nome)}</button>`).join("")}</div>
      <section class="card">${sel.idee.map(ideaRow).join("")}</section>

      <details class="card acc"><summary><div><span class="pill">Lavoro</span><h3>📋 ${esc(P.congedi.titolo)}</h3></div></summary>
        ${lista(P.congedi.punti)}<p class="hint">${esc(P.congedi.nota)}</p>${fonti(P.congedi.fonti)}</details>

      <section class="card soft c1"><p class="kicker">💬 ${esc(P.benessere.titolo)}</p><p>${esc(P.benessere.testo)}</p>${fonti(P.benessere.fonti)}</section>`;
    $app.querySelectorAll(".chip").forEach(b => b.addEventListener("click", () => { store.set("papaEta", b.dataset.e); vistaPapa(f); }));
  }

  // ---------- attività ----------
  function filtraEventi(f, solo) {
    const l = E?.eventi || [], oggiIso = new Date().toISOString().slice(0, 10);
    return l.filter(e => {
      if (e.data && e.data < oggiIso) return false;
      if (solo) return e.eta === solo;
      if (e.eta === "tutti") return true;
      if (f.stato === "attesa") return e.eta === "gravidanza";
      if (e.eta === "gravidanza") return false;
      const [da, a] = (e.eta || "0-99").split("-").map(Number), anni = f.mesi / 12;
      return anni >= (da || 0) && anni < (a || 99);
    }).sort((x, y) => (x.data || "9999").localeCompare(y.data || "9999"));
  }
  function cardEvento(e) {
    const quando = e.data ? fmtData(e.data) + (e.ora ? `, ${e.ora}` : "") : e.quando;
    return `<section class="card event">
      <div class="tags"><span class="tag">${esc(e.tipo || "Evento")}</span>${e.gratuito ? `<span class="tag g">Gratis</span>` : ""}</div>
      <h3>${esc(e.titolo)}</h3>
      <p class="meta">📅 ${esc(quando || "")}${e.dove ? `<br>📍 ${esc(e.dove)}` : ""}</p>
      ${e.descr ? `<p>${esc(e.descr)}</p>` : ""}
      ${e.link ? `<a class="more" href="${esc(e.link)}" target="_blank" rel="noopener">Dettagli →</a>` : ""}
    </section>`;
  }
  function vistaAttivita(f) {
    const fasce = C.attivitaBimbo;
    const auto = f.stato === "nato" ? (fasce.find(a => f.mesi >= a.da && f.mesi < a.a) || fasce.at(-1)) : fasce[0];
    const fascia = fasce.find(a => a.nome === store.get("fascia", null)) || auto;
    const ev = filtraEventi(f);
    $app.innerHTML = testata("attivita", "Attività", f.stato === "attesa" ? "Da tenere pronte per quando arriverà" : "Giochi a casa e iniziative in zona") + `
      <h2 class="sec">🏠 Idee a casa</h2>
      <div class="chips">${fasce.map(a => `<button class="chip" data-f="${esc(a.nome)}" aria-pressed="${a === fascia}">${esc(a.nome)}</button>`).join("")}</div>
      <section class="card">${fascia.idee.map(ideaRow).join("")}</section>
      <a class="card link soft c5" href="#/vicino"><p class="kicker">📍 In tutta Italia</p><h2>Vicino a te</h2><p>Parchi giochi, biblioteche, musei e piscine intorno a te →</p></a>
      <h2 class="sec">📅 Iniziative${E?.citta ? ` · ${esc(E.citta)}` : ""}</h2>
      ${ev.length ? ev.map(cardEvento).join("") : `<div class="card empty">Nessuna iniziativa in elenco per questa fase.</div>`}
      ${E?.aggiornato ? `<p class="foot">Aggiornato il ${fmtData(E.aggiornato)}</p>` : ""}`;
    $app.querySelectorAll(".chip").forEach(b => b.addEventListener("click", () => { store.set("fascia", b.dataset.f); vistaAttivita(f); }));
  }


  // ---------- vicino a te (OpenStreetMap) ----------
  const CAT = [
    { id: "giochi", uno: "Parco giochi",  nome: "Parchi giochi", emo: "🛝", sel: ['nwr["leisure"="playground"]'], nota: "Altalene a cestello e sabbia: dai 6 mesi circa, sempre con un adulto vicino." },
    { id: "ludo", uno: "Ludoteca",    nome: "Ludoteche",     emo: "🧩", sel: ['nwr["amenity"="toy_library"]', 'nwr["name"~"ludoteca",i]'], nota: "Giochi diversi da casa e altri bambini: spesso c'è uno spazio 0-3." },
    { id: "biblio", uno: "Biblioteca",  nome: "Biblioteche",   emo: "📚", sel: ['nwr["amenity"="library"]'], nota: "Chiedi della sezione 0-6 e delle letture Nati per Leggere." },
    { id: "musei", uno: "Museo",   nome: "Musei",         emo: "🏛️", sel: ['nwr["tourism"="museum"]'], nota: "Spesso gratis per i più piccoli: cerca i laboratori per famiglie." },
    { id: "parchi", uno: "Parco",  nome: "Parchi",        emo: "🌳", sel: ['nwr["leisure"="park"]["name"]'], nota: "Passeggiate con carrozzina o fascia, picnic all'ombra." },
    { id: "piscine", uno: "Piscina", nome: "Piscine",       emo: "🏊", sel: ['nwr["leisure"="sports_centre"]["sport"~"swimming"]', 'nwr["leisure"="swimming_pool"]["name"]["access"!~"private|customers"]'], nota: "Chiedi dei corsi di acquaticità neonatale o prenatale." },
    { id: "animali", uno: "Fattoria o zoo", nome: "Animali",       emo: "🐐", sel: ['nwr["tourism"="zoo"]', 'nwr["name"~"fattoria didattica",i]'], nota: "Fattorie didattiche e piccoli zoo: ottimi dai 18 mesi." }
  ];
  function categoria(t) {
    if (t.amenity === "toy_library" || /ludoteca/i.test(t.name || "")) return "ludo";
    if (t.leisure === "playground") return "giochi";
    if (t.amenity === "library") return "biblio";
    if (t.tourism === "museum") return "musei";
    if (t.leisure === "sports_centre" || t.leisure === "swimming_pool") return "piscine";
    if (t.tourism === "zoo" || /fattoria/i.test(t.name || "")) return "animali";
    if (t.leisure === "park") return "parchi";
    return null;
  }
  const distanza = (a, b, c, d) => { const R = 6371000, r = x => x * Math.PI / 180; const dl = r(c - a), dg = r(d - b);
    const h = Math.sin(dl / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(dg / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
  const fmtDist = m => m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1).replace(".", ",")} km`;

  async function cercaLuoghi(lat, lon, raggio) {
    const key = `luoghi:${lat.toFixed(3)},${lon.toFixed(3)},${raggio}`;
    const cache = store.get(key, null);
    if (cache && Date.now() - cache.t < 7 * DAY) return cache.r;
    const sel = CAT.flatMap(c => c.sel).map(s => `${s}(around:${raggio},${lat},${lon});`).join("");
    const q = `[out:json][timeout:25];(${sel});out center tags 400;`;
    const res = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: "data=" + encodeURIComponent(q), headers: { "Content-Type": "application/x-www-form-urlencoded" } });
    if (!res.ok) throw new Error("overpass " + res.status);
    const js = await res.json();
    const visti = new Set();
    const r = js.elements.map(e => {
      const t = e.tags || {}, la = e.lat ?? e.center?.lat, lo = e.lon ?? e.center?.lon, cat = categoria(t);
      if (la == null || !cat) return null;
      const id = `${cat}:${(t.name || "").toLowerCase()}:${la.toFixed(3)}`; if (t.name && visti.has(id)) return null; visti.add(id);
      return { cat, nome: t.name || null, lat: la, lon: lo, sito: t.website || t["contact:website"] || null, d: Math.round(distanza(lat, lon, la, lo)) };
    }).filter(Boolean).sort((x, y) => x.d - y.d);
    store.set(key, { t: Date.now(), r });
    return r;
  }
  async function geocodifica(testo) {
    const u = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=it&accept-language=it&q=${encodeURIComponent(testo)}`;
    const js = await (await fetch(u)).json();
    if (!js.length) throw new Error("non trovato");
    return { lat: +js[0].lat, lon: +js[0].lon, label: js[0].display_name.split(",").slice(0, 2).join(",") };
  }

  function vistaVicino(f) {
    const pos = store.get("posizione", null);
    const raggio = store.get("raggio", 3000);
    const filtro = store.get("catVicino", "tutti");
    const suggerite = f.stato === "attesa" ? ["parchi", "piscine", "musei", "biblio"]
      : f.mesi < 6 ? ["parchi", "biblio", "piscine", "musei"]
      : f.mesi < 18 ? ["giochi", "biblio", "ludo", "parchi", "piscine"]
      : ["giochi", "ludo", "animali", "musei", "biblio"];
    $app.innerHTML = testata("vicino", "Vicino a te", "Luoghi adatti all'età, in tutta Italia") + `
      <section class="card">
        <button class="btn" id="geo" style="margin-top:0">📍 Usa la mia posizione</button>
        <form id="cerca" class="inline"><input type="text" id="luogo" placeholder="oppure scrivi città o indirizzo" value="${esc(pos?.manuale ? pos.label : "")}" autocomplete="off"><button class="btn small" type="submit">Cerca</button></form>
        <div class="chips tight" style="margin-top:12px">${[1000, 3000, 10000].map(r => `<button class="chip" data-r="${r}" aria-pressed="${r === raggio}">${r / 1000} km</button>`).join("")}</div>
        ${pos ? `<p class="muted small" style="margin:0">Intorno a: <strong>${esc(pos.label)}</strong></p>` : ""}
      </section>
      <div id="risultati">${pos ? `<div class="card empty">Cerco i luoghi vicini…</div>` : `<div class="card soft c3"><p class="kicker">Come funziona</p><p>Tocca il pulsante o scrivi un luogo: ti mostro parchi giochi, biblioteche, musei, piscine e parchi intorno a te, in ordine di distanza.</p><p class="muted small" style="margin:0">La posizione serve solo per la ricerca e resta sul telefono.</p></div>`}</div>
      <p class="foot">Dati luoghi © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a></p>`;

    const salva = p => { store.set("posizione", { lat: +p.lat.toFixed(3), lon: +p.lon.toFixed(3), label: p.label, manuale: !!p.manuale }); vistaVicino(f); };
    document.getElementById("geo").addEventListener("click", e => {
      if (!navigator.geolocation) { alert("Posizione non disponibile su questo dispositivo: scrivi la città."); return; }
      e.target.textContent = "📍 Rilevo la posizione…";
      navigator.geolocation.getCurrentPosition(
        p => salva({ lat: p.coords.latitude, lon: p.coords.longitude, label: "La tua posizione" }),
        () => { e.target.textContent = "📍 Usa la mia posizione"; alert("Non riesco a leggere la posizione. Controlla i permessi oppure scrivi la città."); },
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 });
    });
    document.getElementById("cerca").addEventListener("submit", async e => {
      e.preventDefault(); const t = document.getElementById("luogo").value.trim(); if (!t) return;
      try { const g = await geocodifica(t); salva({ ...g, manuale: true }); }
      catch { alert("Luogo non trovato. Prova con il nome del comune."); }
    });
    $app.querySelectorAll("[data-r]").forEach(b => b.addEventListener("click", () => { store.set("raggio", +b.dataset.r); vistaVicino(f); }));
    if (!pos) return;

    const box = document.getElementById("risultati");
    cercaLuoghi(pos.lat, pos.lon, raggio).then(r => {
      const conta = Object.fromEntries(CAT.map(c => [c.id, r.filter(x => x.cat === c.id).length]));
      const cats = CAT.filter(c => conta[c.id]).sort((a, b) => (suggerite.includes(b.id) - suggerite.includes(a.id)) || suggerite.indexOf(a.id) - suggerite.indexOf(b.id));
      if (!r.length) { box.innerHTML = `<div class="card empty">Nessun luogo trovato in questo raggio: prova ad allargarlo.</div>`; return; }
      const vis = filtro === "tutti" ? r.filter(x => suggerite.includes(x.cat)).concat(r.filter(x => !suggerite.includes(x.cat))) : r.filter(x => x.cat === filtro);
      const nota = filtro !== "tutti" ? CAT.find(c => c.id === filtro)?.nota : null;
      box.innerHTML = `
        <div class="chips">
          <button class="chip" data-c="tutti" aria-pressed="${filtro === "tutti"}">✨ Consigliati</button>
          ${cats.map(c => `<button class="chip" data-c="${c.id}" aria-pressed="${filtro === c.id}">${c.emo} ${c.nome} <span class="cnt">${conta[c.id]}</span></button>`).join("")}
        </div>
        ${nota ? `<p class="hint" style="margin:0 0 12px">${esc(nota)}</p>` : ""}
        <div class="glist">${vis.slice(0, 50).map(x => { const c = CAT.find(k => k.id === x.cat); return `
          <div class="grow place">
            <span class="gi ${tinta(c.id)}">${c.emo}</span>
            <span class="gt"><strong>${esc(x.nome || c.uno)}</strong>
              <small>${c.nome} · ${fmtDist(x.d)}</small>
              <span class="acts"><a href="https://www.google.com/maps/dir/?api=1&destination=${x.lat},${x.lon}" target="_blank" rel="noopener">Indicazioni</a>${x.sito ? ` · <a href="${esc(x.sito)}" target="_blank" rel="noopener">Sito</a>` : ""}</span></span>
          </div>`; }).join("")}</div>
        ${vis.length > 50 ? `<p class="foot">Mostro i 50 più vicini.</p>` : ""}`;
      box.querySelectorAll("[data-c]").forEach(b => b.addEventListener("click", () => { store.set("catVicino", b.dataset.c); vistaVicino(f); }));
    }).catch(() => {
      box.innerHTML = `<div class="card empty">Il servizio mappe non risponde in questo momento. Riprova tra qualche minuto.</div>`;
    });
  }

  // ---------- liste ----------
  function vistaListe() {
    const check = store.get("check", {});
    $app.innerHTML = `<a class="back" href="#/organizza">← Organizza</a>` + testata("liste", "Liste", "Si salvano su questo telefono") +
      C.liste.map(l => {
        const fatte = l.voci.filter((_, i) => check[`${l.id}:${i}`]).length, pct = Math.round(fatte / l.voci.length * 100);
        return `<details class="card acc" ${fatte < l.voci.length ? "" : ""}>
          <summary><div><h3>${esc(l.nome)}</h3><div class="bar"><span style="width:${pct}%"></span></div><small class="muted">${fatte} di ${l.voci.length}</small></div></summary>
          ${l.voci.map((v, i) => `<label class="todo"><input type="checkbox" data-k="${l.id}:${i}" ${check[`${l.id}:${i}`] ? "checked" : ""}><span>${esc(v)}</span></label>`).join("")}
          ${l.nota ? `<p class="hint">${esc(l.nota)}</p>` : ""}
        </details>`;
      }).join("");
    $app.querySelectorAll("input[type=checkbox]").forEach(cb => cb.addEventListener("change", () => {
      const c = store.get("check", {}); if (cb.checked) c[cb.dataset.k] = 1; else delete c[cb.dataset.k]; store.set("check", c);
      const det = cb.closest("details"), tot = det.querySelectorAll("input").length, ok = det.querySelectorAll("input:checked").length;
      det.querySelector(".bar span").style.width = Math.round(ok / tot * 100) + "%";
      det.querySelector("small").textContent = `${ok} di ${tot}`;
    }));
  }

  // ---------- barra e router ----------
  function barra(f, rotta) {
    const quinta = f && f.stato === "nato" ? "attivita" : "guide";
    const tabs = ["oggi", quinta, "organizza", "mamma", "papa"];
    const attiva = rotta === "guida" ? "guide" : rotta === "liste" ? "organizza" : rotta === "vicino" ? "attivita" : rotta;
    $tab.innerHTML = tabs.map(k => `<a href="#/${k}" class="${k === attiva ? "on" : ""}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${ICON[k]}</svg>
      <span>${SEZ[k].nome}</span></a>`).join("");
    $tab.hidden = !f || rotta === "profilo" && !f;
  }
  function render() {
    if (!C) { $app.innerHTML = `<div class="empty">Impossibile caricare i contenuti. Controlla la connessione e riapri l'app.</div>`; return; }
    const [, rotta = "oggi", arg] = location.hash.split("/");
    const f = fase();
    barra(f, rotta);
    if (!f || rotta === "profilo") vistaProfilo(!f);
    else ({ guide: vistaGuide, guida: () => vistaGuida(arg), organizza: vistaOrganizza, mamma: vistaMamma, perte: vistaMamma,
            papa: vistaPapa, attivita: vistaAttivita, liste: vistaListe, vicino: vistaVicino }[rotta] || vistaOggi)(f);
    window.scrollTo(0, 0);
  }

  document.getElementById("btn-profilo").addEventListener("click", () => { location.hash = "#/profilo"; });
  window.addEventListener("hashchange", render);
  carica().then(render);
  if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
})();
