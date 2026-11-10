/* HILEND — formatting & DOM helpers. */
(function () {
  const TOKEN_COLORS = {
    ETH: "#627EEA", WETH: "#627EEA", stETH: "#00A3FF", BNB: "#F0B90B", SOL: "#9945FF", JitoSOL: "#2BD49D",
    USDC: "#2775CA", USDT: "#26A17B", DAI: "#F5AC37", WBTC: "#F7931A", BTCB: "#F7931A", cbBTC: "#0052FF",
    CAKE: "#D1884F", AERO: "#0433FF", JUP: "#21C08E",
  };

  const U = {
    esc(s) { return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); },

    usd(v, compact = true) {
      if (v == null || !isFinite(v)) return "—";
      if (!compact || Math.abs(v) < 1000) return "$" + v.toLocaleString("en-US", { minimumFractionDigits: v < 10 ? 2 : 0, maximumFractionDigits: v < 10 ? 2 : 0 });
      const u = [[1e12, "T"], [1e9, "B"], [1e6, "M"], [1e3, "K"]].find(([n]) => Math.abs(v) >= n);
      return "$" + (v / u[0]).toFixed(2) + u[1];
    },
    price(v) {
      if (v == null || !isFinite(v)) return "—";
      const d = v >= 1000 ? 0 : v >= 1 ? 2 : 4;
      return "$" + v.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
    },
    num(v, max = 2) {
      if (v == null || !isFinite(v)) return "—";
      if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(2) + "M";
      if (Math.abs(v) >= 1e4) return (v / 1e3).toFixed(1) + "K";
      return v.toLocaleString("en-US", { maximumFractionDigits: max });
    },
    pct(v, d = 2) { return v == null || !isFinite(v) ? "—" : v.toFixed(d) + "%"; },
    short(a) { return a ? a.slice(0, 6) + "…" + a.slice(-4) : ""; },

    async copy(text, label = "Copied") {
      try { await navigator.clipboard.writeText(text); }
      catch {
        const t = document.createElement("textarea"); t.value = text; document.body.appendChild(t); t.select();
        document.execCommand("copy"); t.remove();
      }
      U.toast(label);
    },

    toast(msg) {
      const t = document.getElementById("toast");
      t.textContent = msg; t.classList.add("show");
      clearTimeout(U._tt); U._tt = setTimeout(() => t.classList.remove("show"), 2200);
    },

    /** Token icon (generated, no external images) with optional network badge. */
    tok(sym, netId) {
      const c = TOKEN_COLORS[sym] || (sym === window.HILEND_CONFIG.token.symbol ? "var(--a1)" : "#5D6789");
      const bg = sym === window.HILEND_CONFIG.token.symbol ? "var(--grad)" : `linear-gradient(135deg, ${c}, ${c}AA)`;
      const label = sym === window.HILEND_CONFIG.token.symbol ? `<img src="assets/logo-mark.svg" alt="" style="width:100%">` : U.esc(sym.replace(/^(cb|W|Jito|st)(?=[A-Z])/, "").slice(0, 4));
      const net = netId ? `<img class="net-ico" src="${Chain.get(netId).icon}" alt="">` : "";
      const fs = sym.length >= 4 ? "font-size:9px;" : "";
      return `<span class="tok"><span class="tok-c" style="${fs}background:${sym === window.HILEND_CONFIG.token.symbol ? "none" : bg}">${label}</span>${net}</span>`;
    },

    netIcon(id, cls = "") {
      const n = Chain.get(id);
      return n ? `<img class="net-ico ${cls}" src="${n.icon}" alt="${U.esc(n.name)}" title="${U.esc(n.name)}">` : "";
    },

    debounce(fn, ms = 200) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; },

    /** Smoothly count a number element up to its new value. */
    countUp(el, to, fmt, ms = 900) {
      const from = Number(el.dataset.v || 0); el.dataset.v = to;
      const t0 = performance.now();
      const step = (t) => {
        const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3);
        el.textContent = fmt(from + (to - from) * e);
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    },

    icons: {
      shield: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>',
      bolt: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
      link: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>',
      eye: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
      cpu: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/></svg>',
      wallet: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12V8H6a2 2 0 0 1 0-4h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>',
      layers: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 2 10 5-10 5L2 7l10-5z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/></svg>',
      coins: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6"/><path d="M18.1 10.4A6 6 0 1 1 10.3 18M7 6h1v4"/></svg>',
      check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
      copy: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
      ext: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M7 7h10v10"/></svg>',
      info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:none"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
      x: '<svg width="15" height="15" viewBox="0 0 24 24"><path fill="currentColor" d="M17.5 3h3.1l-6.8 7.8L21.8 21h-6.3l-4.9-6.4L4.9 21H1.8l7.3-8.3L1.4 3h6.4l4.4 5.9L17.5 3Zm-1.1 16.2h1.7L6.8 4.7H5L16.4 19.2Z"/></svg>',
    },
  };

  window.U = U;
})();
