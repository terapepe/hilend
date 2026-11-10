/* HILEND — pages & modals. */
(function () {
  const CFG = window.HILEND_CONFIG;
  const T = () => CFG.token;
  const I = U.icons;

  /** UI state kept across re-renders. */
  const S = {
    chain: "all", q: "", sort: { k: "suppliedUsd", dir: -1 },
    stake: { pool: null, chain: null, lock: 0, amt: "" },
    lend: { chain: null, asset: null, amt: "" },
    borrow: { chain: null, col: null, colAmt: "", bor: null, borAmt: "" },
    ptab: "supplied",
  };

  const nets = () => Chain.protocol();
  const multi = () => !Chain.isSingle();
  const chainIds = () => (S.chain === "all" ? nets().map((n) => n.id) : [S.chain]);
  const days = (n) => Array.from({ length: n }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (n - 1 - i));
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });
  const apyClass = (v) => (v >= 5 ? "up" : "");

  /* ---------------- shared blocks ---------------- */
  function caBar() {
    return `<div class="ca-bar">${Chain.caGroups().map((g) => `
      <div class="ca-item">
        <span class="nets">${g.nets.map((n) => `<img src="${n.icon}" alt="${U.esc(n.name)}" title="${U.esc(n.name)}">`).join("")}</span>
        <span style="font-size:12.5px;font-weight:600">${g.nets.map((n) => n.short).join(" · ")}</span>
        <code>${g.ca ? U.esc(g.ca) : "CA coming soon"}</code>
        <button class="btn btn-ghost" data-action="copy-ca" data-ca="${U.esc(g.ca)}">${I.copy} Copy CA</button>
      </div>`).join("")}</div>`;
  }

  function chainSeg() {
    if (!multi()) return "";
    return `<div class="seg" role="tablist">
      <button class="${S.chain === "all" ? "on" : ""}" data-action="set-chain" data-id="all">All chains</button>
      ${nets().map((n) => `<button class="${S.chain === n.id ? "on" : ""}" data-action="set-chain" data-id="${n.id}">${U.netIcon(n.id)} <span class="hide-sm">${n.short}</span></button>`).join("")}
    </div>`;
  }

  function statCard(label, value, sub = "", key = "") {
    return `<div class="glass stat"><div class="label">${label}</div><div class="v" ${key ? `data-live="${key}"` : ""}>${value}</div><div class="d muted">${sub}</div></div>`;
  }

  function marketRows(list) {
    return list.map((m) => `
      <tr data-action="open-asset" data-key="${m.key}">
        <td><div class="asset">${U.tok(m.symbol, multi() ? m.chain : null)}<div><b>${U.esc(m.symbol)}</b><small>${U.esc(m.name)}${multi() ? " · " + Chain.get(m.chain).short : ""}</small></div></div></td>
        <td class="num">${U.price(m.price)} ${m.change != null ? `<small class="${m.change >= 0 ? "up" : "down"}">${m.change >= 0 ? "+" : ""}${m.change.toFixed(2)}%</small>` : ""}</td>
        <td class="num">${U.usd(m.suppliedUsd)}<br><small class="muted">${U.num(m.totalSupplied)} ${U.esc(m.symbol)}</small></td>
        <td class="num apy up">${U.pct(m.supplyApy)}</td>
        <td class="num">${U.usd(m.borrowedUsd)}</td>
        <td class="num apy">${U.pct(m.borrowApy)}</td>
        <td class="num"><div class="util"><div class="bar"><i style="width:${Math.min(100, m.utilization)}%"></i></div>${m.utilization.toFixed(0)}%</div></td>
        <td class="num">${U.usd(m.liquidityUsd)}</td>
        <td class="num">${m.collateral ? (m.ltv * 100).toFixed(0) + "%" : "—"}</td>
      </tr>`).join("");
  }

  function marketTable(list, sortable = true) {
    const th = (k, l) => sortable
      ? `<th class="num sortable ${S.sort.k === k ? "sorted" : ""}" data-action="sort" data-k="${k}">${l}${S.sort.k === k ? (S.sort.dir < 0 ? " ↓" : " ↑") : ""}</th>`
      : `<th class="num">${l}</th>`;
    return `<div class="table-wrap"><table class="tbl">
      <thead><tr><th>Asset</th>${th("price", "Price")}${th("suppliedUsd", "Total supplied")}${th("supplyApy", "Supply APY")}${th("borrowedUsd", "Total borrowed")}${th("borrowApy", "Borrow APY")}${th("utilization", "Utilization")}${th("liquidityUsd", "Liquidity")}${th("ltv", "Max LTV")}</tr></thead>
      <tbody>${list.length ? marketRows(list) : `<tr><td colspan="9" class="empty">No markets match your filter.</td></tr>`}</tbody>
    </table></div>`;
  }

  function demoNote(text) {
    return `<div class="note">${I.info}<span>${text}</span></div>`;
  }

  /* ---------------- HOME ---------------- */
  function home() {
    const single = !multi(), n0 = nets()[0];
    const t = Data.totals(), hist = Data.tvlHistory();
    const all = Data.markets().sort((a, b) => b.suppliedUsd - a.suppliedUsd);
    const bestSupply = [...all].sort((a, b) => b.supplyApy - a.supplyApy)[0];
    const lowBorrow = [...all].filter((m) => m.borrowApy > 0).sort((a, b) => a.borrowApy - b.borrowApy)[0];
    const bestStake = Data.staking().sort((a, b) => b.apr - a.apr)[0];
    const h1 = single
      ? `${U.esc(n0.short)}-native <span class="grad-text">lending, staking</span> & borrowing.`
      : `Lend, borrow & stake <span class="grad-text">across ${nets().length} chains.</span>`;
    const lead = single ? `${U.esc(n0.hero)} ${U.esc(CFG.brand.name)} gives you transparent markets, AI-assisted risk monitoring and real-time rates — all on ${U.esc(n0.name)}.` : U.esc(CFG.brand.description) + " Real-time rates, AI-assisted risk monitoring and full on-chain transparency.";

    return `
    <section class="hero"><div class="wrap hero-grid">
      <div>
        <span class="chip chip-accent"><span class="dot"></span>${single ? `Live on ${U.esc(n0.name)}` : `Multi-chain · ${nets().length} networks`}</span>
        <h1 style="margin-top:20px">${h1}</h1>
        <p class="lead">${lead}</p>
        <div class="hero-cta">
          <a href="#/stake" class="btn btn-primary btn-lg">Stake</a>
          <a href="#/lend" class="btn btn-ghost btn-lg">Lend</a>
          <a href="#/borrow" class="btn btn-ghost btn-lg">Borrow</a>
          <a href="#/docs" class="btn btn-lg" style="color:var(--muted)">Read docs →</a>
        </div>
        <div class="hero-nets"><span class="stack">${nets().map((n) => `<img src="${n.icon}" alt="${U.esc(n.name)}" title="${U.esc(n.name)}">`).join("")}</span>
          ${single ? U.esc(n0.tagline) : nets().map((n) => n.short).join(" · ")}</div>
        ${caBar()}
      </div>
      <div style="position:relative">
        <div class="glass float-tag" style="top:-34px;right:24px">Best supply APY<b class="up">${bestSupply ? U.esc(bestSupply.symbol) + " " + U.pct(bestSupply.supplyApy) : "—"}</b></div>
        <div class="glass hero-card">
          <div class="card-h" style="margin:0"><span class="label">Total value locked</span>${Data.pricesLive ? '<span class="chip chip-green"><span class="dot"></span>Live prices</span>' : '<span class="chip">Reference prices</span>'}</div>
          <div class="big" data-live="tvl">${U.usd(t.tvl)}</div>
          <div class="muted" style="font-size:13px">Across ${t.markets} markets${single ? "" : ` on ${nets().length} chains`}</div>
          <div class="chart" id="heroChart" style="margin-top:14px"></div>
          <div class="mini">
            <div><span class="label">Supply APY</span><b class="up">${U.pct(t.supplyApy)}</b></div>
            <div><span class="label">Borrow APY</span><b>${U.pct(t.borrowApy)}</b></div>
            <div><span class="label">Liquidity</span><b>${U.usd(t.liquidity)}</b></div>
          </div>
        </div>
        <div class="glass float-tag" style="bottom:-34px;left:-18px">Top staking<b class="grad-text">${bestStake ? U.esc(bestStake.asset) + " " + U.pct(bestStake.apr, 1) + " APR" : "—"}</b></div>
      </div>
    </div></section>

    <div class="wrap">
      <div class="stats">
        ${statCard("Total value locked", U.usd(t.tvl), "Supplied across all markets", "tvl")}
        ${statCard("Total borrowed", U.usd(t.borrowed), `${t.tvl ? ((t.borrowed / t.tvl) * 100).toFixed(1) : 0}% utilization`, "borrowed")}
        ${statCard("Available liquidity", U.usd(t.liquidity), "Ready to borrow", "liquidity")}
        ${statCard("Active users", U.num(t.users, 0), `${t.markets} markets live`)}
      </div>

      <section class="section">
        <div class="section-h"><span class="chip">${single ? "Network" : "Supported blockchains"}</span>
          <h2>${single ? `Built for ${U.esc(n0.name)}` : `One protocol. <span class="grad-text">${nets().length} blockchains.</span>`}</h2>
          <p>${single ? U.esc(n0.tagline) + ". Every market, rate and reward on this site runs on " + U.esc(n0.name) + "." : "Choose the chain that fits you — fees, speed and assets differ, the HILEND experience stays the same."}</p></div>
        <div class="chains ${single ? "single" : ""}">${nets().map(chainCard).join("")}</div>
      </section>

      <section class="section">
        <div class="page-h" style="margin-bottom:18px"><div><h2 style="font-size:clamp(26px,3.4vw,36px)">Market overview</h2><p>Top markets by total supplied. Prices update live.</p></div>
          <a href="#/markets" class="btn btn-ghost">View all markets →</a></div>
        <div class="glass" style="padding:8px">${marketTable(all.slice(0, 8), false)}</div>
      </section>

      <section class="section">
        <div class="section-h"><span class="chip">Get started</span><h2>Three ways to <span class="grad-text">put crypto to work</span></h2></div>
        <div class="grid g-3 action-cards">
          <div class="glass ac"><div class="feature" style="padding:0"><div class="ico">${I.coins}</div></div><h3>Stake</h3>
            <span class="label">Up to</span><div class="apy-big grad-text">${bestStake ? U.pct(bestStake.apr * Math.max(...bestStake.locks.map((l) => l.boost)), 1) : "—"} APR</div>
            <ul><li>Native & protocol staking</li><li>Lock boosts up to ${bestStake ? Math.max(...bestStake.locks.map((l) => l.boost)) : 1}×</li><li>Rewards accrue every block</li></ul>
            <a href="#/stake" class="btn btn-primary" style="margin-top:auto">Start staking</a></div>
          <div class="glass ac"><div class="feature" style="padding:0"><div class="ico">${I.layers}</div></div><h3>Lend</h3>
            <span class="label">Earn up to</span><div class="apy-big up">${bestSupply ? U.pct(bestSupply.supplyApy) : "—"} APY</div>
            <ul><li>Withdraw any time liquidity allows</li><li>Interest compounds automatically</li><li>Use deposits as collateral</li></ul>
            <a href="#/lend" class="btn btn-primary" style="margin-top:auto">Supply assets</a></div>
          <div class="glass ac"><div class="feature" style="padding:0"><div class="ico">${I.wallet}</div></div><h3>Borrow</h3>
            <span class="label">Rates from</span><div class="apy-big">${lowBorrow ? U.pct(lowBorrow.borrowApy) : "—"} APY</div>
            <ul><li>Keep your exposure, unlock liquidity</li><li>Live health-factor monitoring</li><li>Repay any time, no fixed term</li></ul>
            <a href="#/borrow" class="btn btn-primary" style="margin-top:auto">Borrow now</a></div>
        </div>
      </section>

      <section class="section">
        <div class="section-h"><span class="chip">How it works</span><h2>From wallet to yield in <span class="grad-text">4 steps</span></h2></div>
        <div class="grid g-4 steps">
          ${[["Connect", "Link an EVM wallet (MetaMask, Rabby, Coinbase…) or a Solana wallet (Phantom, Solflare, Backpack).", I.wallet],
             ["Choose a chain", multi() ? "Pick Ethereum, BNB Chain, Robinhood Chain, Base or Solana — whichever has the assets and fees you like." : `Everything runs on ${U.esc(n0.name)} — no bridging needed.`, I.link],
             ["Supply or stake", "Deposit assets to earn APY, or stake to earn rewards. Your balance grows every block.", I.coins],
             ["Borrow safely", "Borrow against your deposits. Keep your health factor above 1 and you are never liquidated.", I.shield]]
            .map(([h, p, ic]) => `<div class="glass step"><div class="feature" style="padding:0"><div class="ico">${ic}</div></div><h3>${h}</h3><p>${p}</p></div>`).join("")}
        </div>
      </section>

      <section class="section">
        <div class="section-h"><span class="chip">Why ${U.esc(CFG.brand.name)}</span><h2>DeFi lending, <span class="grad-text">made clear</span></h2><p>Built for first-time users and power users alike — every number is explained, every risk is visible.</p></div>
        <div class="grid g-3">
          ${[["AI risk engine", "Models watch collateral volatility, liquidity depth and oracle health to suggest safer LTVs and alert you before risk builds up.", I.cpu],
             ["Cross-chain by design", "The same markets and UX on every supported chain. Move where the yield and fees make sense for you.", I.link],
             ["Non-custodial", "You always hold your keys. Assets sit in audited smart contracts, never on a company balance sheet.", I.shield],
             ["Radical transparency", "Rates, utilization, reserves and liquidations are on-chain and shown in real time on this dashboard.", I.eye],
             ["Isolated risk", "Long-tail assets are capped and isolated, so a volatile token cannot drain blue-chip markets.", I.layers],
             ["Real yield", "Supply APY is paid by borrowers. Staking rewards come from protocol revenue — not endless emissions.", I.bolt]]
            .map(([h, p, ic]) => `<div class="glass feature"><div class="ico">${ic}</div><h3>${h}</h3><p>${p}</p></div>`).join("")}
        </div>
      </section>

      <section class="section">
        <div class="grid g-main">
          <div class="glass card" style="padding:30px">
            <span class="chip chip-accent">${U.esc(T().symbol)} token</span>
            <h2 style="font-size:clamp(26px,3.2vw,34px);margin:16px 0 10px">Own a piece of the protocol</h2>
            <p class="muted">${U.esc(T().name)} (${U.esc(T().symbol)}) aligns users with the protocol: stake it to share revenue, vote on risk parameters and unlock fee discounts.</p>
            <div class="grid g-2" style="margin-top:22px">
              ${[["Revenue share", "Stakers receive a share of protocol interest fees."], ["Governance", "Vote on new markets, LTVs and reserve factors."], ["Boosted rewards", "Lock longer for up to 2.2× staking boost."], ["Fee discounts", "Lower borrow fees for long-term stakers."]]
                .map(([h, p]) => `<div><b style="display:flex;gap:8px;align-items:center"><span class="up">${I.check}</span>${h}</b><p class="muted" style="font-size:13.5px;margin-top:4px">${p}</p></div>`).join("")}
            </div>
          </div>
          <div class="glass card" style="padding:30px">
            <div class="card-h"><h3>Token info</h3>${U.tok(T().symbol)}</div>
            <div class="summary">
              <div><span>Name</span><b>${U.esc(T().name)}</b></div>
              <div><span>Symbol</span><b>${U.esc(T().symbol)}</b></div>
              <div><span>Total supply</span><b>${Number(T().totalSupply).toLocaleString("en-US")}</b></div>
              <div><span>Networks</span><b style="display:flex;gap:4px">${Chain.tokenNets().map((n) => U.netIcon(n.id)).join("")}</b></div>
              <div><span>X</span><b><a href="${U.esc(CFG.social.x)}" target="_blank" rel="noopener">${U.esc(CFG.social.xHandle)}</a></b></div>
            </div>
            <button class="btn btn-primary btn-block" data-action="open-ca">${I.copy} Copy contract address</button>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-h"><span class="chip">FAQ</span><h2>Questions, answered</h2></div>
        <div class="faq">${faq().map(([q, a]) => `<details class="glass"><summary>${q}</summary><p>${a}</p></details>`).join("")}</div>
      </section>

      <div class="glass cta-band">
        <h2>Ready to earn on ${single ? U.esc(n0.name) : "every chain"}?</h2>
        <p>Connect your wallet, explore live markets and simulate your first position in under a minute.</p>
        <div class="hero-cta" style="justify-content:center">
          <a href="#/dashboard" class="btn btn-primary btn-lg">Launch app</a>
          <a href="${U.esc(CFG.social.x)}" target="_blank" rel="noopener" class="btn btn-ghost btn-lg">${I.x} Follow ${U.esc(CFG.social.xHandle)}</a>
        </div>
      </div>
    </div>`;
  }

  function chainCard(n) {
    const s = Data.chainStats(n.id);
    return `<a href="#/markets" data-action="set-chain" data-id="${n.id}" class="glass chain-card" style="--c:${n.theme.a1}">
      <img class="net-ico ${multi() ? "lg" : "xl"}" src="${n.icon}" alt="">
      <h4>${U.esc(n.name)}</h4><p>${U.esc(n.tagline)}</p>
      <div class="kv"><span class="muted">TVL</span><b>${U.usd(s.tvl)}</b></div>
      <div class="kv"><span class="muted">Markets</span><b>${s.markets}</b></div>
      <div class="kv"><span class="muted">Best APY</span><b class="up">${U.pct(s.bestApy)} <small class="muted">${U.esc(s.bestAsset || "")}</small></b></div>
    </a>`;
  }

  function faq() {
    return [
      ["What is HILEND?", `${U.esc(CFG.brand.name)} is a non-custodial lending protocol. You can supply assets to earn interest, borrow against your deposits, and stake to earn rewards — ${multi() ? "on Ethereum, BNB Chain, Robinhood Chain, Base and Solana" : "on " + U.esc(nets()[0].name)}.`],
      ["Where does the yield come from?", "Supply APY is paid by borrowers as interest. Staking rewards come from network validator rewards (native staking) or protocol revenue (HILEND staking)."],
      ["What is the health factor?", "It measures how safe your loan is: (collateral value × liquidation threshold) ÷ borrowed value. Above 1 you are safe; at or below 1 part of your collateral can be liquidated."],
      ["Do I need to bridge between chains?", "No. Each chain has its own markets. Use the chain where your assets already are."],
      ["Is it safe?", "Smart contracts carry risk. HILEND uses isolated markets, conservative LTVs, multiple oracles and public audits. Never deposit more than you can afford to lose — see the Risk section in Docs."],
      ["Are the numbers on the site real?", Data.isDemo() ? "Token prices are live. Market sizes and rates are demo figures until the contracts go live; no transaction is ever sent from this preview." : "Yes — all figures are read from the protocol in real time."],
    ];
  }

  /* ---------------- DASHBOARD ---------------- */
  function dashboard() {
    const ids = chainIds(), t = Data.totals(ids), hist = Data.tvlHistory(ids);
    const m = Data.markets(ids);
    const topSupply = [...m].sort((a, b) => b.supplyApy - a.supplyApy).slice(0, 5);
    const topBorrow = [...m].sort((a, b) => b.borrowedUsd - a.borrowedUsd).slice(0, 5);
    const ch = hist.length > 1 ? ((hist[hist.length - 1] - hist[0]) / hist[0]) * 100 : 0;
    const w = Wallet.state;
    return `<div class="wrap page">
      <div class="page-h"><div><h1>Dashboard</h1><p>Protocol health at a glance${multi() ? " — filter by chain" : " on " + U.esc(nets()[0].name)}.</p></div>${chainSeg()}</div>
      <div class="grid g-4">
        ${statCard("Total value locked", U.usd(t.tvl), `<span class="${ch >= 0 ? "up" : "down"}">${ch >= 0 ? "▲" : "▼"} ${Math.abs(ch).toFixed(2)}%</span> 30d`, "tvl")}
        ${statCard("Total borrowed", U.usd(t.borrowed), `${t.tvl ? ((t.borrowed / t.tvl) * 100).toFixed(1) : 0}% utilization`, "borrowed")}
        ${statCard("Avg. supply APY", `<span class="up">${U.pct(t.supplyApy)}</span>`, "Weighted by deposits")}
        ${statCard("Avg. borrow APY", U.pct(t.borrowApy), "Weighted by loans")}
      </div>
      <div class="grid g-main" style="margin-top:18px">
        <div class="glass card"><div class="card-h"><h3>TVL · 30 days</h3><span class="chip">${S.chain === "all" ? (multi() ? "All chains" : nets()[0].short) : Chain.get(S.chain).short}</span></div><div class="chart" id="tvlChart"></div></div>
        <div class="glass card"><div class="card-h"><h3>${multi() && S.chain === "all" ? "TVL by chain" : "TVL by asset"}</h3></div><div class="donut-wrap"><div id="donut"></div><div class="legend" id="legend"></div></div></div>
      </div>
      <div class="grid g-3" style="margin-top:18px">
        <div class="glass card"><div class="card-h"><h3>Top supply APY</h3><a href="#/lend" class="muted" style="font-size:13px">Lend →</a></div>${miniList(topSupply, (a) => `<b class="up">${U.pct(a.supplyApy)}</b>`)}</div>
        <div class="glass card"><div class="card-h"><h3>Most borrowed</h3><a href="#/borrow" class="muted" style="font-size:13px">Borrow →</a></div>${miniList(topBorrow, (a) => `<b>${U.usd(a.borrowedUsd)}</b>`)}</div>
        <div class="glass card"><div class="card-h"><h3>Your position</h3></div>
          ${w.connected ? `<div class="summary"><div><span>Wallet</span><b class="mono">${U.short(w.address)}</b></div><div><span>Network</span><b>${w.network ? U.esc(Chain.get(w.network).name) : "Unsupported"}</b></div><div><span>Balance</span><b>${w.balance != null ? U.num(w.balance, 4) + " " + Chain.get(w.network).nativeCurrency?.symbol : "—"}</b></div><div><span>Supplied / Borrowed</span><b>$0 / $0</b></div></div><a href="#/portfolio" class="btn btn-ghost btn-block">Open portfolio</a>`
          : `<div class="empty" style="padding:20px 0"><div class="ico">${I.wallet}</div><h4>No wallet connected</h4><p style="margin-bottom:16px">Connect to see balances and positions.</p><button class="btn btn-primary" data-action="open-connect">Connect wallet</button></div>`}
        </div>
      </div>
      <div class="glass card" style="margin-top:18px"><div class="card-h"><h3>Staking pools</h3><a href="#/stake" class="muted" style="font-size:13px">Stake →</a></div>
        <div class="grid g-${Math.min(4, Math.max(2, Data.staking().length))}">${Data.staking().slice(0, 4).map((p) => `<a href="#/stake" data-action="pick-pool" data-id="${p.id}" class="glass pool" style="box-shadow:none"><div class="asset">${U.tok(p.asset)}<div><b>${U.esc(p.name)}</b><small>${U.esc(p.kind)}</small></div></div><div class="apr grad-text">${U.pct(p.apr, 1)}</div><span class="muted" style="font-size:12px">Base APR</span></a>`).join("")}</div>
      </div>
    </div>`;
  }

  function miniList(list, right) {
    return list.length ? `<div style="display:grid;gap:12px">${list.map((a) => `<div class="asset" style="justify-content:space-between;cursor:pointer" data-action="open-asset" data-key="${a.key}"><div class="asset">${U.tok(a.symbol, multi() ? a.chain : null)}<div><b>${U.esc(a.symbol)}</b><small>${multi() ? Chain.get(a.chain).short : U.esc(a.name)}</small></div></div>${right(a)}</div>`).join("")}</div>` : '<p class="muted">No data</p>';
  }

  /* ---------------- MARKETS ---------------- */
  function markets() {
    const ids = chainIds();
    let list = Data.markets(ids);
    const q = S.q.trim().toLowerCase();
    if (q) list = list.filter((m) => (m.symbol + " " + m.name + " " + Chain.get(m.chain).name).toLowerCase().includes(q));
    list.sort((a, b) => ((a[S.sort.k] ?? 0) - (b[S.sort.k] ?? 0)) * S.sort.dir);
    const t = Data.totals(ids);
    return `<div class="wrap page">
      <div class="page-h"><div><h1>Markets</h1><p>Every lending market with live prices, supply & borrow rates, utilization and liquidity. Click a row for details.</p></div></div>
      <div class="grid g-4" style="margin-bottom:18px">
        ${statCard("Total supplied", U.usd(t.tvl), "", "tvl")}${statCard("Total borrowed", U.usd(t.borrowed), "", "borrowed")}
        ${statCard("Available liquidity", U.usd(t.liquidity), "", "liquidity")}${statCard("Markets", t.markets, multi() ? `${ids.length} chain${ids.length > 1 ? "s" : ""}` : U.esc(nets()[0].name))}
      </div>
      <div class="toolbar">${chainSeg()}<input class="search" id="mSearch" placeholder="Search asset or chain…" value="${U.esc(S.q)}"></div>
      <div class="glass" style="padding:8px" id="mTable">${marketTable(list)}</div>
    </div>`;
  }

  /* ---------------- STAKE ---------------- */
  function stake() {
    const pools = Data.staking();
    if (!pools.length) return `<div class="wrap page"><div class="glass empty">No staking pools on this network yet.</div></div>`;
    if (!pools.find((p) => p.id === S.stake.pool)) S.stake.pool = pools[0].id;
    const p = pools.find((x) => x.id === S.stake.pool);
    if (!p.chains.includes(S.stake.chain)) S.stake.chain = p.chains[0];
    if (!p.locks[S.stake.lock]) S.stake.lock = 0;
    return `<div class="wrap page">
      <div class="page-h"><div><h1>Stake</h1><p>Stake assets to earn rewards. Longer locks earn a higher boost; flexible pools can be withdrawn any time.</p></div></div>
      <div class="grid g-${Math.min(pools.length, 5) > 3 ? 4 : 3}" style="margin-bottom:22px;grid-template-columns:repeat(auto-fit,minmax(210px,1fr))">
        ${pools.map((x) => `<div class="glass pool ${x.id === p.id ? "on" : ""}" data-action="pick-pool" data-id="${x.id}">
          <div class="asset">${U.tok(x.asset)}<div><b>${U.esc(x.name)}</b><small>${U.esc(x.kind)}</small></div></div>
          <div class="apr grad-text">${U.pct(x.apr, 1)}</div><span class="muted" style="font-size:12px">Base APR${x.locks.length > 1 ? ` · up to ${U.pct(x.apr * Math.max(...x.locks.map((l) => l.boost)), 1)}` : ""}</span>
          <div class="meta"><span>Staked ${U.num(x.totalStaked)} ${U.esc(x.asset)}</span><span style="display:flex;gap:2px">${x.chains.map((c) => U.netIcon(c)).join("")}</span></div>
        </div>`).join("")}
      </div>
      <div class="grid g-main">
        <div class="glass panel">
          <div class="card-h"><h3>${U.esc(p.name)}</h3>${multi() || p.chains.length > 1 ? `<select class="select" data-bind="stake.chain">${p.chains.map((c) => `<option value="${c}" ${c === S.stake.chain ? "selected" : ""}>${U.esc(Chain.get(c).name)}</option>`).join("")}</select>` : `<span class="chip">${U.netIcon(S.stake.chain)} ${U.esc(Chain.get(S.stake.chain).short)}</span>`}</div>
          <p class="muted" style="margin:-6px 0 18px;font-size:14px">${U.esc(p.desc)}</p>
          ${amountField("stake.amt", p.asset, S.stake.chain)}
          <div class="field"><div class="field-h"><span>Lock period</span><span>Boost ×${p.locks[S.stake.lock].boost}</span></div>
            <div class="locks">${p.locks.map((l, i) => `<button class="${i === S.stake.lock ? "on" : ""}" data-action="pick-lock" data-i="${i}">${l.days ? l.days + " days" : "Flexible"}<small>${U.pct(p.apr * l.boost, 1)}</small></button>`).join("")}</div></div>
          <div id="stakeSum"></div>
          ${actionBtn("Stake " + p.asset, S.stake.chain)}
        </div>
        <div class="glass panel"><div class="card-h"><h3>Rewards calculator</h3></div><div id="stakeCalc"></div>
          <div class="note info">${I.info}<span>Rewards are estimates based on the current APR. APR changes with total stake and protocol revenue.</span></div></div>
      </div>
    </div>`;
  }

  function stakeCalc() {
    const p = Data.staking().find((x) => x.id === S.stake.pool); if (!p) return;
    const amt = Number(S.stake.amt) || 0, lock = p.locks[S.stake.lock], apr = p.apr * lock.boost;
    const yr = amt * apr / 100, usd = (v) => (p.price ? " · " + U.usd(v * p.price, false) : "");
    const unlock = lock.days ? new Date(Date.now() + lock.days * 864e5).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Any time";
    const sum = document.getElementById("stakeSum"), calc = document.getElementById("stakeCalc");
    if (sum) sum.innerHTML = `<div class="summary"><div><span>Effective APR</span><b class="up">${U.pct(apr)}</b></div><div><span>Unlocks</span><b>${unlock}</b></div><div><span>Network</span><b>${U.esc(Chain.get(S.stake.chain).name)}</b></div></div>`;
    if (calc) calc.innerHTML = `<div class="summary">
      ${[["Daily", 365], ["Monthly", 12], ["Yearly", 1]].map(([l, d]) => `<div><span>${l}</span><b>${U.num(yr / d, 4)} ${U.esc(p.asset)}<small class="muted">${usd(yr / d)}</small></b></div>`).join("")}
      <div><span>Value at unlock</span><b>${U.num(amt + (lock.days ? yr * lock.days / 365 : yr), 4)} ${U.esc(p.asset)}</b></div></div>
      <div class="chart" id="stakeChart"></div>`;
    const pts = Array.from({ length: 13 }, (_, i) => amt * Math.pow(1 + apr / 100 / 12, i));
    Charts.area(document.getElementById("stakeChart"), amt ? pts : [], { height: 150, fmt: (v) => U.num(v, 4) + " " + p.asset, labels: pts.map((_, i) => "Month " + i) });
  }

  /* ---------------- LEND ---------------- */
  function pickMarket(st, filter = () => true) {
    const ids = nets().map((n) => n.id);
    if (!ids.includes(st.chain)) st.chain = ids[0];
    const list = Data.markets([st.chain]).filter(filter);
    return list;
  }

  function lend() {
    const list = pickMarket(S.lend);
    if (!list.find((m) => m.symbol === S.lend.asset)) S.lend.asset = (list.find((m) => m.symbol.startsWith("USDC")) || list[0])?.symbol;
    return `<div class="wrap page">
      <div class="page-h"><div><h1>Lend</h1><p>Supply assets to earn variable APY paid by borrowers. Supplied assets can also be used as collateral.</p></div></div>
      <div class="grid g-main">
        <div class="glass panel">
          <div class="card-h"><h3>Supply</h3>${netSelect("lend.chain", S.lend.chain)}</div>
          <div class="field"><div class="field-h"><span>Asset</span></div>${assetSelect("lend.asset", list, S.lend.asset)}</div>
          ${amountField("lend.amt", S.lend.asset, S.lend.chain)}
          <div id="lendSum"></div>
          ${actionBtn("Supply " + (S.lend.asset || ""), S.lend.chain)}
        </div>
        <div class="glass panel"><div class="card-h"><h3>Supply rates · ${U.esc(Chain.get(S.lend.chain).short)}</h3></div>
          ${miniList([...list].sort((a, b) => b.supplyApy - a.supplyApy), (a) => `<b class="up">${U.pct(a.supplyApy)}</b>`)}
        </div>
      </div>
    </div>`;
  }

  function lendCalc() {
    const m = Data.markets([S.lend.chain]).find((x) => x.symbol === S.lend.asset), el = document.getElementById("lendSum");
    if (!m || !el) return;
    const amt = Number(S.lend.amt) || 0, usd = amt * m.price, yr = usd * m.supplyApy / 100;
    el.innerHTML = `<div class="summary">
      <div><span>Supply APY</span><b class="up">${U.pct(m.supplyApy)}</b></div>
      <div><span>Deposit value</span><b>${U.usd(usd, false)}</b></div>
      <div><span>Est. earnings / month</span><b>${U.usd(yr / 12, false)}</b></div>
      <div><span>Est. earnings / year</span><b class="up">${U.usd(yr, false)}</b></div>
      <div><span>Collateral</span><b>${m.collateral ? `Yes · max LTV ${(m.ltv * 100).toFixed(0)}%` : "No"}</b></div>
      <div><span>Borrowing power added</span><b>${m.collateral ? U.usd(usd * m.ltv, false) : "—"}</b></div>
      <div><span>Available liquidity</span><b>${U.usd(m.liquidityUsd)}</b></div></div>`;
  }

  /* ---------------- BORROW ---------------- */
  function borrow() {
    const ids = nets().map((n) => n.id);
    if (!ids.includes(S.borrow.chain)) S.borrow.chain = ids[0];
    const all = Data.markets([S.borrow.chain]), cols = all.filter((m) => m.collateral);
    if (!cols.find((m) => m.symbol === S.borrow.col)) S.borrow.col = cols[0]?.symbol;
    const bors = all.filter((m) => m.symbol !== S.borrow.col);
    if (!bors.find((m) => m.symbol === S.borrow.bor)) S.borrow.bor = (bors.find((m) => /USD/.test(m.symbol)) || bors[0])?.symbol;
    return `<div class="wrap page">
      <div class="page-h"><div><h1>Borrow</h1><p>Deposit collateral and borrow against it. Keep your health factor above 1 — the gauge shows how safe your position is.</p></div></div>
      <div class="grid g-main">
        <div class="glass panel">
          <div class="card-h"><h3>New loan</h3>${netSelect("borrow.chain", S.borrow.chain)}</div>
          <div class="field"><div class="field-h"><span>1 · Collateral</span></div>${assetSelect("borrow.col", cols, S.borrow.col)}</div>
          ${amountField("borrow.colAmt", S.borrow.col, S.borrow.chain)}
          <div class="field"><div class="field-h"><span>2 · Borrow</span></div>${assetSelect("borrow.bor", bors, S.borrow.bor)}</div>
          <div class="field"><div class="field-h"><span>Amount</span><span id="maxBorrow"></span></div>
            <div class="input-box"><input inputmode="decimal" placeholder="0.00" data-bind="borrow.borAmt" value="${U.esc(S.borrow.borAmt)}"><span class="usd" id="borUsd"></span></div>
            <div class="pcts">${[25, 50, 75].map((p) => `<button data-action="borrow-pct" data-p="${p}">${p}%</button>`).join("")}<button data-action="borrow-pct" data-p="safe">Safe max</button></div></div>
          <div id="borSum"></div>
          ${actionBtn("Borrow " + (S.borrow.bor || ""), S.borrow.chain)}
        </div>
        <div class="glass panel">
          <div class="card-h"><h3>Health factor</h3><span class="chip" id="hfChip"></span></div>
          <div class="hf"><div class="v" id="hfVal">∞</div><div class="hf-bar"><i id="hfDot" style="left:100%"></i></div><div class="hf-scale"><span>1.0 Liquidation</span><span>1.5</span><span>3.0+ Safe</span></div></div>
          <div id="hfSum"></div>
          <div class="note info">${I.info}<span><b>AI risk tip:</b> <span id="aiTip"></span></span></div>
        </div>
      </div>
    </div>`;
  }

  function borrowCalc() {
    const all = Data.markets([S.borrow.chain]);
    const c = all.find((m) => m.symbol === S.borrow.col), b = all.find((m) => m.symbol === S.borrow.bor);
    if (!c || !b) return;
    const ca = Number(S.borrow.colAmt) || 0, ba = Number(S.borrow.borAmt) || 0;
    const colUsd = ca * c.price, borUsd = ba * b.price, maxUsd = colUsd * c.ltv;
    const hf = borUsd ? (colUsd * c.liqThreshold) / borUsd : Infinity;
    const liqPrice = ca && borUsd ? borUsd / (ca * c.liqThreshold) : null;
    const R = CFG.risk, cls = hf <= R.healthDanger ? "down" : hf < R.healthWarn ? "" : "up";
    const set = (id, h) => { const e = document.getElementById(id); if (e) e.innerHTML = h; };
    set("maxBorrow", `Max ${U.num(maxUsd / b.price, 4)} ${U.esc(b.symbol)}`);
    set("borUsd", U.usd(borUsd, false));
    set("hfVal", `<span class="${cls}">${isFinite(hf) ? hf.toFixed(2) : "∞"}</span>`);
    set("hfChip", hf <= 1 ? "Liquidatable" : hf <= R.healthDanger ? "Danger" : hf < R.healthWarn ? "Moderate" : "Safe");
    const dot = document.getElementById("hfDot"); if (dot) dot.style.left = (isFinite(hf) ? Math.max(0, Math.min(100, ((hf - 1) / 2) * 100)) : 100) + "%";
    set("borSum", `<div class="summary">
      <div><span>Collateral value</span><b>${U.usd(colUsd, false)}</b></div>
      <div><span>Loan-to-value</span><b>${colUsd ? ((borUsd / colUsd) * 100).toFixed(1) : "0.0"}% / ${(c.ltv * 100).toFixed(0)}%</b></div>
      <div><span>Borrow APY</span><b>${U.pct(b.borrowApy)}</b></div>
      <div><span>Interest / year</span><b>${U.usd(borUsd * b.borrowApy / 100, false)}</b></div></div>`);
    set("hfSum", `<div class="summary">
      <div><span>${U.esc(c.symbol)} price</span><b>${U.price(c.price)}</b></div>
      <div><span>Liquidation price</span><b class="${liqPrice ? "down" : ""}">${liqPrice ? U.price(liqPrice) : "—"}</b></div>
      <div><span>Price drop to liquidation</span><b>${liqPrice ? Math.max(0, (1 - liqPrice / c.price) * 100).toFixed(1) + "%" : "—"}</b></div>
      <div><span>Liquidation threshold</span><b>${(c.liqThreshold * 100).toFixed(0)}%</b></div>
      <div><span>Liquidation penalty</span><b>${(CFG.risk.liquidationBonus * 100).toFixed(0)}%</b></div></div>`);
    const vol = /USD|DAI/.test(c.symbol) ? "low" : /BTC|ETH/.test(c.symbol) ? "moderate" : "high";
    set("aiTip", !ba ? `Enter an amount. ${U.esc(c.symbol)} has ${vol} volatility — a health factor above ${vol === "high" ? "2.0" : vol === "moderate" ? "1.6" : "1.2"} is recommended.`
      : hf < R.healthWarn ? `Your position is close to liquidation. Add collateral or borrow less to stay above ${R.healthWarn}.`
      : `Healthy position. ${U.esc(c.symbol)} could fall ${liqPrice ? ((1 - liqPrice / c.price) * 100).toFixed(0) : "—"}% before liquidation.`);
  }

  /* ---------------- PORTFOLIO ---------------- */
  function portfolio() {
    const w = Wallet.state;
    if (!w.connected) return `<div class="wrap page"><div class="page-h"><div><h1>Portfolio</h1><p>Your balances, positions and transaction history.</p></div></div>
      <div class="glass empty" style="padding:70px 20px"><div class="ico">${I.wallet}</div><h4>Connect your wallet</h4><p style="margin-bottom:18px">Balances are read directly from the blockchain — nothing is stored by HILEND.</p><button class="btn btn-primary btn-lg" data-action="open-connect">Connect wallet</button></div></div>`;
    const tabs = [["supplied", "Supplied"], ["borrowed", "Borrowed"], ["staked", "Staked"], ["history", "History"]];
    return `<div class="wrap page">
      <div class="page-h"><div><h1>Portfolio</h1><p>Wallet balances are read live from each chain's public RPC.</p></div>
        <div class="ca-item"><span class="mono" style="font-size:13px">${U.short(w.address)}</span><button class="btn btn-ghost" data-action="copy" data-v="${U.esc(w.address)}">${I.copy}</button>
        ${w.network ? `<a class="btn btn-ghost" target="_blank" rel="noopener" href="${Chain.explorerAddr(w.network, w.address)}">Explorer ${I.ext}</a>` : ""}</div></div>
      <div class="grid g-4">
        ${statCard("Wallet value", '<span id="pfTotal">…</span>', "Native + HILEND, live")}
        ${statCard("Supplied", "$0.00", "No deposits yet")}${statCard("Borrowed", "$0.00", "No loans")}${statCard("Health factor", "∞", "No debt")}
      </div>
      <div class="glass card" style="margin-top:18px"><div class="card-h"><h3>Wallet balances</h3><span class="chip">${U.esc(w.walletName || "")}</span></div><div id="pfBal"><p class="muted">Reading balances on-chain…</p></div></div>
      <div class="glass card" style="margin-top:18px">
        <div class="tabs">${tabs.map(([k, l]) => `<button class="${S.ptab === k ? "on" : ""}" data-action="ptab" data-k="${k}">${l}</button>`).join("")}</div>
        <div class="empty"><div class="ico">${I.layers}</div><h4>No ${S.ptab === "history" ? "transactions" : S.ptab + " positions"} yet</h4>
          <p>${nets().some((n) => Chain.contractsLive(n.id)) ? "Your positions will appear here." : "HILEND contracts are not deployed yet — positions and history will appear here after launch."}</p></div>
      </div>
    </div>`;
  }

  async function portfolioLoad() {
    const w = Wallet.state, box = document.getElementById("pfBal");
    if (!w.connected || !box) return;
    const targets = nets().filter((n) => n.type === w.type);
    const rows = await Promise.all(targets.map(async (n) => {
      const [nat, tok] = await Promise.all([Chain.nativeBalance(n.id, w.address), Chain.tokenBalance(n.id, w.address)]);
      const sym = n.nativeCurrency?.symbol || "SOL";
      const cg = { ETH: "ethereum", BNB: "binancecoin", SOL: "solana" }[sym];
      return { n, sym, nat, tok, usd: nat != null ? nat * (Data.priceOf(cg) || 0) : null };
    }));
    if (!document.body.contains(box)) return;
    const total = rows.reduce((s, r) => s + (r.usd || 0), 0);
    const t = document.getElementById("pfTotal"); if (t) t.textContent = U.usd(total, false);
    box.innerHTML = `<div class="table-wrap"><table class="tbl" style="min-width:520px"><thead><tr><th>Network</th><th class="num">Native</th><th class="num">Value</th><th class="num">${U.esc(T().symbol)}</th></tr></thead><tbody>
      ${rows.map((r) => `<tr style="cursor:default"><td><div class="asset">${U.netIcon(r.n.id, "lg")}<div><b>${U.esc(r.n.name)}</b><small>${r.n.id === w.network ? "Connected" : "Read via RPC"}</small></div></div></td>
        <td class="num">${r.nat == null ? '<span class="muted">unavailable</span>' : U.num(r.nat, 6) + " " + r.sym}</td>
        <td class="num">${r.usd == null ? "—" : U.usd(r.usd, false)}</td>
        <td class="num">${Chain.tokenAddress(r.n.id) ? (r.tok == null ? "—" : U.num(r.tok, 2)) : '<span class="muted">CA soon</span>'}</td></tr>`).join("")}
    </tbody></table></div>`;
  }

  /* ---------------- form helpers ---------------- */
  function netSelect(bind, val) {
    if (!multi()) return `<span class="chip">${U.netIcon(val)} ${U.esc(Chain.get(val).short)}</span>`;
    return `<select class="select" data-bind="${bind}">${nets().map((n) => `<option value="${n.id}" ${n.id === val ? "selected" : ""}>${U.esc(n.name)}</option>`).join("")}</select>`;
  }
  function assetSelect(bind, list, val) {
    return `<div style="display:flex;gap:10px;align-items:center">${val ? U.tok(val) : ""}<select class="select" style="flex:1" data-bind="${bind}">${list.map((m) => `<option value="${m.symbol}" ${m.symbol === val ? "selected" : ""}>${U.esc(m.symbol)} — ${U.esc(m.name)} · ${U.pct(bind.startsWith("lend") ? m.supplyApy : bind === "borrow.bor" ? m.borrowApy : m.ltv * 100, bind === "borrow.col" ? 0 : 2)}${bind === "borrow.col" ? " LTV" : " APY"}</option>`).join("")}</select></div>`;
  }
  function amountField(bind, sym, chain) {
    const [ns, key] = bind.split("."), w = Wallet.state;
    const native = Chain.get(chain)?.nativeCurrency?.symbol || (Chain.get(chain)?.type === "solana" ? "SOL" : "");
    const bal = w.connected && w.network === chain && sym === native && w.balance != null ? w.balance : null;
    return `<div class="field"><div class="field-h"><span>Amount</span><span>Wallet: ${bal != null ? U.num(bal, 4) + " " + U.esc(sym) : "—"}</span></div>
      <div class="input-box"><input inputmode="decimal" placeholder="0.00" data-bind="${bind}" value="${U.esc(S[ns][key])}"><b style="font-size:14px">${U.esc(sym || "")}</b></div>
      ${bal != null ? `<div class="pcts">${[25, 50, 75, 100].map((p) => `<button data-action="fill" data-bind="${bind}" data-v="${(bal * p) / 100}">${p === 100 ? "Max" : p + "%"}</button>`).join("")}</div>` : ""}</div>`;
  }
  function actionBtn(label, chain) {
    const w = Wallet.state;
    if (!w.connected) return `<button class="btn btn-primary btn-lg btn-block" data-action="open-connect">Connect wallet</button>`;
    if (!Chain.contractsLive(chain)) return `<button class="btn btn-primary btn-lg btn-block" disabled>${U.esc(label)}</button>
      ${demoNote(`HILEND contracts on ${U.esc(Chain.get(chain).name)} are not deployed yet. This is a preview — no transaction will be sent.`)}`;
    return `<button class="btn btn-primary btn-lg btn-block" data-action="tx-pending">${U.esc(label)}</button>`;
  }

  /* ---------------- modals ---------------- */
  function caModal() {
    return `<h3>${U.esc(T().symbol)} contract address</h3><p class="muted" style="font-size:14px">Always verify the address before trading. Official X: <a href="${U.esc(CFG.social.x)}" target="_blank" rel="noopener" class="grad-text">${U.esc(CFG.social.xHandle)}</a></p>
      <div style="display:grid;gap:10px;margin-top:18px">${Chain.caGroups().map((g) => `
        <div class="glass" style="padding:14px;box-shadow:none">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">${g.nets.map((n) => `<span class="chip">${U.netIcon(n.id)} ${U.esc(n.short)}</span>`).join("")}</div>
          <div style="display:flex;gap:8px;align-items:center"><code class="mono" style="flex:1;font-size:12.5px;word-break:break-all;color:${g.ca ? "var(--text)" : "var(--muted)"}">${g.ca ? U.esc(g.ca) : "Coming soon"}</code>
          <button class="btn btn-primary btn-sm" data-action="copy-ca" data-ca="${U.esc(g.ca)}">${I.copy} Copy</button></div>
          ${g.ca ? `<div style="display:flex;gap:10px;margin-top:10px;flex-wrap:wrap">${g.nets.map((n) => `<a class="muted" style="font-size:12px" target="_blank" rel="noopener" href="${Chain.explorerToken(n.id)}">${U.esc(n.short)} explorer ${I.ext}</a>`).join("")}</div>` : ""}
        </div>`).join("")}</div>
      ${multi() && Chain.caGroups().some((g) => g.nets.length > 1) ? `<p class="muted" style="font-size:12.5px;margin-top:14px">Robinhood Chain, Base and BSC share the same contract address.</p>` : ""}`;
  }

  function connectModal(netId) {
    const list = nets();
    const sel = netId && Chain.get(netId) ? netId : (Wallet.state.network || list[0].id);
    const n = Chain.get(sel);
    const wallets = n.type === "solana"
      ? Wallet.solWallets().map((w) => `<button class="wallet-opt" data-action="${w.installed ? "connect" : "install"}" data-net="${sel}" data-key="${w.key}" data-url="${w.url}">${w.icon ? `<img src="${w.icon}" alt="">` : `<span class="ph">${w.name[0]}</span>`}<b>${w.name}</b><small>${w.installed ? "Detected" : "Install"}</small></button>`)
      : Wallet.evmWallets().map((w) => `<button class="wallet-opt" data-action="connect" data-net="${sel}" data-key="${U.esc(w.info.rdns || "injected")}">${w.info.icon ? `<img src="${w.info.icon}" alt="">` : `<span class="ph">${U.esc(w.info.name[0])}</span>`}<b>${U.esc(w.info.name)}</b><small>Detected</small></button>`);
    return `<h3>Connect wallet</h3><p class="muted" style="font-size:14px">Read-only preview: HILEND never asks for your seed phrase.</p>
      ${list.length > 1 ? `<div class="seg" style="margin-top:16px">${list.map((x) => `<button class="${x.id === sel ? "on" : ""}" data-action="connect-net" data-net="${x.id}">${U.netIcon(x.id)} ${U.esc(x.short)}</button>`).join("")}</div>` : ""}
      <div class="wallet-list">${wallets.length ? wallets.join("") : `<div class="empty" style="padding:20px">No EVM wallet detected.<br><a class="grad-text" href="https://metamask.io/download/" target="_blank" rel="noopener">Install MetaMask</a> or <a class="grad-text" href="https://rabby.io" target="_blank" rel="noopener">Rabby</a>.</div>`}</div>`;
  }

  function accountModal() {
    const w = Wallet.state;
    return `<h3>Wallet</h3><div class="summary" style="margin-top:14px">
      <div><span>Address</span><b class="mono">${U.short(w.address)}</b></div>
      <div><span>Wallet</span><b>${U.esc(w.walletName || "")}</b></div>
      <div><span>Network</span><b>${w.network ? U.esc(Chain.get(w.network).name) : '<span class="down">Unsupported</span>'}</b></div>
      <div><span>Balance</span><b>${w.balance != null ? U.num(w.balance, 6) + " " + (Chain.get(w.network)?.nativeCurrency?.symbol || "SOL") : "—"}</b></div></div>
      <div class="grid g-2"><button class="btn btn-ghost" data-action="copy" data-v="${U.esc(w.address)}">${I.copy} Copy address</button><button class="btn btn-ghost" data-action="disconnect">Disconnect</button></div>`;
  }

  function assetModal(key) {
    const m = Data.markets().find((x) => x.key === key);
    if (!m) return "";
    const n = Chain.get(m.chain);
    return `<div class="asset" style="margin-bottom:18px">${U.tok(m.symbol, m.chain)}<div><h3 style="margin:0">${U.esc(m.name)} (${U.esc(m.symbol)})</h3><small>${U.esc(n.name)} · ${U.price(m.price)}</small></div></div>
      <div class="grid g-4">
        ${[["Total supplied", U.usd(m.suppliedUsd)], ["Supply APY", `<span class="up">${U.pct(m.supplyApy)}</span>`], ["Total borrowed", U.usd(m.borrowedUsd)], ["Borrow APY", U.pct(m.borrowApy)]]
          .map(([l, v]) => `<div class="glass" style="padding:14px;box-shadow:none"><div class="label">${l}</div><b style="font:600 18px var(--display)">${v}</b></div>`).join("")}
      </div>
      <div class="glass card" style="margin-top:14px;box-shadow:none"><div class="card-h"><h3>Interest rate model</h3><span class="chip">Utilization ${m.utilization.toFixed(1)}%</span></div><div class="chart" id="rateChart"></div></div>
      <div class="summary" style="margin-top:14px">
        <div><span>Max LTV</span><b>${m.collateral ? (m.ltv * 100).toFixed(0) + "%" : "Not collateral"}</b></div>
        <div><span>Liquidation threshold</span><b>${(m.liqThreshold * 100).toFixed(0)}%</b></div>
        <div><span>Available liquidity</span><b>${U.usd(m.liquidityUsd)} · ${U.num(m.totalSupplied - m.totalBorrowed)} ${U.esc(m.symbol)}</b></div>
        <div><span>24h price change</span><b class="${(m.change || 0) >= 0 ? "up" : "down"}">${m.change != null ? m.change.toFixed(2) + "%" : "—"}</b></div></div>
      <div class="grid g-2"><a href="#/lend" class="btn btn-primary" data-action="goto-lend" data-key="${m.key}">Supply ${U.esc(m.symbol)}</a><a href="#/borrow" class="btn btn-ghost" data-action="goto-borrow" data-key="${m.key}">Borrow ${U.esc(m.symbol)}</a></div>`;
  }

  /* ---------------- after-render hooks ---------------- */
  function mount(route) {
    if (route === "home") {
      const h = Data.tvlHistory();
      Charts.area(document.getElementById("heroChart"), h, { height: 120, fmt: (v) => U.usd(v), labels: days(h.length) });
    }
    if (route === "dashboard") {
      const ids = chainIds(), h = Data.tvlHistory(ids);
      Charts.area(document.getElementById("tvlChart"), h, { height: 240, fmt: (v) => U.usd(v), labels: days(h.length) });
      let items;
      if (multi() && S.chain === "all") items = nets().map((n) => ({ label: n.short, value: Data.chainStats(n.id).tvl, color: n.theme.a1 }));
      else {
        const pal = ["#477BFF", "#8855FF", "#7EF0FF", "#2EE59D", "#FFC14D", "#FF5C7A"];
        items = Data.markets(ids).sort((a, b) => b.suppliedUsd - a.suppliedUsd).map((m, i) => ({ label: m.symbol, value: m.suppliedUsd, color: pal[i % pal.length] }));
      }
      const tot = items.reduce((s, i) => s + i.value, 0);
      Charts.donut(document.getElementById("donut"), items, U.usd(tot));
      document.getElementById("legend").innerHTML = items.map((i) => `<div><i style="background:${i.color}"></i><span>${U.esc(i.label)}</span><span>${tot ? ((i.value / tot) * 100).toFixed(1) : 0}%</span></div>`).join("");
    }
    if (route === "stake") stakeCalc();
    if (route === "lend") lendCalc();
    if (route === "borrow") borrowCalc();
    if (route === "portfolio") portfolioLoad();
  }

  window.Views = { S, home, dashboard, markets, stake, lend, borrow, portfolio, marketTable, mount, stakeCalc, lendCalc, borrowCalc, caModal, connectModal, accountModal, assetModal, chainIds };
})();
