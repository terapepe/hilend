/* HILEND — tiny SVG chart helpers (no libraries). */
(function () {
  let uid = 0;
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || v;

  const Charts = {
    /** Area/line chart with hover tooltip. opts: { height, fmt, labels, color, color2, yTicks } */
    area(el, values, opts = {}) {
      if (!el) return;
      if (!values.length) { el.innerHTML = '<p class="muted" style="padding:40px;text-align:center">No data</p>'; return; }
      const W = 640, H = opts.height || 220, P = { t: 14, r: 8, b: 26, l: 8 };
      const min = Math.min(...values) * 0.96, max = Math.max(...values) * 1.02;
      const x = (i) => P.l + (i / (values.length - 1)) * (W - P.l - P.r);
      const y = (v) => P.t + (1 - (v - min) / (max - min || 1)) * (H - P.t - P.b);
      const pts = values.map((v, i) => [x(i), y(v)]);
      const line = pts.map((p, i) => {
        if (!i) return `M${p[0]},${p[1]}`;
        const q = pts[i - 1], cx = (q[0] + p[0]) / 2;
        return `C${cx},${q[1]} ${cx},${p[1]} ${p[0]},${p[1]}`;
      }).join("");
      const id = "ag" + ++uid, c1 = opts.color || css("--a1"), c2 = opts.color2 || css("--a2");
      const labels = opts.labels || [];
      const ticks = [0, Math.floor(values.length / 2), values.length - 1];
      el.innerHTML = `
        <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="height:${H}px">
          <defs>
            <linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}" stop-opacity=".35"/><stop offset="1" stop-color="${c1}" stop-opacity="0"/></linearGradient>
            <linearGradient id="${id}l" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>
          </defs>
          ${[0.25, 0.5, 0.75].map((k) => `<line x1="0" x2="${W}" y1="${P.t + k * (H - P.t - P.b)}" y2="${P.t + k * (H - P.t - P.b)}" stroke="rgba(255,255,255,.06)" stroke-dasharray="3 5"/>`).join("")}
          <path d="${line}L${x(values.length - 1)},${H - P.b}L${x(0)},${H - P.b}Z" fill="url(#${id})"/>
          <path d="${line}" fill="none" stroke="url(#${id}l)" stroke-width="2.5" vector-effect="non-scaling-stroke" class="draw"/>
          ${ticks.map((i) => labels[i] ? `<text x="${x(i)}" y="${H - 6}" fill="#5D6789" font-size="11" text-anchor="${i === 0 ? "start" : i === values.length - 1 ? "end" : "middle"}">${labels[i]}</text>` : "").join("")}
          <line class="hl" y1="${P.t}" y2="${H - P.b}" stroke="rgba(255,255,255,.25)" stroke-dasharray="3 3" opacity="0"/>
          <circle class="hc" r="5" fill="${c1}" stroke="#fff" stroke-width="2" opacity="0"/>
        </svg><div class="tip"></div>`;
      const svg = el.querySelector("svg"), tip = el.querySelector(".tip"), hl = el.querySelector(".hl"), hc = el.querySelector(".hc");
      const path = el.querySelector(".draw"), len = path.getTotalLength ? path.getTotalLength() : 0;
      if (len) { path.style.strokeDasharray = len; path.style.strokeDashoffset = len; path.getBoundingClientRect(); path.style.transition = "stroke-dashoffset 1.2s ease"; path.style.strokeDashoffset = 0; }
      const fmt = opts.fmt || ((v) => v.toFixed(2));
      const move = (ev) => {
        const r = svg.getBoundingClientRect(), px = ((ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left) / r.width * W;
        const i = Math.max(0, Math.min(values.length - 1, Math.round(((px - P.l) / (W - P.l - P.r)) * (values.length - 1))));
        const [X, Y] = pts[i];
        hl.setAttribute("x1", X); hl.setAttribute("x2", X); hl.setAttribute("opacity", 1);
        hc.setAttribute("cx", X); hc.setAttribute("cy", Y); hc.setAttribute("opacity", 1);
        tip.style.left = (X / W) * 100 + "%"; tip.style.top = (Y / H) * r.height + "px"; tip.style.opacity = 1;
        tip.innerHTML = `<b>${fmt(values[i])}</b>${labels[i] || ""}`;
      };
      const leave = () => { tip.style.opacity = 0; hl.setAttribute("opacity", 0); hc.setAttribute("opacity", 0); };
      svg.addEventListener("mousemove", move); svg.addEventListener("touchmove", move, { passive: true });
      svg.addEventListener("mouseleave", leave);
    },

    /** Donut chart. items: [{ label, value, color }] */
    donut(el, items, center = "") {
      if (!el) return;
      const total = items.reduce((s, i) => s + i.value, 0) || 1, R = 70, C = 2 * Math.PI * R;
      let off = 0;
      el.innerHTML = `<svg viewBox="0 0 180 180" style="width:170px;height:170px">
        <circle cx="90" cy="90" r="${R}" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="18"/>
        ${items.map((i) => {
          const len = (i.value / total) * C, s = `<circle cx="90" cy="90" r="${R}" fill="none" stroke="${i.color}" stroke-width="18"
            stroke-dasharray="${Math.max(0, len - 2)} ${C}" stroke-dashoffset="${-off}" transform="rotate(-90 90 90)" stroke-linecap="butt"><title>${U.esc(i.label)}</title></circle>`;
          off += len; return s;
        }).join("")}
        <text x="90" y="86" text-anchor="middle" fill="#8C97B8" font-size="11">TVL</text>
        <text x="90" y="106" text-anchor="middle" fill="#EEF2FF" font-size="18" font-weight="700" font-family="Sora">${center}</text>
      </svg>`;
    },

    /** Kinked interest-rate model curve with current utilization marker. */
    rateCurve(el, asset) {
      // Slope is calibrated so the curve passes through the market's current (utilization, borrow APY).
      const kink = 80, slope = asset.borrowApy / Math.max(asset.utilization, 1);
      const jump = Math.max(kink * slope * 3, 15);
      const borrowAt = (u) => (u <= kink ? u * slope : kink * slope + ((u - kink) / (100 - kink)) * jump);
      const pts = Array.from({ length: 101 }, (_, u) => borrowAt(u));
      const supply = pts.map((b, u) => b * (u / 100) * 0.9);
      const W = 640, H = 200, P = 24, max = Math.max(...pts) * 1.05;
      const x = (u) => P + (u / 100) * (W - 2 * P), y = (v) => H - P - (v / max) * (H - 2 * P);
      const path = (arr) => arr.map((v, u) => `${u ? "L" : "M"}${x(u)},${y(v)}`).join("");
      const cu = Math.min(100, asset.utilization);
      el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" style="height:${H}px">
        <line x1="${x(kink)}" x2="${x(kink)}" y1="${P}" y2="${H - P}" stroke="rgba(255,193,77,.4)" stroke-dasharray="4 4"/>
        <text x="${x(kink) + 6}" y="${P + 10}" fill="#FFC14D" font-size="11">Optimal ${kink}%</text>
        <path d="${path(pts)}" fill="none" stroke="${css("--a2")}" stroke-width="2.5"/>
        <path d="${path(supply)}" fill="none" stroke="${css("--a1")}" stroke-width="2.5"/>
        <line x1="${x(cu)}" x2="${x(cu)}" y1="${P}" y2="${H - P}" stroke="rgba(255,255,255,.4)"/>
        <circle cx="${x(cu)}" cy="${y(borrowAt(cu))}" r="5" fill="${css("--a2")}" stroke="#fff" stroke-width="2"/>
        <text x="${x(cu)}" y="${H - 6}" fill="#EEF2FF" font-size="11" text-anchor="middle">Current ${cu.toFixed(1)}%</text>
        <text x="${P}" y="${H - 6}" fill="#5D6789" font-size="11">0%</text><text x="${W - P}" y="${H - 6}" fill="#5D6789" font-size="11" text-anchor="end">100%</text>
      </svg>
      <div style="display:flex;gap:16px;font-size:12.5px;color:#8C97B8;margin-top:6px">
        <span><i style="display:inline-block;width:10px;height:3px;background:${css("--a2")};margin-right:6px;vertical-align:middle"></i>Borrow APY</span>
        <span><i style="display:inline-block;width:10px;height:3px;background:${css("--a1")};margin-right:6px;vertical-align:middle"></i>Supply APY</span>
      </div>`;
    },

    /** Small inline sparkline (SVG string). */
    spark(values, up = true, w = 90, h = 30) {
      if (!values || values.length < 2) return "";
      const min = Math.min(...values), max = Math.max(...values);
      const d = values.map((v, i) => `${i ? "L" : "M"}${(i / (values.length - 1)) * w},${h - 2 - ((v - min) / (max - min || 1)) * (h - 4)}`).join("");
      return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><path d="${d}" fill="none" stroke="${up ? "#2EE59D" : "#FF5C7A"}" stroke-width="1.8"/></svg>`;
    },
  };

  window.Charts = Charts;
})();
