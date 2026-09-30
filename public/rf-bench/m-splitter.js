/* Module: power splitter. Junction rule, quarter-wave arms, multi-section binomial and Chebyshev transformers. */
(function () {
  "use strict";
  const { cx, el, s, fmt, b } = RF;
  const Z0 = 50;
  const SUBS = {
    gaas: { label: "GaAs 100 µm", er: 12.9, h: 100, minW: 10, unit: "µm" },
    ro: { label: "RO4003C 20 mil", er: 3.55, h: 508, minW: 150, unit: "µm" },
  };
  /* Hammerstad microstrip synthesis: width in the substrate's units */
  function msWidth(Z, er, h) {
    const A = (Z / 60) * Math.sqrt((er + 1) / 2) + ((er - 1) / (er + 1)) * (0.23 + 0.11 / er);
    let wh = (8 * Math.exp(A)) / (Math.exp(2 * A) - 2);
    if (wh > 2) {
      const B = (377 * Math.PI) / (2 * Z * Math.sqrt(er));
      wh = (2 / Math.PI) * (B - 1 - Math.log(2 * B - 1) + ((er - 1) / (2 * er)) * (Math.log(B - 1) + 0.39 - 0.61 / er));
    }
    return wh * h;
  }
  const eeffOf = (w, er, h) => (er + 1) / 2 + ((er - 1) / 2) / Math.sqrt(1 + (12 * h) / w);
  const binom = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return r; };
  const chebT = (n, x) => (Math.abs(x) <= 1 ? Math.cos(n * Math.acos(x)) : Math.sign(x) ** n * Math.cosh(n * Math.acosh(Math.abs(x))));

  /* section impedances from the output (load) side to the junction side */
  function binomialZ(M, r) {
    const out = [];
    let acc = 0;
    for (let n = 0; n < M; n++) { acc += binom(M, n) / 2 ** M; out.push(Z0 * Math.exp(acc * Math.log(r))); }
    return out;
  }
  function chebyZ(M, r, thm) {
    const sec = 1 / Math.cos(thm);
    const K = 3000;
    const a = [];
    for (let k = 0; k <= M; k++) {
      let sum = 0;
      for (let i = 0; i < K; i++) { const th = ((i + 0.5) * Math.PI) / K; sum += chebT(M, sec * Math.cos(th)) * Math.cos(k * th); }
      a.push(((k === 0 ? 1 : 2) * sum) / K);
    }
    const gm = (0.5 * Math.log(r)) / chebT(M, sec);
    const G = new Array(M + 1).fill(0);
    for (let n = 0; n <= M; n++) {
      const k = Math.abs(M - 2 * n);
      G[n] = k === 0 ? gm * a[0] : (gm * a[k]) / 2;
    }
    const out = [];
    let z = Z0;
    for (let n = 0; n < M; n++) { z *= Math.exp(2 * G[n]); out.push(z); }
    return { Z: out, gm };
  }
  /* S11 at the input port: N identical arms in parallel at the junction */
  function s11(Zs, N, f, f0) {
    const th = (Math.PI / 2) * (f / f0);
    let z = cx.C(Z0);
    for (const Zk of Zs) z = cx.line(Zk, th, z);
    return cx.abs(cx.gamma(cx.scale(z, 1 / N), Z0));
  }

  RF.register({
    id: "splitter",
    tab: "Splitter",
    sub: "1×N · sections",
    build(root) {
      const ui = RF.scaffold(root, {
        who: "Wilkinson and corporate dividers",
        title: "Why the arms step wider toward the outputs",
        lede: "At the junction the arms sit in parallel, so each must look like N × 50 Ω. Each arm is then a transformer from its 50 Ω output up to that. One quarter-wave section works over a narrow band. Several smaller steps let the reflections cancel over a wide band, and the line widens at every step.",
        benchTitle: "Top view, widths drawn to scale",
      });
      const st = { N: 2, M: 1, kind: "cheb", lo: 2, hi: 18, spec: 20, sub: "gaas" };

      function design() {
        const r = st.N;
        const f0 = (st.lo + st.hi) / 2;
        const fbw = (2 * (st.hi - st.lo)) / (st.hi + st.lo);
        const thm = (Math.PI / 2) * (1 - fbw / 2);
        const cheb = chebyZ(st.M, r, thm);
        const Zs = st.kind === "binom" ? binomialZ(st.M, r) : cheb.Z;
        const other = st.kind === "binom" ? cheb.Z : binomialZ(st.M, r);
        const one = [Z0 * Math.sqrt(r)];
        const sub = SUBS[st.sub];
        const widths = Zs.map((z) => msWidth(z, sub.er, sub.h));
        const lens = Zs.map((z, i) => 300 / (f0 * Math.sqrt(eeffOf(widths[i], sub.er, sub.h))) / 4);
        return { r, f0, fbw, thm, Zs, other, one, sub, widths, lens, gm: cheb.gm };
      }

      /* ----- drawing ----- */
      const svg = s("svg", { viewBox: "0 0 560 270", role: "img", "aria-label": "Splitter top view: input line, junction, and arms made of stepped quarter-wave sections drawn to scale" });
      ui.draw.append(svg, el("div", { class: "hint", text: "Section nearest the junction is the highest impedance, so the narrowest. Each step toward the output port is wider. Resistors (2-way only) are the isolation resistors, one per section." }));
      function drawBench(d) {
        const k = [];
        const T = (x, y, t, sty = {}, at = {}) => s("text", Object.assign({ x, y, "font-size": 11, text: t }, at), Object.assign({ fill: "var(--ink-2)" }, sty));
        const w50 = msWidth(50, d.sub.er, d.sub.h);
        const px = (w) => RF.clamp((w / w50) * 14, 1.2, 34);
        const N = st.N, M = st.M;
        const yc = 140, spread = N === 1 ? 0 : Math.min(190 / (N - 1), 110);
        const ys = Array.from({ length: N }, (_, i) => yc + (i - (N - 1) / 2) * spread);
        const XJ = 74, XA = 96, XB = 468;
        k.push(s("rect", { x: 8, y: 8, width: 544, height: 244, rx: 6 }, { fill: "var(--substrate)", stroke: "var(--substrate-edge)", strokeWidth: 1 }));
        k.push(s("rect", { x: 14, y: yc - px(w50) / 2, width: XJ - 14, height: px(w50) }, { fill: "var(--gold)" }));
        k.push(T(18, yc - px(w50) / 2 - 6, "in 50 Ω", { fill: "var(--ink)", fontWeight: 600 }));
        k.push(s("rect", { x: XJ - 2, y: ys[0] - 2, width: 4, height: ys[N - 1] - ys[0] + 4 }, { fill: "var(--gold)" }));
        const segW = (XB - XA) / M;
        ys.forEach((y, ai) => {
          k.push(s("rect", { x: XJ, y: y - 1.5, width: XA - XJ, height: 3 }, { fill: "var(--gold)" }));
          // sections: junction side first (highest Z), so draw from the junction with Zs reversed
          for (let j = 0; j < M; j++) {
            const idx = M - 1 - j;
            const hpx = px(d.widths[idx]);
            k.push(s("rect", { x: XA + j * segW, y: y - hpx / 2, width: segW + 0.5, height: hpx }, { fill: "var(--gold)", stroke: "var(--gold-ink)", strokeWidth: 0.6 }));
            if (ai === 0 && (M <= 5 || j === 0 || j === M - 1)) {
              k.push(T(XA + (j + 0.5) * segW, y - Math.max(hpx / 2, 4) - 6, `${fmt(d.Zs[idx], 3)} Ω`, { fill: "var(--ink)", fontWeight: 600 }, { "text-anchor": "middle" }));
            }
            if (ai === N - 1 && (M <= 5 || j === 0 || j === M - 1)) {
              const w = d.widths[idx];
              k.push(T(XA + (j + 0.5) * segW, y + Math.max(hpx / 2, 4) + 14, w >= 1000 ? `${fmt(w / 1000, 3)} mm` : `${fmt(w, 2)} µm`, {}, { "text-anchor": "middle" }));
            }
          }
          k.push(s("rect", { x: XB, y: y - px(w50) / 2, width: 540 - XB, height: px(w50) }, { fill: "var(--gold)" }));
          k.push(T(546, y + 4, "50 Ω", { fill: "var(--ink)" }, { "text-anchor": "end" }));
        });
        if (N === 2) {
          for (let j = 1; j <= M; j++) {
            const x = XA + j * segW - (j === M ? 6 : 0);
            const y1 = ys[0] + 6, y2 = ys[1] - 6;
            let zz = `M${x} ${y1}V${(y1 + y2) / 2 - 18}`;
            for (let i = 0; i < 6; i++) zz += `L${x + (i % 2 ? -5 : 5)} ${(y1 + y2) / 2 - 15 + i * 6}`;
            zz += `L${x} ${(y1 + y2) / 2 + 18}V${y2}`;
            k.push(s("path", { d: zz }, { fill: "none", stroke: "var(--ink)", strokeWidth: 1.3, strokeLinejoin: "round" }));
          }
          k.push(T((XA + XB) / 2, yc + 4, M === 1 ? "R = 2Z₀ = 100 Ω" : `${M} isolation resistors`, { fill: "var(--ink)" }, { "text-anchor": "middle" }));
        } else {
          k.push(T((XA + XB) / 2, 246, `${N}-way isolation uses a star of resistors, not drawn`, { fontSize: "10.5px", fill: "var(--muted)" }, { "text-anchor": "middle" }));
        }
        k.push(T(XA, 22, "junction side", { fontSize: "10.5px", fill: "var(--muted)" }));
        k.push(T(XB, 22, "output side", { fontSize: "10.5px", fill: "var(--muted)" }, { "text-anchor": "end" }));
        svg.replaceChildren(...k);
      }

      /* ----- controls ----- */
      const nSeg = RF.seg(ui.ctl, { labelText: "Ways at this junction", options: [2, 3, 4, 6].map((v) => ({ v, label: `1×${v}` })), value: st.N, onChange: (v) => { st.N = v; update(); } });
      const mSl = RF.slider(ui.ctl, { id: "sp-m", label: "Sections per arm", min: 1, max: 7, step: 1, value: st.M, fmt: (v) => String(v), onInput: (v) => { st.M = v; update(); } });
      const kSeg = RF.seg(ui.ctl, { labelText: "Step profile", options: [{ v: "cheb", label: "Chebyshev" }, { v: "binom", label: "Binomial" }], value: st.kind, onChange: (v) => { st.kind = v; update(); } });
      const loSl = RF.slider(ui.ctl, { id: "sp-lo", label: "Band low", min: 0.5, max: 30, step: 0.5, value: st.lo, fmt: (v) => fmt(v, 3) + " GHz", onInput: (v) => { st.lo = Math.min(v, st.hi - 0.5); update(); } });
      const hiSl = RF.slider(ui.ctl, { id: "sp-hi", label: "Band high", min: 1, max: 40, step: 0.5, value: st.hi, fmt: (v) => fmt(v, 3) + " GHz", onInput: (v) => { st.hi = Math.max(v, st.lo + 0.5); update(); } });
      const spSl = RF.slider(ui.ctl, { id: "sp-spec", label: "Return loss spec", min: 10, max: 30, step: 0.5, value: st.spec, fmt: (v) => fmt(v, 3) + " dB", onInput: (v) => { st.spec = v; update(); } });
      const subSeg = RF.seg(ui.ctl, { labelText: "Substrate", options: [{ v: "gaas", label: SUBS.gaas.label }, { v: "ro", label: SUBS.ro.label }], value: st.sub, onChange: (v) => { st.sub = v; update(); } });
      const set = (o) => {
        Object.assign(st, o);
        nSeg.set(st.N, true); mSl.set(st.M, true); kSeg.set(st.kind, true); loSl.set(st.lo, true); hiSl.set(st.hi, true); spSl.set(st.spec, true); subSeg.set(st.sub, true);
        update();
      };
      RF.presets(ui.ctl, "Try", [
        { label: "Textbook 2-way", go: () => set({ N: 2, M: 1, lo: 8, hi: 12 }) },
        { label: "2–18 GHz, 6 sections", go: () => set({ N: 2, M: 6, kind: "cheb", lo: 2, hi: 18 }) },
        { label: "6-way at one junction", go: () => set({ N: 6, M: 1 }) },
        { label: "Octave, 2 sections", go: () => set({ N: 2, M: 2, lo: 6, hi: 12 }) },
      ]);
      const status = el("div", { class: "presets" });
      ui.ctl.append(status);
      const ro = RF.readouts(ui.ctl, [
        { key: "rj", label: "Each arm at junction" }, { key: "worst", label: "Worst RL in band" }, { key: "cov", label: `Band meeting spec` },
        { key: "len", label: "Arm length" }, { key: "wmin", label: "Narrowest line" }, { key: "ratio", label: "Band ratio" },
      ]);

      /* ----- plots ----- */
      const pS = RF.plot(ui.plots, { x: { min: 0, max: 1 }, y: { min: -50, max: 0 }, series: [{ pts: [[0, 0], [1, 0]], color: "var(--s1)" }] });
      const pair = el("div", { class: "plots two" });
      ui.plots.append(pair);
      const pZ = RF.plot(pair, { x: { min: 0, max: 1 }, y: { min: 0, max: 1 }, series: [{ pts: [[0, 0], [1, 1]], color: "var(--s1)" }] });
      const pG = RF.plot(pair, { x: { min: 0, max: 1 }, y: { min: 0, max: 1 }, series: [{ pts: [[0, 0], [1, 1]], color: "var(--s1)" }], crosshair: false });

      function update() {
        const d = design();
        drawBench(d);
        const fmax = Math.max(2.2 * d.f0, st.hi * 1.1);
        const fs = RF.linspace(0.01 * d.f0, fmax, 900);
        const curve = (Zs) => fs.map((f) => [f, RF.db20(Math.max(1e-6, s11(Zs, st.N, f, d.f0)))]);
        const mine = curve(d.Zs);
        const inBand = mine.filter(([f]) => f >= st.lo && f <= st.hi);
        const worst = -Math.max(...inBand.map((p) => p[1]));
        const ok = inBand.filter((p) => -p[1] >= st.spec).length / inBand.length;
        const otherName = st.kind === "binom" ? "Chebyshev, same sections" : "Binomial, same sections";
        const series = [{ name: `Your ${st.M}-section ${st.kind === "binom" ? "binomial" : "Chebyshev"}`, pts: mine, color: "var(--s1)", width: 2.5 }];
        if (st.M > 1) series.push({ name: otherName, pts: curve(d.other), color: "var(--s3)", width: 1.5, opacity: 0.8 });
        if (st.M > 1) series.push({ name: "Single λ/4 section", pts: curve(d.one), color: "var(--s2)", width: 1.5, opacity: 0.8 });
        pS.update({
          title: "Input match (S11) of the splitter",
          subtitle: `Sections are λ/4 at the band centre, ${fmt(d.f0, 3)} GHz. At 2f₀ they are λ/2 long and do nothing, so the match collapses there.`,
          height: 300,
          x: { min: 0, max: fmax, label: "Frequency (GHz)", fmt: (v) => fmt(v, 3) },
          y: { min: -50, max: 0, label: "S11 (dB)" },
          series,
          bands: [{ x0: st.lo, x1: st.hi, label: `${fmt(st.lo, 3)}–${fmt(st.hi, 3)} GHz` }],
          hlines: [{ y: -st.spec, label: `spec −${fmt(st.spec, 3)} dB` }],
          vlines: [{ x: 2 * d.f0, label: "2f₀: sections are λ/2", anchor: "end", dy: 30 }],
          tipX: (v) => fmt(v, 3) + " GHz", tipY: (v) => fmt(v, 3) + " dB",
        });

        // impedance staircase from output port to junction
        const stair = [[0, Z0]];
        d.Zs.forEach((z, i) => { stair.push([i, z], [i + 1, z]); });
        stair.push([st.M, d.r * Z0], [st.M + 0.35, d.r * Z0]);
        stair.unshift([-0.35, Z0]);
        pZ.update({
          title: "Impedance along one arm",
          subtitle: `From the 50 Ω output up to ${fmt(d.r * Z0, 3)} Ω at the junction`,
          height: 250,
          x: { min: -0.35, max: st.M + 0.35, label: "Sections from the output (λ/4 each)", fmt: (v) => fmt(v, 2) },
          y: { min: 40, max: d.r * Z0 * 1.08, label: "Z (Ω)", fmt: (v) => fmt(v, 3) },
          series: [{ name: "Z", pts: stair, color: "var(--s1)" }],
          tipX: (v) => "section " + fmt(v, 2), tipY: (v) => fmt(v, 3) + " Ω",
        });

        // echo taps: small reflections at each step
        const zAll = [Z0, ...d.Zs, d.r * Z0];
        const taps = [];
        for (let i = 0; i < zAll.length - 1; i++) taps.push(0.5 * Math.log(zAll[i + 1] / zAll[i]));
        const tmax = Math.max(...taps);
        const stems = [];
        taps.forEach((t, i) => { stems.push([i, 0], [i, t], [i, NaN]); });
        pG.update({
          title: "The echoes: one per step",
          subtitle: "Γₙ = ½·ln(Zₙ₊₁/Zₙ). Small, many, shaped: that's what makes the band wide.",
          height: 250,
          x: { min: -0.5, max: taps.length - 0.5, label: "Step, output → junction", fmt: (v) => (Number.isInteger(v) ? String(v) : ""), ticks: taps.map((_, i) => i) },
          y: { min: 0, max: tmax * 1.2, label: "Γₙ", fmt: (v) => fmt(v, 2) },
          series: [{ name: "taps", pts: stems, color: "var(--s1)", width: 2.5 }],
          markers: taps.map((t, i) => ({ x: i, y: t, color: "var(--s1)" })),
          crosshair: false,
        });

        const wmin = Math.min(...d.widths);
        const totalLen = d.lens.reduce((a, c) => a + c, 0);
        ro.update({
          rj: [fmt(d.r * Z0, 3), "Ω"], worst: [fmt(worst, 3), "dB"], cov: [fmt(ok * 100, 3), "%"],
          len: [fmt(totalLen, 3), "mm"], wmin: [wmin >= 1000 ? fmt(wmin / 1000, 3) : fmt(wmin, 2), wmin >= 1000 ? "mm" : "µm"], ratio: [fmt(st.hi / st.lo, 3), ": 1"],
        });
        const pills = [el("span", { class: "pill " + (worst >= st.spec ? "good" : "bad"), text: worst >= st.spec ? "Meets the spec across the band" : `Misses: worst ${fmt(worst, 3)} dB in band` })];
        if (wmin < d.sub.minW) pills.push(el("span", { class: "pill warn", text: `Narrowest line ${fmt(wmin, 2)} µm: hard to make and lossy on ${d.sub.label}` }));
        status.replaceChildren(...pills);

        const zlist = d.Zs.map((z) => fmt(z, 3)).join(", ");
        RF.setEqs(ui.eqs, [
          { name: "Junction rule: arms in parallel must make 50 Ω", f: `each arm looks like N·Z₀ = ${st.N} × 50 = ${b(fmt(d.r * Z0, 3) + " Ω")} at the junction` },
          { name: "One quarter-wave section: the geometric mean", f: `Z = √(50 × ${fmt(d.r * Z0, 3)}) = 50·√N = ${b(fmt(d.one[0], 4) + " Ω")}` },
          st.kind === "binom"
            ? { name: "Binomial steps (maximally flat): split ln(r) by binomial weights", f: `ln(Zₙ₊₁/Zₙ) = 2⁻ᴹ·C(M,n)·ln(${fmt(d.r, 3)})  →  ${b(zlist)} Ω` }
            : { name: "Chebyshev steps (equal ripple across your band; small-reflection design, so the exact curve lands within a few tenths of a dB)", f: `θₘ = 90°·(1 − FBW/2) = ${fmt((d.thm * 180) / Math.PI, 3)}°,  Γₘ = ½ln(r) / T_M(sec θₘ) = ${fmt(d.gm, 3)} → ${fmt(-RF.db20(Math.abs(d.gm)), 3)} dB  →  ${b(zlist)} Ω` },
          { name: "Small-reflection view: every step is an echo, delayed by 2θ per section", f: `Γ(θ) ≈ Γ₀ + Γ₁e^(−j2θ) + Γ₂e^(−j4θ) + …   (a digital filter whose taps are the steps)` },
          { name: "Band is fractional, so ratio matters more than width in GHz", f: `FBW = 2(f_hi − f_lo)/(f_hi + f_lo) = ${b(fmt(d.fbw * 100, 3) + " %")}   (${fmt(st.hi / st.lo, 3)}:1)` },
          { name: `Physical size on ${d.sub.label}`, f: `λg/4 at ${fmt(d.f0, 3)} GHz per section, total ${b(fmt(totalLen, 3) + " mm")} per arm` },
        ]);
      }

      RF.setSay(ui.say, {
        quote: "At the junction the arms are in parallel, so for an equal 2-way each arm must look like 100 Ω. A quarter-wave at √(50·100) = 70.7 Ω does it. For N ways it's √N·Z₀, which gets narrow fast, so we build trees. For bandwidth I replace the single section with a stepped transformer from 100 down to 50: the small reflections cancel over a wider band, which is why the lines widen toward the outputs. 2 to 18 GHz at 20 dB takes about six sections per split, with a resistor per section for isolation.",
        bullets: [
          "Power divides like conductance: an arm meant to take a fraction p must look like Z₀/p at the junction. Uneven splits use the same rule.",
          "Binomial is flattest at the centre. Chebyshev trades a little ripple for the widest band per section.",
          "A taper is infinitely many tiny steps. Klopfenstein is the shortest taper for a given ripple.",
          "A resistive 2:1 match has no Bode–Fano ceiling. At 18 GHz the limit is the T-junction and resistor-pad parasitics.",
          "The plot here is input match only. Isolation and output match need the resistors, one per section (Cohn, 1968).",
        ],
      });

      RF.predict(ui.predict, [
        { q: "Equal 2-way Wilkinson, one section. What's the arm impedance?", unit: "Ω", answer: () => 50 * Math.SQRT2, tol: 0.02, apply: () => set({ N: 2, M: 1, lo: 8, hi: 12 }), explain: "Each arm must look like 100 Ω at the junction: √(50 × 100) = 70.7 Ω." },
        { q: "Equal 4-way split at a single junction, one section. Arm impedance?", unit: "Ω", answer: () => 100, tol: 0.02, apply: () => set({ N: 4, M: 1 }), explain: "Each arm must look like 200 Ω: √(50 × 200) = 100 Ω, which is 50·√4." },
        { q: "Two binomial sections from 50 up to 100 Ω. Impedance of the section nearest the junction?", unit: "Ω", answer: () => 50 * 2 ** 0.75, tol: 0.03, apply: () => set({ N: 2, M: 2, kind: "binom" }), explain: "50·2^¾ = 84.1 Ω, then 59.5 Ω next to the output. Narrow near the junction, wider toward the output." },
        { q: "Chebyshev, 50 → 100 Ω, 20 dB return loss. How many sections for 2 to 18 GHz?", unit: "sections", answer: () => 6, absTol: 0.5, apply: () => set({ N: 2, M: 6, kind: "cheb", lo: 2, hi: 18, spec: 20 }), explain: "About six. Try five and seven with the slider and read the worst in-band return loss." },
        { q: "A single-section splitter is designed at 10 GHz. At what frequency does the match collapse completely?", unit: "GHz", answer: () => 20, tol: 0.05, apply: () => set({ N: 2, M: 1, lo: 8, hi: 12 }), explain: "At 20 GHz the section is λ/2 long, so it transforms nothing and the junction sees 25 Ω." },
      ], "splitter");

      update();
      return {};
    },
  });
})();
