/* Module: matching. Low-impedance die to 50 Ω: L-networks, quarter-wave, multi-section, bandwidth vs Q. */
(function () {
  "use strict";
  const { cx, el, s, fmt, b } = RF;
  const TWO_PI = 2 * Math.PI;
  const RH = 50;
  const NETS = [
    { v: "L1", label: "L-network", color: "var(--s1)" },
    { v: "L2", label: "Two L steps", color: "var(--s2)" },
    { v: "Q1", label: "λ/4 line", color: "var(--s3)" },
    { v: "Q2", label: "Two λ/4 sections", color: "var(--s4)" },
  ];

  /* element values at f0 */
  function design(RL, f0) {
    const w0 = TWO_PI * f0;
    const lstep = (ra, rb) => {
      const Q = Math.sqrt(rb / ra - 1);
      return { Q, L: (Q * ra) / w0, C: Q / (w0 * rb) };
    };
    const Rm = Math.sqrt(RL * RH);
    return {
      L1: lstep(RL, RH),
      L2: { a: lstep(RL, Rm), b: lstep(Rm, RH), Rm },
      Q1: { Z: Math.sqrt(RL * RH) },
      Q2: { Za: Math.pow(RL, 0.75) * Math.pow(RH, 0.25), Zb: Math.pow(RL, 0.25) * Math.pow(RH, 0.75) },
    };
  }
  /* list of steps; each step maps z -> z at frequency f. Used for both the sweep and the Smith path. */
  function steps(net, d, f, f0) {
    const w = TWO_PI * f, th = (Math.PI / 2) * (f / f0);
    const ser = (L) => ({ kind: "series L", L, go: (z, t = 1) => cx.add(z, cx.C(0, w * L * t)) });
    const sh = (C) => ({ kind: "shunt C", C, go: (z, t = 1) => cx.inv(cx.add(cx.inv(z), cx.C(0, w * C * t))) });
    const ln = (Z) => ({ kind: "line", Z, go: (z, t = 1) => cx.line(Z, th * t, z) });
    if (net === "L1") return [ser(d.L1.L), sh(d.L1.C)];
    if (net === "L2") return [ser(d.L2.a.L), sh(d.L2.a.C), ser(d.L2.b.L), sh(d.L2.b.C)];
    if (net === "Q1") return [ln(d.Q1.Z)];
    return [ln(d.Q2.Za), ln(d.Q2.Zb)];
  }
  function zin(net, d, f, f0, RL) {
    let z = cx.C(RL);
    for (const st of steps(net, d, f, f0)) z = st.go(z);
    return z;
  }

  RF.register({
    id: "matching",
    tab: "Matching",
    sub: "5 Ω → 50 Ω",
    build(root) {
      const ui = RF.scaffold(root, {
        who: "Senior question · power amplifiers",
        title: "Getting a low-impedance die up to 50 Ω",
        lede: "A big power transistor wants a few ohms. Pick a network and watch the return loss across your band. A bigger transformation ratio means a higher Q and a narrower band. Taking smaller steps buys bandwidth back.",
      });
      const st = { RL: 5, f0: 4, lo: 2, hi: 6, spec: 15, net: "L1" };

      /* ----- drawing ----- */
      const svg = s("svg", { viewBox: "0 0 560 210", role: "img", "aria-label": "Matching network between the transistor die and the 50 ohm port" });
      ui.draw.append(svg, el("div", { class: "hint", text: "Drag the die up or down to change its impedance. Line width is drawn to scale with impedance: lower Z means a wider line." }));
      const wOf = (Z) => RF.clamp(9 * Math.pow(50 / Z, 1.1), 4, 70);

      function drawBench(d) {
        const k = [];
        const T = (x, y, t, sty = {}, at = {}) => s("text", Object.assign({ x, y, "font-size": 12, text: t }, at), Object.assign({ fill: "var(--ink-2)" }, sty));
        const W = (dd, sw = 1.5) => s("path", { d: dd }, { fill: "none", stroke: "var(--ink)", strokeWidth: sw, strokeLinejoin: "round" });
        const yc = 90, gy = 176;
        // die
        k.push(s("rect", { x: 16, y: yc - 44, width: 86, height: 88, rx: 6 }, { fill: "var(--substrate)", stroke: "var(--substrate-edge)", strokeWidth: 1 }));
        for (let i = 0; i < 5; i++) k.push(s("rect", { x: 30 + i * 12, y: yc - 30, width: 4, height: 60 }, { fill: "var(--gold)", opacity: 0.8 }));
        k.push(T(59, yc + 62, "Die", { fill: "var(--ink)", fontWeight: 600 }, { "text-anchor": "middle" }));
        k.push(T(59, yc + 77, `${fmt(st.RL, 3)} Ω`, { fill: "var(--ink)" }, { "text-anchor": "middle" }));
        k.push(s("circle", { cx: 59, cy: yc, r: 16 }, { fill: "var(--gold)", opacity: 0.15, stroke: "var(--gold-ink)", strokeWidth: 1.5 }));
        // port
        k.push(s("rect", { x: 470, y: yc - 24, width: 74, height: 48, rx: 6 }, { fill: "var(--surface)", stroke: "var(--ink)", strokeWidth: 1.2 }));
        k.push(T(507, yc + 4, "50 Ω", { fill: "var(--ink)", fontWeight: 600 }, { "text-anchor": "middle" }));
        k.push(T(507, yc + 42, "port", {}, { "text-anchor": "middle" }));
        const x0 = 102, x1 = 470;
        if (st.net === "Q1" || st.net === "Q2") {
          const secs = st.net === "Q1" ? [d.Q1.Z] : [d.Q2.Za, d.Q2.Zb];
          const segW = 240 / secs.length;
          let x = x0 + 30;
          k.push(s("rect", { x: x0, y: yc - wOf(50) / 2, width: 30, height: wOf(50) }, { fill: "var(--gold)" }));
          secs.forEach((Z, i) => {
            const ww = wOf(Z);
            k.push(s("rect", { x, y: yc - ww / 2, width: segW, height: ww }, { fill: "var(--gold)", stroke: "var(--gold-ink)", strokeWidth: 0.8 }));
            k.push(T(x + segW / 2, yc - ww / 2 - 8, `${fmt(Z, 3)} Ω`, { fill: "var(--ink)", fontWeight: 600 }, { "text-anchor": "middle" }));
            k.push(T(x + segW / 2, yc + ww / 2 + 16, "λ/4 at f₀", { fontSize: "11px" }, { "text-anchor": "middle" }));
            x += segW;
          });
          k.push(s("rect", { x, y: yc - wOf(50) / 2, width: x1 - x, height: wOf(50) }, { fill: "var(--gold)" }));
          k.push(T(x + (x1 - x) / 2, yc - wOf(50) / 2 - 8, "50 Ω", {}, { "text-anchor": "middle" }));
          const eeff = 7, lq = 3e8 / (4 * st.f0 * 1e9 * Math.sqrt(eeff)) * 1e3;
          k.push(T(286, gy + 20, `each λ/4 on GaAs microstrip (ε_eff ≈ 7): about ${fmt(lq, 3)} mm at ${fmt(st.f0, 3)} GHz`, { fontSize: "11px", fill: "var(--muted)" }, { "text-anchor": "middle" }));
        } else {
          const stepsL = st.net === "L1" ? [d.L1] : [d.L2.a, d.L2.b];
          const span = (x1 - x0) / stepsL.length;
          k.push(W(`M${x0} ${yc}H${x1}`));
          k.push(W(`M${x0 + 10} ${gy}H${x1 - 10}`, 2.5));
          stepsL.forEach((p, i) => {
            const xa = x0 + i * span;
            const lx = xa + span * 0.2, lw = span * 0.34;
            // series inductor: bumps
            let coil = `M${lx} ${yc}`;
            for (let j = 0; j < 4; j++) coil += `a${lw / 8} ${lw / 8} 0 0 1 ${lw / 4} 0`;
            k.push(s("rect", { x: lx - 1, y: yc - 3, width: lw + 2, height: 6 }, { fill: "var(--surface-2)" }));
            k.push(W(coil));
            k.push(T(lx + lw / 2, yc - 20, `L ${RF.si(p.L, "H")}`, { fill: "var(--ink)", fontWeight: 600 }, { "text-anchor": "middle" }));
            // shunt cap to ground
            const cxp = xa + span * 0.78;
            k.push(W(`M${cxp} ${yc}V${yc + 38}M${cxp - 14} ${yc + 38}H${cxp + 14}M${cxp - 14} ${yc + 46}H${cxp + 14}M${cxp} ${yc + 46}V${gy}`));
            k.push(T(cxp + 18, yc + 46, `C ${RF.si(p.C, "F")}`, { fill: "var(--ink)", fontWeight: 600 }));
            k.push(T(xa + span / 2, gy + 20, `step ${i + 1}: Q = ${fmt(p.Q, 3)}`, { fontSize: "11px" }, { "text-anchor": "middle" }));
          });
        }
        svg.replaceChildren(...k);
      }
      RF.dragSvg(svg, (p) => {
        if (p.x > 110 || p.y < 40 || p.y > 140) return null;
        const y0 = p.y, r0 = st.RL;
        return (q) => rlSl.set(RF.clamp(r0 * Math.exp(-(q.y - y0) / 40), 1, 45));
      });

      /* ----- controls ----- */
      const netSeg = RF.seg(ui.ctl, { label: "Network", labelText: "Network", options: NETS, value: st.net, onChange: (v) => { st.net = v; update(); } });
      const rlSl = RF.slider(ui.ctl, { id: "mt-rl", label: "Die impedance", min: 1, max: 45, log: true, value: st.RL, fmt: (v) => fmt(v, 3) + " Ω", onInput: (v) => { st.RL = v; update(); } });
      const f0Sl = RF.slider(ui.ctl, { id: "mt-f0", label: "Design f₀", min: 1, max: 20, step: 0.1, value: st.f0, fmt: (v) => fmt(v, 3) + " GHz", onInput: (v) => { st.f0 = v; update(); } });
      const loSl = RF.slider(ui.ctl, { id: "mt-lo", label: "Band low", min: 0.5, max: 20, step: 0.1, value: st.lo, fmt: (v) => fmt(v, 3) + " GHz", onInput: (v) => { st.lo = Math.min(v, st.hi - 0.1); update(); } });
      const hiSl = RF.slider(ui.ctl, { id: "mt-hi", label: "Band high", min: 0.6, max: 40, step: 0.1, value: st.hi, fmt: (v) => fmt(v, 3) + " GHz", onInput: (v) => { st.hi = Math.max(v, st.lo + 0.1); update(); } });
      const spSl = RF.slider(ui.ctl, { id: "mt-spec", label: "Return loss spec", min: 6, max: 25, step: 0.5, value: st.spec, fmt: (v) => fmt(v, 3) + " dB", onInput: (v) => { st.spec = v; update(); } });
      const set = (o) => {
        Object.assign(st, o);
        netSeg.set(st.net, true); rlSl.set(st.RL, true); f0Sl.set(st.f0, true); loSl.set(st.lo, true); hiSl.set(st.hi, true); spSl.set(st.spec, true);
        update();
      };
      RF.presets(ui.ctl, "Try", [
        { label: "10 W die (25 Ω)", go: () => set({ RL: 25 }) },
        { label: "50 W die (5 Ω)", go: () => set({ RL: 5 }) },
        { label: "100 W die (2.5 Ω)", go: () => set({ RL: 2.5 }) },
        { label: "Narrow band 3.8–4.2", go: () => set({ lo: 3.8, hi: 4.2 }) },
        { label: "2–6 GHz", go: () => set({ lo: 2, hi: 6, f0: 4 }) },
      ]);
      const tableBox = el("div", { class: "tscroll" });
      ui.ctl.append(tableBox);

      /* ----- plots ----- */
      const pS = RF.plot(ui.plots, { x: { min: 0, max: 1 }, y: { min: -40, max: 0 }, series: [{ pts: [[0, 0], [1, 0]], color: "var(--s1)" }] });
      const smith = RF.smith(ui.plots, { title: "" });
      smith.box.style.maxWidth = "440px";

      function bandwidth(net, d) {
        const f0 = st.f0 * 1e9;
        const fs = RF.linspace(0.02 * f0, 2.4 * f0, 1200);
        const ok = fs.map((f) => -RF.db20(cx.abs(cx.gamma(zin(net, d, f, f0, st.RL), RH))) >= st.spec);
        let i0 = Math.round((1 - 0.02) / (2.4 - 0.02) * (fs.length - 1));
        if (!ok[i0]) return null;
        let a = i0, z = i0;
        while (a > 0 && ok[a - 1]) a--;
        while (z < fs.length - 1 && ok[z + 1]) z++;
        return { lo: fs[a] / 1e9, hi: fs[z] / 1e9 };
      }

      function update() {
        const f0 = st.f0 * 1e9;
        const d = design(st.RL, f0);
        drawBench(d);
        const fmax = Math.max(2 * st.f0, st.hi * 1.15);
        const fs = RF.linspace(0.02 * st.f0, fmax, 700);
        const series = NETS.map((n) => ({
          name: n.label,
          color: n.color,
          width: n.v === st.net ? 3 : 2,
          opacity: n.v === st.net ? 1 : 0.5,
          pts: fs.map((fg) => [fg, RF.db20(Math.max(1e-5, cx.abs(cx.gamma(zin(n.v, d, fg * 1e9, f0, st.RL), RH))))]),
        }));
        pS.update({
          title: "S11 at the 50 Ω port",
          subtitle: `All four networks at once. The selected one is drawn heavier. Shaded band is your target, the line is the −${fmt(st.spec, 3)} dB spec.`,
          height: 300,
          x: { min: 0, max: fmax, label: "Frequency (GHz)", fmt: (v) => fmt(v, 3) },
          y: { min: -40, max: 0, label: "S11 (dB)" },
          series,
          bands: [{ x0: st.lo, x1: st.hi, label: `target ${fmt(st.lo, 3)}–${fmt(st.hi, 3)} GHz` }],
          hlines: [{ y: -st.spec, label: `spec −${fmt(st.spec, 3)} dB` }],
          vlines: [{ x: st.f0, label: `f₀ ${fmt(st.f0, 3)}`, dy: 30 }],
          tipX: (v) => fmt(v, 3) + " GHz", tipY: (v) => fmt(v, 3) + " dB",
        });

        // Smith path at f0, element by element, plus the band sweep of the selected network
        const paths = [];
        let z = cx.C(st.RL);
        const pathPts = [cx.gamma(z, RH)];
        for (const stp of steps(st.net, d, f0, f0)) {
          const z0 = z;
          for (let t = 0.02; t <= 1.0001; t += 0.02) pathPts.push(cx.gamma(stp.go(z0, t), RH));
          z = stp.go(z0);
        }
        const sweep = RF.linspace(st.lo * 1e9, st.hi * 1e9, 160).map((f) => cx.gamma(zin(st.net, d, f, f0, st.RL), RH));
        const col = NETS.find((n) => n.v === st.net).color;
        paths.push({ pts: sweep, color: "var(--ink-2)", width: 1.5, opacity: 0.6 });
        paths.push({ pts: pathPts, color: col, width: 3 });
        const gSpec = Math.pow(10, -st.spec / 20);
        smith.update({
          title: "The same match on the Smith chart",
          subtitle: `Heavy path: each element at f₀, from the die to the centre. Thin grey curve: the result across ${fmt(st.lo, 3)}–${fmt(st.hi, 3)} GHz. Circle: the spec.`,
          circles: [{ r: gSpec, color: "var(--good)", width: 1.5, opacity: 0.8 }],
          paths,
          points: [{ g: cx.gamma(cx.C(st.RL), RH), color: "var(--ink)", label: `die ${fmt(st.RL, 3)} Ω` }, { g: pathPts[pathPts.length - 1], color: col }],
          aria: "Smith chart path of the selected matching network",
        });

        // table
        const rows = NETS.map((n) => {
          const bw = bandwidth(n.v, d);
          const covers = bw && bw.lo <= st.lo && bw.hi >= st.hi;
          const fb = bw ? (200 * (bw.hi - bw.lo)) / (bw.hi + bw.lo) : 0;
          return { n, bw, covers, fb };
        });
        const tbl = el("table", { class: "mini" });
        tbl.append(el("tr", null, ["Network", `Band at ${fmt(st.spec, 3)} dB`, "Fractional BW", "Your band"].map((h) => el("th", { text: h }))));
        for (const r of rows) {
          const sw = el("i");
          sw.style.cssText = `display:inline-block;width:14px;height:3px;border-radius:2px;margin-right:7px;vertical-align:middle;background:${r.n.color}`;
          const first = el("td", null, [sw, document.createTextNode(r.n.label)]);
          const verdict = el("span", { class: "pill " + (r.covers ? "good" : "bad"), text: r.covers ? "covers" : "misses" });
          tbl.append(el("tr", { class: r.n.v === st.net ? "hot" : "" }, [
            first,
            el("td", { text: r.bw ? `${fmt(r.bw.lo, 3)}–${fmt(r.bw.hi, 3)} GHz` : "never meets it" }),
            el("td", { text: r.bw ? fmt(r.fb, 3) + " %" : "0 %" }),
            el("td", null, [verdict]),
          ]));
        }
        tableBox.replaceChildren(tbl);

        const fbTarget = (200 * (st.hi - st.lo)) / (st.hi + st.lo);
        const r = RH / st.RL;
        const eq = [
          { name: "Transformation ratio and your band", f: `r = 50 / ${fmt(st.RL, 3)} = ${b(fmt(r, 3))}     target fractional BW = (f_hi − f_lo) / f_center = ${b(fmt(fbTarget, 3) + " %")}` },
        ];
        if (st.net === "L1") eq.push(
          { name: "One L-section: its Q is fixed by the ratio", f: `Q = √(r − 1) = √(${fmt(r - 1, 3)}) = ${b(fmt(d.L1.Q, 3))}   → rough fractional BW ≈ 1/Q ≈ ${b(fmt(100 / d.L1.Q, 3) + " %")}` },
          { name: "Series element on the low-R side, shunt element across the high-R side", f: `X_series = Q·R_low = ${fmt(d.L1.Q * st.RL, 3)} Ω → L = ${b(RF.si(d.L1.L, "H"))}     X_shunt = R_high/Q = ${fmt(RH / d.L1.Q, 3)} Ω → C = ${b(RF.si(d.L1.C, "F"))}` });
        if (st.net === "L2") eq.push(
          { name: "Two steps through the geometric mean", f: `R_mid = √(R_low·50) = ${b(fmt(d.L2.Rm, 3) + " Ω")}     each step ratio = ${fmt(Math.sqrt(r), 3)}` },
          { name: "Each step has a much lower Q", f: `Q per step = √(${fmt(Math.sqrt(r), 3)} − 1) = ${b(fmt(d.L2.a.Q, 3))}   vs ${fmt(d.L1.Q, 3)} for one step` });
        if (st.net === "Q1") eq.push(
          { name: "Quarter-wave transformer", f: `Z₁ = √(Z_load · Z₀) = √(${fmt(st.RL, 3)} × 50) = ${b(fmt(d.Q1.Z, 3) + " Ω")}, length λ/4 at f₀` },
          { name: "Why it works: a λ/4 line inverts the load", f: `Z_in = Z₁² / Z_load = ${fmt(d.Q1.Z, 3)}² / ${fmt(st.RL, 3)} = ${b("50 Ω")} (only exactly at f₀)` });
        if (st.net === "Q2") eq.push(
          { name: "Binomial two-section transformer (steps of ¼, ½, ¼ in log Z)", f: `Z_a = R_low^¾·50^¼ = ${b(fmt(d.Q2.Za, 3) + " Ω")}     Z_b = R_low^¼·50^¾ = ${b(fmt(d.Q2.Zb, 3) + " Ω")}` });
        eq.push({ name: "The ceiling no network beats (Bode–Fano, for a die with drain capacitance C_ds)", f: `∫ ln(1/|Γ|) dω ≤ π / (R·C_ds)   → more bandwidth costs match quality` });
        RF.setEqs(ui.eqs, eq);
      }

      RF.setSay(ui.say, {
        quote: "A single section is a quarter-wave transformer at √(5·50), about 16 Ω. But 10 to 1 means Q ≈ 3, around 30 % bandwidth, so for 2 to 6 GHz I'd step it down in multiple sections. On-chip those would be lumped L-C, and I'd absorb the drain capacitance into the first section. Bode–Fano sets the ceiling.",
        bullets: [
          "Bigger ratio → higher Q → narrower band. Split the ratio into smaller steps to widen it.",
          "Shunt element across the larger resistance, series element next to the smaller one.",
          "A taper is the limit of infinitely many sections, but it must be about λ/2 long at the lowest frequency. That's centimetres at 2 GHz, too big for an MMIC.",
          "Low-pass L-C ladders are also low-pass filters. They pass DC and can double as a bias path.",
        ],
      });

      RF.predict(ui.predict, [
        { q: "Quarter-wave transformer from a 5 Ω die to 50 Ω. What impedance is the line?", unit: "Ω", answer: () => Math.sqrt(250), tol: 0.05, apply: () => set({ RL: 5, net: "Q1" }), explain: "√(5 × 50) = √250 = 15.8 Ω." },
        { q: "A single L-section from 5 Ω to 50 Ω. What's its Q?", unit: "", answer: () => 3, tol: 0.05, apply: () => set({ RL: 5, net: "L1" }), explain: "Q = √(50/5 − 1) = √9 = 3." },
        { q: "What fractional bandwidth is 2 to 6 GHz?", unit: "%", answer: () => 100, tol: 0.05, apply: () => set({ lo: 2, hi: 6, f0: 4 }), explain: "4 GHz wide around a 4 GHz centre is 100 %. One section with Q = 3 gives roughly 33 %." },
        { q: "Two L steps from 5 Ω to 50 Ω. What's the intermediate resistance?", unit: "Ω", answer: () => Math.sqrt(250), tol: 0.05, apply: () => set({ RL: 5, net: "L2" }), explain: "Step through the geometric mean, √(5 × 50) = 15.8 Ω. Each step is then 3.16:1 with Q ≈ 1.5." },
        { q: "Die at 2.5 Ω (a 100 W part). Q of a single L-section?", unit: "", answer: () => Math.sqrt(19), tol: 0.05, apply: () => set({ RL: 2.5, net: "L1" }), explain: "√(20 − 1) = 4.4. The bigger the device, the harder the broadband match." },
      ], "matching");

      update();
      return {};
    },
  });
})();
