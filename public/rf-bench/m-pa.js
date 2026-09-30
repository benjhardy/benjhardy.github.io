/* Module: PA load line and transistor periphery. */
(function () {
  "use strict";
  const { el, s, fmt, b } = RF;
  const dBm = (w) => 10 * Math.log10(w / 1e-3);

  RF.register({
    id: "pa",
    tab: "PA load line",
    sub: "R_opt · fingers",
    build(root) {
      const ui = RF.scaffold(root, {
        who: "Senior question · power amplifiers and devices",
        title: "Why a big transistor wants a few ohms",
        lede: "The drain voltage can only swing between the knee and about twice the supply. With the voltage capped, more watts means more current, and that means a lower load. Grow the transistor on the left and watch the optimum load fall.",
      });
      const st = { nof: 8, ugw: 100, J: 0.83, vdd: 28, vk: 4, R: 30, bridge: "air" };
      const derive = () => {
        const W = (st.nof * st.ugw) / 1000;
        const Imax = st.J * W;
        const Vsw = st.vdd - st.vk;
        const Ropt = (2 * Vsw) / Imax;
        const Pmax = (Vsw * Imax) / 4;
        const cur = st.R <= Ropt;
        const P = cur ? (Imax * Imax * st.R) / 8 : (Vsw * Vsw) / (2 * st.R);
        const Ia = cur ? Imax / 2 : Vsw / st.R;
        const Va = Ia * st.R;
        const Pdc = (st.vdd * Imax) / 2;
        return { W, Imax, Vsw, Ropt, Pmax, cur, P, Ia, Va, Pdc, eff: P / Pdc };
      };

      /* ----- drawing: interdigitated FET, top view ----- */
      const svg = s("svg", { viewBox: "0 0 560 260", role: "img", "aria-label": "Interdigitated transistor layout with gate fingers, source and drain contacts" });
      ui.draw.append(svg, el("div", { class: "hint", text: "Drag the drain bus up or down to change finger width (UGW). Drag the right edge to add or remove fingers." }));
      const X0 = 60, XMAX = 470;
      const ybOf = (L) => 145 + L / 2; // keeps the cell vertically centred as UGW changes
      const lenPx = () => 36 + (st.ugw / 500) * 110;
      const widthPx = () => Math.min(XMAX - X0, 26 + st.nof * 17);

      function drawBench(d) {
        const k = [];
        const T = (x, y, t, sty = {}, at = {}) => s("text", Object.assign({ x, y, "font-size": 12, text: t }, at), Object.assign({ fill: "var(--ink-2)" }, sty));
        const L = lenPx(), Wd = widthPx();
        const YB = ybOf(L);
        const yTop = YB - 16 - L;
        k.push(s("rect", { x: X0 - 34, y: yTop - 34, width: Wd + 68, height: L + 70, rx: 6 }, { fill: "var(--substrate)", stroke: "var(--substrate-edge)", strokeWidth: 1 }));
        // buses
        k.push(s("rect", { x: X0 - 6, y: yTop - 22, width: Wd + 12, height: 14, rx: 2 }, { fill: "var(--gold)" }));
        k.push(s("rect", { x: X0 - 6, y: YB - 8, width: Wd + 12, height: 10, rx: 2 }, { fill: "var(--via)", opacity: 0.85 }));
        k.push(T(X0 + Wd + 14, yTop - 11, "drain bus", { fontSize: "11px" }));
        k.push(T(X0 + Wd + 14, YB + 2, "gate bus", { fontSize: "11px" }));
        const nC = st.nof + 1;
        const pitch = Wd / nC;
        const cw = Math.max(3, pitch * 0.55);
        for (let i = 0; i < nC; i++) {
          const x = X0 + pitch * (i + 0.5);
          const isD = i % 2 === 1;
          const top = isD ? yTop - 8 : yTop;
          k.push(s("rect", { x: x - cw / 2, y: top, width: cw, height: YB - 16 - top }, { fill: "var(--gold)", opacity: isD ? 1 : 0.75 }));
          if (nC <= 17) k.push(T(x, yTop + L / 2 + 4, isD ? "D" : "S", { fontSize: "10px", fill: "var(--ink)", fontWeight: 600 }, { "text-anchor": "middle" }));
          if (!isD && st.bridge === "via") k.push(s("circle", { cx: x, cy: yTop + L * 0.25, r: Math.min(cw / 2 - 0.5, 5) }, { fill: "var(--via)", stroke: "var(--surface)", strokeWidth: 1 }));
        }
        for (let i = 0; i < st.nof; i++) {
          const x = X0 + pitch * (i + 1);
          k.push(s("line", { x1: x, x2: x, y1: yTop + 4, y2: YB - 8 }, { stroke: "var(--s1)", strokeWidth: 2 }));
        }
        if (st.bridge === "air") {
          for (let i = 0; i + 2 < nC; i += 2) {
            const xa = X0 + pitch * (i + 0.5), xb = X0 + pitch * (i + 2.5);
            const yb = yTop + L * 0.3;
            k.push(s("path", { d: `M${xa} ${yb}Q${(xa + xb) / 2} ${yb - 26} ${xb} ${yb}` }, { fill: "none", stroke: "var(--gold-ink)", strokeWidth: 2.5 }));
          }
        }
        // dimension labels
        k.push(s("path", { d: `M${X0 - 20} ${yTop}V${YB - 16}M${X0 - 24} ${yTop}H${X0 - 16}M${X0 - 24} ${YB - 16}H${X0 - 16}` }, { fill: "none", stroke: "var(--ink-2)", strokeWidth: 1 }));
        k.push(T(X0 - 26, (yTop + YB) / 2, `UGW ${fmt(st.ugw, 3)} µm`, { fill: "var(--ink)", fontWeight: 600, fontSize: "11px" }, { "text-anchor": "middle", transform: `rotate(-90 ${X0 - 26} ${(yTop + YB) / 2})` }));
        k.push(T(X0 + Wd / 2, 16, `${st.nof} gate fingers × ${fmt(st.ugw, 3)} µm = ${fmt(d.W, 3)} mm periphery`, { fill: "var(--ink)", fontWeight: 600 }, { "text-anchor": "middle" }));
        k.push(T(X0 + Wd / 2, YB + 26, st.bridge === "air" ? "air bridges tie the sources together over the drains" : "a via under each source goes straight to backside ground", { fontSize: "11px" }, { "text-anchor": "middle" }));
        // handles
        k.push(s("circle", { cx: X0 + Wd / 2, cy: yTop - 15, r: 9 }, { fill: "var(--surface)", stroke: "var(--gold-ink)", strokeWidth: 1.5 }));
        k.push(s("circle", { cx: X0 + Wd + 6, cy: (yTop + YB) / 2, r: 9 }, { fill: "var(--surface)", stroke: "var(--gold-ink)", strokeWidth: 1.5 }));
        svg.replaceChildren(...k);
      }
      RF.dragSvg(svg, (p) => {
        const L = lenPx(), Wd = widthPx(), YB = ybOf(L), yTop = YB - 16 - L;
        if (Math.hypot(p.x - (X0 + Wd / 2), p.y - (yTop - 15)) < 22) {
          const y0 = p.y, u0 = st.ugw; // the centred handle moves half as far as the finger length changes
          return (q) => { ugwSl.set(Math.round(RF.clamp(u0 - ((2 * (q.y - y0)) / 110) * 500, 25, 500) / 5) * 5); };
        }
        if (Math.hypot(p.x - (X0 + Wd + 6), p.y - (yTop + YB) / 2) < 22) {
          return (q) => { const n = Math.round((q.x - 6 - X0 - 26) / 17 / 2) * 2; nofSl.set(RF.clamp(n, 2, 24)); };
        }
        return null;
      });

      /* ----- controls ----- */
      const nofSl = RF.slider(ui.ctl, { id: "pa-nof", label: "Fingers (NOF)", min: 2, max: 24, step: 2, value: st.nof, fmt: (v) => String(v), onInput: (v) => { st.nof = v; update(); } });
      const ugwSl = RF.slider(ui.ctl, { id: "pa-ugw", label: "Finger width (UGW)", min: 25, max: 500, step: 5, value: st.ugw, fmt: (v) => fmt(v, 3) + " µm", onInput: (v) => { st.ugw = v; update(); } });
      const jSl = RF.slider(ui.ctl, { id: "pa-j", label: "Current density", min: 0.4, max: 1.5, step: 0.01, value: st.J, fmt: (v) => fmt(v, 3) + " A/mm", onInput: (v) => { st.J = v; update(); } });
      const vddSl = RF.slider(ui.ctl, { id: "pa-vdd", label: "Supply V_DD", min: 5, max: 50, step: 1, value: st.vdd, fmt: (v) => fmt(v, 3) + " V", onInput: (v) => { st.vdd = v; update(); } });
      const vkSl = RF.slider(ui.ctl, { id: "pa-vk", label: "Knee V_k", min: 1, max: 10, step: 0.5, value: st.vk, fmt: (v) => fmt(v, 3) + " V", onInput: (v) => { st.vk = Math.min(v, st.vdd - 1); update(); } });
      const rSl = RF.slider(ui.ctl, { id: "pa-r", label: "Load R_L", min: 1, max: 500, log: true, value: st.R, fmt: (v) => fmt(v, 3) + " Ω", onInput: (v) => { st.R = v; update(); } });
      const brSeg = RF.seg(ui.ctl, { labelText: "Tie the sources with", options: [{ v: "air", label: "Air bridges" }, { v: "via", label: "Source vias" }], value: st.bridge, onChange: (v) => { st.bridge = v; update(); } });
      const set = (o) => {
        Object.assign(st, o);
        nofSl.set(st.nof, true); ugwSl.set(st.ugw, true); jSl.set(st.J, true); vddSl.set(st.vdd, true); vkSl.set(st.vk, true); rSl.set(st.R, true); brSeg.set(st.bridge, true);
        update();
      };
      RF.presets(ui.ctl, "Try", [
        { label: "Snap R_L to R_opt", go: () => set({ R: derive().Ropt }) },
        { label: "8 × 100 µm", go: () => set({ nof: 8, ugw: 100 }) },
        { label: "50 W part", go: () => set({ nof: 20, ugw: 500 }) },
        { label: "48 V GaN", go: () => set({ vdd: 48, vk: 5 }) },
        { label: "One long finger", go: () => set({ nof: 2, ugw: 500 }) },
      ]);
      const ro = RF.readouts(ui.ctl, [
        { key: "imax", label: "I_max" }, { key: "ropt", label: "R_opt" }, { key: "pmax", label: "P_max at R_opt" },
        { key: "p", label: "P_out at your R_L" }, { key: "eff", label: "Drain efficiency" }, { key: "rg", label: "Gate R vs 8×100" },
      ]);

      /* ----- plots ----- */
      const pIV = RF.plot(ui.plots, { x: { min: 0, max: 1 }, y: { min: 0, max: 1 }, series: [{ pts: [[0, 0], [1, 1]], color: "var(--s1)" }] });
      const pP = RF.plot(ui.plots, { x: { min: 1, max: 500, log: true }, y: { min: 0, max: 1 }, series: [{ pts: [[1, 0], [500, 1]], color: "var(--s1)" }] });

      function update() {
        const d = derive();
        drawBench(d);
        const rg = st.ugw / st.nof / (100 / 8);
        ro.update({
          imax: [fmt(d.Imax, 3), "A"], ropt: [fmt(d.Ropt, 3), "Ω"], pmax: [fmt(d.Pmax, 3), `W · ${fmt(dBm(d.Pmax), 3)} dBm`],
          p: [fmt(d.P, 3), `W · ${fmt(dBm(d.P), 3)} dBm`], eff: [fmt(d.eff * 100, 3), "%"], rg: [fmt(rg, 3), "×"],
        });

        // I-V plane
        const vmax = 2 * st.vdd + 4, imaxAx = d.Imax * 1.15;
        const vs = RF.linspace(0, vmax, 160);
        const series = [];
        for (let k = 1; k <= 8; k++) {
          const u = k / 8;
          series.push({ pts: vs.map((v) => [v, d.Imax * u * Math.tanh((2.6 * v) / st.vk)]), color: "var(--axis)", width: 1.2, noLegend: true, noTip: true });
        }
        const ll = (v) => d.Imax / 2 - (v - st.vdd) / st.R;
        series.push({ name: "Load line, slope −1/R_L", pts: vs.map((v) => [v, ll(v)]), color: "var(--s2)", width: 1.5 });
        const va = st.vdd - d.Va, vb = st.vdd + d.Va;
        series.push({ name: "Swing you can actually use", pts: RF.linspace(va, vb, 40).map((v) => [v, ll(v)]), color: "var(--s1)", width: 4 });
        pIV.update({
          title: "Drain I–V with your load line (class A)",
          subtitle: d.cur
            ? `Current-limited: the current hits 0 and I_max before the voltage uses its full ${fmt(d.Vsw, 3)} V of swing.`
            : `Voltage-limited: the voltage hits the knee and 2·V_DD − V_k before the current uses its full range.`,
          height: 300,
          x: { min: 0, max: vmax, label: "V_DS (V)", fmt: (v) => fmt(v, 3) },
          y: { min: 0, max: imaxAx, label: "I_D (A)", fmt: (v) => fmt(v, 2) },
          series,
          vlines: [{ x: st.vk, label: "knee", dy: 16 }, { x: 2 * st.vdd - st.vk, label: "2V_DD − V_k", anchor: "end", dy: 16 }],
          markers: [{ x: st.vdd, y: d.Imax / 2, color: "var(--ink)", label: `bias ${fmt(st.vdd, 3)} V, ${fmt(d.Imax / 2, 3)} A` }],
          tipX: (v) => fmt(v, 3) + " V", tipY: (v) => fmt(v, 3) + " A",
        });

        // Pout vs R
        const rs = RF.logspace(1, 500, 300);
        const pr = (r) => (r <= d.Ropt ? (d.Imax * d.Imax * r) / 8 : (d.Vsw * d.Vsw) / (2 * r));
        pP.update({
          title: "Output power vs load resistance",
          subtitle: `Peak at R_opt = ${fmt(d.Ropt, 3)} Ω. Left of it you run out of current, right of it you run out of voltage.`,
          height: 280,
          x: { min: 1, max: 500, log: true, label: "R_L (Ω)", fmt: (v) => fmt(v, 2) },
          y: { min: 0, max: d.Pmax * 1.18, label: "P_out (W)", fmt: (v) => fmt(v, 2) },
          series: [{ name: "P_out", pts: rs.map((r) => [r, pr(r)]), color: "var(--s1)", area: 0 }],
          bands: [{ x0: 1, x1: d.Ropt, label: "current-limited", opacity: 0.05 }, { x0: d.Ropt, x1: 500, label: "voltage-limited", opacity: 0.02 }],
          vlines: [{ x: d.Ropt, label: `R_opt ${fmt(d.Ropt, 3)} Ω`, dy: 150, anchor: d.Ropt > 60 ? "end" : "start" }, { x: 50, label: "50 Ω", color: "var(--muted)", dy: 200, anchor: "end" }],
          markers: [{ x: st.R, y: d.P, color: "var(--s2)", label: `${fmt(d.P, 3)} W at ${fmt(st.R, 3)} Ω` }],
          tipX: (v) => fmt(v, 3) + " Ω", tipY: (v) => fmt(v, 3) + " W",
        });

        RF.setEqs(ui.eqs, [
          { name: "Periphery sets everything", f: `W = NOF × UGW = ${st.nof} × ${fmt(st.ugw, 3)} µm = ${b(fmt(d.W, 3) + " mm")}     I_max = J × W = ${b(fmt(d.Imax, 3) + " A")}` },
          { name: "Optimum load from the load line", f: `R_opt = 2(V_DD − V_k) / I_max = 2 × ${fmt(d.Vsw, 3)} / ${fmt(d.Imax, 3)} = ${b(fmt(d.Ropt, 3) + " Ω")}` },
          { name: "Same thing from power: P = V²/(2R) with the voltage capped", f: `R_opt = (V_DD − V_k)² / (2·P_max) = ${fmt(d.Vsw, 3)}² / (2 × ${fmt(d.Pmax, 3)}) = ${b(fmt(d.Ropt, 3) + " Ω")}` },
          { name: "Maximum class-A output", f: `P_max = (V_DD − V_k)·I_max / 4 = ${b(fmt(d.Pmax, 3) + " W")} = ${fmt(dBm(d.Pmax), 3)} dBm     (${fmt(d.Pmax / d.W, 3)} W/mm)` },
          {
            name: d.cur ? "Your load is below R_opt: current-limited" : "Your load is above R_opt: voltage-limited",
            f: d.cur ? `P = I_max²·R_L / 8 = ${b(fmt(d.P, 3) + " W")}` : `P = (V_DD − V_k)² / (2·R_L) = ${b(fmt(d.P, 3) + " W")}`,
          },
          { name: "dBm: 0 dBm = 1 mW, +30 dBm = 1 W, every 10 dB is ×10", f: `P(dBm) = 10·log₁₀(P / 1 mW) = 10·log₁₀(${fmt(d.P * 1000, 3)}) = ${b(fmt(dBm(d.P), 3) + " dBm")}` },
          { name: "Gate resistance scales with finger length over finger count", f: `R_g ∝ UGW / NOF = ${fmt(st.ugw, 3)} / ${st.nof} → ${b(fmt(rg, 3) + "×")} the 8 × 100 µm cell` },
        ]);
      }

      RF.setSay(ui.say, {
        quote: "The drain voltage swing is capped by the supply, the knee and breakdown. P = V²/2R, so with V fixed, more power takes more current and a lower R. Periphery sets current, power and capacitance, and R_opt scales inversely with it. That's why big devices want a few ohms and need a matching network to get to 50.",
        bullets: [
          "Long fingers raise gate resistance and cut fmax. The far end of the finger is driven late and weak.",
          "Too many fingers: thermal crowding in the centre, phase spread across the device, more parasitics.",
          "Air bridges are low-capacitance crossovers that tie the trapped terminal together. Source vias are the alternative and help heat and source inductance.",
          "GaN HEMTs are depletion mode: on at 0 V. Bias the gate negative, around −2 to −3 V, to pinch off.",
          "PA outputs get a load-line match, not a conjugate match. Conjugate maximizes small-signal gain, load-line maximizes power.",
        ],
      });

      RF.predict(ui.predict, [
        { q: "8 fingers × 100 µm, and the process gives 5 W/mm. Output power?", unit: "W", answer: () => 4, tol: 0.08, apply: () => set({ nof: 8, ugw: 100, J: 0.83, vdd: 28, vk: 4 }), explain: "0.8 mm × 5 W/mm = 4 W. Periphery is the first number to compute." },
        { q: "28 V supply, 4 V knee, I_max = 0.8 A. What's R_opt?", unit: "Ω", answer: () => 60, tol: 0.06, apply: () => set({ nof: 8, ugw: 100, J: 1.0, vdd: 28, vk: 4, R: 60 }), explain: "2 × (28 − 4) / 0.8 = 60 Ω. A small device is close to 50 Ω already." },
        { q: "You double the periphery. R_opt changes by what factor?", unit: "×", answer: () => 0.5, tol: 0.05, apply: () => set({ nof: 16, ugw: 100 }), explain: "Twice the current at the same voltage means half the resistance." },
        { q: "A 50 W part on 28 V with a 4 V knee. What's R_opt?", unit: "Ω", answer: () => 5.76, tol: 0.08, apply: () => set({ nof: 20, ugw: 500, J: 0.83, vdd: 28, vk: 4 }), explain: "R = V²/(2P) = 24² / 100 = 5.8 Ω. That's the 5 Ω die on the matching tab." },
        { q: "Your load is twice R_opt. What fraction of P_max do you get?", unit: "%", answer: () => 50, tol: 0.06, apply: () => set({ R: 2 * derive().Ropt }), explain: "Voltage-limited: P = V²/(2R), so doubling R halves the power." },
        { q: "10 W is how many dBm?", unit: "dBm", answer: () => 40, absTol: 0.3, explain: "1 W is 30 dBm, ×10 adds 10 dB, so 40 dBm." },
      ], "pa");

      update();
      return {};
    },
  });
})();
