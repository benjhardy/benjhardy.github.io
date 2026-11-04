/* Module: group delay. Filter phase, delay across the band, and what it does to a pulse envelope. */
(function () {
  "use strict";
  const { cx, el, s, fmt, b } = RF;

  RF.register({
    id: "groupdelay",
    tab: "Group delay",
    sub: "τg · phase · pulse",
    build(root) {
      const ui = RF.scaffold(root, {
        who: "Senior question · flat magnitude isn't enough",
        title: "Group delay: how long the envelope takes, frequency by frequency",
        lede: "Group delay is the slope of the phase. If it's flat across the signal, the envelope arrives late but unchanged. If it isn't, parts of the signal arrive at different times and the pulse smears, even when the magnitude looks fine.",
        benchTitle: "A bandpass filter and a pulse",
        plotTitle: "Response",
      });
      const st = { kind: "butt", N: 5, f0: 10, bw: 1, rl: 20, Qu: 300, pulse: 4 };

      function proto() {
        if (st.kind === "butt") return { g: RF.buttG(st.N), load: 1 };
        return RF.chebG(st.N, RF.rippleFromRL(st.rl));
      }
      /* complex S21 at f (GHz) through the lowpass prototype with uniform dissipation */
      function h(f) {
        const fbw = st.bw / st.f0;
        const W = (f / st.f0 - st.f0 / f) / fbw;
        const d = 1 / (fbw * st.Qu);
        const { g, load } = proto();
        let M = RF.abcd.I();
        g.forEach((gk, i) => {
          const v = cx.C(gk * d, gk * W);
          M = RF.abcd.mul(M, i % 2 === 0 ? RF.abcd.series(v) : RF.abcd.shunt(v));
        });
        return RF.abcd.sparams(M, 1, load).s21;
      }
      /* group delay in ns from a centered difference of the unwrapped phase */
      function tauG(f) {
        const df = st.bw * 1e-3;
        const a = h(f - df), c = h(f + df);
        const q = cx.div(c, a);
        return -Math.atan2(q.im, q.re) / (2 * Math.PI * 2 * df);
      }

      function pulseThrough() {
        const N = 4096;
        const span = Math.max(40 * st.pulse, 100 / st.bw, 20);   /* ns */
        const dt = span / N;
        const t = Array.from({ length: N }, (_, i) => i * dt);
        const sigma = st.pulse / 2.355;    /* FWHM to sigma */
        const t0 = 6 * sigma + 2;
        const re = t.map((x) => Math.exp(-0.5 * ((x - t0) / sigma) ** 2));
        const inp = re.slice();
        const im = new Array(N).fill(0);
        RF.fft(re, im);
        for (let k = 0; k < N; k++) {
          const dfk = (k <= N / 2 ? k : k - N) / (N * dt);   /* GHz offset from f0 */
          const f = st.f0 + dfk;
          if (f <= 0.01) { re[k] = 0; im[k] = 0; continue; }
          const H = h(f);
          const r = re[k] * H.re - im[k] * H.im;
          im[k] = re[k] * H.im + im[k] * H.re;
          re[k] = r;
        }
        RF.fft(re, im, true);
        const out = re.map((v, i) => Math.hypot(v, im[i]));
        return { t, inp, out, t0, dt };
      }

      /* ----- drawing ----- */
      const svg = s("svg", { viewBox: "0 0 560 120", role: "img", "aria-label": "A chain of resonators with a pulse going in and coming out later" });
      ui.draw.append(svg, el("div", { class: "hint", text: "More poles or less bandwidth means more stored energy, which means more delay." }));
      function drawBench() {
        const k = [];
        const x0 = 140, x1 = 420, y = 60, N = st.N;
        const step = N > 1 ? (x1 - x0) / (N - 1) : 0;
        const r = RF.clamp(step * 0.3, 8, 18);
        k.push(s("line", { x1: 90, x2: 470, y1: y, y2: y }, { stroke: "var(--gold)", strokeWidth: 3 }));
        for (let i = 0; i < N; i++) {
          const x = N > 1 ? x0 + i * step : 280;
          k.push(s("circle", { cx: x, cy: y, r }, { fill: "var(--surface)", stroke: "var(--gold-ink)", strokeWidth: 2 }));
        }
        const bump = (cx0, w, h0, color) => {
          let d = "";
          for (let i = 0; i <= 30; i++) {
            const u = -1 + i / 15;
            d += (i ? "L" : "M") + (cx0 + u * w).toFixed(1) + " " + (y - 8 - h0 * Math.exp(-4 * u * u)).toFixed(1);
          }
          return s("path", { d }, { fill: "none", stroke: color, strokeWidth: 2.5 });
        };
        k.push(bump(50, 34, 34, "var(--s1)"), bump(510, 40, 26, "var(--s2)"));
        k.push(s("text", { x: 50, y: 92, "text-anchor": "middle", "font-size": 11.5, text: "in" }, { fill: "var(--ink-2)" }));
        k.push(s("text", { x: 510, y: 92, "text-anchor": "middle", "font-size": 11.5, text: "out, later" }, { fill: "var(--ink-2)" }));
        k.push(s("text", { x: 280, y: 108, "text-anchor": "middle", "font-size": 11.5, text: `${N} pole${N > 1 ? "s" : ""}, ${fmt(st.bw, 3)} GHz wide at ${fmt(st.f0, 3)} GHz` }, { fill: "var(--ink)" }));
        svg.replaceChildren(...k);
      }

      /* ----- controls ----- */
      const kindSeg = RF.seg(ui.ctl, { labelText: "Response", options: [{ v: "butt", label: "Butterworth" }, { v: "cheb", label: "Chebyshev" }], value: st.kind, onChange: (v) => { st.kind = v; update(); } });
      const nSl = RF.slider(ui.ctl, { id: "gd-n", label: "Poles N", min: 1, max: 9, step: 1, value: st.N, fmt: (v) => String(v), onInput: (v) => { st.N = v; update(); } });
      const f0Sl = RF.slider(ui.ctl, { id: "gd-f0", label: "Center f₀", min: 1, max: 40, step: 0.1, value: st.f0, fmt: (v) => fmt(v, 3) + " GHz", onInput: (v) => { st.f0 = v; st.bw = Math.min(st.bw, v * 0.6); bwSl.set(st.bw, true); update(); } });
      const bwSl = RF.slider(ui.ctl, { id: "gd-bw", label: "Bandwidth", min: 0.05, max: 10, log: true, value: st.bw, fmt: (v) => fmt(v, 3) + " GHz", onInput: (v) => { st.bw = Math.min(v, st.f0 * 0.6); update(); } });
      const quSl = RF.slider(ui.ctl, { id: "gd-qu", label: "Unloaded Qᵤ", min: 30, max: 3000, log: true, value: st.Qu, fmt: (v) => fmt(v, 3), onInput: (v) => { st.Qu = v; update(); } });
      const puSl = RF.slider(ui.ctl, { id: "gd-pu", label: "Pulse width (FWHM)", min: 0.2, max: 100, log: true, value: st.pulse, fmt: (v) => fmt(v, 3) + " ns", onInput: (v) => { st.pulse = v; update(); } });
      const set = (o) => {
        Object.assign(st, o);
        kindSeg.set(st.kind, true); nSl.set(st.N, true); f0Sl.set(st.f0, true); bwSl.set(st.bw, true); quSl.set(st.Qu, true); puSl.set(st.pulse, true);
        update();
      };
      RF.presets(ui.ctl, "Pulse is", [
        { label: "Wide: passes clean", go: () => set({ pulse: 20 }) },
        { label: "Matched to the band", go: () => set({ pulse: 0.8 / st.bw * 3 }) },
        { label: "Too short: smears", go: () => set({ pulse: 0.3 / st.bw }) },
      ]);
      const ro = RF.readouts(ui.ctl, [
        { key: "mid", label: "Midband τg" },
        { key: "edge", label: "Peak τg in band" },
        { key: "ripple", label: "Variation in band" },
        { key: "il", label: "Midband loss" },
        { key: "lat", label: "Pulse peak delay" },
        { key: "wid", label: "Pulse out, FWHM" },
      ]);

      const blank = { x: { min: 0, max: 1 }, y: { min: 0, max: 1 }, series: [{ pts: [[0, 0], [1, 1]], color: "var(--s1)" }] };
      const pM = RF.plot(ui.plots, blank);
      const pG = RF.plot(ui.plots, blank);
      const pP = RF.plot(ui.plots, blank);

      function update() {
        drawBench();
        const lo = st.f0 - st.bw / 2, hi = st.f0 + st.bw / 2;
        const za = Math.max(0.05, st.f0 - 1.5 * st.bw), zb = st.f0 + 1.5 * st.bw;
        const fs = RF.linspace(za, zb, 400);
        const taus = fs.map(tauG);
        const inBand = fs.map((f, i) => [f, taus[i]]).filter(([f]) => f >= lo && f <= hi).map(([, v]) => v);
        const tMid = tauG(st.f0);
        const tMax = Math.max(...inBand), tMin = Math.min(...inBand);
        const ilMid = -RF.db20(cx.abs(h(st.f0)));
        const cohn = 4.343 * 2 * Math.PI * st.f0 * tMid / st.Qu;

        pM.update({
          title: "Magnitude",
          height: 200,
          x: { min: za, max: zb, label: "Frequency (GHz)", fmt: (v) => fmt(v, 4) },
          y: { min: -60, max: 2, label: "S21 (dB)" },
          series: [{ pts: fs.map((f) => [f, RF.db20(cx.abs(h(f)))]), color: "var(--s1)" }],
          bands: [{ x0: lo, x1: hi, label: "passband" }],
          tipX: (v) => fmt(v, 4) + " GHz", tipY: (v) => fmt(v, 3) + " dB",
        });
        pG.update({
          title: "Group delay: the slope of the phase",
          subtitle: "It peaks at the band edges. Those frequencies are stored longest, and they also pay the most loss.",
          height: 230,
          x: { min: za, max: zb, label: "Frequency (GHz)", fmt: (v) => fmt(v, 4) },
          y: { min: 0, max: Math.max(tMax * 1.3, 0.1), label: "τg (ns)" },
          series: [{ pts: fs.map((f, i) => [f, taus[i]]), color: "var(--s2)" }],
          bands: [{ x0: lo, x1: hi }],
          markers: [{ x: st.f0, y: tMid, color: "var(--s2)", label: `${fmt(tMid, 3)} ns` }],
          tipX: (v) => fmt(v, 4) + " GHz", tipY: (v) => fmt(v, 3) + " ns",
        });

        const p = pulseThrough();
        const outMax = Math.max(...p.out);
        const iPk = p.out.indexOf(outMax);
        const above = p.out.map((v, i) => [i, v]).filter(([, v]) => v >= outMax / 2);
        const fwhmOut = (above[above.length - 1][0] - above[0][0]) * p.dt;
        const latency = iPk * p.dt - p.t0;
        const tEnd = Math.min(p.t[p.t.length - 1], p.t0 + Math.max(3 * st.pulse, 0) + Math.max(tMax * 2.5, st.pulse * 2));
        const stride = Math.max(1, Math.ceil(tEnd / p.dt / 700));
        const shown = p.t.map((_, i) => i).filter((i) => p.t[i] <= tEnd && i % stride === 0);
        pP.update({
          title: "Envelope of a Gaussian pulse at f₀",
          subtitle: "Spectral width ≈ 0.44/FWHM. Small next to the band: a clean, delayed copy. Near or past the band: it widens and rings.",
          height: 230,
          x: { min: 0, max: tEnd, label: "Time (ns)", fmt: (v) => fmt(v, 3) },
          y: { min: 0, max: 1.1, label: "Envelope" },
          series: [
            { name: "In", pts: shown.map((i) => [p.t[i], p.inp[i]]), color: "var(--s1)" },
            { name: "Out", pts: shown.map((i) => [p.t[i], p.out[i]]), color: "var(--s2)" },
          ],
          tipX: (v) => fmt(v, 3) + " ns", tipY: (v) => fmt(v, 3),
        });

        ro.update({
          mid: [fmt(tMid, 3), "ns"], edge: [fmt(tMax, 3), "ns"], ripple: [fmt(tMax - tMin, 3), "ns"],
          il: [fmt(ilMid, 3), "dB"], lat: [fmt(latency, 3), "ns"], wid: [fmt(fwhmOut, 3), "ns"],
        });
        const butt = 1 / (Math.PI * st.bw * Math.sin(Math.PI / (2 * st.N)));
        RF.setEqs(ui.eqs, [
          { name: "Definition: the negative slope of the phase", f: `τg = −dφ/dω = −(1/2π)·dφ/df` },
          { name: "Not the same as phase delay, which is the carrier's", f: `τp = −φ/ω.  τg is the envelope's` },
          { name: "Single resonator at center", f: `τg = 2·Q_L/ω₀ = 1/(π·BW)` },
          { name: "Butterworth bandpass at center (this filter's: " + fmt(tMid, 3) + " ns)", f: `τg ≈ 1/(π·BW·sin(π/2N)) = ${b(fmt(butt, 3) + " ns")}` },
          { name: "Delay and loss are tied together", f: `IL ≈ 4.343·ω₀·τg/Qᵤ = 4.343 × 2π × ${fmt(st.f0, 3)} × ${fmt(tMid, 3)} / ${fmt(st.Qu, 3)} = ${b(fmt(cohn, 3) + " dB")}` },
          { name: "A plain line: flat group delay equal to its physical delay", f: `τg = L·√εᵣ/c ≈ 3.3 ns/m × √εᵣ` },
        ]);
      }

      RF.setSay(ui.say, {
        quote: "Group delay is minus d phi d omega: how long the envelope takes at each frequency. What hurts isn't the delay itself but its variation. A flat delay just arrives late. If it varies across the signal band, the pulse smears, and on a modulated signal that shows up as EVM or a closed eye, even with a flat magnitude. In a filter, delay peaks at the band edges, and loss follows it, because loss is roughly 4.34 omega tau over Q.",
        bullets: [
          "Phase delay is the carrier's, group delay is the envelope's. They only match in a non-dispersive medium.",
          "Sharper filters cost delay. Chebyshev has a sharper skirt and a bigger edge peak than Butterworth. Bessel trades skirt for flat delay.",
          "A delay peak near the edge also means more stored energy, so more loss and more voltage on the resonators.",
          "To measure it, a VNA differentiates phase over an aperture. Too small an aperture is noisy, too large smooths real ripple.",
          "Practical specs give ripple in ns over a stated channel, not the absolute delay. Absolute delay can be compensated with timing.",
        ],
      });

      RF.predict(ui.predict, [
        { q: "One resonator, 100 MHz 3 dB bandwidth. Group delay at center?", unit: "ns", answer: () => 1000 / (Math.PI * 100), absTol: 0.4, explain: "1/(π × 100 MHz) = 3.2 ns." },
        { q: "5-pole Butterworth, 1 GHz bandwidth at 10 GHz. Delay at center?", unit: "ns", answer: () => tauCheck(5, 1), absTol: 0.15, apply: () => set({ kind: "butt", N: 5, f0: 10, bw: 1, Qu: 300, pulse: 4 }), explain: "1/(π × 1 GHz × sin 18°) ≈ 1.03 ns." },
        { q: "Halve that bandwidth, same poles. Delay changes by what factor?", unit: "×", answer: () => 2, tol: 0.1, apply: () => set({ kind: "butt", N: 5, f0: 10, bw: 0.5 }), explain: "Delay goes as 1/BW. That's the same reason loss doubles." },
        { q: "That 5-pole filter, 1 ns delay at 10 GHz, Qᵤ = 300. Midband loss estimate?", unit: "dB", answer: () => (4.343 * 2 * Math.PI * 10 * tauCheck(5, 1)) / 300, absTol: 0.2, apply: () => set({ kind: "butt", N: 5, f0: 10, bw: 1, Qu: 300 }), explain: "4.343 × 2π × 10 GHz × 1 ns / 300 ≈ 0.9 dB." },
        { q: "1 m of PTFE coax, εᵣ = 2.1. Group delay?", unit: "ns", answer: () => 3.336 * Math.sqrt(2.1), absTol: 0.3, explain: "3.34 ns/m × √2.1 = 4.8 ns, and it's flat with frequency." },
      ], "groupdelay");
      function tauCheck(N, bw) { return 1 / (Math.PI * bw * Math.sin(Math.PI / (2 * N))); }

      update();
      return {};
    },
  });
})();
