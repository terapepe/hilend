/* HILEND — app shell, router & events. */
(function () {
  const CFG = window.HILEND_CONFIG;
  const V = window.Views, S = V.S;
  const $ = (id) => document.getElementById(id);
  const ROUTES = ["home", "dashboard", "markets", "stake", "lend", "borrow", "portfolio", "docs"];
  let route = "home", sub = "", lastLive = {};

  /* ---------- theme & shell ---------- */
  function applyTheme() {
    const r = document.documentElement.style;
    if (Chain.isSingle()) {
      const t = Chain.get(Chain.singleId()).theme || {};
      if (t.a1) r.setProperty("--a1", t.a1);
      if (t.a2) r.setProperty("--a2", t.a2);
      if (t.ink) r.setProperty("--ink", t.ink);
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#0B1020");
    }
  }

  function shell() {
    const B = CFG.brand, single = Chain.isSingle(), nets = Chain.protocol();
    document.title = `${B.name} — ${single ? nets[0].name + " Lending" : B.tagline}`;
    ["brandName", "footBrand"].forEach((id) => ($(id).textContent = B.name));
    $("footDesc").textContent = B.description;
    $("footCopy").textContent = `© ${new Date().getFullYear()} ${B.name}. All rights reserved.`;
    $("xTop").href = CFG.social.x;
    $("tokenBtn").textContent = `${CFG.token.symbol} token`;
    $("footSocial").innerHTML = `<a href="${U.esc(CFG.social.x)}" target="_blank" rel="noopener">${U.icons.x} ${U.esc(CFG.social.xHandle)}</a>` +
      (CFG.social.telegram ? `<a href="${U.esc(CFG.social.telegram)}" target="_blank" rel="noopener">Telegram</a>` : "");
    $("footNets").innerHTML = nets.map((n) => `<a href="#/markets" data-action="set-chain" data-id="${n.id}">${U.netIcon(n.id)} ${U.esc(n.name)}</a>`).join("");
    $("netBadge").innerHTML = single
      ? `${U.netIcon(nets[0].id)}<span>${U.esc(nets[0].short)}</span>`
      : `<span style="display:flex">${nets.map((n, i) => `<img class="net-ico" style="margin-left:${i ? -7 : 0}px;border:2px solid var(--bg)" src="${n.icon}" alt="">`).join("")}</span><span>Multi-chain</span>`;
    if (Data.isDemo()) {
      $("demoBar").hidden = false;
      $("demoBar").innerHTML = `${U.icons.info}<span><b>Preview</b> — market & staking figures are demo data${CFG.data.livePrices ? "; token prices are live" : ""}. Contracts not deployed: no transactions are sent.</span>`;
    }
  }

  function walletBtn() {
    const w = Wallet.state, b = $("walletBtn");
    if (w.connected) {
      b.className = "btn btn-ghost"; b.dataset.action = "open-account";
      b.innerHTML = `${w.network ? U.netIcon(w.network) : '<span class="down">⚠</span>'}<span class="mono">${U.short(w.address)}</span>`;
    } else {
      b.className = "btn btn-primary"; b.dataset.action = "open-connect"; b.textContent = "Connect";
    }
  }

  /* ---------- router ---------- */
  function parse() {
    const [r, s] = location.hash.replace(/^#\/?/, "").split("/");
    route = ROUTES.includes(r) ? r : "home"; sub = s || "";
  }

  function render(anim = true) {
    const y = window.scrollY;
    const html = route === "docs" ? V.docs(sub || "introduction") : V[route]();
    const app = $("app");
    app.innerHTML = html;
    if (!anim) app.querySelectorAll(".page").forEach((p) => (p.style.animation = "none"));
    document.querySelectorAll("[data-route]").forEach((a) => a.classList.toggle("active", a.dataset.route === route));
    V.mount(route);
    markLive(!anim);
    if (!anim) window.scrollTo(0, y);
  }

  function navigate() {
    parse();
    $("nav").classList.remove("open");
    closeModal();
    render(true);
    if (route === "docs" && sub) document.getElementById(sub)?.scrollIntoView();
    else window.scrollTo(0, 0);
  }

  /** Flash numbers that changed after a live price update. */
  function markLive(flash) {
    document.querySelectorAll("[data-live]").forEach((el, i) => {
      const k = el.dataset.live + i, v = el.textContent;
      if (flash && lastLive[k] && lastLive[k] !== v) { el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash"); }
      lastLive[k] = v;
    });
  }

  function onData() {
    if (["home", "dashboard"].includes(route)) render(false);
    else if (route === "markets") {
      if (document.activeElement?.id === "mSearch") refreshMarketsTable(); else render(false);
    } else if (route === "stake") V.stakeCalc();
    else if (route === "lend") V.lendCalc();
    else if (route === "borrow") V.borrowCalc();
  }

  function refreshMarketsTable() {
    let list = Data.markets(V.chainIds());
    const q = S.q.trim().toLowerCase();
    if (q) list = list.filter((m) => (m.symbol + " " + m.name + " " + Chain.get(m.chain).name).toLowerCase().includes(q));
    list.sort((a, b) => ((a[S.sort.k] ?? 0) - (b[S.sort.k] ?? 0)) * S.sort.dir);
    $("mTable").innerHTML = V.marketTable(list);
  }

  /* ---------- modal ---------- */
  function openModal(html, wide = false) {
    $("modalBody").innerHTML = html;
    $("modalCard").classList.toggle("wide", wide);
    $("modal").hidden = false; document.body.style.overflow = "hidden";
  }
  function closeModal() { $("modal").hidden = true; document.body.style.overflow = ""; }

  /* ---------- events ---------- */
  const actions = {
    "open-ca": () => openModal(V.caModal()),
    "copy-ca": (d) => (d.ca ? U.copy(d.ca, "Contract address copied") : U.toast(`CA coming soon — follow ${CFG.social.xHandle}`)),
    copy: (d) => U.copy(d.v, "Copied"),
    "open-connect": () => openModal(V.connectModal()),
    "connect-net": (d) => openModal(V.connectModal(d.net)),
    "open-account": () => openModal(V.accountModal()),
    install: (d) => window.open(d.url, "_blank", "noopener"),
    connect: async (d) => {
      try { await Wallet.connect(d.net, d.key); closeModal(); U.toast("Wallet connected"); }
      catch (e) { U.toast(e.message || "Connection rejected"); }
    },
    disconnect: async () => { await Wallet.disconnect(); closeModal(); U.toast("Disconnected"); },
    "close-modal": closeModal,
    "set-chain": (d, el, ev) => {
      S.chain = d.id;
      if (d.id !== "all") { S.lend.chain = S.borrow.chain = d.id; }
      if (el.tagName === "A") return; // link navigates to #/markets
      ev.preventDefault(); render(false);
    },
    sort: (d) => { S.sort = { k: d.k, dir: S.sort.k === d.k ? -S.sort.dir : -1 }; refreshMarketsTable(); },
    "open-asset": (d) => {
      openModal(V.assetModal(d.key), true);
      const m = Data.markets().find((x) => x.key === d.key);
      if (m) Charts.rateCurve($("rateChart"), m);
    },
    "goto-lend": (d) => { const [c, a] = d.key.split(":"); S.lend.chain = c; S.lend.asset = a; closeModal(); },
    "goto-borrow": (d) => { const [c, a] = d.key.split(":"); S.borrow.chain = c; S.borrow.bor = a; closeModal(); },
    "pick-pool": (d, el, ev) => { S.stake.pool = d.id; S.stake.lock = 0; if (el.tagName !== "A") { ev.preventDefault(); render(false); } },
    "pick-lock": (d) => { S.stake.lock = Number(d.i); render(false); },
    fill: (d) => { const [ns, k] = d.bind.split("."); S[ns][k] = String(+Number(d.v).toFixed(6)); render(false); },
    "borrow-pct": (d) => {
      const all = Data.markets([S.borrow.chain]);
      const c = all.find((m) => m.symbol === S.borrow.col), b = all.find((m) => m.symbol === S.borrow.bor);
      if (!c || !b) return;
      const max = (Number(S.borrow.colAmt) || 0) * c.price * c.ltv / b.price;
      const k = d.p === "safe" ? (c.liqThreshold / CFG.risk.healthWarn) / c.ltv : Number(d.p) / 100;
      S.borrow.borAmt = max ? String(+(max * Math.min(1, k)).toFixed(6)) : "";
      const inp = document.querySelector('[data-bind="borrow.borAmt"]'); if (inp) inp.value = S.borrow.borAmt;
      V.borrowCalc();
    },
    ptab: (d) => { S.ptab = d.k; render(false); },
    "tx-pending": () => U.toast("Contract integration pending — no transaction sent."),
  };

  document.addEventListener("click", (ev) => {
    const el = ev.target.closest("[data-action]");
    if (el && actions[el.dataset.action]) actions[el.dataset.action](el.dataset, el, ev);
    if (ev.target.closest("#burger")) $("nav").classList.toggle("open");
    const doc = ev.target.closest("[data-doc]");
    if (doc && route === "docs") {
      ev.preventDefault();
      history.replaceState(null, "", "#/docs/" + doc.dataset.doc);
      document.querySelectorAll("[data-doc]").forEach((a) => a.classList.toggle("on", a === doc));
      document.getElementById(doc.dataset.doc)?.scrollIntoView({ behavior: "smooth" });
    }
  });

  document.addEventListener("input", (ev) => {
    const el = ev.target;
    if (el.id === "mSearch") { S.q = el.value; refreshMarketsTable(); return; }
    const bind = el.dataset.bind;
    if (!bind || el.tagName !== "INPUT") return;
    el.value = el.value.replace(",", ".").replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
    const [ns, k] = bind.split("."); S[ns][k] = el.value;
    if (ns === "stake") V.stakeCalc(); else if (ns === "lend") V.lendCalc(); else V.borrowCalc();
  });

  document.addEventListener("change", (ev) => {
    const el = ev.target, bind = el.dataset.bind;
    if (!bind || el.tagName !== "SELECT") return;
    const [ns, k] = bind.split("."); S[ns][k] = el.value;
    render(false);
  });

  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  /* ---------- boot ---------- */
  async function boot() {
    let ready = false;
    applyTheme();
    window.addEventListener("wallet:change", () => {
      walletBtn();
      if (ready && ["dashboard", "portfolio", "stake", "lend", "borrow"].includes(route)) render(false);
    });
    Wallet.init();
    await Data.init();
    shell();
    walletBtn();
    navigate();
    ready = true;
    window.addEventListener("hashchange", navigate);
    window.addEventListener("data:update", onData);
  }
  boot();
})();
