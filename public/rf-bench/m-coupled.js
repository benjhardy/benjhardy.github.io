/* Module: two coupled quarter-wave resonators. Mode splitting, k, external Q from the tap, 2-pole response. */
(function () {
  "use strict";
  const { cx, el, s, fmt, b } = RF;
  const kFromGap = (g) => 0.2 * Math.exp(-g / 30);
  const gapFromK = (k) => 30 * Math.log(0.2 / k);
  const qeFromTap = (t) => (Math.PI / 4) / Math.pow(Math.sin((Math.PI / 2) * t), 2);
  const tapFromQe = (q) => (2 / Math.PI) * Math.asin(Math.sqrt(Math.PI / 4 / q));
  const modes = (k, f0) => {
    const r = Math.sqrt(k * k + 4);
    return [(f0 * (r - k)) / 2, (f0 * (r + k)) / 2];
  };

  RF.register({
    id: "coupled",
    tab: "Coupled resonators",
    sub: "k · Qₑ · 2-pole filter",
    build(root) {
      const ui = RF.scaffold(root, {
        who: "Senior question · coupled-resonator filters",
        title: "Two resonators, two modes, one filter",
        lede: "Two identical quarter-wave resonators side by side split into two modes. The gap sets the coupling k, and k sets the bandwidth. The tap sets how hard the ports pull on the end resonators (external Q). A flat two-pole response needs k·Qₑ = 1.",
      });
      const st = { f0: 20, gap: 50, tap: 0.114, Qu: 300 };

      /* ----- drawing ----- */
      const svg = s("svg", { viewBox: "0 0 560 262", role: "img", "aria-label": "Two quarter-wave resonators with vias at the shorted end, tapped feed lines, and the coupling gap" });
      ui.draw.append(svg, el("div", { class: "hint", text: "Drag the right resonator sideways to change the gap. Drag either tap point up or down. Near the via it couples weakly; toward the open end it couples hard." }));
      const CXM = 280, YO = 46, YS = 206, RW = 22;
      const gpx = () => 4 + st.gap * 0.55;
      const tapY = () => YS - st.tap * (YS - YO);

      function drawBench() {
        const k = [];
        const T = (x, y, t, sty = {}, at = {}) => s("text", Object.assign({ x, y, "font-size": 12, text: t }, at), Object.assign({ fill: "var(--ink-2)" }, sty));
        k.push(s("rect", { x: 8, y: 20, width: 544, height: 214, rx: 6 }, { fill: "var(--substrate)", stroke: "var(--substrate-edge)", strokeWidth: 1 }));
        const defs = s("defs");
        const grad = s("linearGradient", { id: "eField", x1: "0", x2: "0", y1: "0", y2: "1" });
        [[0, 0.6], [1, 0]].forEach(([o, a]) => grad.append(s("stop", { offset: o, "stop-opacity": a }, { stopColor: "var(--s1)" })));
        defs.append(grad);
        k.push(defs);
        const g = gpx();
        const x1 = CXM - g / 2 - RW, x2 = CXM + g / 2;
        for (const x of [x1, x2]) {
          k.push(s("rect", { x, y: YO, width: RW, height: YS - YO }, { fill: "var(--gold)" }));
          k.push(s("rect", { x: x - 4, y: YO - 4, width: RW + 8, height: (YS - YO) * 0.55, rx: 3, fill: "url(#eField)" }));
          k.push(s("circle", { cx: x + RW / 2, cy: YS - 8, r: 7 }, { fill: "var(--via)", stroke: "var(--surface)", strokeWidth: 1.5 }));
        }
        const ty = tapY();
        k.push(s("rect", { x: 20, y: ty - 5, width: x1 - 20, height: 10 }, { fill: "var(--gold)" }));
        k.push(s("rect", { x: x2 + RW, y: ty - 5, width: 540 - x2 - RW, height: 10 }, { fill: "var(--gold)" }));
        for (const x of [x1, x2 + RW]) k.push(s("circle", { cx: x, cy: ty, r: 9 }, { fill: "var(--surface)", opacity: 0.9, stroke: "var(--gold-ink)", strokeWidth: 1.5 }));
        k.push(T(22, ty - 12, "Port 1", { fill: "var(--ink)", fontWeight: 600 }));
        k.push(T(538, ty - 12, "Port 2", { fill: "var(--ink)", fontWeight: 600 }, { "text-anchor": "end" }));
        // gap dimension
        k.push(s("path", { d: `M${x1 + RW} ${YO - 12}V${YO - 4}M${x2} ${YO - 12}V${YO - 4}M${x1 + RW} ${YO - 8}H${x2}` }, { fill: "none", stroke: "var(--ink)", strokeWidth: 1 }));
        k.push(T(CXM, YO - 16, `G1 = ${fmt(st.gap, 3)} µm`, { fill: "var(--ink)", fontWeight: 600, fontSize: "11.5px" }, { "text-anchor": "middle" }));
        k.push(s("circle", { cx: x2 + RW / 2, cy: (YO + YS) / 2, r: 10 }, { fill: "var(--surface)", opacity: 0.85, stroke: "var(--gold-ink)", strokeWidth: 1.5 }));
        // annotations
        k.push(T(x2 + RW + 12, YO + 10, "open end: E max", { fontSize: "11px" }));
        k.push(T(x2 + RW + 12, YO + 24, "(electric coupling)", { fontSize: "10.5px", fill: "var(--muted)" }));
        k.push(T(x2 + RW + 12, YS - 4, "via: H max", { fontSize: "11px" }));
        k.push(T(x2 + RW + 12, YS + 10, "(magnetic coupling)", { fontSize: "10.5px", fill: "var(--muted)" }));
        k.push(T(x1 - 10, (ty + YS) / 2 + 4, `tap ${fmt(st.tap * 100, 2)} % up`, { fontSize: "11px", fill: "var(--ink)" }, { "text-anchor": "end" }));
        k.push(T(CXM, 252, "each resonator is λ/4 at f₀, shorted by the via at the bottom", { fontSize: "11px", fill: "var(--muted)" }, { "text-anchor": "middle" }));
        svg.replaceChildren(...k);
      }
      RF.dragSvg(svg, (p) => {
        const g = gpx();
        const x1 = CXM - g / 2 - RW, x2 = CXM + g / 2, ty = tapY();
        if (Math.hypot(p.x - x1, p.y - ty) < 20 || Math.hypot(p.x - (x2 + RW), p.y - ty) < 20) {
          return (q) => tapSl.set(RF.clamp((YS - q.y) / (YS - YO), 0.03, 0.6));
        }
        if (p.x >= x2 - 6 && p.x <= x2 + RW + 6 && p.y > YO && p.y < YS) {
          const off = p.x - x2;
          return (q) => { const gp = 2 * (q.x - off - CXM); gapSl.set(RF.clamp((gp - 4) / 0.55, 10, 150)); };
        }
        return null;
      });

      /* ----- controls ----- */
      const gapSl = RF.slider(ui.ctl, { id: "cr-gap", label: "Gap G1", min: 10, max: 150, step: 0.5, value: st.gap, fmt: (v) => fmt(v, 3) + " µm", onInput: (v) => { st.gap = v; update(); } });
      const tapSl = RF.slider(ui.ctl, { id: "cr-tap", label: "Tap height", min: 0.03, max: 0.6, step: 0.001, value: st.tap, fmt: (v) => fmt(v * 100, 3) + " % of L", onInput: (v) => { st.tap = v; update(); } });
      const f0Sl = RF.slider(ui.ctl, { id: "cr-f0", label: "Resonator f₀", min: 5, max: 40, step: 0.1, value: st.f0, fmt: (v) => fmt(v, 3) + " GHz", onInput: (v) => { st.f0 = v; update(); } });
      const quSl = RF.slider(ui.ctl, { id: "cr-qu", label: "Unloaded Qᵤ", min: 30, max: 2000, log: true, value: st.Qu, fmt: (v) => fmt(v, 3), onInput: (v) => { st.Qu = v; update(); } });
      const set = (o) => {
        Object.assign(st, o);
        gapSl.set(st.gap, true); tapSl.set(st.tap, true); f0Sl.set(st.f0, true); quSl.set(st.Qu, true);
        update();
      };
      RF.presets(ui.ctl, "Try", [
        { label: "Flat (k·Qₑ = 1)", go: () => set({ tap: tapFromQe(1 / kFromGap(st.gap)) }) },
        { label: "Over-coupled", go: () => set({ tap: tapFromQe(2.2 / kFromGap(st.gap)) }) },
        { label: "Under-coupled", go: () => set({ tap: tapFromQe(0.45 / kFromGap(st.gap)) }) },
        { label: "Modes at 19.6 / 20.4", go: () => set({ f0: 20, gap: gapFromK(0.04) }) },
      ]);
      const status = el("div", { class: "presets" });
      ui.ctl.append(status);
      const ro = RF.readouts(ui.ctl, [
        { key: "k", label: "Coupling k" }, { key: "modes", label: "Mode frequencies" }, { key: "qe", label: "External Qₑ" },
        { key: "x", label: "k · Qₑ" }, { key: "fbw", label: "Flat-case bandwidth" }, { key: "pk", label: "S21 at f₀" },
      ]);

      /* ----- plots ----- */
      const pS = RF.plot(ui.plots, { x: { min: 1, max: 2 }, y: { min: -40, max: 0 }, series: [{ pts: [[1, 0], [2, 0]], color: "var(--s1)" }] });
      const pK = RF.plot(ui.plots, { x: { min: 10, max: 150 }, y: { min: 0.001, max: 0.3, log: true }, series: [{ pts: [[10, 0.1], [150, 0.01]], color: "var(--s1)" }] });

      function update() {
        drawBench();
        const f0 = st.f0;
        const kk = kFromGap(st.gap);
        const Qe = qeFromTap(st.tap);
        const x = kk * Qe;
        const [f1, f2] = modes(kk, f0);
        const kMeas = (f2 * f2 - f1 * f1) / (f2 * f2 + f1 * f1);
        const w = RF.clamp(Math.max(3.5 * kk, 4 / Qe, 0.015), 0.015, 0.45);
        const fs = RF.linspace(f0 * (1 - w), f0 * (1 + w), 700);
        const p21 = [], p11 = [];
        let pk0 = 0;
        for (const f of fs) {
          const om = f / f0 - f0 / f;
          const a = cx.C(1 / Qe + 1 / st.Qu, om);
          const det = cx.add(cx.mul(a, a), cx.C(kk * kk));
          const i21 = cx.div(cx.C(0, kk), det);
          const i11 = cx.div(a, det);
          const s21 = cx.scale(i21, 2 / Qe);
          const s11 = cx.sub(cx.C(1), cx.scale(i11, 2 / Qe));
          p21.push([f, RF.db20(Math.max(1e-6, cx.abs(s21)))]);
          p11.push([f, RF.db20(Math.max(1e-6, cx.abs(s11)))]);
        }
        {
          const a = cx.C(1 / Qe + 1 / st.Qu, 0);
          const det = cx.add(cx.mul(a, a), cx.C(kk * kk));
          pk0 = cx.abs(cx.scale(cx.div(cx.C(0, kk), det), 2 / Qe));
        }
        const regime = x < 0.85 ? ["warn", "Under-coupled: one rounded peak, can't reach 0 dB"] : x > 1.18 ? ["warn", "Over-coupled: two humps, ripple in the middle"] : ["good", "Near critical: flat, Butterworth-like top"];
        status.replaceChildren(el("span", { class: "pill " + regime[0], text: regime[1] }));
        ro.update({
          k: [fmt(kk, 3), `≈ ${fmt(kk * 100, 2)} %`], modes: [`${fmt(f1, 4)} / ${fmt(f2, 4)}`, "GHz"], qe: fmt(Qe, 3),
          x: fmt(x, 3), fbw: [fmt(Math.SQRT2 * kk * 100, 3), "%"], pk: [fmt(RF.db20(pk0), 3), "dB"],
        });
        pS.update({
          title: "Two-pole filter response",
          subtitle: `Grey lines mark the two eigenmodes (what an eigenmode solve reports). With the ports attached you see the filter.`,
          height: 300,
          x: { min: fs[0], max: fs[fs.length - 1], label: "Frequency (GHz)", fmt: (v) => fmt(v, 4) },
          y: { min: -40, max: 0, label: "dB" },
          series: [{ name: "S21", pts: p21, color: "var(--s1)" }, { name: "S11", pts: p11, color: "var(--s2)" }],
          vlines: [{ x: f1, label: `f₁ ${fmt(f1, 4)}`, anchor: "end", dy: 40 }, { x: f2, label: `f₂ ${fmt(f2, 4)}`, dy: 40 }],
          tipX: (v) => fmt(v, 5) + " GHz", tipY: (v) => fmt(v, 3) + " dB",
        });
        const gs = RF.linspace(10, 150, 200);
        const kNeed = 1 / Qe;
        pK.update({
          title: "Coupling k vs gap",
          subtitle: "Illustrative edge-coupled fit: k falls roughly exponentially with the gap. The line is the k your tap needs for a flat response.",
          height: 250,
          x: { min: 10, max: 150, label: "Gap G1 (µm)", fmt: (v) => fmt(v, 3) },
          y: { min: 0.001, max: 0.3, log: true, label: "k", fmt: (v) => fmt(v, 2) },
          series: [{ name: "k", pts: gs.map((g) => [g, kFromGap(g)]), color: "var(--s1)" }],
          hlines: [{ y: RF.clamp(kNeed, 0.0011, 0.29), label: `k for flat = 1/Qₑ = ${fmt(kNeed, 3)}` }],
          markers: [{ x: st.gap, y: kk, color: "var(--s1)", label: `k = ${fmt(kk, 3)}` }],
          tipX: (v) => fmt(v, 3) + " µm", tipY: (v) => fmt(v, 3),
        });
        RF.setEqs(ui.eqs, [
          { name: "Coupling from the two mode frequencies", f: `k = (f₂² − f₁²) / (f₂² + f₁²) = (${fmt(f2, 4)}² − ${fmt(f1, 4)}²) / (${fmt(f2, 4)}² + ${fmt(f1, 4)}²) = ${b(fmt(kMeas, 3))}` },
          { name: "Mental shortcut", f: `k ≈ Δf / f₀ = ${fmt(f2 - f1, 3)} / ${fmt(f0, 3)} = ${b(fmt((f2 - f1) / f0, 3))}` },
          { name: "Two-pole Butterworth (g₁ = g₂ = 1.414): k sets bandwidth, Qₑ sets the ends", f: `FBW = k·√(g₁g₂) = 1.414 × ${fmt(kk, 3)} = ${b(fmt(Math.SQRT2 * kk * 100, 3) + " %")}     Qₑ = g₀g₁ / FBW = ${b(fmt(1 / kk, 3))}` },
          { name: "Tapped quarter-wave: tap near the via couples weakly (high Qₑ)", f: `Qₑ ≈ (π/4) / sin²(π·t / 2L) = (π/4) / sin²(${fmt(90 * st.tap, 3)}°) = ${b(fmt(Qe, 3))}` },
          { name: "Peak transmission at f₀ for a lossless pair", f: `|S21(f₀)| = 2x / (1 + x²),  x = k·Qₑ = ${fmt(x, 3)}  → ${b(fmt(RF.db20((2 * x) / (1 + x * x)), 3) + " dB")}` },
        ]);
      }

      RF.setSay(ui.say, {
        quote: "The split modes are the even and odd modes of the pair. k is about Δf over f₀, so 4 % here. Widening the gap drops k and narrows the filter. In a coupled-resonator design, k sets the bandwidth, and the tap sets the external Q of the end resonators.",
        bullets: [
          "Two pendulums on a spring: swinging together is one frequency, swinging against each other is another.",
          "Quarter-wave coupling is part electric (open end) and part magnetic (via end). They have opposite signs and partly cancel, so moving the via can change k a lot.",
          "Tap toward the via: weak coupling, high Qₑ, narrow. Tap toward the open end: strong coupling, low Qₑ, wide.",
          "k·Qₑ < 1 under-coupled, = 1 flat, > 1 double hump.",
        ],
      });

      RF.predict(ui.predict, [
        { q: "Eigenmode gives two modes at 19.6 and 20.4 GHz. What's k?", unit: "", answer: () => (20.4 ** 2 - 19.6 ** 2) / (20.4 ** 2 + 19.6 ** 2), absTol: 0.003, apply: () => set({ f0: 20, gap: gapFromK(0.04) }), explain: "(20.4² − 19.6²)/(20.4² + 19.6²) = 32/800 = 0.04. Or Δf/f₀ = 0.8/20." },
        { q: "k = 0.04 in a two-pole Butterworth. Fractional bandwidth?", unit: "%", answer: () => 5.66, tol: 0.06, apply: () => set({ f0: 20, gap: gapFromK(0.04), tap: tapFromQe(25) }), explain: "FBW = k·√(g₁g₂) = 0.04 × 1.414 = 5.7 %, about 1.1 GHz at 20 GHz." },
        { q: "Same k = 0.04. What external Q makes the response flat?", unit: "", answer: () => 25, tol: 0.06, apply: () => set({ f0: 20, gap: gapFromK(0.04), tap: tapFromQe(25) }), explain: "Flat two-pole needs k·Qₑ = 1, so Qₑ = 25. The tap is now set for it." },
        { q: "k·Qₑ = 2 (over-coupled), no loss. What's |S21| at f₀ in dB?", unit: "dB", answer: () => RF.db20(0.8), absTol: 0.3, apply: () => set({ f0: 20, gap: gapFromK(0.04), tap: tapFromQe(50), Qu: 2000 }), explain: "2x/(1 + x²) = 4/5 = 0.8, which is −1.9 dB. That's the dip between the two humps." },
      ], "coupled");

      update();
      return {};
    },
  });
})();
