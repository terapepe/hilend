window.HILEND_CONFIG = {
  brand: {
    name: "HILEND",
    tagline: "Cross-Chain Lending Protocol",
    description:
      "Stake, lend and borrow across Ethereum, BNB Chain, Robinhood Chain, Base and Solana from a single, transparent dashboard.",
    logo: "assets/logo.svg",
    mark: "assets/logo-mark.svg",
  },
  token: {
    name: "HILEND",
    symbol: "HID",
    decimals: 18,
    totalSupply: "1000000000", // display only
    address: "s", //
    sol: "",
  },

  announcement: "HILEND contract address launching soon",

  social: {
    x: "https://x.com/TheHiLend",
    xHandle: "@TheHiLend",
    // telegram: "https://t.me/...", // optional — shown in footer if set
  },
  mode: "single",
  singleNetwork: "robinhood",
  multiOrder: ["solana", "robinhood", "base", "bsc"],
  protocolChains: ["ethereum", "bsc", "robinhood", "base", "solana"],

  networks: {
    ethereum: {
      name: "Ethereum",
      short: "Ethereum",
      type: "evm",
      chainId: 1,
      nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
      rpcUrls: ["https://ethereum-rpc.publicnode.com"],
      explorer: "https://etherscan.io",
      explorerToken: "/token/",
      icon: "assets/networks/ethereum.svg",
      theme: { a1: "#627EEA", a2: "#8855FF", ink: "#ffffff" },
      tagline: "Deepest liquidity, battle-tested security",
      hero: "Lend and borrow on the world's most secure smart-contract chain.",
      ca: "",
      contracts: { pool: "", staking: "" },
    },
    bsc: {
      name: "BNB Smart Chain",
      short: "BSC",
      type: "evm",
      chainId: 56,
      nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
      rpcUrls: ["https://bsc-dataseed.bnbchain.org"],
      explorer: "https://bscscan.com",
      explorerToken: "/token/",
      icon: "assets/networks/bsc.svg",
      theme: { a1: "#F0B90B", a2: "#477BFF", ink: "#14100a" },
      tagline: "Low fees and a massive user base",
      hero: "Put your BNB Chain assets to work with low-fee lending.",
      ca: "",
      contracts: { pool: "", staking: "" },
    },
    robinhood: {
      name: "Robinhood Chain",
      short: "Robinhood",
      type: "evm",
      chainId: 4663,
      nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
      rpcUrls: ["https://rpc.mainnet.chain.robinhood.com"],
      explorer: "https://robinhoodchain.blockscout.com",
      explorerToken: "/token/",
      icon: "assets/networks/robinhood.svg",
      theme: { a1: "#CCFF00", a2: "#477BFF", ink: "#0b1020" },
      tagline: "Fast, low-fee L2 built for trading",
      hero: "Trading-grade lending on Robinhood Chain.",
      ca: "",
      contracts: { pool: "", staking: "" },
    },
    base: {
      name: "Base",
      short: "Base",
      type: "evm",
      chainId: 8453,
      nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
      rpcUrls: ["https://mainnet.base.org"],
      explorer: "https://basescan.org",
      explorerToken: "/token/",
      icon: "assets/networks/base.svg",
      theme: { a1: "#0052FF", a2: "#477BFF", ink: "#ffffff" },
      tagline: "Onchain with the Base community",
      hero: "Bring your assets onchain and earn on Base.",
      ca: "",
      contracts: { pool: "", staking: "" },
    },
    solana: {
      name: "Solana",
      short: "Solana",
      type: "solana",
      rpcUrls: ["https://api.mainnet-beta.solana.com"],
      explorer: "https://solscan.io",
      explorerToken: "/token/",
      explorerAddrPath: "/account/",
      icon: "assets/networks/solana.svg",
      theme: { a1: "#9945FF", a2: "#14F195", ink: "#ffffff" },
      tagline: "Lightning-fast, sub-cent transactions",
      hero: "Lightning-fast lending on Solana.",
      ca: "",
      contracts: { pool: "", staking: "" },
    },
  },

  data: {
    mode: "demo",
    demoUrl: "data/markets.json",
    apiBase: "/api",
    livePrices: true,
    priceApi: "https://api.coingecko.com/api/v3/simple/price",
    priceRefreshMs: 60000,
  },

  /** Risk parameters used by the calculators (display only until contracts are live). */
  risk: {
    liquidationBonus: 0.05,
    healthWarn: 1.5,
    healthDanger: 1.1,
  },
};

/* ---- hybot sync: CA, token name, symbol, X and Telegram follow the newest token hybot launched for this site ----
   https://hybot.xyz/api/site-token?site=<domain> · values above are the fallback when hybot has none / is unreachable.
   Links in the page that point to the old X / Telegram are updated, or hidden when the launched token has none. */
(function (C) {
  if (!C || typeof window === "undefined") return;
  var DOMAIN = "hilend.xyz";
  var host = String(location.hostname || "").replace(/^www\./, "");
  var site = /\./.test(host) && !/(^|\.)(vercel\.app|localhost|127\.0\.0\.1)$/.test(host) ? host : DOMAIN;
  if (!site) return;
  var d = null, key = "hybot:" + site;
  try { var c = JSON.parse(localStorage.getItem(key) || "null"); if (c && Date.now() - c.t < 60000) d = c.d; } catch (e) {}
  if (!d) {
    try {
      var x = new XMLHttpRequest();
      x.open("GET", "https://hybot.xyz/api/site-token?site=" + encodeURIComponent(site), false); // sync: config must be ready before the app scripts run
      x.send();
      if (x.status === 200) { d = JSON.parse(x.responseText); try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), d: d })); } catch (e) {} }
    } catch (e) {}
  }
  if (!d || !d.found || !/^0x[0-9a-fA-F]{40}$/.test(d.ca || "")) return;
  var handle = function (u) { var m = String(u || "").match(/(?:x|twitter)\.com\/@?([A-Za-z0-9_]{1,15})|^@?([A-Za-z0-9_]{1,15})$/); return m ? (m[1] || m[2]) : ""; };
  var tgName = function (u) { var m = String(u || "").match(/t\.me\/([\w+/-]+)/); return m ? m[1].replace(/\/+$/, "") : String(u || "").replace(/^@/, ""); };
  var X0 = C.social && C.social.x || "", TG0 = C.social && C.social.telegram || "";
  var oldX = handle(X0), oldTg = tgName(TG0);
  var X = d.x || "", TG = d.telegram || "", SYM = d.symbol, NAME = d.name, CA = d.ca;
  // no X / Telegram on the launched token → config keeps the old link so the app renders as usual, and the link fixer below hides it
  var XV = X || X0, TGV = TG || TG0, XH = handle(XV);
  // single-network per-chain CA overrides would win over the shared address → clear them
  var net = C.singleNetwork || C.singleChain || (C.token && C.token.singleNetwork);
  [C.networks, C.chains, C.token && C.token.chains].forEach(function (m) { if (m && net && m[net] && "ca" in m[net]) m[net].ca = ""; });
  C.token.name = NAME; C.token.symbol = SYM; C.token.address = CA;
  C.social.x = XV; C.social.xHandle = XH ? "@" + XH : ""; C.social.telegram = TGV;
  // page links still pointing to the old X / Telegram (hard-coded or rendered later)
  var fix = function (root) {
    var as = root.querySelectorAll ? root.querySelectorAll("a[href]") : [];
    for (var i = 0; i < as.length; i++) {
      var a = as[i], h = a.getAttribute("href") || "";
      if (oldX && new RegExp("(x|twitter)\\.com/@?" + oldX + "(?![A-Za-z0-9_])", "i").test(h) && !/intent|share/i.test(h)) {
        if (X) { if (h !== X) { a.href = X; if (XH && oldX !== XH) a.innerHTML = a.innerHTML.split("@" + oldX).join("@" + XH); } }
        else a.style.display = "none";
      } else if (oldTg && /t\.me\//i.test(h) && tgName(h).toLowerCase() === oldTg.toLowerCase()) {
        if (TG) { if (h !== TG) a.href = TG; } else a.style.display = "none";
      }
    }
  };
  var start = function () { fix(document); new MutationObserver(function (ms) { ms.forEach(function (m) { m.addedNodes.forEach(function (n) { if (n.nodeType === 1) { fix(n); if (n.matches && n.matches("a[href]")) fix(n.parentNode || n); } }); }); }).observe(document.documentElement, { childList: true, subtree: true }); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})(window.HILEND_CONFIG);
