# HILEND — Cross-Chain Lending Protocol (frontend)

Static DeFi frontend (HTML / CSS / vanilla JS, no build step) for **HILEND**: Stake, Lend, Borrow, Markets, Portfolio and Docs across Ethereum, BNB Chain, Robinhood Chain, Base and Solana.

- **Single mode**: show any one network. The whole site (theme colors, hero copy, markets, CA) switches to that network.
- **Multi mode**: token CA is always shown on Solana, Robinhood, Base and BSC (Robinhood, Base and BSC share one CA); the lending markets cover every chain in `protocolChains`.
- CA chips show the network SVG icons and include a **Copy CA** button (header, hero, token section, Docs).
- Wallets: EVM (EIP-6963: MetaMask, Rabby, Coinbase…; the network is added and switched automatically) and Solana (Phantom, Solflare, Backpack). The connection is read-only: balances are read from public RPCs.
- X: [@hilendMulti](https://x.com/hilendMulti)

## Run

```bash
python3 -m http.server 8000   # open http://localhost:8000
```
Works on GitHub Pages as-is (`.nojekyll` included).

## Configure — `js/config.js`

| Key | Purpose |
|---|---|
| `brand.name / tagline / description` | Brand texts |
| `token.name`, `token.symbol`, `token.totalSupply` | Token info |
| `token.address` | CA shared by all EVM networks (Robinhood, Base, BSC, Ethereum) |
| `token.sol` | Solana mint |
| `networks.<id>.ca` | Per-network CA override (empty → `token.address` / `token.sol`) |
| `mode` | `"single"` or `"multi"` |
| `singleNetwork` | `ethereum` \| `bsc` \| `robinhood` \| `base` \| `solana` (single mode) |
| `multiOrder` | Token networks shown in multi mode (default Solana, Robinhood, Base, BSC) |
| `protocolChains` | Chains with lending markets in multi mode |
| `networks.<id>` | `name`, `short`, `icon`, `theme {a1, a2, ink}`, `tagline`, `hero`, RPC, explorer, `contracts {pool, staking}` |
| `social.x`, `social.xHandle` (+ optional `social.telegram`) | Social links |
| `data.mode` | `"demo"` (data/markets.json) or `"live"` (`apiBase` + `/markets`, same JSON shape) |
| `data.livePrices` | Live token prices from CoinGecko (refreshes every `priceRefreshMs`) |
| `risk` | Liquidation bonus and health-factor thresholds used by the calculators |

Network icons are in `assets/networks/`. The logo is in `assets/logo.svg` and `assets/logo-mark.svg` (favicon: `assets/favicon.svg`).

## Data & transactions

- `data/markets.json` holds **demo** market figures (token amounts, APYs, LTVs, 30-day TVL history, staking pools). USD values are computed from live prices. A "Preview" banner is shown while `data.mode` is `"demo"`.
- **No transaction is ever sent** while a network's `contracts.pool` / `contracts.staking` are empty. Action buttons are disabled and show a notice.
- Portfolio wallet balances (native coin + HILEND when the CA is set) are real on-chain reads.

## Structure

```
index.html
css/style.css
js/config.js   # all editable settings
js/utils.js    # formatting, icons, toast, copy
js/chain.js    # networks, CA groups, RPC reads
js/data.js     # market data + live prices
js/charts.js   # SVG charts (area, donut, rate curve)
js/wallet.js   # EVM + Solana wallet connection
js/views.js    # pages & modals
js/docs.js     # documentation page
js/app.js      # router, theme, events
data/markets.json
assets/
```
