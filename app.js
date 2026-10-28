/* Giry toolbox – PWA per genitori e futuri genitori · Giry Corporation™ */
(() => {
  "use strict";

  const $app = document.getElementById("app");
  const $tab = document.getElementById("tabbar");
  const DAY = 86400000;
  let C = null, E = null, A = null;

  // ---------- storage ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem("nido:" + k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v, silenzioso) {
      try {
        if (!silenzioso && ["profilo", "nascita", "cal", "check", "todo"].includes(k)) segnaModifiche(k, v);
        localStorage.setItem("nido:" + k, JSON.stringify(v));
      } catch {}
    }
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
    vicino:    { nome: "Vicino a te", emo: "📍", col: "c5", sub: "Luoghi adatti all'età" },
    acquisti:  { nome: "Acquisti smart", emo: "🛒", col: "c2", sub: "Scelti dai test, non dal marchio" },
    nascita:   { nome: "Lista nascita", emo: "🎁", col: "c4", sub: "Scegli, personalizza, condividi in PDF" },
    calendario: { nome: "Calendario", emo: "📅", col: "c3", sub: "Visite, ecografie e appuntamenti, per entrambi" }
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

  // ---------- palette per sesso ----------
  const TEMA = { m: { nome: "Mokka e salvia", desc: "caffè, beige e verde salvia", bg: ["#F3EEE7", "#161210"] },
                 f: { nome: "Mokka e cipria", desc: "caffè, beige e rosa cipria", bg: ["#F6EFEA", "#171211"] } };
  function applicaTema(sx) {
    const r = document.documentElement;
    if (TEMA[sx]) r.dataset.sesso = sx; else delete r.dataset.sesso;
    const bg = TEMA[sx]?.bg || ["#FFF7F0", "#1A1614"];
    document.querySelectorAll('meta[name="theme-color"]').forEach((m, i) => m.setAttribute("content", bg[i] || bg[0]));
  }
  const notaTema = sx => TEMA[sx] ? `Palette dell'app: <strong>${TEMA[sx].nome}</strong> · ${TEMA[sx].desc}.` : "Senza sesso indicato resta la palette corallo.";

  // ---------- condividi ----------
  const URL_APP = "https://daddytoolbox.github.io/giry-toolbox/";
  const TESTO = "Giry toolbox: puericultura con fonti, acquisti scelti dai test di laboratorio e idee per mamma e papà, settimana dopo settimana. Gratis, senza pubblicità.";
  const SI = {
    wa: ['#25D366', '<path fill="currentColor" stroke="none" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.9s.7-2.1 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.7 1.2 1.6 2 1.1 1 2 1.3 2.3 1.4.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.2z"/>'],
    tg: ['#2AABEE', '<path fill="currentColor" stroke="none" d="M21.5 4.3 2.9 11.5c-1.3.5-1.2 1.2-.2 1.5l4.8 1.5 1.8 5.6c.2.6.4.8.8.8s.6-.2.9-.5l2.3-2.2 4.8 3.5c.9.5 1.5.2 1.7-.8l3.1-14.6c.3-1.3-.5-1.8-1.4-1.5zM9 14.2l9-5.7c.4-.3.8-.1.5.2l-7.4 6.7-.3 3.2z"/>'],
    mail: ['#8A7A70', '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m4 7 8 6 8-6"/>'],
    sms: ['#34A853', '<path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.1A8 8 0 1 1 20 12z"/>'],
    copia: ['#6B5E57', '<rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H15"/>'],
    altro: ['#4E5B4B', '<circle cx="6" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18" cy="12" r="1.6"/>']
  };
  const icona = k => `<span class="si" style="background:${SI[k][0]}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${SI[k][1]}</svg></span>`;
  async function copia(testo, el) {
    try { await navigator.clipboard.writeText(testo); }
    catch { const t = document.createElement("textarea"); t.value = testo; document.body.appendChild(t); t.select(); try { document.execCommand("copy"); } catch {} t.remove(); }
    if (el) { const o = el.lastChild.textContent; el.lastChild.textContent = "Copiato ✓"; setTimeout(() => { el.lastChild.textContent = o; }, 1600); }
  }
  function apriCondividi() {
    const msg = `${TESTO}\n${URL_APP}`, e = encodeURIComponent;
    const bg = document.createElement("div");
    bg.className = "sheet-bg";
    bg.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sh-t">
      <div class="grab"></div>
      <h2 id="sh-t">Condividi Giry toolbox</h2>
      <p class="muted small" style="margin:0">Mandala a chi aspetta un bimbo o ne ha appena avuto uno.</p>
      <div class="share-grid">
        <a href="https://wa.me/?text=${e(msg)}" target="_blank" rel="noopener">${icona("wa")}<span>WhatsApp</span></a>
        <a href="https://t.me/share/url?url=${e(URL_APP)}&text=${e(TESTO)}" target="_blank" rel="noopener">${icona("tg")}<span>Telegram</span></a>
        <a href="mailto:?subject=${e("Un'app utile per genitori: Giry toolbox")}&body=${e(msg)}">${icona("mail")}<span>Email</span></a>
        <a href="sms:?&body=${e(msg)}">${icona("sms")}<span>SMS</span></a>
        <button type="button" data-a="copia">${icona("copia")}<span>Copia link</span></button>
        ${navigator.share ? `<button type="button" data-a="altro">${icona("altro")}<span>Altre app</span></button>` : ""}
      </div>
      <div class="qr"><img src="qr.png" alt="Codice QR per aprire Giry toolbox" width="112" height="112">
        <p><strong>Di persona?</strong><br>Fai inquadrare questo codice con la fotocamera del telefono.</p></div>
      <div class="linkbox"><input type="text" readonly value="${URL_APP}" aria-label="Link dell'app"></div>
      <button class="btn ghost" type="button" data-a="chiudi">Chiudi</button>
    </div>`;
    const chiudi = () => { bg.remove(); document.removeEventListener("keydown", esc_); };
    const esc_ = ev => { if (ev.key === "Escape") chiudi(); };
    bg.addEventListener("click", ev => {
      if (ev.target === bg) return chiudi();
      const b = ev.target.closest("[data-a]"); if (!b) return;
      if (b.dataset.a === "chiudi") chiudi();
      if (b.dataset.a === "copia") copia(URL_APP, b);
      if (b.dataset.a === "altro") navigator.share({ title: "Giry toolbox", text: TESTO, url: URL_APP }).catch(() => {});
    });
    bg.querySelector("input").addEventListener("focus", ev => ev.target.select());
    document.addEventListener("keydown", esc_);
    document.body.appendChild(bg);
  }
  async function condividi() {
    // sul telefono apre il pannello nativo (WhatsApp, Telegram, Messaggi, Gmail…); altrimenti il nostro
    if (navigator.share && matchMedia("(pointer: coarse)").matches) {
      try { await navigator.share({ title: "Giry toolbox", text: TESTO, url: URL_APP }); return; }
      catch (err) { if (err && err.name === "AbortError") return; }
    }
    apriCondividi();
  }

  // ---------- installazione ----------
  let installa = null;
  window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); installa = e; });
  const installata = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  const iOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  function bloccoInstalla() {
    if (installata()) return "";
    if (installa) return `<section class="card soft c3"><p class="kicker">📲 Installa l'app</p><p>Aggiungila alla schermata Home: si apre a tutto schermo e funziona anche senza rete.</p><button class="btn small" type="button" id="installa">Installa</button></section>`;
    if (iOS()) return `<section class="card soft c3"><p class="kicker">📲 Installa l'app</p><p>In Safari tocca <strong>Condividi</strong> (il quadrato con la freccia) e poi <strong>Aggiungi alla schermata Home</strong>.</p></section>`;
    return "";
  }

  // ---------- dati ----------
  async function carica() {
    const get = async u => (await fetch(u, { cache: "no-cache" })).json();
    try { C = await get("contenuti.json"); } catch { C = null; }
    try { E = await get("eventi.json"); } catch { E = { eventi: [] }; }
    try { A = await get("acquisti.json"); } catch { A = null; }
  }

  // ---------- profilo ----------
  function vistaProfilo(primo) {
    const p = store.get("profilo", { stato: "attesa", data: "", nome: "", citta: "Torino" });
    $app.innerHTML = `
      ${primo ? `<div class="welcome"><img src="icon-512.png?v=18" alt=""><h1>Benvenuti in Giry toolbox</h1>
        <p>Due informazioni e l'app si adatta da sola, settimana dopo settimana.</p></div>`
        : `<a class="back" href="#/oggi">← Indietro</a><h1 class="plain">Impostazioni</h1>`}
      <form id="f" class="card">
        <label>Situazione</label>
        <div class="seg">
          <label><input type="radio" name="stato" value="attesa" ${p.stato === "attesa" ? "checked" : ""}><span>🤰 In attesa</span></label>
          <label><input type="radio" name="stato" value="nato" ${p.stato === "nato" ? "checked" : ""}><span>👶 È nato</span></label>
        </div>
        <label>Sesso <span class="muted">(facoltativo)</span></label>
        <div class="seg seg3">
          <label><input type="radio" name="sesso" value="m" ${p.sesso === "m" ? "checked" : ""}><span>Maschio</span></label>
          <label><input type="radio" name="sesso" value="f" ${p.sesso === "f" ? "checked" : ""}><span>Femmina</span></label>
          <label><input type="radio" name="sesso" value="" ${!p.sesso ? "checked" : ""}><span>Non so</span></label>
        </div>
        <p class="palette-hint" id="palette-hint">${notaTema(p.sesso)}</p>
        <label for="data" id="lbl-data">${p.stato === "nato" ? "Data di nascita" : "Data presunta del parto"}</label>
        <input type="date" id="data" name="data" value="${esc(p.data)}" required>
        <label for="nome">Nome o soprannome <span class="muted">(facoltativo)</span></label>
        <input type="text" id="nome" name="nome" value="${esc(p.nome)}" placeholder="Es. Fagiolino" maxlength="30">
        <label for="citta">Città</label>
        <input type="text" id="citta" name="citta" value="${esc(p.citta || "Torino")}">
        <button class="btn" type="submit">${primo ? "Iniziamo" : "Salva"}</button>
        ${primo ? "" : `<button class="btn ghost" type="button" id="reset">Azzera le liste spuntate</button>`}
      </form>
      ${primo ? "" : `${bloccoSync()}${bloccoInstalla()}<section class="card soft c5"><p class="kicker">💌 Passaparola</p><p>Conosci qualcuno in attesa? Mandagli l'app con WhatsApp, Telegram, email o un codice QR.</p><button class="btn small" type="button" id="condividi2">Condividi l'app</button></section>`}
      <p class="foot">I dati restano solo su questo telefono.</p>
      ${firma()}`;
    const f = document.getElementById("f");
    f.addEventListener("change", e => { if (e.target.name === "sesso") { applicaTema(e.target.value); document.getElementById("palette-hint").innerHTML = notaTema(e.target.value); } if (e.target.name === "stato") document.getElementById("lbl-data").textContent = e.target.value === "nato" ? "Data di nascita" : "Data presunta del parto"; });
    f.addEventListener("submit", e => {
      e.preventDefault();
      const d = new FormData(f);
      store.set("profilo", { stato: d.get("stato"), sesso: d.get("sesso") || "", data: d.get("data"), nome: (d.get("nome") || "").trim(), citta: (d.get("citta") || "").trim() });
      location.hash = "#/oggi"; render();
    });
    document.getElementById("condividi2")?.addEventListener("click", condividi);
    eventiSync(() => vistaProfilo(false));
    document.getElementById("installa")?.addEventListener("click", async () => { if (!installa) return; installa.prompt(); try { await installa.userChoice; } catch {} installa = null; vistaProfilo(false); });
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
          <p class="kicker">${p.nome ? esc(p.nome) : p.sesso === "f" ? "La vostra bimba" : "Il vostro bimbo"} ha</p>
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
    const hub = f.stato === "nato" ? ["calendario", "acquisti", "guide", "organizza", "liste", "vicino", "nascita", "mamma", "papa"]
      : ["calendario", "nascita", "acquisti", "organizza", "liste", "vicino", "attivita", "mamma", "papa"];
    const pe = prossimiEventi()[0];
    const ev = filtraEventi(f)[0];
    const st = C.organizza.stagioni[stagione(oggi())];

    $app.innerHTML = `
      ${hero}
      <div class="hub">${hub.map(k => `<a class="hubtile ${SEZ[k].col}" href="#/${k}"><span>${SEZ[k].emo}</span>${SEZ[k].nome}</a>`).join("")}</div>
      ${pe ? `<a class="card link soft c3" href="#/calendario"><p class="kicker">📅 Prossimo appuntamento</p><h2>${tipo(pe.tipo)[2]} ${esc(pe.titolo)}</h2>
        <p>${esc(fmtData(pe.data))}${pe.ora ? ", ore " + esc(pe.ora) : ""}${pe.luogo ? " · " + esc(pe.luogo) : ""} →</p></a>` : ""}
      ${store.get("leggimiVisto", false) ? "" : leggimi()}

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
      ${store.get("leggimiVisto", false) ? `<div style="margin-top:14px">${leggimi()}</div>` : ""}
      ${firma()}`;

    document.getElementById("lg-ok")?.addEventListener("click", () => { store.set("leggimiVisto", true); const d = document.getElementById("leggimi"); d.open = false; d.scrollIntoView({ block: "nearest" }); document.getElementById("lg-ok").remove(); });
    $app.querySelectorAll(".todo input").forEach(cb => cb.addEventListener("change", () => {
      const t = store.get("todo", {}); if (cb.checked) t[cb.dataset.k] = 1; else delete t[cb.dataset.k]; store.set("todo", t);
    }));
  }

  // ---------- leggimi ----------
  function leggimi() {
    const L = C.leggimi; if (!L) return "";
    const visto = store.get("leggimiVisto", false);
    const blocco = x => `<p class="lbl">${esc(x.t)}</p>${x.p.map(t => `<p>${inline(t)}</p>`).join("")}`;
    return `<details class="card acc leggimi" id="leggimi" ${visto ? "" : "open"}>
      <summary><div><span class="pill">${visto ? "Leggimi" : "Nuovo qui?"}</span><h3>ℹ️ ${esc(L.titolo)}</h3></div></summary>
      <p class="muted">${esc(L.intro)}</p>
      ${L.sezioni.map(blocco).join("")}
      <div class="disc">${blocco(L.disclaimer)}<p class="small"><a href="#/acquisti">Il metodo completo è in Acquisti smart → Come scegliamo</a></p></div>
      ${visto ? "" : `<button class="btn small" type="button" id="lg-ok">Ho capito</button>`}
    </details>`;
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
  function notaSesso() {
    const sx = store.get("profilo", {}).sesso;
    const M = `<p class="kicker">Se è un maschio</p><ul class="dots"><li>Il prepuzio <strong>non va retratto</strong>: si stacca da solo nel corso degli anni. Si lava solo l'esterno con acqua.</li><li>Una piccola sacca di sebo biancastro sotto la pelle è normale.</li></ul>`;
    const F = `<p class="kicker">Se è una femmina</p><ul class="dots"><li>Pulisci sempre <strong>dal davanti verso il dietro</strong>.</li><li>Nei primi giorni piccole perdite biancastre o un po' di sangue sono normali: sono gli ormoni della mamma.</li></ul>`;
    const fonti_ = fonti([{ t: "HealthyChildren (AAP) – Care for an uncircumcised penis", u: "https://www.healthychildren.org/English/ages-stages/baby/bathing-skin-care/Pages/Care-for-an-uncircumcised-penis.aspx" }, { t: "NHS – Washing and bathing your baby", u: "https://www.nhs.uk/baby/caring-for-a-newborn/washing-and-bathing-your-baby/" }]);
    return `<section class="card soft c3">${sx === "m" ? M : sx === "f" ? F : M + F}${fonti_}</section>`;
  }
  function vistaGuida(id) {
    const s = C.schede.find(x => x.id === id);
    if (!s) { location.hash = "#/guide"; return; }
    $app.innerHTML = `
      <a class="back" href="#/guide">← Guide</a>
      <header class="pagehead ${tinta(s.id)}"><span class="pe">${s.icona}</span><div><h1>${esc(s.titolo)}</h1><p>${esc(s.fase)}</p></div></header>
      <article class="card article">${rich(s.testo)}</article>
      ${s.id === "bagnetto" ? notaSesso() : ""}
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
    const sx = f.p.sesso === "m" ? -0.25 : f.p.sesso === "f" ? 0.25 : 0;
    const spost = m => m === 0 ? 0 : Math.max(0, m + sx * Math.min(1, m));
    const bande = O.taglie.map(tg => ({ ...tg, d0: addDays(B, spost(tg.mesi[0]) * 30.44), d1: addDays(B, spost(tg.mesi[1]) * 30.44) }))
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
      <p class="muted small">Le date sono calcolate dalla ${f.stato === "attesa" ? "data presunta del parto" : "data di nascita"}: ogni bambino cresce a modo suo, controlla sempre la lunghezza in cm sull'etichetta.${f.p.sesso ? ` Calcolo corretto per ${f.p.sesso === "m" ? "un maschio" : "una femmina"} secondo le curve di crescita OMS.` : ""}</p>
      ${bimboHtml}
      ${regali.length ? `<section class="card soft c4"><p class="kicker">🎁 Da chiedere in regalo</p>
        <p>Copia e manda a nonni e amici:</p>
        <div class="regali" id="regali">${regali.map(r => `<div>${esc(r)}</div>`).join("")}</div>
        <button class="btn small" id="copia">Copia la lista</button></section>` : ""}
      <a class="card link soft c4" href="#/nascita"><p class="kicker">🎁 Lista nascita</p><h2>La vostra lista, pronta da condividere</h2><p>Tre prodotti consigliati per voce, oppure il vostro. PDF per WhatsApp →</p></a>
      <a class="card link soft c2" href="#/acquisti"><p class="kicker">🛒 Acquisti smart</p><h2>Seggiolino, passeggino, culla, marsupio</h2><p>Scelti dai test di laboratorio, non dal marchio →</p></a>
      <h2 class="sec">💡 Consigli smart</h2>
      <div class="card">${C.organizza.smart.map(ideaRow).join("")}</div>
      <a class="card link soft c5" href="#/liste"><p class="kicker">✅ Liste</p><h2>Borsa per l'ospedale, casa, pratiche</h2><p>Da spuntare man mano →</p></a>
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
    { id: "giochi", uno: "Parco giochi",  nome: "Parchi giochi", emo: "🛝", sel: ['nwr[leisure=playground]'], nota: "Altalene a cestello e sabbia: dai 6 mesi circa, sempre con un adulto vicino." },
    { id: "ludo", uno: "Ludoteca",    nome: "Ludoteche",     emo: "🧩", sel: ['nwr[amenity=toy_library]', 'nwr[leisure=indoor_play]'], nota: "Giochi diversi da casa e altri bambini: spesso c'è uno spazio 0-3." },
    { id: "biblio", uno: "Biblioteca",  nome: "Biblioteche",   emo: "📚", sel: ['nwr[amenity=library]'], nota: "Chiedi della sezione 0-6 e delle letture Nati per Leggere." },
    { id: "musei", uno: "Museo",   nome: "Musei",         emo: "🏛️", sel: ['nwr[tourism=museum]'], nota: "Spesso gratis per i più piccoli: cerca i laboratori per famiglie." },
    { id: "parchi", uno: "Parco",  nome: "Parchi",        emo: "🌳", sel: ['nwr[leisure=park][name]'], nota: "Passeggiate con carrozzina o fascia, picnic all'ombra." },
    { id: "piscine", uno: "Piscina", nome: "Piscine",       emo: "🏊", sel: ['nwr[leisure=sports_centre][sport=swimming]', 'nwr[leisure=water_park]'], nota: "Chiedi dei corsi di acquaticità neonatale o prenatale." },
    { id: "animali", uno: "Fattoria o zoo", nome: "Animali",       emo: "🐐", sel: ['nwr[tourism=zoo]', 'nwr[tourism=farm]'], nota: "Fattorie didattiche e piccoli zoo: ottimi dai 18 mesi." }
  ];
  function categoria(t) {
    if (t.amenity === "toy_library" || t.leisure === "indoor_play" || /ludoteca/i.test(t.name || "")) return "ludo";
    if (t.leisure === "playground") return "giochi";
    if (t.amenity === "library") return "biblio";
    if (t.tourism === "museum") return "musei";
    if (t.leisure === "sports_centre" || t.leisure === "swimming_pool" || t.leisure === "water_park") return "piscine";
    if (t.tourism === "zoo" || t.tourism === "farm" || /fattoria/i.test(t.name || "")) return "animali";
    if (t.leisure === "park") return "parchi";
    return null;
  }
  const distanza = (a, b, c, d) => { const R = 6371000, r = x => x * Math.PI / 180; const dl = r(c - a), dg = r(d - b);
    const h = Math.sin(dl / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(dg / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
  const fmtDist = m => m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1).replace(".", ",")} km`;

  // Photon (komoot): ricerca di luoghi OpenStreetMap per categoria, veloce e con CORS
  const TAG = {
    giochi: ["leisure:playground"], ludo: ["amenity:toy_library", "leisure:indoor_play"], biblio: ["amenity:library"],
    musei: ["tourism:museum"], parchi: ["leisure:park"], piscine: ["leisure:sports_centre", "leisure:water_park", "leisure:swimming_pool"],
    animali: ["tourism:zoo", "tourism:farm"]
  };
  function catDa(k, v, nome) {
    if (k === "leisure" && v === "sports_centre" && !/piscin|nuoto|acqu|swim/i.test(nome || "")) return null;
    for (const [c, tags] of Object.entries(TAG)) if (tags.includes(`${k}:${v}`)) return c;
    return null;
  }
  function conTimeout(url, ms) {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), ms);
    return fetch(url, { signal: ctl.signal }).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }).finally(() => clearTimeout(t));
  }
  async function unaCategoria(c, lat, lon, raggio) {
    const url = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}&radius=${raggio / 1000}&limit=50${TAG[c].map(t => "&osm_tag=" + t).join("")}`;
    for (let i = 0; i < 2; i++) {
      try { return (await conTimeout(url, 8000)).features || []; }
      catch { await new Promise(z => setTimeout(z, 500)); }
    }
    throw new Error("categoria " + c);
  }
  // restituisce i risultati man mano che arrivano: onDati(lista, finito, errori)
  async function cercaLuoghi(lat, lon, raggio, ordine, onDati) {
    const key = `luoghi2:${lat.toFixed(3)},${lon.toFixed(3)},${raggio}`;
    const cache = store.get(key, null);
    if (cache && Date.now() - cache.t < 7 * DAY) { onDati(cache.r, true, 0); return; }
    const tutti = [], visti = new Set(); let errori = 0;
    const coda = [...ordine, ...Object.keys(TAG).filter(c => !ordine.includes(c))];
    const lavora = async () => {
      while (coda.length) {
        const c = coda.shift();
        try {
          for (const ft of await unaCategoria(c, lat, lon, raggio)) {
            const p = ft.properties || {}, [lo, la] = ft.geometry?.coordinates || [];
            const cat = catDa(p.osm_key, p.osm_value, p.name);
            if (la == null || !cat) continue;
            const id = `${p.osm_type}${p.osm_id}`; if (visti.has(id)) continue; visti.add(id);
            const d = Math.round(distanza(lat, lon, la, lo)); if (d > raggio) continue;
            tutti.push({ cat, nome: p.name || null, lat: la, lon: lo, via: [p.street, p.housenumber].filter(Boolean).join(" "), d });
          }
        } catch { errori++; }
        tutti.sort((x, y) => x.d - y.d);
        onDati([...tutti], coda.length === 0 && attivi === 1, errori);
      }
    };
    let attivi = 0;
    await Promise.all([0, 1, 2].map(async () => { attivi++; await lavora(); attivi--; }));
    onDati([...tutti], true, errori);
    if (!errori) store.set(key, { t: Date.now(), r: tutti });
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
      <div id="risultati">${pos ? `<div class="card empty"><span class="spin"></span> Cerco i luoghi vicini…</div>` : `<div class="card soft c3"><p class="kicker">Come funziona</p><p>Tocca il pulsante o scrivi un luogo: ti mostro parchi giochi, biblioteche, musei, piscine e parchi intorno a te, in ordine di distanza.</p><p class="muted small" style="margin:0">La posizione serve solo per la ricerca e resta sul telefono.</p></div>`}</div>
      <p class="foot">Dati luoghi © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a> · ricerca <a href="https://photon.komoot.io" target="_blank" rel="noopener">Photon</a></p>`;

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
    let lista = [], finito = false, errori = 0, cat = filtro;
    const disegna = () => {
      if (!lista.length) {
        box.innerHTML = finito
          ? `<div class="card empty">${errori ? "Il servizio mappe non risponde in questo momento. Riprova tra poco." : "Nessun luogo trovato in questo raggio: prova ad allargarlo."}</div>`
          : `<div class="card empty"><span class="spin"></span> Cerco i luoghi vicini…</div>`;
        return;
      }
      const conta = Object.fromEntries(CAT.map(c => [c.id, lista.filter(x => x.cat === c.id).length]));
      const cats = CAT.filter(c => conta[c.id]).sort((a, b) => (suggerite.includes(b.id) - suggerite.includes(a.id)) || suggerite.indexOf(a.id) - suggerite.indexOf(b.id));
      const vis = cat === "tutti" ? lista.filter(x => suggerite.includes(x.cat)).concat(lista.filter(x => !suggerite.includes(x.cat))) : lista.filter(x => x.cat === cat);
      const nota = cat !== "tutti" ? CAT.find(c => c.id === cat)?.nota : null;
      box.innerHTML = `
        <div class="chips">
          <button class="chip" data-c="tutti" aria-pressed="${cat === "tutti"}">✨ Consigliati</button>
          ${cats.map(c => `<button class="chip" data-c="${c.id}" aria-pressed="${cat === c.id}">${c.emo} ${c.nome} <span class="cnt">${conta[c.id]}</span></button>`).join("")}
        </div>
        ${!finito ? `<p class="hint" style="margin:0 0 12px"><span class="spin"></span> Sto ancora cercando altri luoghi…</p>` : errori ? `<p class="hint" style="margin:0 0 12px">Alcune categorie non hanno risposto: riapri la pagina per riprovare.</p>` : ""}
        ${nota ? `<p class="hint" style="margin:0 0 12px">${esc(nota)}</p>` : ""}
        <div class="glist">${vis.slice(0, 50).map(x => { const c = CAT.find(k => k.id === x.cat); const nome = x.nome || c.uno; return `
          <div class="grow place">
            <span class="gi ${tinta(c.id)}">${c.emo}</span>
            <span class="gt"><strong>${esc(nome)}</strong>
              <small>${c.nome} · ${fmtDist(x.d)}${x.via ? " · " + esc(x.via) : ""}</small>
              <span class="acts"><a href="https://www.google.com/maps/dir/?api=1&destination=${x.lat},${x.lon}" target="_blank" rel="noopener">Indicazioni</a> · <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(nome + " " + x.lat + "," + x.lon)}" target="_blank" rel="noopener">Info e orari</a></span></span>
          </div>`; }).join("")}</div>
        ${vis.length > 50 ? `<p class="foot">Mostro i 50 più vicini.</p>` : ""}`;
      box.querySelectorAll("[data-c]").forEach(b => b.addEventListener("click", () => { cat = b.dataset.c; store.set("catVicino", cat); disegna(); }));
    };
    cercaLuoghi(pos.lat, pos.lon, raggio, suggerite, (r, fin, err) => {
      if (location.hash !== "#/vicino") return;
      lista = r; finito = fin; errori = err; disegna();
    });
  }

  // ---------- acquisti smart ----------
  const meseIso = ym => { const [y, m] = ym.split("-").map(Number); return new Date(y, m - 1, 15).toLocaleDateString("it-IT", { month: "long", year: "numeric" }); };
  const idealo = q => `https://www.idealo.it/MainSearchProductCategory.html?q=${encodeURIComponent(q)}`;
  const SCALA = { ADAC: "voto ADAC · 0,5 ottimo → 5,5 insufficiente", Warentest: "voto Stiftung Warentest · 0,5 ottimo → 5,5 insufficiente", Altroconsumo: "punteggio Altroconsumo su 100" };
  function cardScelta(x) {
    const badge = [x.top ? `<span class="badge b-top">La nostra scelta</span>` : "", x.conv ? `<span class="badge b-conv">Miglior rapporto</span>` : "", x.piccolo ? `<span class="badge b-small">Marchio piccolo</span>` : ""].join("");
    return `<div class="pick">
      <div class="voto" title="${esc(SCALA[x.scala] || "")}"><b>${esc(x.voto)}</b><small>${esc(x.scala)}</small></div>
      <div class="pick-b">
        ${badge ? `<div class="badges">${badge}</div>` : ""}
        <h3>${esc(x.nome)}</h3>
        <p class="meta">${esc(x.fonte)} · ${esc(meseIso(x.data))} · <strong>${esc(x.prezzo)}</strong>${x.prezzoOggi ? ` · oggi da <strong>${esc(x.prezzoOggi.valore)}</strong> (${esc(fmtData(x.prezzoOggi.data))})` : ""}</p>
        ${x.nota ? `<p class="pn">${inline(x.nota)}</p>` : ""}
        <p class="acts"><a href="${esc(x.link)}" target="_blank" rel="noopener">Il test</a>${x.q ? ` · <a href="${idealo(x.q)}" target="_blank" rel="noopener">Prezzo di oggi</a>` : ""}${voceDaProdotto(x.nome) ? ` · <button type="button" class="linkbtn inl" data-ln="${esc(x.nome)}">＋ Lista nascita</button>` : ""}</p>
      </div>
    </div>`;
  }
  function gruppoAdesso(cat, f) {
    if (cat.id !== "seggiolino" || f.stato !== "nato") return 0;
    return f.mesi < 12 ? 0 : f.mesi < 42 ? 1 : 2;
  }
  function vistaAcquisti(f) {
    if (!A) { $app.innerHTML = testata("acquisti") + `<div class="card empty">Non riesco a caricare i consigli d'acquisto. Controlla la connessione.</div>`; return; }
    const scelta = store.get("acqCat", A.categorie[0].id);
    const cats = [...A.categorie.map(c => ({ id: c.id, nome: c.nome, emo: c.emo })), { id: "tessili", nome: "Tessili", emo: "🧦" }];
    const cat = A.categorie.find(c => c.id === scelta);
    let corpo;
    if (scelta === "tessili") {
      const T = A.tessili;
      corpo = `<section class="card"><h2>🧦 ${esc(T.titolo)}</h2><p class="muted">${esc(T.intro)}</p>${lista(T.punti)}${fonti(T.fonti)}</section>`;
    } else {
      const ga = gruppoAdesso(cat, f);
      corpo = `
        <section class="card soft c2"><p class="kicker">${cat.emo} ${esc(cat.nome)}</p><p style="margin:0 0 8px"><strong>${esc(cat.quando)}</strong></p>
          <p class="muted small" style="margin:0">Norma: ${esc(cat.norma)}</p></section>
        ${cat.nessunTest ? `<div class="card empty left">${esc(cat.nessunTest)}</div>` : ""}
        ${cat.gruppi.map((g, i) => `<h2 class="sec">${esc(g.nome)}${i === ga && f.stato === "nato" && cat.id === "seggiolino" ? ` <span class="pill on">Adesso</span>` : ""}</h2>
          <div class="glist picks">${g.scelte.map(cardScelta).join("")}</div>`).join("")}
        ${cat.avviso ? `<p class="hint">${esc(cat.avviso)}</p>` : ""}
        <section class="card"><h2>Come scegliere</h2>${lista(cat.consigli)}</section>
        ${cat.altri?.length ? `<h2 class="sec">🔎 E i marchi noti?</h2><div class="glist">${cat.altri.map(x => `
          <div class="grow avoid"><span class="gi c5">?</span><span class="gt"><strong>${esc(x.nome)}</strong><small>${inline(x.stato)}</small>
            ${x.link ? `<span class="acts"><a href="${esc(x.link)}" target="_blank" rel="noopener">Fonte</a></span>` : ""}</span></div>`).join("")}</div>
          <p class="hint">Un modello non in lista non è per forza peggiore: spesso manca solo un test imparziale che lo confronti con gli altri.</p>` : ""}
        ${cat.evitare.length ? `<h2 class="sec">⛔ Da evitare</h2><div class="glist">${cat.evitare.map(e => `
          <div class="grow avoid"><span class="gi ${e.richiamo ? "c4" : "c0"}">${e.richiamo ? "⚠️" : "✋"}</span>
            <span class="gt"><strong>${esc(e.nome)}</strong><small>${inline(e.motivo)}</small>
            <span class="acts">${e.richiamo ? `<span class="badge b-rec">Richiamo</span> ` : ""}${esc(meseIso(e.data))} · <a href="${esc(e.link)}" target="_blank" rel="noopener">Fonte</a></span></span></div>`).join("")}</div>` : ""}
        ${fonti(cat.fonti)}`;
    }
    $app.innerHTML = `<a class="back" href="#/organizza">← Organizza</a>` + testata("acquisti", "Acquisti smart", SEZ.acquisti.sub) + `
      <p class="muted">${esc(A.intro)}</p>
      <div class="chips">${cats.map(c => `<button class="chip" data-c="${c.id}" aria-pressed="${c.id === scelta}">${c.emo} ${esc(c.nome)}</button>`).join("")}</div>
      ${corpo}
      <details class="card acc"><summary><div><span class="pill">Metodo</span><h3>Come scegliamo</h3></div></summary>${lista(A.metodo)}</details>
      <p class="foot">Consigli aggiornati il ${fmtData(A.aggiornato)} · richiami Safety Gate verificati il ${fmtData(A.richiamiVerificati)}.<br>Prima di comprare controlla sempre il prezzo di oggi e che il modello non sia stato richiamato.</p>
      <details class="sources"><summary>Dove controlliamo i richiami</summary><ol>${A.fontiRichiami.map(x => `<li><a href="${esc(x.u)}" target="_blank" rel="noopener">${esc(x.t)}</a></li>`).join("")}</ol></details>`;
    $app.querySelectorAll(".chip").forEach(b => b.addEventListener("click", () => { store.set("acqCat", b.dataset.c); vistaAcquisti(f); }));
    $app.querySelectorAll("[data-ln]").forEach(b => b.addEventListener("click", () => mettiInLista(b.dataset.ln)));
  }

  // ---------- lista nascita ----------
  const LN = () => A?.listaNascita;
  const statoLN = () => { const s = store.get("nascita", null) || {}; return { titolo: s.titolo || "", messaggio: s.messaggio || "", voci: s.voci || {}, extra: s.extra || [] }; };
  function toast(t) {
    document.querySelector(".toast")?.remove();
    const d = document.createElement("div"); d.className = "toast"; d.setAttribute("role", "status"); d.textContent = t;
    document.body.appendChild(d); setTimeout(() => d.remove(), 3800);
  }
  function trovaScelta(cat, nome) {
    const c = A?.categorie.find(x => x.id === cat);
    for (const g of c?.gruppi || []) { const x = g.scelte.find(y => y.nome === nome); if (x) return x; }
    return null;
  }
  function opzioniVoce(v) {
    if (v.rif) return v.rif.map(n => trovaScelta(v.cat, n)).filter(Boolean).map(x => ({
      nome: x.nome, voto: x.voto, scala: x.scala, prezzo: x.prezzoOggi?.valore || x.prezzo, link: x.link, q: x.q, test: true }));
    return (v.opzioni || []).map(o => ({ nome: o.nome, nota: o.nota }));
  }
  function vociLN(s) {
    return [...LN().voci.map(v => ({ ...v, base: true })),
      ...s.extra.map(e => ({ id: e.id, gruppo: e.gruppo, nome: e.nome, qta: 1, base: false }))];
  }
  function sceltaDi(v, st) {
    const o = opzioniVoce(v);
    if (st.scelta === "altro" || !o.length) return st.altro?.nome ? { nome: st.altro.nome, prezzo: st.altro.prezzo, link: st.altro.link, mio: true } : null;
    return typeof st.scelta === "number" && o[st.scelta] ? o[st.scelta] : null;
  }
  // mappa prodotto consigliato -> voce della lista (per il pulsante in Acquisti smart)
  function voceDaProdotto(nome) {
    for (const v of LN()?.voci || []) { const i = (v.rif || []).indexOf(nome); if (i >= 0) return { id: v.id, i, voce: v.nome }; }
    return null;
  }
  function mettiInLista(nome) {
    const r = voceDaProdotto(nome); if (!r) return;
    const s = statoLN(); const st = s.voci[r.id] = s.voci[r.id] || {};
    st.scelta = r.i; st.tolta = false; store.set("nascita", s);
    toast(`In lista nascita: ${nome}`);
  }
  function gruppiLN(s) { return [...new Set([...LN().gruppi, ...s.extra.map(e => e.gruppo)])]; }
  function titoloLN(s, f) { return s.titolo || `Lista nascita${f.p.nome ? " di " + f.p.nome : ""}`; }

  function cardVoce(v, s) {
    const st = s.voci[v.id] || {}, o = opzioniVoce(v), sc = sceltaDi(v, st);
    const qta = st.qta || v.qta || 1, altro = st.scelta === "altro" || !o.length;
    return `<details class="card acc voce${st.preso ? " preso" : ""}" data-id="${esc(v.id)}">
      <summary><div><div class="vh"><h3>${esc(v.nome)}</h3><span class="qx" ${qta > 1 ? "" : "hidden"}>×${qta}</span></div>
        <p class="vs">${vsTesto(sc, st)}</p></div></summary>
      ${v.nota ? `<p class="hint" style="margin:0 0 10px">${esc(v.nota)}${v.fonte ? ` <a href="${esc(v.fonte.u)}" target="_blank" rel="noopener">Fonte</a>` : ""}</p>` : ""}
      ${o.length ? `<p class="lbl" style="margin-top:0">${v.rif ? "I tre consigliati dai test" : "Che tipo scegliere"}</p>
      <div class="opts">${o.map((x, i) => `<label class="opt"><input type="radio" name="r-${esc(v.id)}" value="${i}" ${st.scelta === i ? "checked" : ""}>
        <span><strong>${esc(x.nome)}</strong>${x.test ? `<small>${esc(x.voto)} ${esc(x.scala)} · ${esc(x.prezzo)} · <a href="${esc(x.link)}" target="_blank" rel="noopener">il test</a></small>` : x.nota ? `<small>${esc(x.nota)}</small>` : ""}</span></label>`).join("")}
        <label class="opt"><input type="radio" name="r-${esc(v.id)}" value="altro" ${st.scelta === "altro" ? "checked" : ""}><span><strong>Un altro prodotto</strong><small>Scrivi tu marca e modello</small></span></label>
      </div>` : ""}
      <div class="altro" ${altro ? "" : "hidden"}>
        <input type="text" data-f="altro.nome" placeholder="${o.length ? "Marca e modello" : "Prodotto (facoltativo)"}" value="${esc(st.altro?.nome || "")}" maxlength="80">
        <div class="row2"><input type="text" data-f="altro.prezzo" placeholder="Prezzo" value="${esc(st.altro?.prezzo || "")}" maxlength="20">
          <input type="url" data-f="altro.link" placeholder="Link (facoltativo)" value="${esc(st.altro?.link || "")}"></div>
      </div>
      <div class="row2 vfoot">
        <label class="mini">Quantità <input type="number" min="1" max="99" data-f="qta" value="${qta}" inputmode="numeric"></label>
        <label class="mini chk"><input type="checkbox" data-f="preso" ${st.preso ? "checked" : ""}><span>Già preso</span></label>
      </div>
      <input type="text" data-f="nota" placeholder="Nota per chi regala: colore, taglia, negozio…" value="${esc(st.nota || "")}" maxlength="140">
      <button type="button" class="linkbtn" data-a="${v.base ? "togli" : "elimina"}">${v.base ? "Togli dalla lista" : "Elimina questa voce"}</button>
    </details>`;
  }
  const vsTesto = (sc, st) => `${st.preso ? `<span class="ok">✓ Già preso</span> · ` : ""}${sc ? esc(sc.nome) : `<span class="muted">Da scegliere</span>`}`;

  function vistaNascita(f) {
    if (!LN()) { $app.innerHTML = testata("nascita") + `<div class="card empty">Non riesco a caricare la lista. Controlla la connessione.</div>`; return; }
    caricaPdf().catch(() => {});
    const s = statoLN();
    const aperte = new Set([...$app.querySelectorAll("details.voce[open]")].map(d => d.dataset.id));
    const voci = vociLN(s), att = voci.filter(v => !s.voci[v.id]?.tolta), tolte = voci.filter(v => s.voci[v.id]?.tolta);
    const grp = gruppiLN(s);
    $app.innerHTML = `<div class="ln"><a class="back" href="#/organizza">← Organizza</a>` + testata("nascita", "Lista nascita", SEZ.nascita.sub) + `
      <p class="muted">${esc(LN().intro)}</p>
      <section class="card">
        <label class="fl" for="ln-titolo">Titolo</label>
        <input type="text" id="ln-titolo" value="${esc(titoloLN(s, f))}" maxlength="60">
        <label class="fl" for="ln-msg">Messaggio per chi regala <span class="muted">(facoltativo)</span></label>
        <textarea id="ln-msg" rows="2" maxlength="300" placeholder="Es. Scriveteci prima di comprare, così evitiamo doppioni.">${esc(s.messaggio)}</textarea>
        <div class="bar"><span id="ln-bar"></span></div><small class="muted" id="ln-prog"></small>
      </section>
      ${grp.map(g => { const vs = att.filter(v => v.gruppo === g); return vs.length ? `<h2 class="sec">${esc(g)}</h2>${vs.map(v => cardVoce(v, s)).join("")}` : ""; }).join("")}
      <section class="card soft c4"><h2>➕ Aggiungi una voce</h2>
        <form id="ln-add" class="addv">
          <input type="text" name="nome" placeholder="Es. Cuscino per l'allattamento" required maxlength="60" aria-label="Nome della voce">
          <select name="gruppo" aria-label="Sezione">${grp.map(g => `<option>${esc(g)}</option>`).join("")}</select>
          <button class="btn small" type="submit">Aggiungi</button>
        </form>
      </section>
      ${tolte.length ? `<details class="card acc"><summary><div><span class="pill">${tolte.length}</span><h3>Voci tolte</h3></div></summary>
        ${tolte.map(v => `<div class="row-h tolta"><span>${esc(v.nome)}</span><button type="button" class="btn small ghost" data-rip="${esc(v.id)}">Rimetti</button></div>`).join("")}</details>` : ""}
      <section class="card sharebox">
        <h2>📤 Condividi la lista</h2>
        <p class="muted small">Il PDF si apre su qualsiasi telefono: mandalo su WhatsApp, Telegram o per email.</p>
        <button class="btn" type="button" id="ln-pdf">Condividi il PDF</button>
        <div class="row2"><button class="btn ghost" type="button" id="ln-scarica">Scarica PDF</button><button class="btn ghost" type="button" id="ln-testo">Invia come testo</button></div>
      </section>
      <p class="foot">La lista resta su questo telefono. Nel PDF ci sono solo le voci non tolte.</p></div>`;
    aperte.forEach(id => $app.querySelector(`details.voce[data-id="${CSS.escape(id)}"]`)?.setAttribute("open", ""));

    const salva = () => store.set("nascita", s);
    const progresso = () => {
      const n = att.length, k = att.filter(v => sceltaDi(v, s.voci[v.id] || {})).length;
      document.getElementById("ln-bar").style.width = (n ? Math.round(k / n * 100) : 0) + "%";
      document.getElementById("ln-prog").textContent = `${k} di ${n} voci con un prodotto scelto`;
    };
    progresso();
    const ridisegna = () => { const y = scrollY; vistaNascita(f); scrollTo(0, y); };
    const voceDi = el => { const d = el.closest("details.voce"); if (!d) return null; const v = voci.find(x => x.id === d.dataset.id); return { d, v, st: (s.voci[v.id] = s.voci[v.id] || {}) }; };
    const aggiornaRiga = ({ d, v, st }) => {
      d.querySelector(".vs").innerHTML = vsTesto(sceltaDi(v, st), st);
      const q = st.qta || v.qta || 1, qx = d.querySelector(".qx"); qx.textContent = "×" + q; qx.hidden = q <= 1;
      d.classList.toggle("preso", !!st.preso); progresso();
    };
    let timer;
    $app.querySelector(".ln").addEventListener("input", e => {
      const t = e.target;
      if (t.id === "ln-titolo") { s.titolo = t.value.trim(); }
      else if (t.id === "ln-msg") { s.messaggio = t.value; }
      else if (t.dataset.f) {
        const x = voceDi(t); if (!x) return;
        const f_ = t.dataset.f;
        if (f_.startsWith("altro.")) { x.st.altro = x.st.altro || {}; x.st.altro[f_.slice(6)] = t.value.trim(); if (f_ === "altro.nome" && opzioniVoce(x.v).length) x.st.scelta = "altro"; }
        else if (f_ === "qta") x.st.qta = Math.max(1, Math.min(99, parseInt(t.value, 10) || 1));
        else if (f_ === "preso") x.st.preso = t.checked;
        else x.st[f_] = t.value.trim();
        aggiornaRiga(x);
      } else return;
      clearTimeout(timer); timer = setTimeout(salva, 250);
    });
    $app.querySelector(".ln").addEventListener("change", e => {
      const t = e.target;
      if (t.type === "radio") {
        const x = voceDi(t); x.st.scelta = t.value === "altro" ? "altro" : +t.value;
        const box = x.d.querySelector(".altro"); box.hidden = t.value !== "altro";
        if (t.value === "altro") box.querySelector("input").focus();
        aggiornaRiga(x); salva();
      } else if (t.type === "checkbox") { const x = voceDi(t); x.st.preso = t.checked; aggiornaRiga(x); salva(); }
      else if (t.id === "ln-titolo" && !t.value.trim()) { t.value = titoloLN(s, f); }
    });
    $app.querySelector(".ln").addEventListener("click", e => {
      const a = e.target.closest("[data-a]"), r = e.target.closest("[data-rip]");
      if (a) {
        const x = voceDi(a);
        if (a.dataset.a === "togli") x.st.tolta = true;
        else if (confirm(`Eliminare "${x.v.nome}"?`)) { s.extra = s.extra.filter(z => z.id !== x.v.id); delete s.voci[x.v.id]; }
        else return;
        salva(); ridisegna();
      } else if (r) { (s.voci[r.dataset.rip] = s.voci[r.dataset.rip] || {}).tolta = false; salva(); ridisegna(); }
    });
    document.getElementById("ln-add").addEventListener("submit", e => {
      e.preventDefault();
      const fd = new FormData(e.target), nome = (fd.get("nome") || "").trim(); if (!nome) return;
      const id = "x" + Date.now().toString(36);
      s.extra.push({ id, gruppo: fd.get("gruppo"), nome }); s.voci[id] = { scelta: "altro" }; salva();
      vistaNascita(f);
      const d = $app.querySelector(`details.voce[data-id="${id}"]`);
      if (d) { d.open = true; d.scrollIntoView({ behavior: "smooth", block: "center" }); }
      toast(`Aggiunta: ${nome}`);
    });
    document.getElementById("ln-pdf").addEventListener("click", () => { clearTimeout(timer); salva(); condividiPdf(s, f, "condividi"); });
    document.getElementById("ln-scarica").addEventListener("click", () => { clearTimeout(timer); salva(); condividiPdf(s, f, "scarica"); });
    document.getElementById("ln-testo").addEventListener("click", () => { clearTimeout(timer); salva(); condividiTesto(s, f); });
  }

  // righe della lista pronte per PDF e testo
  function righeLN(s) {
    const voci = vociLN(s).filter(v => !s.voci[v.id]?.tolta);
    return gruppiLN(s).map(g => ({ g, voci: voci.filter(v => v.gruppo === g).map(v => {
      const st = s.voci[v.id] || {}; return { v, st, sc: sceltaDi(v, st), qta: st.qta || v.qta || 1 };
    }) })).filter(x => x.voci.length);
  }
  function sottotitoloLN(f) {
    return f.stato === "attesa" ? `Nascita prevista: ${fmtData(f.p.data)}` : `Nato il ${fmtData(f.p.data)}`;
  }
  function condividiTesto(s, f) {
    const L = [`*${titoloLN(s, f)}*`, sottotitoloLN(f)];
    if (s.messaggio.trim()) L.push("", s.messaggio.trim());
    for (const { g, voci } of righeLN(s)) {
      L.push("", `_${g}_`);
      for (const { v, st, sc, qta } of voci) {
        L.push(`${st.preso ? "✓" : "•"} ${v.nome}${qta > 1 ? ` ×${qta}` : ""}${sc ? `: ${sc.nome}` : ""}${sc?.prezzo && !/^non indicato/i.test(sc.prezzo) ? ` (${sc.prezzo})` : ""}${st.preso ? " – già preso" : ""}`);
        if (st.nota) L.push(`   ${st.nota}`);
        if (sc?.mio && sc.link) L.push(`   ${sc.link}`);
      }
    }
    L.push("", `Lista creata con Giry toolbox: ${URL_APP}`);
    const testo = L.join("\n");
    if (navigator.share && matchMedia("(pointer: coarse)").matches) navigator.share({ title: titoloLN(s, f), text: testo }).catch(() => {});
    else window.open(`https://wa.me/?text=${encodeURIComponent(testo)}`, "_blank", "noopener");
  }

  let pdfPronto = null;
  function caricaPdf() {
    if (window.jspdf) return Promise.resolve();
    return pdfPronto = pdfPronto || new Promise((ok, ko) => {
      const sc = document.createElement("script"); sc.src = "jspdf.min.js?v=1"; sc.async = true;
      sc.onload = ok; sc.onerror = () => { pdfPronto = null; sc.remove(); ko(new Error("jspdf")); };
      document.head.appendChild(sc);
    });
  }
  // i caratteri fuori dalla codifica dei font PDF standard (emoji ecc.) vengono tolti
  const perPdf = t => String(t ?? "").replace(/[^\x20-\x7E -ÿ€–—‘’“”•…]/g, "").replace(/\s+/g, " ").trim();
  function pdfLN(s, f) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const W = 210, M = 16, CW = W - 2 * M, FONDO = 280;
    const css = getComputedStyle(document.documentElement);
    const hex = (k, d) => { const v = css.getPropertyValue(k).trim(); return /^#[0-9a-f]{6}$/i.test(v) ? v : d; };
    const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
    const scuro = matchMedia("(prefers-color-scheme: dark)").matches;
    const ACC = rgb(scuro ? (TEMA[f.p.sesso] ? (f.p.sesso === "m" ? "#6B4F3F" : "#7A5548") : "#E0603A") : hex("--accent", "#E0603A"));
    const INK = [42, 35, 32], GRIGIO = [118, 106, 98], LINEA = [226, 218, 208];
    let y = 0;
    const testata_ = () => {
      doc.setFillColor(...ACC); doc.rect(0, 0, W, 32, "F");
      doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(20);
      doc.text(perPdf(titoloLN(s, f)), M, 16);
      doc.setFont("helvetica", "normal"); doc.setFontSize(10.5); doc.text(perPdf(sottotitoloLN(f)), M, 24);
      y = 42;
    };
    const nuova = h => { if (y + h > FONDO) { doc.addPage(); y = 18; } };
    testata_();
    if (s.messaggio.trim()) {
      doc.setFont("helvetica", "italic"); doc.setFontSize(11); doc.setTextColor(...INK);
      const w = doc.splitTextToSize(perPdf(s.messaggio), CW); doc.text(w, M, y); y += w.length * 5 + 5;
    }
    for (const { g, voci } of righeLN(s)) {
      nuova(22);
      doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(...ACC);
      doc.text(perPdf(g).toUpperCase(), M, y, { charSpace: 0.4 }); y += 2;
      doc.setDrawColor(...ACC); doc.setLineWidth(0.5); doc.line(M, y, W - M, y); y += 7;
      for (const { v, st, sc, qta } of voci) {
        const X = M + 8, TW = CW - 8 - 16;
        doc.setFont("helvetica", "normal"); doc.setFontSize(10.5);
        const prod = sc ? doc.splitTextToSize(perPdf(sc.nome), TW) : ["Da scegliere"];
        const det = [];
        if (sc?.test) det.push(`Voto ${sc.voto} ${sc.scala}`);
        if (sc?.prezzo && !/^non indicato/i.test(sc.prezzo)) det.push(perPdf(sc.prezzo));
        doc.setFontSize(9);
        const nota = st.nota ? doc.splitTextToSize("Nota: " + perPdf(st.nota), TW) : [];
        const link = sc?.mio && sc.link ? sc.link : sc?.test && sc.q ? `https://www.idealo.it/MainSearchProductCategory.html?q=${encodeURIComponent(sc.q)}` : null;
        const h = 6 + prod.length * 4.8 + (det.length ? 4.2 : 0) + nota.length * 4.2 + (link ? 4.2 : 0) + 4;
        nuova(h);
        const y0 = y;
        // casella
        doc.setDrawColor(...(st.preso ? ACC : GRIGIO)); doc.setLineWidth(0.4); doc.roundedRect(M, y - 3.6, 4.6, 4.6, 0.8, 0.8, st.preso ? "FD" : "S");
        if (st.preso) { doc.setFillColor(...ACC); doc.roundedRect(M, y - 3.6, 4.6, 4.6, 0.8, 0.8, "F"); doc.setDrawColor(255, 255, 255); doc.setLineWidth(0.6); doc.line(M + 1, y - 1.3, M + 2, y - 0.2); doc.line(M + 2, y - 0.2, M + 3.7, y - 2.6); }
        doc.setFont("helvetica", "bold"); doc.setFontSize(11.5); doc.setTextColor(...INK);
        doc.text(perPdf(v.nome), X, y);
        doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(...ACC);
        if (qta > 1) doc.text(`×${qta}`, W - M, y, { align: "right" });
        y += 5.2;
        doc.setFont("helvetica", sc ? "normal" : "italic"); doc.setFontSize(10.5); doc.setTextColor(...(sc ? INK : GRIGIO));
        doc.text(prod, X, y); y += prod.length * 4.8;
        doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...GRIGIO);
        if (det.length) { doc.text(det.join("  ·  "), X, y); y += 4.2; }
        if (nota.length) { doc.text(nota, X, y); y += nota.length * 4.2; }
        if (link) { doc.setTextColor(...ACC); doc.textWithLink(sc.mio ? "Link al prodotto" : "Confronta i prezzi", X, y, { url: link }); y += 4.2; }
        if (st.preso) { doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...ACC); doc.text("GIÀ PRESO", W - M, y0 + 5.2, { align: "right" }); }
        y += 1.5; doc.setDrawColor(...LINEA); doc.setLineWidth(0.2); doc.line(X, y, W - M, y); y += 5.5;
      }
      y += 2;
    }
    const n = doc.getNumberOfPages();
    for (let i = 1; i <= n; i++) {
      doc.setPage(i); doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...GRIGIO);
      doc.text("Creata con Giry toolbox · consigli dai test di laboratorio indipendenti, senza sponsor", M, 290);
      doc.textWithLink("daddytoolbox.github.io/giry-toolbox", M, 294, { url: URL_APP });
      doc.text(`${i}/${n}`, W - M, 294, { align: "right" });
    }
    return doc;
  }
  async function condividiPdf(s, f, modo) {
    let doc;
    try { await caricaPdf(); doc = pdfLN(s, f); }
    catch { toast("Non riesco a creare il PDF: controlla la connessione e riprova."); return; }
    const nome = (perPdf(titoloLN(s, f)).toLowerCase().normalize("NFD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-") || "lista-nascita") + ".pdf";
    const blob = doc.output("blob"), file = new File([blob], nome, { type: "application/pdf" });
    if (modo === "condividi" && navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: titoloLN(s, f) }); return; }
      catch (e) { if (e?.name === "AbortError") return; }
    }
    const url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    toast(modo === "condividi" ? "PDF scaricato: allegalo nella chat da WhatsApp o Telegram (cartella Download)." : "PDF scaricato.");
  }

  // ---------- profilo condiviso (sincronizzazione cifrata) ----------
  // I dati vengono cifrati qui con AES-GCM; la chiave viaggia solo nel link d'invito (dopo #).
  const SYNC_URL = "https://giry-sync.marco-fronda87.workers.dev";
  const urlSync = () => (store.get("syncUrl", "") || SYNC_URL).replace(/\/+$/, "");
  const SINC = ["profilo", "nascita", "cal", "check", "todo"];
  const b64u = buf => { const b = new Uint8Array(buf); let s = ""; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
  const deb64u = s => { const t = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)); const b = new Uint8Array(t.length); for (let i = 0; i < t.length; i++) b[i] = t.charCodeAt(i); return b; };
  const casuale = n => b64u(crypto.getRandomValues(new Uint8Array(n)));
  const chiaveDa = s => crypto.subtle.importKey("raw", deb64u(s), "AES-GCM", false, ["encrypt", "decrypt"]);
  async function cifra(k, obj) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await chiaveDa(k), new TextEncoder().encode(JSON.stringify(obj))));
    const out = new Uint8Array(12 + ct.length); out.set(iv); out.set(ct, 12); return b64u(out);
  }
  async function decifra(k, s) {
    const b = deb64u(s);
    return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: b.slice(0, 12) }, await chiaveDa(k), b.slice(12))));
  }
  // ogni dato diventa una voce indipendente: vince la modifica più recente, voce per voce
  function piatto(k, v) {
    const o = {};
    if (k === "profilo") { if (v) o.profilo = v; }
    else if (k === "nascita") {
      if (!v) return o;
      if (v.titolo) o["nascita.titolo"] = v.titolo;
      if (v.messaggio) o["nascita.messaggio"] = v.messaggio;
      for (const [id, st] of Object.entries(v.voci || {})) o["nascita.voce." + id] = st;
      for (const e of v.extra || []) o["nascita.extra." + e.id] = e;
    } else if (k === "cal") { for (const e of v || []) o["cal." + e.id] = e; }
    else for (const [kk, x] of Object.entries(v || {})) if (x) o[k + "." + kk] = x;
    return o;
  }
  function ricomponi(k, flat) {
    const pre = k === "profilo" ? null : k + ".";
    const ent = Object.entries(flat).filter(([p, v]) => v != null && (pre ? p.startsWith(pre) : p === "profilo"));
    if (k === "profilo") return ent[0]?.[1] ?? null;
    if (k === "nascita") {
      const o = { titolo: "", messaggio: "", voci: {}, extra: [] };
      for (const [p, v] of ent) {
        if (p === "nascita.titolo") o.titolo = v; else if (p === "nascita.messaggio") o.messaggio = v;
        else if (p.startsWith("nascita.voce.")) o.voci[p.slice(13)] = v;
        else if (p.startsWith("nascita.extra.")) o.extra.push(v);
      }
      o.extra.sort((a, b) => a.id.localeCompare(b.id)); return o;
    }
    if (k === "cal") return ent.map(([, v]) => v).sort((a, b) => (a.data + (a.ora || "")).localeCompare(b.data + (b.ora || "")));
    return Object.fromEntries(ent.map(([p, v]) => [p.slice(pre.length), v]));
  }
  const tuttoPiatto = () => Object.assign({}, ...SINC.map(k => piatto(k, store.get(k, null))));
  const stessa = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
  let timerPush = null;
  function segnaModifiche(k, v) {
    const S = store.get("sync", null); if (!S || S.perso) return;
    const prima = piatto(k, store.get(k, null)), dopo = piatto(k, v), ts = store.get("sync:ts", {}), ora = Date.now();
    let cambi = false;
    for (const p of new Set([...Object.keys(prima), ...Object.keys(dopo)])) if (!stessa(prima[p], dopo[p])) { ts[p] = ora; cambi = true; }
    if (!cambi) return;
    store.set("sync:ts", ts); store.set("sync:sporco", true);
    clearTimeout(timerPush); timerPush = setTimeout(sincronizza, 700);
  }
  function docLocale() {
    const flat = tuttoPiatto(), ts = store.get("sync:ts", {}), campi = {};
    for (const p of new Set([...Object.keys(flat), ...Object.keys(ts)])) campi[p] = { v: flat[p] ?? null, t: ts[p] || 0 };
    return { v: 1, campi };
  }
  // riunisce i dati remoti con quelli del telefono; restituisce se è cambiato qualcosa qui e se serve inviare
  function unisci(remoto) {
    const R = remoto?.campi || {}, L = docLocale().campi, ts = store.get("sync:ts", {});
    const flat = tuttoPiatto(); let cambiato = false, push = false;
    for (const p of new Set([...Object.keys(R), ...Object.keys(L)])) {
      const r = R[p], l = L[p] || { v: null, t: 0 };
      if (r && (r.t > l.t || (r.t === l.t && !stessa(r.v, l.v) && JSON.stringify(r.v) > JSON.stringify(l.v)))) {
        if (!stessa(flat[p], r.v)) { flat[p] = r.v; cambiato = true; }
        ts[p] = r.t;
      } else if (!r || l.t > r.t || !stessa(r.v, l.v)) push = true;
    }
    if (cambiato) for (const k of SINC) { const nuovo = ricomponi(k, flat); if (!stessa(nuovo, ricomponi(k, tuttoPiatto()))) store.set(k, nuovo, true); }
    store.set("sync:ts", ts);
    return { cambiato, push };
  }
  let inCorso = false, ancora = false, statoSync = "";
  async function sincronizza() {
    const S = store.get("sync", null), base = urlSync();
    if (!S || S.perso || !base) return;
    if (inCorso) { ancora = true; return; }
    inCorso = true;
    try {
      const r = await fetch(`${base}/s/${S.id}?rev=${S.rev || 0}`, { cache: "no-store" });
      if (r.status === 404) { perso(S); return; }
      if (!r.ok) throw new Error(r.status);
      const j = await r.json();
      let rev = S.rev || 0, esito = { cambiato: false, push: false };
      if (!j.uguale) { esito = unisci(await decifra(S.chiave, j.dati)); rev = j.rev; }
      if (esito.push || store.get("sync:sporco", false)) {
        for (let i = 0; i < 4; i++) {
          const dati = await cifra(S.chiave, docLocale());
          const p = await fetch(`${base}/s/${S.id}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: "Bearer " + S.token }, body: JSON.stringify({ dati, rev }) });
          if (p.ok) { rev = (await p.json()).rev; store.set("sync:sporco", false); break; }
          if (p.status === 409) { const c = await p.json(); const e2 = unisci(await decifra(S.chiave, c.dati)); esito.cambiato ||= e2.cambiato; rev = c.rev; continue; }
          if (p.status === 404) { perso(S); return; }
          throw new Error(p.status);
        }
      }
      const S2 = store.get("sync", null);
      if (S2 && S2.id === S.id) { S2.rev = rev; S2.ultimo = Date.now(); store.set("sync", S2); }
      statoSync = "ok";
      if (esito.cambiato) aggiornaVista();
    } catch { statoSync = "offline"; }
    finally { inCorso = false; if (ancora) { ancora = false; sincronizza(); } }
  }
  function perso(S) { S.perso = true; store.set("sync", S); toast("Il profilo condiviso non esiste più: chiedi un nuovo link all'altro genitore."); aggiornaVista(); }
  // ridisegna la pagina con i dati arrivati dall'altro telefono, senza disturbare chi sta scrivendo
  let vistaInSospeso = false;
  function aggiornaVista() {
    const a = document.activeElement;
    if (document.querySelector(".sheet-bg") || (a && $app.contains(a) && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))) { vistaInSospeso = true; return; }
    vistaInSospeso = false; const y = scrollY; render(); scrollTo(0, y);
  }
  document.addEventListener("focusout", () => setTimeout(() => { if (vistaInSospeso) aggiornaVista(); }, 300));
  setInterval(() => { if (document.visibilityState === "visible") sincronizza(); }, 8000);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") sincronizza(); });
  window.addEventListener("online", sincronizza);

  const linkInvito = S => `${location.origin}${location.pathname}#/unisciti/${S.id}.${S.chiave}.${S.token}`;
  async function creaSpazio(motivo) {
    const base = urlSync(); if (!base) return null;
    const vecchio = store.get("sync", null);
    const S = { id: casuale(16), chiave: casuale(32), token: casuale(24), rev: 0 };
    // al primo collegamento tutti i dati del telefono diventano "nuovi"
    if (!vecchio) { const ts = {}, ora = Date.now(); for (const p of Object.keys(tuttoPiatto())) ts[p] = ora; store.set("sync:ts", ts); }
    const dati = await cifra(S.chiave, docLocale());
    const r = await fetch(`${base}/s/${S.id}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: "Bearer " + S.token }, body: JSON.stringify({ dati }) });
    if (!r.ok) throw new Error(r.status);
    S.rev = (await r.json()).rev; S.ultimo = Date.now();
    store.set("sync", S); store.set("sync:sporco", false);
    if (vecchio && motivo === "nuovo" && !vecchio.perso) fetch(`${base}/s/${vecchio.id}`, { method: "DELETE", headers: { Authorization: "Bearer " + vecchio.token } }).catch(() => {});
    return S;
  }
  async function unisciti(arg) {
    const [id, chiave, token] = (arg || "").split(".");
    history.replaceState(null, "", location.pathname + "#/oggi");
    if (!id || !chiave || !token) { toast("Link d'invito non valido."); render(); return; }
    const att = store.get("sync", null);
    if (att && att.id === id) { render(); return; }
    if (att && !att.perso && !confirm("Questo telefono è già collegato a un altro profilo condiviso. Vuoi passare a quello nuovo?")) { render(); return; }
    if (!urlSync()) { toast("La condivisione non è ancora attiva in questa versione."); render(); return; }
    $app.innerHTML = `<div class="card empty" style="margin-top:24px"><span class="spin"></span> Collego il profilo condiviso…</div>`;
    try {
      const r = await fetch(`${urlSync()}/s/${id}`, { cache: "no-store" });
      if (r.status === 404) throw new Error("perso");
      const j = await r.json(), remoto = await decifra(chiave, j.dati);
      store.set("sync:ts", {}); // i dati remoti hanno la precedenza su quelli già presenti qui
      store.set("sync", { id, chiave, token, rev: 0 });
      unisci(remoto);
      const S = store.get("sync", null); S.rev = j.rev; S.ultimo = Date.now(); store.set("sync", S);
      store.set("sync:sporco", true); sincronizza();
      toast("Profilo condiviso collegato ✓");
    } catch (e) {
      toast(e.message === "perso" ? "Questo link non è più valido: chiedi quello nuovo." : "Non riesco a collegarmi: controlla la connessione e riapri il link.");
    }
    render();
  }
  function foglioInvito(S) {
    const link = linkInvito(S), e = encodeURIComponent;
    const testo = "Ti invito a condividere il nostro profilo su Giry toolbox: lista nascita e calendario si aggiornano su entrambi i telefoni. Apri questo link:";
    const bg = document.createElement("div"); bg.className = "sheet-bg";
    bg.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="inv-t"><div class="grab"></div>
      <h2 id="inv-t">Invita l'altro genitore</h2>
      <p class="muted small" style="margin:0">Aprendo il link, il suo telefono vedrà e potrà modificare profilo, lista nascita, calendario e liste. Mandalo solo a lui o a lei: vale come una chiave.</p>
      <div class="share-grid">
        ${navigator.share ? `<button type="button" data-a="nativo">${icona("altro")}<span>Condividi</span></button>` : ""}
        <a href="https://wa.me/?text=${e(testo + "\n" + link)}" target="_blank" rel="noopener">${icona("wa")}<span>WhatsApp</span></a>
        <a href="https://t.me/share/url?url=${e(link)}&text=${e(testo)}" target="_blank" rel="noopener">${icona("tg")}<span>Telegram</span></a>
        <button type="button" data-a="copia">${icona("copia")}<span>Copia link</span></button>
      </div>
      <p class="hint">Se il link finisce nelle mani sbagliate, in Impostazioni tocca <strong>Nuovo link</strong>: quello vecchio smette di funzionare.</p>
      <button class="btn ghost" type="button" data-a="chiudi">Chiudi</button></div>`;
    const chiudi = () => { bg.remove(); if (vistaInSospeso) aggiornaVista(); };
    bg.addEventListener("click", ev => {
      if (ev.target === bg) return chiudi();
      const b = ev.target.closest("[data-a]"); if (!b) return;
      if (b.dataset.a === "chiudi") chiudi();
      if (b.dataset.a === "copia") copia(link, b);
      if (b.dataset.a === "nativo") navigator.share({ title: "Giry toolbox", text: testo, url: link }).catch(() => {});
    });
    document.body.appendChild(bg);
  }
  const oraBreve = t => t ? new Date(t).toLocaleString("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "mai";
  function bloccoSync() {
    const S = store.get("sync", null);
    if (!urlSync()) return `<section class="card soft c3"><p class="kicker">👫 Profilo condiviso</p><p style="margin:0">In arrivo: profilo, lista nascita e calendario in comune con l'altro genitore.</p></section>`;
    if (!S) return `<section class="card soft c3"><p class="kicker">👫 Profilo condiviso</p>
      <p>Usate l'app in due? Invita l'altro genitore: profilo, lista nascita, calendario e liste si aggiornano da soli su entrambi i telefoni.</p>
      <p class="muted small">I dati sono cifrati sul telefono prima di partire: il server conserva solo un blocco illeggibile.</p>
      <button class="btn small" type="button" id="sync-crea">Invita l'altro genitore</button></section>`;
    if (S.perso) return `<section class="card soft c4"><p class="kicker">👫 Profilo condiviso</p>
      <p>Il profilo condiviso non esiste più (forse è stato creato un nuovo link). I dati restano su questo telefono.</p>
      <button class="btn small" type="button" id="sync-scollega">Scollega</button></section>`;
    return `<section class="card soft c3"><p class="kicker">👫 Profilo condiviso · attivo</p>
      <p style="margin:0 0 4px">Profilo, lista nascita, calendario e liste si aggiornano su tutti i telefoni collegati.</p>
      <p class="muted small">Ultimo aggiornamento: ${esc(oraBreve(S.ultimo))}${statoSync === "offline" ? " · senza connessione, riprovo da solo" : ""}</p>
      <div class="row2"><button class="btn small" type="button" id="sync-invita">Rimanda il link</button><button class="btn small ghost" type="button" id="sync-nuovo">Nuovo link</button></div>
      <button class="linkbtn" type="button" id="sync-scollega">Scollega questo telefono</button></section>`;
  }
  function eventiSync(rifai) {
    document.getElementById("sync-crea")?.addEventListener("click", async e => {
      e.target.disabled = true; e.target.textContent = "Preparo il link…";
      try { const S = await creaSpazio(); rifai(); foglioInvito(S); }
      catch { toast("Non riesco a raggiungere il server: riprova tra poco."); rifai(); }
    });
    document.getElementById("sync-invita")?.addEventListener("click", () => foglioInvito(store.get("sync", null)));
    document.getElementById("sync-nuovo")?.addEventListener("click", async () => {
      if (!confirm("Creo un nuovo link: quello vecchio smetterà di funzionare e dovrai rimandare il nuovo all'altro genitore. Procedo?")) return;
      try { await sincronizza(); const S = await creaSpazio("nuovo"); rifai(); foglioInvito(S); }
      catch { toast("Non riesco a raggiungere il server: riprova tra poco."); }
    });
    document.getElementById("sync-scollega")?.addEventListener("click", () => {
      if (!confirm("Scollego questo telefono? I dati restano qui, ma non si aggiorneranno più con l'altro.")) return;
      ["sync", "sync:ts", "sync:sporco"].forEach(k => { try { localStorage.removeItem("nido:" + k); } catch {} });
      rifai();
    });
  }

  // ---------- calendario ----------
  const TIPI = [["visita", "Visita", "🩺"], ["eco", "Ecografia", "🔎"], ["esami", "Esami", "🧪"], ["corso", "Corso", "👥"],
    ["pediatra", "Pediatra", "👶"], ["vaccino", "Vaccino", "💉"], ["pratiche", "Pratiche", "📄"], ["altro", "Altro", "📌"]];
  const CHI = [["", "Tutti e due"], ["mamma", "Mamma"], ["papa", "Papà"], ["bimbo", "Con il bimbo"]];
  const tipo = id => TIPI.find(t => t[0] === id) || TIPI.at(-1);
  const oggiIso = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
  const pad = n => String(n).padStart(2, "0");
  const stampLocale = d => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  function intervallo(e) {
    if (!e.ora) { const d = new Date(e.data + "T12:00:00"), f = addDays(d, 1); return { tutto: true, da: e.data.replace(/-/g, ""), a: `${f.getFullYear()}${pad(f.getMonth() + 1)}${pad(f.getDate())}` }; }
    const d = new Date(`${e.data}T${e.ora}:00`), f = new Date(d.getTime() + (e.durata || 60) * 60000);
    return { tutto: false, da: stampLocale(d), a: stampLocale(f) };
  }
  const dettagli = e => [e.note, e.chi ? `Chi: ${CHI.find(c => c[0] === e.chi)?.[1]}` : "", "Da Giry toolbox"].filter(Boolean).join("\n");
  function linkGoogle(e) {
    const iv = intervallo(e);
    const p = new URLSearchParams({ action: "TEMPLATE", text: e.titolo, dates: `${iv.da}/${iv.a}`, details: dettagli(e) });
    if (e.luogo) p.set("location", e.luogo);
    if (!iv.tutto) p.set("ctz", Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Rome");
    return "https://calendar.google.com/calendar/render?" + p.toString();
  }
  function icsEvento(e) {
    const iv = intervallo(e), q = s => String(s || "").replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, m => "\\" + m);
    return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Giry Corporation//Giry toolbox//IT", "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
      `UID:${e.id}@giry-toolbox`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "")}`,
      iv.tutto ? `DTSTART;VALUE=DATE:${iv.da}` : `DTSTART:${iv.da}`, iv.tutto ? `DTEND;VALUE=DATE:${iv.a}` : `DTEND:${iv.a}`,
      `SUMMARY:${q(e.titolo)}`, e.luogo ? `LOCATION:${q(e.luogo)}` : "", `DESCRIPTION:${q(dettagli(e))}`,
      "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", `DESCRIPTION:${q(e.titolo)}`, "END:VALARM",
      "END:VEVENT", "END:VCALENDAR"].filter(Boolean).join("\r\n");
  }
  async function esportaIcs(e) {
    const nome = (e.titolo.toLowerCase().normalize("NFD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-") || "appuntamento") + ".ics";
    const blob = new Blob([icsEvento(e)], { type: "text/calendar" }), file = new File([blob], nome, { type: "text/calendar" });
    if (navigator.canShare?.({ files: [file] }) && matchMedia("(pointer: coarse)").matches) {
      try { await navigator.share({ files: [file], title: e.titolo }); return; } catch (err) { if (err?.name === "AbortError") return; }
    }
    const url = URL.createObjectURL(blob), a = document.createElement("a"); a.href = url; a.download = nome;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
  const giornoBreve = iso => new Date(iso + "T12:00:00").toLocaleDateString("it-IT", { weekday: "short" }).replace(".", "");
  const meseBreve = iso => new Date(iso + "T12:00:00").toLocaleDateString("it-IT", { month: "short" }).replace(".", "");
  function cardEventoCal(e, passato) {
    const t = tipo(e.tipo), chi = CHI.find(c => c[0] === e.chi);
    const tra = Math.round((new Date(e.data + "T12:00:00") - oggi()) / DAY);
    const quando = tra === 0 ? "Oggi" : tra === 1 ? "Domani" : tra > 1 && tra < 7 ? `Tra ${tra} giorni` : "";
    return `<div class="ev${passato ? " passato" : ""}" data-ev="${esc(e.id)}">
      <button type="button" class="ev-main" data-apri="${esc(e.id)}" aria-label="Modifica ${esc(e.titolo)}">
        <span class="ev-d"><small>${esc(giornoBreve(e.data))}</small><b>${new Date(e.data + "T12:00:00").getDate()}</b><small>${esc(meseBreve(e.data))}</small></span>
        <span class="ev-b"><strong>${t[2]} ${esc(e.titolo)}</strong>
          <small>${[quando, e.ora || "Tutto il giorno", e.luogo].filter(Boolean).map(esc).join(" · ")}</small>
          ${e.chi ? `<small class="ev-chi">${esc(chi?.[1] || "")}</small>` : ""}</span>
      </button>
      ${passato ? "" : `<a class="ev-g" href="${esc(linkGoogle(e))}" target="_blank" rel="noopener" aria-label="Aggiungi a Google Calendar">${ICONA_GCAL}<span>Google</span></a>`}
    </div>`;
  }
  const ICONA_GCAL = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4M12 13v5M9.5 15.5h5"/></svg>`;
  function prossimiEventi() { const o = oggiIso(); return (store.get("cal", []) || []).filter(e => e.data >= o).sort((a, b) => (a.data + (a.ora || "")).localeCompare(b.data + (b.ora || ""))); }
  function vistaCalendario(f) {
    const tutti = (store.get("cal", []) || []).slice().sort((a, b) => (a.data + (a.ora || "")).localeCompare(b.data + (b.ora || "")));
    const o = oggiIso(), futuri = tutti.filter(e => e.data >= o), passati = tutti.filter(e => e.data < o).reverse();
    const S = store.get("sync", null);
    const mesi = [...new Set(futuri.map(e => e.data.slice(0, 7)))];
    $app.innerHTML = testata("calendario", "Calendario", SEZ.calendario.sub) + `
      <p class="sync-line">${S && !S.perso ? `👫 Condiviso con l'altro genitore · aggiornato ${esc(oraBreve(S.ultimo))}` : `Solo su questo telefono · <a href="#/profilo">condividilo con l'altro genitore</a>`}</p>
      <button class="btn" type="button" id="cal-nuovo" style="margin-top:4px">＋ Nuovo appuntamento</button>
      ${futuri.length ? mesi.map(m => `<h2 class="sec">${esc(new Date(m + "-15T12:00:00").toLocaleDateString("it-IT", { month: "long", year: "numeric" }))}</h2>
        <div class="glist evlist">${futuri.filter(e => e.data.startsWith(m)).map(e => cardEventoCal(e)).join("")}</div>`).join("")
        : `<div class="card empty" style="margin-top:16px">Nessun appuntamento in programma.<br>Aggiungi visite, ecografie, esami, corsi e pratiche: li vedrete entrambi.</div>`}
      ${passati.length ? `<details class="card acc" style="margin-top:18px"><summary><div><span class="pill">${passati.length}</span><h3>Appuntamenti passati</h3></div></summary>
        <div class="glist evlist flat">${passati.map(e => cardEventoCal(e, true)).join("")}</div></details>` : ""}
      <p class="foot">Il tasto Google apre l'evento già compilato nel Google Calendar del telefono: basta salvarlo.</p>`;
    document.getElementById("cal-nuovo").addEventListener("click", () => formEvento(null, f));
    $app.querySelectorAll("[data-apri]").forEach(b => b.addEventListener("click", () => formEvento(tutti.find(e => e.id === b.dataset.apri), f)));
  }
  function formEvento(e, f) {
    const nuovo = !e; e = e || { id: "e" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), titolo: "", tipo: "visita", data: oggiIso(), ora: "", durata: 60, luogo: "", note: "", chi: "" };
    const bg = document.createElement("div"); bg.className = "sheet-bg";
    bg.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="ev-t"><div class="grab"></div>
      <h2 id="ev-t">${nuovo ? "Nuovo appuntamento" : "Appuntamento"}</h2>
      <form id="ev-f" class="ln evf">
        <label class="fl" for="ev-titolo">Cosa</label>
        <input type="text" id="ev-titolo" name="titolo" value="${esc(e.titolo)}" placeholder="Es. Ecografia morfologica" required maxlength="80">
        <div class="tipi">${TIPI.map(t => `<label><input type="radio" name="tipo" value="${t[0]}" ${e.tipo === t[0] ? "checked" : ""}><span>${t[2]} ${t[1]}</span></label>`).join("")}</div>
        <div class="row2"><div><label class="fl" for="ev-data">Giorno</label><input type="date" id="ev-data" name="data" value="${esc(e.data)}" required></div>
          <div><label class="fl" for="ev-ora">Ora</label><input type="time" id="ev-ora" name="ora" value="${esc(e.ora)}"></div></div>
        <div class="row2"><div><label class="fl" for="ev-durata">Durata</label><select id="ev-durata" name="durata">${[[30, "30 minuti"], [60, "1 ora"], [90, "1 ora e mezza"], [120, "2 ore"], [180, "3 ore"]].map(([v, t]) => `<option value="${v}" ${+e.durata === v ? "selected" : ""}>${t}</option>`).join("")}</select></div>
          <div><label class="fl" for="ev-chi">Chi va</label><select id="ev-chi" name="chi">${CHI.map(([v, t]) => `<option value="${v}" ${e.chi === v ? "selected" : ""}>${t}</option>`).join("")}</select></div></div>
        <label class="fl" for="ev-luogo">Dove</label>
        <input type="text" id="ev-luogo" name="luogo" value="${esc(e.luogo)}" placeholder="Es. Ospedale Sant'Anna, ambulatorio 3" maxlength="120">
        <label class="fl" for="ev-note">Note</label>
        <textarea id="ev-note" name="note" rows="2" maxlength="400" placeholder="Es. portare impegnativa e esami precedenti">${esc(e.note)}</textarea>
        <button class="btn" type="submit">Salva</button>
        ${nuovo ? "" : `<div class="row2 evexp"><a class="btn ghost" href="${esc(linkGoogle(e))}" target="_blank" rel="noopener">Google Calendar</a><button class="btn ghost" type="button" data-a="ics">Calendario iPhone</button></div>
          <button type="button" class="linkbtn danger" data-a="elimina">Elimina appuntamento</button>`}
        <button class="btn ghost" type="button" data-a="chiudi">Annulla</button>
      </form></div>`;
    const chiudi = () => { bg.remove(); if (vistaInSospeso) aggiornaVista(); };
    const form = bg.querySelector("form");
    form.querySelector("#ev-ora").addEventListener("input", ev => { form.querySelector("#ev-durata").disabled = !ev.target.value; });
    form.querySelector("#ev-durata").disabled = !e.ora;
    form.addEventListener("submit", ev => {
      ev.preventDefault();
      const d = new FormData(form);
      const nuovoE = { id: e.id, titolo: (d.get("titolo") || "").trim(), tipo: d.get("tipo") || "altro", data: d.get("data"), ora: d.get("ora") || "",
        durata: +(d.get("durata") || 60), luogo: (d.get("luogo") || "").trim(), note: (d.get("note") || "").trim(), chi: d.get("chi") || "" };
      if (!nuovoE.titolo || !nuovoE.data) return;
      const cal = (store.get("cal", []) || []).filter(x => x.id !== e.id); cal.push(nuovoE);
      store.set("cal", cal); chiudi(); render();
      toast(nuovo ? "Appuntamento aggiunto" : "Appuntamento aggiornato");
    });
    bg.addEventListener("click", ev => {
      if (ev.target === bg) return chiudi();
      const b = ev.target.closest("[data-a]"); if (!b) return;
      if (b.dataset.a === "chiudi") chiudi();
      if (b.dataset.a === "ics") esportaIcs(e);
      if (b.dataset.a === "elimina" && confirm(`Eliminare "${e.titolo}"? Sparirà anche dall'altro telefono.`)) {
        store.set("cal", (store.get("cal", []) || []).filter(x => x.id !== e.id)); chiudi(); render(); toast("Appuntamento eliminato");
      }
    });
    document.body.appendChild(bg);
    if (nuovo) setTimeout(() => form.querySelector("#ev-titolo").focus(), 250);
  }

  // ---------- liste ----------
  function vistaListe() {
    const check = store.get("check", {});
    $app.innerHTML = `<a class="back" href="#/organizza">← Organizza</a>` + testata("liste", "Liste", "Si salvano su questo telefono") +
      `<a class="card link soft c4" href="#/nascita"><p class="kicker">🎁 Lista nascita</p><h2>Scegli i prodotti e condividila in PDF</h2><p>Apri la lista nascita →</p></a>` +
      C.liste.filter(l => l.id !== "nascita").map(l => {
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
    const attiva = rotta === "guida" ? "guide" : rotta === "liste" || rotta === "acquisti" || rotta === "nascita" ? "organizza" : rotta === "vicino" ? "attivita" : rotta;
    $tab.innerHTML = tabs.map(k => `<a href="#/${k}" class="${k === attiva ? "on" : ""}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${ICON[k]}</svg>
      <span>${SEZ[k].nome}</span></a>`).join("");
    $tab.hidden = !f || rotta === "profilo" && !f;
  }
  function render() {
    if (!C) { $app.innerHTML = `<div class="empty">Impossibile caricare i contenuti. Controlla la connessione e riapri l'app.</div>`; return; }
    const [, rotta = "oggi", arg] = location.hash.split("/");
    if (rotta === "unisciti") { unisciti(arg); return; }
    const f = fase();
    applicaTema(store.get("profilo", {})?.sesso);
    barra(f, rotta);
    if (!f || rotta === "profilo") vistaProfilo(!f);
    else ({ guide: vistaGuide, guida: () => vistaGuida(arg), organizza: vistaOrganizza, mamma: vistaMamma, perte: vistaMamma,
            papa: vistaPapa, attivita: vistaAttivita, liste: vistaListe, vicino: vistaVicino, acquisti: vistaAcquisti, nascita: vistaNascita, calendario: vistaCalendario }[rotta] || vistaOggi)(f);
    window.scrollTo(0, 0);
  }

  document.getElementById("btn-profilo").addEventListener("click", () => { location.hash = "#/profilo"; });
  document.getElementById("btn-condividi").addEventListener("click", condividi);
  window.addEventListener("hashchange", render);
  applicaTema(store.get("profilo", {})?.sesso);
  carica().then(() => { render(); sincronizza(); });
  if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
})();
