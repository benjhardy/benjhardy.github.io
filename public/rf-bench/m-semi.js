/* Module: GaAs vs silicon. Band structure, carrier velocity, speed against voltage, and substrate loss. */
(function () {
  "use strict";
  const { el, s, fmt, b } = RF;
  const EPS0 = 8.854e-12;

  /* Room-temperature textbook values, rounded. vEff is a rough effective transit velocity for a short FET channel. */
  const MAT = {
    si: { name: "Si", color: "var(--s1)", eg: 1.12, gap: "indirect", mu: 1400, muH: 450, vsat: 1.0e7, vEff: 1.0e7, ec: 0.3, er: 11.7, k: 150, tand: 0.0005, rho: null, gun: 0 },
    gaas: { name: "GaAs", color: "var(--s2)", eg: 1.42, gap: "direct", mu: 8500, muH: 400, vsat: 1.0e7, vEff: 1.5e7, ec: 0.4, er: 12.9, k: 46, tand: 0.0006, rho: 1e5, gun: 4 },
    inp: { name: "InP", color: "var(--s4)", eg: 1.34, gap: "direct", mu: 5400, muH: 200, vsat: 1.0e7, vEff: 2.5e7, ec: 0.5, er: 12.5, k: 68, tand: 0.0006, rho: 1e5, gun: 8 },
    gan: { name: "GaN", color: "var(--s3)", eg: 3.4, gap: "direct", mu: 1500, muH: 30, vsat: 2.5e7, vEff: 1.5e7, ec: 3.3, er: 9, k: 130, tand: 0.0005, rho: 1e5, gun: 0 },
  };
  const KEYS = Object.keys(MAT);

  /* v(E), E in kV/cm, returns cm/s. Simple fits: Caughey-Thomas for Si and GaN, the Kroemer form for the transferred-electron materials. */
  function vel(m, E) {
    const e = E * 1e3;
    if (m.gun) {
      const r = Math.pow(E / m.gun, 4);
      return (m.mu * e + m.vsat * r) / (1 + r);
    }
    return (m.mu * e) / Math.sqrt(1 + Math.pow((m.mu * e) / m.vsat, 2));
  }
  const fT = (m, lgNm) => m.vEff * 1e-2 / (2 * Math.PI * lgNm * 1e-9);
  const jfom = (m) => (m.ec * 1e8 * m.vsat * 1e-2) / (2 * Math.PI);   /* V·Hz */
  const lambdaNm = (eg) => 1240 / eg;

  RF.register({
    id: "semi",
    tab: "GaAs vs Si",
    sub: "bands · mobility · substrate",
    build(root) {
      const ui = RF.scaffold(root, {
        who: "Senior question · why not just use silicon?",
        title: "GaAs and silicon: different physics, different jobs",
        lede: "Silicon wins on cost, thermal conductivity and integration. GaAs has faster electrons and a substrate that barely conducts, so its passives have much less loss. Pick two materials and compare them.",
        benchTitle: "Band structure",
        plotTitle: "Speed, voltage and substrate loss",
      });
      const st = { a: "si", b: "gaas", lg: 100, rho: 10, f: 10 };
      const rhoOf = (k) => (MAT[k].rho == null ? st.rho * 0.01 : MAT[k].rho);     /* Ω·m; the Si slider is in Ω·cm */
      const tanD = (k, fGHz) => MAT[k].tand + 1 / (2 * Math.PI * fGHz * 1e9 * EPS0 * MAT[k].er * rhoOf(k));

      /* ----- drawing: E-k sketch ----- */
      const svg = s("svg", { viewBox: "0 0 560 210", role: "img", "aria-label": "Sketch of energy against momentum for the two materials, showing direct or indirect gaps" });
      ui.draw.append(svg, el("div", { class: "hint", text: "A sketch, not to scale. A direct gap lets an electron drop and emit a photon. An indirect gap needs a phonon too, so silicon is a very poor light source." }));
      function panel(k, x0, w) {
        const m = MAT[k], out = [];
        const yV = 150, h = RF.clamp(m.eg * 34, 30, 112), yC = yV - h;
        const cx0 = x0 + w / 2;
        let dv = "", dc = "";
        for (let i = 0; i <= 40; i++) {
          const u = -1 + i / 20;
          const x = cx0 + (u * w) / 2;
          const yv = yV + 50 * u * u;
          const kMin = m.gap === "indirect" ? 0.7 : 0;
          const yc = m.gap === "indirect"
            ? yC + 60 * Math.pow(Math.abs(u) - kMin, 2)
            : yC - 0 + 72 * u * u;
          dv += (i ? "L" : "M") + x.toFixed(1) + " " + Math.min(yv, 205).toFixed(1);
          dc += (i ? "L" : "M") + x.toFixed(1) + " " + Math.max(yc, 6).toFixed(1);
        }
        out.push(s("path", { d: dv }, { fill: "none", stroke: "var(--ink-2)", strokeWidth: 2 }));
        out.push(s("path", { d: dc }, { fill: "none", stroke: m.color, strokeWidth: 2.5 }));
        const xC = m.gap === "indirect" ? cx0 + 0.7 * (w / 2) : cx0;
        out.push(s("line", { x1: xC, x2: cx0, y1: yC + 3, y2: yV - 3 }, { stroke: "var(--gold)", strokeWidth: 2, strokeDasharray: "4 3" }));
        out.push(s("circle", { cx: xC, cy: yC, r: 4 }, { fill: m.color }));
        out.push(s("circle", { cx: cx0, cy: yV, r: 4 }, { fill: "var(--ink-2)" }));
        out.push(s("text", { x: cx0, y: 16, "text-anchor": "middle", "font-size": 13, "font-weight": 600, text: `${m.name}: ${m.eg} eV, ${m.gap}` }, { fill: "var(--ink)" }));
        return out;
      }
      function drawBench() {
        svg.replaceChildren(...panel(st.a, 20, 240), ...panel(st.b, 300, 240));
      }

      /* ----- controls ----- */
      const opts = KEYS.map((k) => ({ v: k, label: MAT[k].name }));
      RF.seg(ui.ctl, { labelText: "Material A", options: opts, value: st.a, onChange: (v) => { st.a = v; update(); } });
      RF.seg(ui.ctl, { labelText: "Material B", options: opts, value: st.b, onChange: (v) => { st.b = v; update(); } });
      const lgSl = RF.slider(ui.ctl, { id: "se-lg", label: "Gate length", min: 20, max: 1000, log: true, value: st.lg, fmt: (v) => fmt(v, 3) + " nm", onInput: (v) => { st.lg = v; update(); } });
      const rhoSl = RF.slider(ui.ctl, { id: "se-rho", label: "Si substrate ρ", min: 1, max: 10000, log: true, value: st.rho, fmt: (v) => fmt(v, 3) + " Ω·cm", onInput: (v) => { st.rho = v; update(); } });
      const fSl = RF.slider(ui.ctl, { id: "se-f", label: "Frequency", min: 0.1, max: 100, log: true, value: st.f, fmt: (v) => fmt(v, 3) + " GHz", onInput: (v) => { st.f = v; update(); } });
      const set = (o) => { Object.assign(st, o); lgSl.set(st.lg, true); rhoSl.set(st.rho, true); fSl.set(st.f, true); update(); };
      RF.presets(ui.ctl, "Si substrate", [
        { label: "Bulk CMOS, 10 Ω·cm", go: () => set({ rho: 10 }) },
        { label: "High-res SOI, 1 kΩ·cm", go: () => set({ rho: 1000 }) },
      ]);
      const tblBox = el("div", { class: "tscroll" });
      ui.ctl.append(tblBox);

      const pV = RF.plot(ui.plots, { x: { min: 0.1, max: 1000, log: true }, y: { min: 0, max: 3 }, series: [{ pts: [[0.1, 0], [1000, 1]], color: "var(--s1)" }] });
      const pJ = RF.plot(ui.plots, { x: { min: 1, max: 1000, log: true }, y: { min: 1, max: 1000, log: true }, series: [{ pts: [[1, 1], [1000, 1000]], color: "var(--s1)" }] });
      const pT = RF.plot(ui.plots, { x: { min: 0.1, max: 100, log: true }, y: { min: 1e-4, max: 100, log: true }, series: [{ pts: [[0.1, 1e-4], [100, 100]], color: "var(--s1)" }] });

      function update() {
        drawBench();
        const A = MAT[st.a], B = MAT[st.b];
        const pair = st.a === st.b ? [st.a] : [st.a, st.b];

        // table
        const t = el("table", { class: "mini" });
        t.append(el("tr", null, ["", ...KEYS.map((k) => MAT[k].name)].map((h) => el("th", { text: h }))));
        const row = (label, f) => t.append(el("tr", null, [el("td", { text: label }), ...KEYS.map((k) => {
          const td = el("td", { text: f(MAT[k], k) });
          if (k === st.a || k === st.b) td.style.background = "var(--gold-soft)";
          return td;
        })]));
        row("Bandgap (eV)", (m) => fmt(m.eg, 3));
        row("Gap type", (m) => m.gap);
        row("Electron mobility (cm²/V·s)", (m) => String(m.mu));
        row("Hole mobility (cm²/V·s)", (m) => String(m.muH));
        row("Saturation velocity (10⁷ cm/s)", (m) => fmt(m.vsat / 1e7, 2));
        row("Breakdown field (MV/cm)", (m) => fmt(m.ec, 2));
        row("Dielectric constant", (m) => fmt(m.er, 3));
        row("Thermal conductivity (W/m·K)", (m) => String(m.k));
        row("Substrate ρ (Ω·cm)", (m, k) => (m.rho == null ? fmt(st.rho, 3) : "~10⁷"));
        row(`tan δ at ${fmt(st.f, 3)} GHz`, (m, k) => fmt(tanD(k, st.f), 2));
        row(`f_T at ${fmt(st.lg, 3)} nm (GHz)`, (m) => fmt(fT(m, st.lg) / 1e9, 3));
        tblBox.replaceChildren(el("div", { class: "muted", style: "font-size:12.5px;margin-bottom:4px", text: "Typical room-temperature values, rounded. Sources vary. GaN and InP mobility in a real HEMT channel is higher. GaN's substrate is usually SiC." }), t);

        // velocity
        const Es = RF.logspace(0.1, 1000, 300);
        pV.update({
          title: "Electron velocity against field",
          subtitle: "Mobility is the slope at low field. GaAs and InP overshoot to a peak, then fall as electrons transfer to a heavier valley. Simple fits.",
          height: 240,
          x: { min: 0.1, max: 1000, log: true, label: "Electric field (kV/cm)", fmt: (v) => fmt(v, 2) },
          y: { min: 0, max: 3.5, label: "Velocity (10⁷ cm/s)" },
          series: pair.map((k) => ({ name: MAT[k].name, pts: Es.map((E) => [E, vel(MAT[k], E) / 1e7]), color: MAT[k].color })),
          tipX: (v) => fmt(v, 3) + " kV/cm", tipY: (v) => fmt(v, 3) + " ×10⁷",
        });

        // Johnson
        const fsT = RF.logspace(1, 1000, 60);
        const Vmax = (k, fG) => jfom(MAT[k]) / (fG * 1e9);
        pJ.update({
          title: "Speed against voltage: the Johnson limit",
          subtitle: "f_T × BV ≈ E_c·v_sat/2π. You can't have both. The dots are the f_T each gate length gives you.",
          height: 240,
          x: { min: 1, max: 1000, log: true, label: "f_T (GHz)", fmt: (v) => fmt(v, 2) },
          y: { min: 0.1, max: 10000, log: true, label: "Max voltage (V)", fmt: (v) => fmt(v, 2) },
          series: pair.map((k) => ({ name: MAT[k].name, pts: fsT.map((f) => [f, Vmax(k, f)]), color: MAT[k].color })),
          markers: pair.map((k, i) => ({ x: fT(MAT[k], st.lg) / 1e9, y: Vmax(k, fT(MAT[k], st.lg) / 1e9), color: MAT[k].color, dy: i ? 18 : -10, label: `${MAT[k].name} ${fmt(fT(MAT[k], st.lg) / 1e9, 3)} GHz` })),
          tipX: (v) => fmt(v, 3) + " GHz", tipY: (v) => fmt(v, 3) + " V",
        });

        // tan delta
        const fsS = RF.logspace(0.1, 100, 120);
        pT.update({
          title: "Substrate loss: why spirals have low Q on bulk silicon",
          subtitle: "tan δ = 1/(2π·f·ε·ρ) plus the material's own. A conducting substrate is also where magnetic eddy currents flow.",
          height: 240,
          x: { min: 0.1, max: 100, log: true, label: "Frequency (GHz)", fmt: (v) => fmt(v, 2) },
          y: { min: 1e-4, max: 100, log: true, label: "tan δ", fmt: (v) => fmt(v, 2) },
          series: pair.map((k) => ({ name: MAT[k].name, pts: fsS.map((f) => [f, tanD(k, f)]), color: MAT[k].color })),
          vlines: [{ x: st.f }],
          markers: pair.map((k) => ({ x: st.f, y: tanD(k, st.f), color: MAT[k].color, label: fmt(tanD(k, st.f), 2) })),
          tipX: (v) => fmt(v, 3) + " GHz", tipY: (v) => fmt(v, 3),
        });

        RF.setEqs(ui.eqs, [
          { name: "Low-field velocity: mobility is the slope", f: `v = μ·E.  μ ratio ${B.name}/${A.name} = ${b(fmt(B.mu / A.mu, 3) + "×")}` },
          { name: "Transit frequency: the gate length matters as much as the material", f: `f_T ≈ v/(2π·L_g):  ${A.name} ${b(fmt(fT(A, st.lg) / 1e9, 3) + " GHz")},  ${B.name} ${b(fmt(fT(B, st.lg) / 1e9, 3) + " GHz")}` },
          { name: "Johnson figure of merit", f: `f_T·BV = E_c·v_sat/2π:  ${A.name} ${b(fmt(jfom(A) / 1e9, 3) + " GHz·V")},  ${B.name} ${b(fmt(jfom(B) / 1e9, 3) + " GHz·V")}` },
          { name: "Substrate conduction as a loss tangent", f: `tan δ ≈ 1/(2π·f·ε₀·εᵣ·ρ):  ${A.name} ${b(fmt(tanD(st.a, st.f), 2))},  ${B.name} ${b(fmt(tanD(st.b, st.f), 2))}` },
          { name: "Photon energy at the gap", f: `λ = 1240/E_g nm:  ${A.name} ${fmt(lambdaNm(A.eg), 3)} nm,  ${B.name} ${fmt(lambdaNm(B.eg), 3)} nm` },
        ]);
      }

      RF.setSay(ui.say, {
        quote: "Three differences matter. Carriers: GaAs electron mobility is about six times silicon's, and that gives low on-resistance and low noise at the same gate length, though silicon has closed much of the speed gap by scaling. Substrate: semi-insulating GaAs is around ten to the seven ohm centimeters and bulk silicon is around ten, so GaAs gets high-Q spirals and low-loss lines right on the die. Band structure: GaAs has a direct gap, so it can emit light, and a larger gap with higher breakdown. Silicon's advantages are cost, integration, a native oxide, and three times the thermal conductivity. So I use silicon when integration dominates, and GaAs or GaN for the power amp, the low-noise front end and the high-Q passives. GaN adds about ten times the breakdown field for power.",
        bullets: [
          "No good oxide or fast holes in GaAs: no native gate oxide like SiO₂ and hole mobility about 20 times lower than its electrons, so no CMOS-style complementary logic. That's why RF GaAs is HEMTs and HBTs.",
          "HEMT: electrons sit in an undoped channel at a heterojunction (the 2DEG), away from dopants that would scatter them. That's the source of the low noise.",
          "Thermal: GaAs at 46 W/m·K traps heat, so MMICs are thinned to 100 µm or less with backside vias, which also gives a low-inductance ground. GaN on SiC is far better.",
          "EM simulation: Si substrate loss and eddy currents must be modeled, so the stackup's conductivity matters. On GaAs, conductor loss dominates and the substrate is nearly lossless.",
          "Velocity numbers are approximate. Peak GaAs velocity is about 2×10⁷ cm/s near 4 kV/cm, and saturation is around 1×10⁷.",
        ],
        note: "Values here are textbook approximations, good for intuition and comparison. Use a foundry PDK for real numbers.",
      });

      RF.predict(ui.predict, [
        { q: "Electron mobility: GaAs 8500, Si 1400. Ratio, GaAs over Si?", unit: "×", answer: () => 8500 / 1400, absTol: 0.6, explain: "About 6×. Saturated velocity differs far less, so the advantage shrinks at short gate lengths." },
        { q: "v = 1.5×10⁷ cm/s and L_g = 100 nm. f_T?", unit: "GHz", answer: () => (1.5e5 / (2 * Math.PI * 1e-7)) / 1e9, absTol: 25, apply: () => set({ lg: 100 }), explain: "1.5×10⁵ m/s / (2π × 100 nm) ≈ 240 GHz, before parasitics." },
        { q: "Bulk Si at 10 Ω·cm, εᵣ 11.7, at 10 GHz. Substrate tan δ?", unit: "", answer: () => 1 / (2 * Math.PI * 1e10 * EPS0 * 11.7 * 0.1), absTol: 0.2, apply: () => set({ rho: 10, f: 10 }), explain: "About 1.5, which is hugely lossy. Semi-insulating GaAs is about 0.0006, set by the material itself." },
        { q: "GaAs, E_g = 1.42 eV. Emission wavelength?", unit: "nm", answer: () => 1240 / 1.42, absTol: 20, explain: "1240/1.42 ≈ 873 nm, in the near infrared." },
        { q: "Thermal conductivity, Si 150 and GaAs 46 W/m·K. How many times better is Si?", unit: "×", answer: () => 150 / 46, absTol: 0.4, explain: "About 3×. That's a big reason GaAs dies are thinned." },
      ], "semi");

      update();
      return {};
    },
  });
})();
