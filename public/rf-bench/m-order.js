/* Module: bandpass filter order. Poles vs rejection vs loss at a given unloaded Q. */
(function () {
  "use strict";
  const { cx, el, s, fmt, b } = RF;

  RF.register({
    id: "order",
    tab: "Filter order",
    sub: "poles · loss · rejection",
    build(root) {
      const ui = RF.scaffold(root, {
        who: "Senior question · why 7 poles?",
        title: "How many poles: rejection buys, loss pays",
        lede: "The passband width doesn't set the order. The rejection spec does. Every extra pole steepens the skirt and adds loss, and the loss grows as the bandwidth shrinks or the resonator Q drops. The table finds the fewest poles that meet your spec.",
        benchTitle: "Coupled-resonator chain from the prototype",
      });
      const st = { kind: "cheb", N: 7, rl: 22, lo: 9.5, hi: 10.5, Qu: 280, fs1: 9.0, fs2: 11.1, A: 30, maxIL: 3 };

      function proto(N) {
        if (st.kind === "butt") return { g: RF.buttG(N), load: 1 };
        return RF.chebG(N, RF.rippleFromRL(st.rl));
      }
      function geom() {
        const f0 = Math.sqrt(st.lo * st.hi);
        return { f0, fbw: (st.hi - st.lo) / f0 };
      }
      /* S21 of the bandpass via the lowpass prototype with uniform dissipation d = 1/(FBW·Qu) */
      function s21(N, f, lossy = true) {
        const { f0, fbw } = geom();
        const { g, load } = proto(N);
        const W = (f / f0 - f0 / f) / fbw;
        const d = lossy ? 1 / (fbw * st.Qu) : 0;
        let M = RF.abcd.I();
        g.forEach((gk, i) => {
          const v = cx.C(gk * d, gk * W);
          M = RF.abcd.mul(M, i % 2 === 0 ? RF.abcd.series(v) : RF.abcd.shunt(v));
        });
        return cx.abs(RF.abcd.sparams(M, 1, load).s21);
      }
      const dB = (x) => -RF.db20(Math.max(x, 1e-12));
      function metrics(N) {
        const { g } = proto(N);
        const pass = RF.linspace(st.lo, st.hi, 161);
        const ils = pass.map((f) => dB(s21(N, f)));
        const { f0 } = geom();
        return {
          N, sumg: g.reduce((a, c) => a + c, 0), mid: dB(s21(N, f0)), edge: Math.max(...ils),
          r1: dB(s21(N, st.fs1)), r2: dB(s21(N, st.fs2)),
        };
      }

      /* ----- drawing: resonators and couplings ----- */
      const svg = s("svg", { viewBox: "0 0 560 200", role: "img", "aria-label": "Chain of coupled resonators with the coupling coefficients and external Q from the prototype values" });
      ui.draw.append(svg, el("div", { class: "hint", text: "Each circle is a resonator (a pole). The numbers between them are the couplings k the prototype asks for. Qₑ at each end is set by the tap." }));
      function drawBench() {
        const k = [];
        const T = (x, y, t, sty = {}, at = {}) => s("text", Object.assign({ x, y, "font-size": 11, text: t }, at), Object.assign({ fill: "var(--ink-2)" }, sty));
        const { fbw } = geom();
        const { g, load } = proto(st.N);
        const N = st.N;
        const x0 = 70, x1 = 490, y = 100;
        const step = N > 1 ? (x1 - x0) / (N - 1) : 0;
        const r = RF.clamp(step * 0.28, 9, 20);
        const xs = Array.from({ length: N }, (_, i) => (N > 1 ? x0 + i * step : (x0 + x1) / 2));
        k.push(s("line", { x1: 16, x2: xs[0] - r, y1: y, y2: y }, { stroke: "var(--gold)", strokeWidth: 3 }));
        k.push(s("line", { x1: xs[N - 1] + r, x2: 544, y1: y, y2: y }, { stroke: "var(--gold)", strokeWidth: 3 }));
        k.push(T(18, y - 10, "in", { fill: "var(--ink)", fontWeight: 600 }));
        k.push(T(542, y - 10, "out", { fill: "var(--ink)", fontWeight: 600 }, { "text-anchor": "end" }));
        const qe1 = g[0] / fbw, qe2 = (g[N - 1] * load) / fbw;
        k.push(T(20, y + 26, `Qₑ ${fmt(qe1, 3)}`, { fill: "var(--ink)" }));
        k.push(T(540, y + 26, `Qₑ ${fmt(qe2, 3)}`, { fill: "var(--ink)" }, { "text-anchor": "end" }));
        for (let i = 0; i < N - 1; i++) {
          const kk = fbw / Math.sqrt(g[i] * g[i + 1]);
          const xa = xs[i] + r, xb = xs[i + 1] - r;
          k.push(s("path", { d: `M${xa} ${y}Q${(xa + xb) / 2} ${y - 26} ${xb} ${y}` }, { fill: "none", stroke: "var(--s1)", strokeWidth: 1 + kk * 25 }));
          if (N <= 9) k.push(T((xa + xb) / 2, y - 26, fmt(kk, 2), { fontSize: "10.5px", fill: "var(--ink)" }, { "text-anchor": "middle" }));
        }
        xs.forEach((x, i) => {
          k.push(s("circle", { cx: x, cy: y, r }, { fill: "var(--surface)", stroke: "var(--gold-ink)", strokeWidth: 2 }));
          k.push(T(x, y + 4, String(i + 1), { fill: "var(--ink)", fontWeight: 600 }, { "text-anchor": "middle" }));
          if (N <= 9) k.push(T(x, y + r + 16, `g ${fmt(g[i], 3)}`, { fontSize: "10px" }, { "text-anchor": "middle" }));
        });
        k.push(T(280, 176, `${N} resonators = ${N} poles, ${N + 1} couplings counting the two ends`, { fill: "var(--ink)" }, { "text-anchor": "middle" }));
        svg.replaceChildren(...k);
      }

      /* ----- controls ----- */
      const kindSeg = RF.seg(ui.ctl, { labelText: "Response", options: [{ v: "cheb", label: "Chebyshev" }, { v: "butt", label: "Butterworth" }], value: st.kind, onChange: (v) => { st.kind = v; update(); } });
      const nSl = RF.slider(ui.ctl, { id: "or-n", label: "Poles N", min: 1, max: 11, step: 1, value: st.N, fmt: (v) => String(v), onInput: (v) => { st.N = v; update(); } });
      const rlSl = RF.slider(ui.ctl, { id: "or-rl", label: "Passband RL (ripple)", min: 10, max: 30, step: 0.5, value: st.rl, fmt: (v) => `${fmt(v, 3)} dB`, onInput: (v) => { st.rl = v; update(); } });
      const loSl = RF.slider(ui.ctl, { id: "or-lo", label: "Passband low", min: 1, max: 40, step: 0.05, value: st.lo, fmt: (v) => fmt(v, 4) + " GHz", onInput: (v) => { st.lo = Math.min(v, st.hi - 0.05); update(); } });
      const hiSl = RF.slider(ui.ctl, { id: "or-hi", label: "Passband high", min: 1.1, max: 45, step: 0.05, value: st.hi, fmt: (v) => fmt(v, 4) + " GHz", onInput: (v) => { st.hi = Math.max(v, st.lo + 0.05); update(); } });
      const quSl = RF.slider(ui.ctl, { id: "or-qu", label: "Unloaded Qᵤ", min: 20, max: 2000, log: true, value: st.Qu, fmt: (v) => fmt(v, 3), onInput: (v) => { st.Qu = v; update(); } });
      const f1Sl = RF.slider(ui.ctl, { id: "or-fs1", label: "Reject below at", min: 0.5, max: 45, step: 0.05, value: st.fs1, fmt: (v) => fmt(v, 4) + " GHz", onInput: (v) => { st.fs1 = v; update(); } });
      const f2Sl = RF.slider(ui.ctl, { id: "or-fs2", label: "Reject above at", min: 0.5, max: 50, step: 0.05, value: st.fs2, fmt: (v) => fmt(v, 4) + " GHz", onInput: (v) => { st.fs2 = v; update(); } });
      const aSl = RF.slider(ui.ctl, { id: "or-a", label: "Rejection needed", min: 10, max: 90, step: 1, value: st.A, fmt: (v) => fmt(v, 3) + " dB", onInput: (v) => { st.A = v; update(); } });
      const ilSl = RF.slider(ui.ctl, { id: "or-il", label: "Max passband loss", min: 0.5, max: 10, step: 0.1, value: st.maxIL, fmt: (v) => fmt(v, 3) + " dB", onInput: (v) => { st.maxIL = v; update(); } });
      const set = (o) => {
        Object.assign(st, o);
        kindSeg.set(st.kind, true); nSl.set(st.N, true); rlSl.set(st.rl, true); loSl.set(st.lo, true); hiSl.set(st.hi, true);
        quSl.set(st.Qu, true); f1Sl.set(st.fs1, true); f2Sl.set(st.fs2, true); aSl.set(st.A, true); ilSl.set(st.maxIL, true);
        update();
      };
      RF.presets(ui.ctl, "7-pole X-band example", [
        { label: "Shielded copper, Qᵤ 280", go: () => set({ kind: "cheb", N: 7, rl: 22, lo: 9.5, hi: 10.5, Qu: 280 }) },
        { label: "Open box, Qᵤ 90", go: () => set({ kind: "cheb", N: 7, rl: 20, lo: 9.5, hi: 10.5, Qu: 90 }) },
        { label: "Qᵤ 150", go: () => set({ kind: "cheb", N: 7, rl: 20, lo: 9.5, hi: 10.5, Qu: 150 }) },
        { label: "Dielectric only, Qᵤ 370", go: () => set({ kind: "cheb", N: 7, rl: 20, lo: 9.5, hi: 10.5, Qu: 370 }) },
        { label: "5 poles instead", go: () => set({ N: 5 }) },
      ]);
      const status = el("div", { class: "presets" });
      ui.ctl.append(status);
      const tblBox = el("div", { class: "tscroll" });
      ui.ctl.append(tblBox);

      /* ----- plots ----- */
      const pW = RF.plot(ui.plots, { x: { min: 0, max: 1 }, y: { min: -100, max: 0 }, series: [{ pts: [[0, 0], [1, 0]], color: "var(--s1)" }] });
      const pP = RF.plot(ui.plots, { x: { min: 0, max: 1 }, y: { min: -5, max: 0 }, series: [{ pts: [[0, 0], [1, 0]], color: "var(--s1)" }] });

      function update() {
        const { f0, fbw } = geom();
        drawBench();
        const rows = [];
        for (let N = 1; N <= 11; N++) rows.push(metrics(N));
        const meets = (m) => m.r1 >= st.A && m.r2 >= st.A && m.edge <= st.maxIL;
        const best = rows.find(meets);
        const cur = rows[st.N - 1];

        // table
        const t = el("table", { class: "mini" });
        t.append(el("tr", null, ["Poles", "Σg", "Mid loss", "Worst in band", `@ ${fmt(st.fs1, 4)}`, `@ ${fmt(st.fs2, 4)}`, ""].map((h) => el("th", { text: h }))));
        for (const m of rows) {
          const okR = m.r1 >= st.A && m.r2 >= st.A, okL = m.edge <= st.maxIL;
          const verdict = okR && okL ? ["good", "meets"] : !okR ? ["bad", "rejection"] : ["warn", "loss"];
          const tr = el("tr", { class: m.N === st.N ? "hot" : "" }, [
            el("td", { text: String(m.N) + (best && best.N === m.N ? "  ← fewest" : "") }),
            el("td", { text: fmt(m.sumg, 3) }), el("td", { text: fmt(m.mid, 3) }), el("td", { text: fmt(m.edge, 3) }),
            el("td", { text: fmt(m.r1, 3) }), el("td", { text: fmt(m.r2, 3) }),
            el("td", null, [el("span", { class: "pill " + verdict[0], text: verdict[1] })]),
          ]);
          tr.style.cursor = "pointer";
          tr.addEventListener("click", () => set({ N: m.N }));
          t.append(tr);
        }
        tblBox.replaceChildren(el("div", { class: "muted", style: "font-size:12.5px;margin-bottom:4px", text: "All values in dB, with your Qᵤ. Click a row to load it." }), t);
        status.replaceChildren(
          el("span", { class: "pill " + (meets(cur) ? "good" : "bad"), text: meets(cur) ? `${st.N} poles meets the spec` : `${st.N} poles misses the spec` }),
          el("span", { class: "pill", text: best ? `Fewest that meets it: ${best.N}` : "No order up to 11 meets it at this Qᵤ" }),
        );

        // wide response
        const span = Math.max(4 * fbw, 1.5 * Math.abs(st.fs2 / f0 - 1), 1.5 * Math.abs(1 - st.fs1 / f0));
        const fa = f0 * Math.max(0.05, 1 - span), fb = f0 * (1 + span);
        const fs = RF.linspace(fa, fb, 700);
        const series = [];
        const add = (N, color, width, name) => { if (N >= 1 && N <= 11) series.push({ name, pts: fs.map((f) => [f, -dB(s21(N, f))]), color, width }); };
        add(st.N, "var(--s1)", 2.5, `${st.N} poles`);
        add(st.N - 2, "var(--s3)", 1.5, `${st.N - 2} poles`);
        add(st.N + 2, "var(--s2)", 1.5, `${st.N + 2} poles`);
        pW.update({
          title: "Rejection: more poles, steeper skirts",
          subtitle: `Loss included (Qᵤ ${fmt(st.Qu, 3)}). Bandpass skirts are symmetric in log frequency: ${fmt(st.fs1, 4)} GHz pairs with f₀²/${fmt(st.fs1, 4)} = ${fmt(f0 * f0 / st.fs1, 4)} GHz.`,
          height: 290,
          x: { min: fa, max: fb, label: "Frequency (GHz)", fmt: (v) => fmt(v, 4) },
          y: { min: -100, max: 0, label: "S21 (dB)" },
          series,
          bands: [{ x0: st.lo, x1: st.hi, label: "passband" }],
          hlines: [{ y: -st.A, label: `need −${fmt(st.A, 3)} dB` }],
          markers: [{ x: st.fs1, y: -cur.r1, color: "var(--s1)", label: `${fmt(cur.r1, 3)} dB` }, { x: st.fs2, y: -cur.r2, color: "var(--s1)", label: `${fmt(cur.r2, 3)} dB` }],
          tipX: (v) => fmt(v, 5) + " GHz", tipY: (v) => fmt(v, 3) + " dB",
        });

        // passband zoom
        const bw = st.hi - st.lo;
        const za = st.lo - 0.25 * bw, zb = st.hi + 0.25 * bw;
        const zf = RF.linspace(za, zb, 500);
        const ymin = -Math.max(st.maxIL + 1.5, Math.min(cur.edge * 1.3 + 0.5, 30));
        pP.update({
          title: "Passband loss: the edges pay most",
          subtitle: `Midband ${fmt(cur.mid, 3)} dB, worst in band ${fmt(cur.edge, 3)} dB. Group delay peaks at the edges, and loss follows it.`,
          height: 260,
          x: { min: za, max: zb, label: "Frequency (GHz)", fmt: (v) => fmt(v, 4) },
          y: { min: ymin, max: 0.3, label: "S21 (dB)" },
          series: [
            { name: `With Qᵤ ${fmt(st.Qu, 3)}`, pts: zf.map((f) => [f, -dB(s21(st.N, f))]), color: "var(--s1)" },
            { name: "Lossless", pts: zf.map((f) => [f, -dB(s21(st.N, f, false))]), color: "var(--s2)", width: 1.5 },
          ],
          bands: [{ x0: st.lo, x1: st.hi }],
          hlines: [{ y: -st.maxIL, label: `max loss −${fmt(st.maxIL, 3)} dB` }],
          tipX: (v) => fmt(v, 5) + " GHz", tipY: (v) => fmt(v, 3) + " dB",
        });

        const { g } = proto(st.N);
        const cohn = (4.343 * cur.sumg) / (fbw * st.Qu);
        const rip = st.kind === "cheb" ? RF.rippleFromRL(st.rl) : 3.01;
        RF.setEqs(ui.eqs, [
          { name: "Fractional bandwidth and the lowpass mapping", f: `FBW = (f_hi − f_lo)/f₀ = ${b(fmt(fbw * 100, 3) + " %")},  Ω = (f/f₀ − f₀/f)/FBW,  f₀ = √(f_lo·f_hi) = ${fmt(f0, 4)} GHz` },
          { name: "Cohn's midband loss estimate (the table uses the full calculation)", f: `IL ≈ 4.343·Σg / (FBW·Qᵤ) = 4.343 × ${fmt(cur.sumg, 3)} / (${fmt(fbw, 3)} × ${fmt(st.Qu, 3)}) = ${b(fmt(cohn, 3) + " dB")}` },
          st.kind === "cheb"
            ? { name: "Chebyshev skirt", f: `L_A = 10·log(1 + ε²·T_N²(Ω)),  ripple ${fmt(rip, 3)} dB ↔ RL ${fmt(st.rl, 3)} dB` }
            : { name: "Butterworth skirt: 6N dB per octave far out", f: `L_A = 10·log(1 + Ω^(2N))` },
          { name: "What the layout must realize", f: `k(i,i+1) = FBW/√(gᵢgᵢ₊₁),  Qₑ = g₀g₁/FBW = ${b(fmt(g[0] / fbw, 3))}` },
          { name: "Loss scales as", f: `Σg (more poles) ÷ FBW (narrower is worse) ÷ Qᵤ (lossier is worse)` },
        ]);
      }

      RF.setSay(ui.say, {
        quote: "The order comes from the rejection spec, not the bandwidth. Seven poles at 10 % gives about 55 dB half a GHz out, but loss scales with Σg over FBW times Qᵤ. In an open box the lowest modes can radiate, dragging their Q down toward 90, and the lower band edge pays for it. A shielded copper channel can reach Qᵤ around 280: about 1.6 dB midband and 3 dB at the edges. If the rejection spec allowed it, five poles would cut the loss by about 40 %.",
        bullets: [
          "Pick N from the rejection you need at a stated offset, then check loss with the Q you can actually get.",
          "Loss peaks at the band edges because group delay does. Edges often run twice midband or more.",
          "Halving the bandwidth at the same N and Qᵤ doubles the loss in dB.",
          "If the stopband allows it, design wider than the spec band so the lossy edges fall outside it.",
          "Know the error bars: this is a uniform-Q prototype model. Against a full-wave solve it is typically good to a few tenths of a dB, and a little pessimistic at the band edges.",
        ],
      });

      RF.predict(ui.predict, [
        { q: "7 poles, 10 % bandwidth, Qᵤ = 150. Cohn's midband loss?", unit: "dB", answer: () => (4.343 * 10.4) / (0.1 * 150), absTol: 0.3, apply: () => set({ kind: "cheb", N: 7, rl: 20, lo: 9.5, hi: 10.5, Qu: 150 }), explain: "4.343 × 10.4 / (0.1 × 150) = 3.0 dB. The table's full calculation agrees at midband." },
        { q: "Same filter in the open box, Qᵤ ≈ 90. Midband loss?", unit: "dB", answer: () => (4.343 * 10.4) / (0.1 * 90), absTol: 0.4, apply: () => set({ Qu: 90 }), explain: "About 5 dB midband, and look at the worst-in-band column: the edges are far worse." },
        { q: "Passband 9.5–10.5 GHz, 20 dB RL ripple. Fewest poles for 30 dB at 9.0 GHz?", unit: "poles", answer: () => 5, absTol: 0.4, apply: () => set({ kind: "cheb", rl: 20, lo: 9.5, hi: 10.5, fs1: 9.0, fs2: 11.1, A: 30, Qu: 370, maxIL: 3 }), explain: "Five: about 33 dB at 9.0 GHz. Seven gives about 57 dB there." },
        { q: "Halve the bandwidth, same poles and Qᵤ. The loss in dB changes by what factor?", unit: "×", answer: () => 2, tol: 0.1, apply: () => set({ lo: 9.75, hi: 10.25 }), explain: "Loss goes as 1/FBW, so it doubles. Narrow filters need high-Q resonators." },
      ], "order");

      update();
      return {};
    },
  });
})();
