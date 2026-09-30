/* Module: resonator. L, C, reactance, f0, Q, loaded vs unloaded Q, ring-down. */
(function () {
  "use strict";
  const { cx, el, s, fmt, b } = RF;
  const TWO_PI = 2 * Math.PI;
  const qextFromGap = (g) => 3 * Math.exp(g / 8);
  const gapFromQext = (q) => 8 * Math.log(q / 3);

  RF.register({
    id: "resonator",
    tab: "Resonator & Q",
    sub: "f₀ · loaded vs unloaded",
    build(root) {
      const ui = RF.scaffold(root, {
        who: "Senior question · filters and resonators",
        title: "A resonator, its Q, and what the ports do to it",
        lede: "A half-wave line resonator sits between two feed lines. L and C set the frequency. Metal and dielectric loss set the unloaded Q. The coupling gaps set how much energy leaks out to the ports (external Q). What you measure is the loaded Q.",
      });
      const st = { L: 0.25, C: 0.253, Qu: 200, gap: 30 };

      /* ----- drawing ----- */
      const svg = s("svg", { viewBox: "0 0 560 236", role: "img", "aria-label": "Gap-coupled half-wave resonator with its equivalent circuit" });
      ui.draw.append(svg, el("div", { class: "hint", text: "Drag either feed-line end to change the coupling gap. A bigger gap means weaker coupling and a higher external Q." }));
      const RX0 = 190, RX1 = 370, TY = 44, TH = 14;
      const gpx = () => 3 + st.gap * 0.8;

      function drawBench(d) {
        const k = [];
        const T = (x, y, t, st2 = {}, at = {}) => s("text", Object.assign({ x, y, "font-size": 12, text: t }, at), Object.assign({ fill: "var(--ink-2)" }, st2));
        k.push(s("rect", { x: 8, y: 14, width: 544, height: 74, rx: 6 }, { fill: "var(--substrate)", stroke: "var(--substrate-edge)", strokeWidth: 1 }));
        k.push(T(16, 30, "GaAs substrate, top view", { fontSize: "10.5px", fill: "var(--muted)" }));
        const g = gpx();
        // voltage standing wave on the half-wave resonator: max at the ends, zero in the middle
        const grad = s("linearGradient", { id: "resV", x1: "0", x2: "1", y1: "0", y2: "0" });
        [[0, 0.55], [0.5, 0], [1, 0.55]].forEach(([o, a]) => grad.append(s("stop", { offset: o, "stop-opacity": a }, { stopColor: "var(--s1)" })));
        const defs = s("defs");
        defs.append(grad);
        k.push(defs);
        k.push(s("rect", { x: 8, y: TY, width: RX0 - g - 8, height: TH }, { fill: "var(--gold)" }));
        k.push(s("rect", { x: RX1 + g, y: TY, width: 552 - RX1 - g, height: TH }, { fill: "var(--gold)" }));
        k.push(s("rect", { x: RX0, y: TY, width: RX1 - RX0, height: TH }, { fill: "var(--gold)" }));
        k.push(s("rect", { x: RX0, y: TY - 7, width: RX1 - RX0, height: TH + 14, rx: 3, fill: "url(#resV)" }));
        k.push(T((RX0 + RX1) / 2, TY + TH + 22, "resonator, λ/2 at f₀ (shading = voltage)", { fontSize: "10.5px" }, { "text-anchor": "middle" }));
        k.push(T(20, TY - 8, "Port 1", { fontWeight: 600, fill: "var(--ink)" }));
        k.push(T(540, TY - 8, "Port 2", { fontWeight: 600, fill: "var(--ink)" }, { "text-anchor": "end" }));
        // gap dimension
        for (const [x0, x1] of [[RX0 - g, RX0], [RX1, RX1 + g]]) {
          k.push(s("path", { d: `M${x0} ${TY + TH + 4}V${TY + TH + 10}M${x1} ${TY + TH + 4}V${TY + TH + 10}M${x0} ${TY + TH + 7}H${x1}` }, { stroke: "var(--ink-2)", strokeWidth: 1, fill: "none" }));
        }
        k.push(T(RX0 - g / 2, TY - 8, `${fmt(st.gap, 2)} µm`, { fontSize: "11px", fill: "var(--ink)" }, { "text-anchor": "middle" }));
        for (const x of [RX0 - g, RX1 + g]) k.push(s("circle", { cx: x, cy: TY + TH / 2, r: 9 }, { fill: "var(--gold)", opacity: 0.2, stroke: "var(--gold-ink)", strokeWidth: 1.5 }));

        // equivalent circuit
        const y0 = 118, gy = 222;
        k.push(T(16, y0 - 4, "Equivalent circuit", { fontSize: "10.5px", fill: "var(--muted)" }));
        const W = (dd) => s("path", { d: dd }, { fill: "none", stroke: "var(--ink)", strokeWidth: 1.5, strokeLinejoin: "round" });
        k.push(W(`M40 ${y0 + 20}H120M140 ${y0 + 20}H420M440 ${y0 + 20}H520`));
        k.push(W(`M120 ${y0 + 8}V${y0 + 32}M128 ${y0 + 8}V${y0 + 32}M432 ${y0 + 8}V${y0 + 32}M440 ${y0 + 8}V${y0 + 32}`));
        k.push(W(`M128 ${y0 + 20}H140M420 ${y0 + 20}H432`));
        k.push(W(`M40 ${gy}H520`));
        // tank: L, C, R in parallel
        const cols = [220, 280, 340];
        k.push(W(`M${cols[0]} ${y0 + 20}V${y0 + 44}M${cols[0]} ${gy - 24}V${gy}`));
        let coil = `M${cols[0]} ${y0 + 44}`;
        for (let i = 0; i < 4; i++) coil += `a6 5 0 1 1 0 ${(gy - 24 - (y0 + 44)) / 4}`;
        k.push(W(coil));
        k.push(W(`M${cols[1]} ${y0 + 20}V${(y0 + gy) / 2 + 6 - 16}M${cols[1] - 12} ${(y0 + gy) / 2 - 10}H${cols[1] + 12}M${cols[1] - 12} ${(y0 + gy) / 2 - 2}H${cols[1] + 12}M${cols[1]} ${(y0 + gy) / 2 - 2}V${gy}`));
        let zz = `M${cols[2]} ${y0 + 20}V${y0 + 40}`;
        for (let i = 0; i < 7; i++) zz += `L${cols[2] + (i % 2 ? -8 : 8)} ${y0 + 44 + i * 7}`;
        zz += `L${cols[2]} ${y0 + 92}V${gy}`;
        k.push(W(zz));
        k.push(T(cols[0] + 12, (y0 + gy) / 2 + 4, `L ${RF.si(st.L * 1e-9, "H")}`, { fill: "var(--ink)" }));
        k.push(T(cols[1] + 16, (y0 + gy) / 2 - 2, `C ${RF.si(st.C * 1e-12, "F")}`, { fill: "var(--ink)" }));
        k.push(T(cols[2] + 14, (y0 + gy) / 2 + 12, `R ${RF.si(d.R, "Ω")}`, { fill: "var(--ink)" }));
        k.push(T(cols[2] + 14, (y0 + gy) / 2 + 26, "(sets Qᵤ)", { fontSize: "10.5px", fill: "var(--muted)" }));
        k.push(T(124, y0 + 50, "C_c", { fontSize: "11px" }, { "text-anchor": "middle" }));
        k.push(T(436, y0 + 50, "C_c", { fontSize: "11px" }, { "text-anchor": "middle" }));
        k.push(T(124, y0 + 64, "gap → Qₑ", { fontSize: "10.5px", fill: "var(--muted)" }, { "text-anchor": "middle" }));
        k.push(T(46, y0 + 12, "Port 1", { fontSize: "11px" }));
        k.push(T(514, y0 + 12, "Port 2", { fontSize: "11px" }, { "text-anchor": "end" }));
        svg.replaceChildren(...k);
      }
      RF.dragSvg(svg, (p) => {
        const g = gpx();
        const left = Math.hypot(p.x - (RX0 - g), p.y - (TY + TH / 2)) < 22;
        const right = Math.hypot(p.x - (RX1 + g), p.y - (TY + TH / 2)) < 22;
        if (!left && !right) return null;
        return (q) => {
          const px = left ? RX0 - q.x : q.x - RX1;
          gapSl.set(RF.clamp((px - 3) / 0.8, 2, 60));
        };
      });

      /* ----- controls ----- */
      const lSl = RF.slider(ui.ctl, { id: "rs-l", label: "Inductance L", min: 0.05, max: 10, log: true, value: st.L, fmt: (v) => fmt(v, 3) + " nH", onInput: (v) => { st.L = v; update(); } });
      const cSl = RF.slider(ui.ctl, { id: "rs-c", label: "Capacitance C", min: 0.02, max: 10, log: true, value: st.C, fmt: (v) => fmt(v, 3) + " pF", onInput: (v) => { st.C = v; update(); } });
      const quSl = RF.slider(ui.ctl, { id: "rs-qu", label: "Unloaded Qᵤ", min: 5, max: 2000, log: true, value: st.Qu, fmt: (v) => fmt(v, 3), onInput: (v) => { st.Qu = v; update(); } });
      const gapSl = RF.slider(ui.ctl, { id: "rs-gap", label: "Coupling gap", min: 2, max: 60, step: 0.1, value: st.gap, fmt: (v) => fmt(v, 3) + " µm", onInput: (v) => { st.gap = v; update(); } });
      const set = (o) => {
        Object.assign(st, o);
        lSl.set(st.L, true); cSl.set(st.C, true); quSl.set(st.Qu, true); gapSl.set(st.gap, true);
        update();
      };
      RF.presets(ui.ctl, "Try", [
        { label: "1 nH + 1 pF", go: () => set({ L: 1, C: 1 }) },
        { label: "20 GHz", go: () => set({ L: 0.25, C: 0.253 }) },
        { label: "Weak coupling", go: () => set({ gap: 55 }) },
        { label: "Strong coupling", go: () => set({ gap: 8 }) },
        { label: "Lossy metal", go: () => set({ Qu: 30 }) },
      ]);
      const ro = RF.readouts(ui.ctl, [
        { key: "f0", label: "f₀" }, { key: "x0", label: "X_L = X_C at f₀" }, { key: "qe", label: "External Qₑ" },
        { key: "ql", label: "Loaded Q_L" }, { key: "bw", label: "3 dB bandwidth" }, { key: "s21", label: "S21 at f₀" },
      ]);

      /* ----- plots ----- */
      const pS = RF.plot(ui.plots, { x: { min: 1, max: 2 }, y: { min: -40, max: 0 }, series: [{ pts: [[1, 0], [2, 0]], color: "var(--s1)" }] });
      const pair = el("div", { class: "plots two" });
      ui.plots.append(pair);
      const pX = RF.plot(pair, { height: 300, x: { min: 0.1, max: 100, log: true }, y: { min: 0.1, max: 1e4, log: true }, series: [{ pts: [[1, 1], [2, 2]], color: "var(--s1)" }] });
      const pR = RF.plot(pair, { height: 300, x: { min: 0, max: 10 }, y: { min: -1, max: 1 }, series: [{ pts: [[0, 0], [1, 0]], color: "var(--s1)" }] });

      function update() {
        const L = st.L * 1e-9, Cf = st.C * 1e-12;
        const f0 = 1 / (TWO_PI * Math.sqrt(L * Cf));
        const x0 = Math.sqrt(L / Cf);
        const Qe = qextFromGap(st.gap);
        const QL = 1 / (1 / st.Qu + 1 / Qe);
        const s21pk = st.Qu / (st.Qu + Qe);
        const bw = f0 / QL;
        const R = st.Qu * x0;
        drawBench({ R });
        ro.update({
          f0: [fmt(f0 / 1e9, 4), "GHz"], x0: [fmt(x0, 3), "Ω"], qe: fmt(Qe, 3), ql: fmt(QL, 3),
          bw: [bw >= 1e9 ? fmt(bw / 1e9, 3) : fmt(bw / 1e6, 3), bw >= 1e9 ? "GHz" : "MHz"], s21: [fmt(RF.db20(s21pk), 3), "dB"],
        });

        // S-parameters around f0
        const w = RF.clamp(5 / QL, 0.01, 0.6);
        const fa = f0 * (1 - w), fb = f0 * (1 + w);
        const pts21 = [], pts11 = [];
        for (const f of RF.linspace(fa, fb, 600)) {
          const om = f / f0 - f0 / f;
          const A = cx.C(1 / Qe + 1 / st.Qu, om);
          const s21 = cx.div(cx.C(1 / Qe), A);
          const s11 = cx.sub(cx.C(1), s21);
          pts21.push([f / 1e9, RF.db20(Math.max(cx.abs(s21), 1e-6))]);
          pts11.push([f / 1e9, RF.db20(Math.max(cx.abs(s11), 1e-6))]);
        }
        const pk = RF.db20(s21pk);
        pS.update({
          title: "S-parameters through the resonator",
          subtitle: `Loaded Q = f₀ / BW = ${fmt(f0 / 1e9, 4)} GHz / ${fmt(bw / 1e6, 3)} MHz = ${fmt(QL, 3)}`,
          height: 290,
          x: { min: fa / 1e9, max: fb / 1e9, label: "Frequency (GHz)", fmt: (v) => fmt(v, 4) },
          y: { min: -40, max: 0, label: "dB" },
          series: [{ name: "S21", pts: pts21, color: "var(--s1)" }, { name: "S11", pts: pts11, color: "var(--s2)" }],
          hlines: [{ y: pk - 3, label: "peak − 3 dB" }],
          vlines: [{ x: (f0 - bw / 2) / 1e9, label: "", color: "var(--gold)" }, { x: (f0 + bw / 2) / 1e9, label: `BW ${fmt(bw / 1e6, 3)} MHz`, color: "var(--gold)" }],
          markers: [{ x: f0 / 1e9, y: pk, color: "var(--s1)", label: `${fmt(pk, 3)} dB` }],
          tipX: (v) => fmt(v, 5) + " GHz", tipY: (v) => fmt(v, 3) + " dB",
        });

        // reactance chart
        const fs = RF.logspace(0.1e9, 100e9, 200);
        pX.update({
          title: "Reactance vs frequency",
          subtitle: "L rises with f, C falls. They cross at f₀.",
          height: 300,
          x: { min: 0.1, max: 100, log: true, label: "GHz", fmt: (v) => fmt(v, 2) },
          y: { min: 0.1, max: 1e4, log: true, label: "|X| (Ω)", fmt: (v) => (v >= 1000 ? fmt(v / 1000, 2) + "k" : fmt(v, 2)) },
          series: [
            { name: "X_L = 2πfL", pts: fs.map((f) => [f / 1e9, TWO_PI * f * L]), color: "var(--s1)" },
            { name: "X_C = 1/(2πfC)", pts: fs.map((f) => [f / 1e9, 1 / (TWO_PI * f * Cf)]), color: "var(--s3)" },
          ],
          markers: [{ x: f0 / 1e9, y: x0, color: "var(--ink)", label: `${fmt(f0 / 1e9, 3)} GHz, ${fmt(x0, 3)} Ω` }],
          tipX: (v) => fmt(v, 3) + " GHz", tipY: (v) => fmt(v, 3) + " Ω",
        });

        // ring-down in cycles
        const nMax = Math.max(6, (2.2 * st.Qu) / Math.PI);
        const npts = Math.min(2400, Math.ceil(nMax * 16));
        const ns = RF.linspace(0, nMax, npts);
        const carrierOk = nMax <= 160;
        const series = [];
        if (carrierOk) series.push({ pts: ns.map((n) => [n, Math.exp((-Math.PI * n) / QL) * Math.cos(TWO_PI * n)]), color: "var(--ink-2)", width: 1, opacity: 0.35, noLegend: true, noTip: true });
        series.push({ name: "Loaded (what you see)", pts: ns.map((n) => [n, Math.exp((-Math.PI * n) / QL)]), color: "var(--s1)" });
        series.push({ name: "Unloaded (no ports)", pts: ns.map((n) => [n, Math.exp((-Math.PI * n) / st.Qu)]), color: "var(--s2)" });
        pR.update({
          title: "Ring-down after a pulse",
          subtitle: `Amplitude falls to 1/e after Q/π cycles: ${fmt(QL / Math.PI, 3)} cycles loaded, ${fmt(st.Qu / Math.PI, 3)} unloaded`,
          height: 300,
          x: { min: 0, max: nMax, label: "Cycles of f₀", fmt: (v) => fmt(v, 3) },
          y: { min: carrierOk ? -1 : 0, max: 1, label: "Amplitude" },
          series,
          hlines: [{ y: 1 / Math.E, label: "1/e" }],
          markers: [{ x: QL / Math.PI, y: 1 / Math.E, color: "var(--s1)" }, { x: st.Qu / Math.PI, y: 1 / Math.E, color: "var(--s2)" }],
          tipX: (v) => fmt(v, 3) + " cycles", tipY: (v) => fmt(v, 3),
        });

        const quBack = QL / (1 - s21pk);
        RF.setEqs(ui.eqs, [
          { name: "Resonant frequency (shortcut: 5.03 / √(L[nH]·C[pF]) GHz)", f: `f₀ = 1 / (2π√(LC)) = 5.03 / √(${fmt(st.L, 3)} × ${fmt(st.C, 3)}) = ${b(fmt(f0 / 1e9, 4) + " GHz")}` },
          { name: "At resonance the two reactances are equal", f: `X_L = 2πf₀L = X_C = 1/(2πf₀C) = √(L/C) = ${b(fmt(x0, 3) + " Ω")}` },
          { name: "Loaded Q from the measured bandwidth", f: `Q_L = f₀ / BW₃dB = ${fmt(f0 / 1e9, 4)} GHz / ${fmt(bw / 1e6, 3)} MHz = ${b(fmt(QL, 3))}` },
          { name: "Losses add like parallel resistors", f: `1/Q_L = 1/Qᵤ + 1/Qₑ = 1/${fmt(st.Qu, 3)} + 1/${fmt(Qe, 3)} → Q_L = ${b(fmt(QL, 3))}` },
          { name: "Peak transmission tells you how lossy the resonator is", f: `|S21(f₀)| = Qᵤ / (Qᵤ + Qₑ) = ${fmt(s21pk, 3)} = ${b(fmt(RF.db20(s21pk), 3) + " dB")}` },
          { name: "Back out the unloaded Q from a measurement", f: `Qᵤ = Q_L / (1 − |S21|) = ${fmt(QL, 3)} / (1 − ${fmt(s21pk, 3)}) = ${b(fmt(quBack, 3))}` },
        ]);
      }

      RF.setSay(ui.say, {
        quote: "Unloaded Q is the resonator's own losses: metal, dielectric and radiation. Loaded Q adds the energy leaving through the ports, and the two add like parallel resistors. Eigenmode has no ports, so it gives unloaded Q, as long as I've set real conductivity and loss tangent.",
        bullets: [
          "Q = 2π × energy stored / energy lost per cycle. High Q rings for a long time.",
          "Q = f₀ / BW₃dB. 20 GHz with 100 MHz of bandwidth is Q = 200.",
          "Weak coupling (S21 at resonance below about −30 dB) means Q_L ≈ Qᵤ.",
          "Anchors at 10 GHz: 1 pF is 16 Ω, 1 nH is 63 Ω. 1 nH with 1 pF resonates at 5.03 GHz.",
        ],
      });

      RF.predict(ui.predict, [
        { q: "1 nH in parallel with 1 pF. What's the resonant frequency?", unit: "GHz", answer: () => 5.033, tol: 0.06, apply: () => set({ L: 1, C: 1 }), explain: "1/(2π√(1e-9 × 1e-12)) = 5.03 GHz. Memorize it: every other L and C scales from there by 1/√(LC)." },
        { q: "A resonator at 20 GHz has a 3 dB bandwidth of 100 MHz. What's its Q?", unit: "", answer: () => 200, tol: 0.05, apply: () => set({ L: 0.25, C: 0.2533, Qu: 1000, gap: gapFromQext(250) }), explain: "Q = f₀/BW = 20 GHz / 0.1 GHz = 200. The bench is now set to that loaded Q." },
        { q: "What's the reactance of 1 pF at 10 GHz?", unit: "Ω", answer: () => 15.92, tol: 0.08, apply: () => set({ C: 1 }), explain: "1/(2π × 10e9 × 1e-12) = 15.9 Ω. Find 1 pF's line on the reactance chart at 10 GHz." },
        { q: "You measure Q_L = 100 and |S21| at resonance is −6 dB. What's the unloaded Q?", unit: "", answer: () => 200, tol: 0.08, apply: () => set({ Qu: 200, gap: gapFromQext(200) }), explain: "−6 dB is 0.5 linear, so Qᵤ = 100 / (1 − 0.5) = 200." },
        { q: "You cut C in half. By what factor does f₀ change?", unit: "×", answer: () => Math.SQRT2, tol: 0.05, apply: () => set({ C: st.C / 2 }), explain: "f₀ ∝ 1/√C, so halving C raises f₀ by √2 = 1.41×." },
      ], "resonator");

      update();
      return {};
    },
  });
})();
