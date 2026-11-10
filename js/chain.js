/* HILEND — networks, CA helpers and live on-chain reads (plain JSON-RPC, no libraries). */
(function () {
  const CFG = window.HILEND_CONFIG;

  const Chain = {
    isSingle() { return CFG.mode !== "multi"; },
    singleId() { return CFG.networks[CFG.singleNetwork] ? CFG.singleNetwork : Object.keys(CFG.networks)[0]; },
    get(id) { const n = CFG.networks[id]; return n ? { id, ...n } : null; },
    byChainId(cid) { return Chain.protocol().find((n) => n.type === "evm" && n.chainId === Number(cid)) || null; },
    hex(cid) { return "0x" + Number(cid).toString(16); },

    /** Networks where the HILEND token CA is shown (single → 1, multi → multiOrder: SOL/RH/BASE/BSC). */
    tokenNets() {
      if (Chain.isSingle()) return [Chain.get(Chain.singleId())];
      return (CFG.multiOrder || []).filter((id) => CFG.networks[id]).map(Chain.get);
    },
    /** Chains with lending markets (single → 1, multi → protocolChains). */
    protocol() {
      if (Chain.isSingle()) return [Chain.get(Chain.singleId())];
      const ids = CFG.protocolChains && CFG.protocolChains.length ? CFG.protocolChains : Object.keys(CFG.networks);
      return ids.filter((id) => CFG.networks[id]).map(Chain.get);
    },

    tokenAddress(id) {
      const n = CFG.networks[id];
      if (!n) return "";
      return (n.ca || (n.type === "solana" ? CFG.token.sol : CFG.token.address) || "").trim();
    },
    /** Networks sharing one CA are grouped → one Copy button per group (multi: RH+BASE+BSC, SOL). */
    caGroups() {
      return Chain.tokenNets().reduce((acc, n) => {
        const ca = Chain.tokenAddress(n.id);
        const key = ca ? ca.toLowerCase() : (n.type === "solana" ? "sol" : "evm");
        const g = acc.find((x) => x.key === key);
        g ? g.nets.push(n) : acc.push({ key, ca, nets: [n] });
        return acc;
      }, []);
    },
    explorerToken(id) {
      const n = CFG.networks[id], a = Chain.tokenAddress(id);
      return n && a ? n.explorer + n.explorerToken + a : "";
    },
    explorerAddr(id, a) {
      const n = CFG.networks[id];
      return n && a ? n.explorer + (n.explorerAddrPath || "/address/") + a : "";
    },
    contractsLive(id) {
      const c = (CFG.networks[id] || {}).contracts || {};
      return !!(c.pool || c.staking);
    },

    async rpc(id, method, params) {
      const n = CFG.networks[id];
      const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 8000);
      try {
        const res = await fetch(n.rpcUrls[0], {
          method: "POST", headers: { "Content-Type": "application/json" }, signal: ctl.signal,
          body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
        });
        const j = await res.json();
        if (j.error) throw new Error(j.error.message || "RPC error");
        return j.result;
      } finally { clearTimeout(to); }
    },

    format(raw, dec) {
      const b = BigInt(raw), d = 10n ** BigInt(dec);
      const i = b / d, f = (b % d).toString().padStart(dec, "0").replace(/0+$/, "");
      return Number(i.toString() + (f ? "." + f.slice(0, 8) : ""));
    },

    /** Native coin balance (ETH / BNB / SOL) — real read via public RPC. */
    async nativeBalance(id, owner) {
      const n = CFG.networks[id];
      if (!n || !owner) return null;
      try {
        if (n.type === "solana") {
          const r = await Chain.rpc(id, "getBalance", [owner]);
          return (r.value || 0) / 1e9;
        }
        return Chain.format(await Chain.rpc(id, "eth_getBalance", [owner, "latest"]), 18);
      } catch { return null; }
    },

    /** HILEND balance on a network (null when CA not set or unreachable). */
    async tokenBalance(id, owner) {
      const n = CFG.networks[id], ca = Chain.tokenAddress(id);
      if (!n || !ca || !owner) return null;
      try {
        if (n.type === "solana") {
          const r = await Chain.rpc(id, "getTokenAccountsByOwner", [owner, { mint: ca }, { encoding: "jsonParsed" }]);
          return (r.value || []).reduce((s, a) => s + Number(a.account.data.parsed.info.tokenAmount.uiAmount || 0), 0);
        }
        let dec = CFG.token.decimals;
        try { dec = Number(BigInt(await Chain.rpc(id, "eth_call", [{ to: ca, data: "0x313ce567" }, "latest"]))); } catch {}
        const data = "0x70a08231" + owner.toLowerCase().replace(/^0x/, "").padStart(64, "0");
        return Chain.format(await Chain.rpc(id, "eth_call", [{ to: ca, data }, "latest"]), dec);
      } catch { return null; }
    },
  };

  window.Chain = Chain;
})();
