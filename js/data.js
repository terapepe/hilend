/* HILEND — market data store.
 * Market figures: data/markets.json (demo) or backend (live).
 * Token prices: live from CoinGecko (refreshed every data.priceRefreshMs), fallbackPrice if unreachable. */
(function () {
  const CFG = window.HILEND_CONFIG;

  const D = {
    raw: null,
    prices: {},        // cg id -> { usd, change }
    pricesLive: false,
    updatedAt: null,

    async init() {
      const url = CFG.data.mode === "live" ? CFG.data.apiBase.replace(/\/$/, "") + "/markets" : CFG.data.demoUrl;
      try {
        const r = await fetch(url, { cache: "no-store" });
        const j = await r.json();
        D.raw = j.data || j;
      } catch (e) {
        D.raw = { chains: {}, staking: [] };
        console.error("HILEND: market data unavailable", e);
      }
      await D.refreshPrices();
      if (CFG.data.livePrices) setInterval(D.refreshPrices, CFG.data.priceRefreshMs || 60000);
    },

    cgIds() {
      const ids = new Set();
      Object.values(D.raw.chains || {}).forEach((c) => c.assets.forEach((a) => a.cg && ids.add(a.cg)));
      (D.raw.staking || []).forEach((s) => s.cg && ids.add(s.cg));
      return [...ids];
    },

    async refreshPrices() {
      if (!CFG.data.livePrices || !D.raw) return D.emit();
      try {
        const q = `${CFG.data.priceApi}?ids=${D.cgIds().join(",")}&vs_currencies=usd&include_24hr_change=true`;
        const r = await fetch(q);
        if (!r.ok) throw new Error(r.status);
        const j = await r.json();
        Object.entries(j).forEach(([id, v]) => { D.prices[id] = { usd: v.usd, change: v.usd_24h_change }; });
        D.pricesLive = true;
      } catch { /* keep previous / fallback prices */ }
      D.updatedAt = new Date();
      D.emit();
    },

    priceOf(cg, fallback) { return (cg && D.prices[cg]?.usd) || fallback || null; },
    changeOf(cg) { return cg && D.prices[cg] ? D.prices[cg].change : null; },

    /** Flattened markets for the active protocol chains, with USD values. */
    markets(chainIds) {
      const ids = chainIds || Chain.protocol().map((n) => n.id);
      const out = [];
      ids.forEach((cid) => {
        const c = D.raw?.chains?.[cid];
        if (!c) return;
        c.assets.forEach((a) => {
          const price = D.priceOf(a.cg, a.fallbackPrice);
          const sup = a.totalSupplied * price, bor = a.totalBorrowed * price;
          out.push({
            ...a, chain: cid, key: cid + ":" + a.symbol, price, change: D.changeOf(a.cg),
            suppliedUsd: sup, borrowedUsd: bor, liquidityUsd: sup - bor,
            utilization: a.totalSupplied ? (a.totalBorrowed / a.totalSupplied) * 100 : 0,
          });
        });
      });
      return out;
    },

    chainStats(cid) {
      const m = D.markets([cid]);
      const tvl = m.reduce((s, a) => s + a.suppliedUsd, 0), borrowed = m.reduce((s, a) => s + a.borrowedUsd, 0);
      const best = m.reduce((b, a) => (a.supplyApy > (b?.supplyApy || 0) ? a : b), null);
      return { id: cid, tvl, borrowed, markets: m.length, bestApy: best ? best.supplyApy : 0, bestAsset: best?.symbol, users: D.raw?.chains?.[cid]?.users || 0, volume: D.raw?.chains?.[cid]?.volume24h || 0 };
    },

    totals(chainIds) {
      const m = D.markets(chainIds);
      const tvl = m.reduce((s, a) => s + a.suppliedUsd, 0);
      const borrowed = m.reduce((s, a) => s + a.borrowedUsd, 0);
      const wSupply = tvl ? m.reduce((s, a) => s + a.supplyApy * a.suppliedUsd, 0) / tvl : 0;
      const wBorrow = borrowed ? m.reduce((s, a) => s + a.borrowApy * a.borrowedUsd, 0) / borrowed : 0;
      const ids = chainIds || Chain.protocol().map((n) => n.id);
      const users = ids.reduce((s, id) => s + (D.raw?.chains?.[id]?.users || 0), 0);
      const staked = D.staking().reduce((s, p) => s + (p.price ? p.totalStaked * p.price : 0), 0);
      return { tvl, borrowed, liquidity: tvl - borrowed, supplyApy: wSupply, borrowApy: wBorrow, users, markets: m.length, staked };
    },

    /** TVL history (USD) summed over chains, last point anchored to live TVL. */
    tvlHistory(chainIds) {
      const ids = chainIds || Chain.protocol().map((n) => n.id);
      let series = null;
      ids.forEach((id) => {
        const c = D.raw?.chains?.[id];
        if (!c?.tvlHistory) return;
        const live = D.chainStats(id).tvl, last = c.tvlHistory[c.tvlHistory.length - 1] || 1;
        const scaled = c.tvlHistory.map((v) => (v * live) / last);
        series = series ? series.map((v, i) => v + (scaled[i] || 0)) : scaled;
      });
      return series || [];
    },

    staking() {
      const active = new Set(Chain.protocol().map((n) => n.id));
      return (D.raw?.staking || [])
        .map((p) => ({ ...p, chains: p.chains.filter((c) => active.has(c)), price: p.cg ? D.priceOf(p.cg) : null }))
        .filter((p) => p.chains.length);
    },

    isDemo() { return CFG.data.mode !== "live"; },
    emit() { window.dispatchEvent(new CustomEvent("data:update")); },
  };

  window.Data = D;
})();
