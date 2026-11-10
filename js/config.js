/* ==========================================================================
   HILEND — site configuration.
   Everything that may change later (token name/symbol, CA, networks,
   single/multi mode, X account, contracts, data source) lives in this file.
   Edit it directly on GitHub — no build step needed.
   ========================================================================== */
window.HILEND_CONFIG = {
  brand: {
    name: "HILEND",
    tagline: "Cross-Chain Lending Protocol",
    description:
      "Stake, lend and borrow across Ethereum, BNB Chain, Robinhood Chain, Base and Solana from a single, transparent dashboard.",
    logo: "assets/logo.svg",
    mark: "assets/logo-mark.svg",
  },

  /** Project token. CA: `address` is shared by all EVM networks (Robinhood, Base, BSC, Ethereum),
   *  `sol` is the Solana mint. A network can override with its own `ca` below.
   *  Leave empty until launch — the site shows "CA coming soon". */
  token: {
    name: "HILEND",
    symbol: "HILEND",
    decimals: 18,             // fallback; real value is read on-chain when CA is set
    totalSupply: "1000000000", // display only
    address: "",
    sol: "",
  },

  social: {
    x: "https://x.com/hilendMulti",
    xHandle: "@hilendMulti",
    // telegram: "https://t.me/...", // optional — shown in footer if set
  },

  /**
   * Site mode
   *  "single" → the whole site shows only `singleNetwork` (any key of `networks`),
   *             the theme switches to that network's colors and copy.
   *  "multi"  → token CA always shown on the 4 networks of `multiOrder`
   *             (Solana, Robinhood, Base, BSC — Robinhood/Base/BSC share one CA),
   *             lending markets cover every chain in `protocolChains`.
   */
  mode: "multi",
  singleNetwork: "base",
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

  /**
   * Data source
   *  "demo" → market figures from data/markets.json (illustrative, labelled DEMO in the UI).
   *  "live" → backend at apiBase (same JSON shape as data/markets.json, endpoint /markets).
   * Token prices are always fetched live from CoinGecko when livePrices = true.
   * No transaction is ever sent while a network's contracts.pool / contracts.staking are empty.
   */
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
