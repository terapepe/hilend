/* HILEND — documentation page (#/docs/<section>). Content adapts to config (mode, networks, token). */
(function () {
  const CFG = window.HILEND_CONFIG;

  const NAV = [
    ["Overview", [["introduction", "Introduction"], ["getting-started", "Getting started"], ["networks", "Networks & contract"]]],
    ["Using HILEND", [["staking", "Staking"], ["lending", "Lending"], ["borrowing", "Borrowing"], ["health-factor", "Health factor & liquidation"], ["interest-rates", "Interest rate model"]]],
    ["Protocol", [["token", "HILEND token"], ["ai-risk", "AI risk engine"], ["security", "Security & transparency"], ["risks", "Risk disclosure"]]],
    ["Help", [["faq", "FAQ"], ["glossary", "Glossary"]]],
  ];

  function body() {
    const nets = Chain.protocol(), single = Chain.isSingle(), T = CFG.token, B = CFG.brand.name;
    const netNames = nets.map((n) => n.name).join(", ");
    const caRows = Chain.caGroups().map((g) => `<tr><td>${g.nets.map((n) => `<span style="display:inline-flex;gap:6px;align-items:center;margin-right:10px">${U.netIcon(n.id)} ${U.esc(n.short)}</span>`).join("")}</td>
      <td><code>${g.ca ? U.esc(g.ca) : "Coming soon"}</code></td><td><button class="btn btn-ghost btn-sm" data-action="copy-ca" data-ca="${U.esc(g.ca)}">${U.icons.copy} Copy</button></td></tr>`).join("");

    return `
    <section id="introduction"><span class="chip chip-accent">Documentation</span>
      <h2 style="margin-top:14px;font-size:36px">Welcome to ${B}</h2>
      <p>${B} is a <b>${single ? nets[0].name + "-native" : "cross-chain"} lending protocol</b>. It lets anyone earn yield on crypto, borrow against it, and stake to earn rewards — without a bank, a broker or a custodian. Everything happens through smart contracts you can verify on-chain.</p>
      <p>This guide explains how each feature works, what the numbers mean and which risks to keep in mind. No prior DeFi experience is needed.</p>
      <div class="grid g-3" style="margin-top:20px">
        ${[["Stake", "Earn rewards on idle assets."], ["Lend", "Supply assets, earn variable APY."], ["Borrow", "Unlock liquidity without selling."]].map(([h, p]) => `<div class="glass" style="padding:18px;box-shadow:none"><b>${h}</b><p class="muted" style="font-size:14px;margin-top:4px">${p}</p></div>`).join("")}
      </div>
    </section>

    <section id="getting-started"><h2>Getting started</h2>
      <ol>
        <li><b>Get a wallet.</b> For EVM chains (${nets.filter((n) => n.type === "evm").map((n) => n.short).join(", ") || "—"}) use MetaMask, Rabby, Coinbase Wallet or any EIP-6963 wallet. ${nets.some((n) => n.type === "solana") ? "For Solana use Phantom, Solflare or Backpack." : ""}</li>
        <li><b>Fund it</b> with the asset you want to supply and a little native coin for gas (${[...new Set(nets.map((n) => n.nativeCurrency?.symbol || "SOL"))].join(" / ")}).</li>
        <li><b>Connect</b> with the button at the top right. ${single ? "" : "Choose the network first — HILEND adds and switches the network in your wallet automatically."}</li>
        <li><b>Pick an action</b> — Stake, Lend or Borrow — enter an amount and review the summary before confirming in your wallet.</li>
        <li><b>Track everything</b> in Portfolio: balances, positions, health factor and history.</li>
      </ol>
      <div class="callout"><p>💡 Start small. Supply a modest amount first and watch how interest accrues before committing larger sums.</p></div>
    </section>

    <section id="networks"><h2>Networks & contract address</h2>
      <p>${single ? `This deployment runs on <b>${U.esc(nets[0].name)}</b> only.` : `${B} is live on <b>${nets.length} networks</b>: ${U.esc(netNames)}. Each network has its own independent markets and liquidity.`}</p>
      <table><thead><tr><th>Network</th><th>Type</th><th>Native coin</th><th>Best for</th></tr></thead><tbody>
        ${nets.map((n) => `<tr><td>${U.netIcon(n.id)} ${U.esc(n.name)}</td><td>${n.type === "evm" ? "EVM · chain " + n.chainId : "Solana"}</td><td>${n.nativeCurrency?.symbol || "SOL"}</td><td class="muted">${U.esc(n.tagline)}</td></tr>`).join("")}
      </tbody></table>
      <h3>${U.esc(T.symbol)} contract address</h3>
      <table><tbody>${caRows}</tbody></table>
      ${!single ? `<p>Robinhood Chain, Base and BSC share <b>one identical contract address</b>; Solana uses its own mint address.</p>` : ""}
      <div class="callout warn"><p>⚠️ Only trust addresses shown on this site or posted by <a class="grad-text" href="${U.esc(CFG.social.x)}" target="_blank" rel="noopener">${U.esc(CFG.social.xHandle)}</a>. Scammers often deploy look-alike tokens.</p></div>
    </section>

    <section id="staking"><h2>Staking</h2>
      <p>Staking locks an asset in a pool in exchange for rewards. ${B} offers three kinds of pools:</p>
      <ul><li><b>${U.esc(T.symbol)} single stake</b> — earns a share of protocol revenue plus boosted rewards.</li>
        <li><b>Native staking</b> (ETH, BNB, SOL) — delegates to curated validators; you receive a liquid receipt token.</li>
        <li><b>Stable vaults</b> — auto-compounding stablecoin yield from the safest lending markets.</li></ul>
      <h3>Lock boosts</h3>
      <p>Some pools offer optional lock periods. Longer locks multiply your APR (e.g. 90 days = 1.6×). Flexible stakes can be withdrawn at any time; locked stakes unlock automatically at the end of the period.</p>
      <pre>Effective APR = Base APR × Lock boost
Yearly reward  = Amount × Effective APR</pre>
    </section>

    <section id="lending"><h2>Lending</h2>
      <p>When you <b>supply</b> an asset, it joins a shared pool that borrowers draw from. Borrowers pay interest, and that interest is distributed to suppliers — this is your <b>Supply APY</b>.</p>
      <ul><li>APY is <b>variable</b>: it rises when many people borrow (high utilization) and falls when few do.</li>
        <li>Interest compounds every block — no claiming needed.</li>
        <li>You can withdraw at any time as long as the pool has enough unborrowed liquidity.</li>
        <li>Supplied assets marked as collateral increase your <b>borrowing power</b>.</li></ul>
    </section>

    <section id="borrowing"><h2>Borrowing</h2>
      <p>Borrowing lets you get liquidity without selling your crypto. Every loan is <b>over-collateralized</b>: you deposit more value than you borrow.</p>
      <ul><li><b>Max LTV</b> (loan-to-value) is the most you can borrow against an asset, e.g. 80% for ETH means $1,000 of ETH lets you borrow up to $800.</li>
        <li><b>Borrow APY</b> is variable and accrues on your debt every block.</li>
        <li>There is no fixed term — repay whenever you like.</li></ul>
      <div class="callout"><p>💡 Borrowing well below your max LTV gives you a buffer against price drops.</p></div>
    </section>

    <section id="health-factor"><h2>Health factor & liquidation</h2>
      <p>The health factor (HF) summarises how safe a loan is:</p>
      <pre>Health factor = (Collateral value × Liquidation threshold) ÷ Borrowed value</pre>
      <table><thead><tr><th>Health factor</th><th>Status</th><th>What it means</th></tr></thead><tbody>
        <tr><td class="up">≥ ${CFG.risk.healthWarn}</td><td>Safe</td><td>Comfortable buffer against volatility.</td></tr>
        <tr><td>${CFG.risk.healthDanger} – ${CFG.risk.healthWarn}</td><td>Moderate</td><td>Consider adding collateral or repaying.</td></tr>
        <tr><td class="down">&lt; ${CFG.risk.healthDanger}</td><td>Danger</td><td>A small price move may trigger liquidation.</td></tr>
        <tr><td class="down">≤ 1.0</td><td>Liquidatable</td><td>Part of your collateral can be sold to repay the debt.</td></tr></tbody></table>
      <p>During liquidation, a liquidator repays part of your debt and receives the equivalent collateral plus a <b>${(CFG.risk.liquidationBonus * 100).toFixed(0)}% penalty</b>. You keep the rest of your collateral.</p>
    </section>

    <section id="interest-rates"><h2>Interest rate model</h2>
      <p>Rates follow a <b>kinked curve</b> driven by utilization (borrowed ÷ supplied):</p>
      <ul><li>Below the optimal point (80%), borrow rates rise slowly to keep borrowing affordable.</li>
        <li>Above it, rates rise steeply to attract new suppliers and encourage repayment, protecting withdrawals.</li></ul>
      <pre>Supply APY ≈ Borrow APY × Utilization × (1 − Reserve factor)</pre>
      <p>Open any market on the Markets page to see its live curve.</p>
    </section>

    <section id="token"><h2>${U.esc(T.name)} token (${U.esc(T.symbol)})</h2>
      <table><tbody>
        <tr><td>Name</td><td>${U.esc(T.name)}</td></tr><tr><td>Symbol</td><td>${U.esc(T.symbol)}</td></tr>
        <tr><td>Total supply</td><td>${Number(T.totalSupply).toLocaleString("en-US")}</td></tr>
        <tr><td>Networks</td><td>${Chain.tokenNets().map((n) => U.netIcon(n.id) + " " + U.esc(n.short)).join(" &nbsp; ")}</td></tr></tbody></table>
      <h3>Utility</h3>
      <ul><li><b>Revenue share</b> — stakers receive part of protocol interest fees.</li><li><b>Governance</b> — vote on new markets, LTVs, reserve factors and chain expansion.</li>
        <li><b>Boosted rewards</b> — longer locks earn up to 2.2× staking boost.</li><li><b>Fee discounts</b> — reduced borrow fees for long-term stakers.</li></ul>
    </section>

    <section id="ai-risk"><h2>AI risk engine</h2>
      <p>${B} includes an AI-assisted monitoring layer that helps users and governance spot risk early:</p>
      <ul><li><b>Volatility scoring</b> per collateral asset, used to suggest a safe health-factor target.</li>
        <li><b>Liquidity depth checks</b> so collateral can actually be liquidated without bad debt.</li>
        <li><b>Oracle health</b> — deviations between price feeds are flagged.</li>
        <li><b>Position alerts</b> — warnings when your health factor approaches danger.</li></ul>
      <div class="callout"><p>The AI engine gives recommendations only. It never moves your funds; all parameters are enforced by smart contracts and governance.</p></div>
    </section>

    <section id="security"><h2>Security & transparency</h2>
      <ul><li><b>Non-custodial</b> — funds are held by smart contracts, never by the team.</li>
        <li><b>Audits</b> — independent audit reports will be published here before contracts go live.</li>
        <li><b>Isolated markets & supply caps</b> limit exposure to volatile assets.</li>
        <li><b>Multiple oracles</b> with deviation checks.</li>
        <li><b>Timelocked governance</b> — parameter changes are announced before they take effect.</li>
        <li><b>On-chain data</b> — every number on the dashboard can be verified on a block explorer.</li></ul>
    </section>

    <section id="risks"><h2>Risk disclosure</h2>
      <div class="callout warn"><p>DeFi is experimental. You can lose some or all of your funds. Nothing on this website is financial advice.</p></div>
      <ul><li><b>Smart-contract risk</b> — bugs can exist even in audited code.</li><li><b>Liquidation risk</b> — sharp price moves can liquidate borrowers.</li>
        <li><b>Oracle risk</b> — incorrect prices can cause unexpected liquidations.</li><li><b>Liquidity risk</b> — at 100% utilization, withdrawals may be temporarily unavailable.</li>
        <li><b>Network risk</b> — chain congestion or outages can delay transactions.</li><li><b>Variable rates</b> — APYs change continuously and are not guaranteed.</li></ul>
      ${Data.isDemo() ? `<p><b>Preview notice:</b> market sizes, rates and staking figures currently shown are demo data. Token prices are live. No transactions are sent until contracts are deployed.</p>` : ""}
    </section>

    <section id="faq"><h2>FAQ</h2>
      ${[["Do I need an account?", "No. Your wallet is your account. Connect and go."],
         ["What fees are there?", "Network gas fees, plus a reserve factor taken from borrower interest. There are no deposit or withdrawal fees."],
         ["Can I lose my deposit?", "Suppliers are exposed to smart-contract and bad-debt risk. Borrowers can additionally be liquidated if their health factor falls to 1."],
         ["Why did my APY change?", "Rates are variable and react to utilization in real time."],
         [single ? "Which network is supported?" : "Can I move positions between chains?", single ? `Only ${U.esc(nets[0].name)}.` : "Positions live on the chain where you opened them. Withdraw, bridge with a trusted bridge, then supply on the other chain."],
         ["Where can I get help?", `Follow <a class="grad-text" href="${U.esc(CFG.social.x)}" target="_blank" rel="noopener">${U.esc(CFG.social.xHandle)}</a> for announcements and support.`]]
        .map(([q, a]) => `<h3>${q}</h3><p>${a}</p>`).join("")}
    </section>

    <section id="glossary"><h2>Glossary</h2>
      <table><tbody>${[["APY", "Annual percentage yield, including compounding."], ["APR", "Annual percentage rate, without compounding."], ["TVL", "Total value locked — total value supplied to the protocol."], ["Utilization", "Share of supplied assets currently borrowed."], ["LTV", "Loan-to-value — debt ÷ collateral value."], ["Liquidation threshold", "LTV at which a position can be liquidated."], ["Health factor", "Safety score of a loan; ≤ 1 means liquidatable."], ["CA", "Contract address of a token."]]
        .map(([a, b]) => `<tr><td><b>${a}</b></td><td class="muted">${b}</td></tr>`).join("")}</tbody></table>
    </section>`;
  }

  window.Views.docs = function (section) {
    return `<div class="wrap page"><div class="docs">
      <aside class="glass docs-nav">${NAV.map(([h, items]) => `<h5>${h}</h5>${items.map(([id, l]) => `<a href="#/docs/${id}" data-doc="${id}" class="${id === section ? "on" : ""}">${l}</a>`).join("")}`).join("")}</aside>
      <article class="doc">${body()}</article></div></div>`;
  };
})();
