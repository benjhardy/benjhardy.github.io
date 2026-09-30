/* Section inside the Coupled resonators tab: electric vs magnetic coupling, odd vs even mode order. */
(function () {
  "use strict";
  const { cx, el, s, fmt, b } = RF;
  const modesOf = (f0, ke, km) => ({
    odd: f0 / Math.sqrt((1 - km) * (1 + ke)),
    even: f0 / Math.sqrt((1 + km) * (1 - ke)),
  });

  RF.register({
    id: "ctype",
    into: "coupled",
    build(root) {
      const ui = RF.scaffold(root, {
        who: "Senior question · coupling type",
        title: "Which mode sits lower: electric vs magnetic coupling",
        lede: "The size of k doesn't tell you the coupling type. The order of the two modes does. Mutual capacitance pulls the odd mode down. Mutual inductance pulls the even mode down. When both are present they fight, and the bigger one decides which mode is lower.",
        benchTitle: "Two LC resonators and the symmetry plane",
      });
      const st = { ke: 0.03, km: 0.0173, f0: 9.263, view: "odd" };

      /* ----- drawing ----- */
      const svg = s("svg", { viewBox: "0 0 560 262", role: "img", "aria-label": "Two parallel LC resonators coupled by a mutual capacitor and a mutual inductance, with the symmetry plane between them" });
      ui.draw.append(svg, el("div", { class: "hint", text: "Line weight shows how strong each coupling is. Switch between the odd and even mode to see what the symmetry plane becomes." }));
      const TY = 58, GY = 204;
      function drawBench(m) {
        const k = [];
        const T = (x, y, t, sty = {}, at = {}) => s("text", Object.assign({ x, y, "font-size": 12, text: t }, at), Object.assign({ fill: "var(--ink-2)" }, sty));
        const W = (d, w = 1.6, col = "var(--ink)") => s("path", { d }, { fill: "none", stroke: col, strokeWidth: w, strokeLinejoin: "round", strokeLinecap: "round" });
        const odd = st.view === "odd";
        // symmetry plane
        k.push(s("line", { x1: 280, x2: 280, y1: 22, y2: GY + 14, "stroke-dasharray": "5 5" }, { stroke: odd ? "var(--s1)" : "var(--s2)", strokeWidth: 2 }));
        k.push(T(280, 16, odd ? "Perfect E: V = 0 on the plane" : "Perfect H: no current crosses", { fill: "var(--ink)", fontWeight: 600 }, { "text-anchor": "middle" }));
        for (const side of [-1, 1]) {
          const X = (x) => (side < 0 ? x : 560 - x);
          const cX = X(120), lX = X(210);
          k.push(W(`M${X(100)} ${TY}H${X(236)}`));
          k.push(W(`M${X(100)} ${GY}H${X(236)}`, 2.5, "var(--via)"));
          // capacitor C
          const my = (TY + GY) / 2;
          k.push(W(`M${cX} ${TY}V${my - 5}M${cX - 14} ${my - 5}H${cX + 14}M${cX - 14} ${my + 5}H${cX + 14}M${cX} ${my + 5}V${GY}`));
          k.push(T(cX + (side < 0 ? -20 : 20), my + 4, "C", { fill: "var(--ink)" }, { "text-anchor": side < 0 ? "end" : "start" }));
          // inductor L
          let coil = `M${lX} ${TY}V${TY + 30}`;
          for (let i = 0; i < 5; i++) coil += `a6 ${9.2} 0 1 ${side < 0 ? 1 : 0} 0 ${17.6}`;
          coil += `V${GY}`;
          k.push(W(coil));
          k.push(T(lX + (side < 0 ? -16 : 16), TY + 76, "L", { fill: "var(--ink)" }, { "text-anchor": side < 0 ? "end" : "start" }));
          // node voltage label
          const sign = odd && side > 0 ? "−V" : "+V";
          k.push(s("rect", { x: X(150) - 20, y: TY - 30, width: 40, height: 20, rx: 10 }, { fill: odd && side > 0 ? "var(--s2)" : "var(--s1)", opacity: 0.18 }));
          k.push(T(X(150), TY - 16, sign, { fill: "var(--ink)", fontWeight: 700 }, { "text-anchor": "middle" }));
          // current arrow on the coil
          const up = odd && side > 0;
          const ax = lX + (side < 0 ? 14 : -14), ay = TY + 88;
          k.push(W(up ? `M${ax} ${ay + 14}V${ay - 14}M${ax - 5} ${ay - 8}L${ax} ${ay - 14}L${ax + 5} ${ay - 8}` : `M${ax} ${ay - 14}V${ay + 14}M${ax - 5} ${ay + 8}L${ax} ${ay + 14}L${ax + 5} ${ay + 8}`, 1.6, "var(--gold-ink)"));
        }
        // mutual capacitor Cm across the plane, weight follows Cm/C
        const cw = 1 + st.ke * 90;
        k.push(W(`M236 ${TY}H272M288 ${TY}H324`, cw));
        k.push(W(`M272 ${TY - 13}V${TY + 13}M288 ${TY - 13}V${TY + 13}`, Math.max(1.6, cw)));
        k.push(T(280, TY + 30, `Cm/C = ${fmt(st.ke, 3)}`, { fill: "var(--ink)", fontSize: "11.5px" }, { "text-anchor": "middle" }));
        // mutual inductance between the coils
        const mw = 1 + st.km * 90;
        k.push(s("path", { d: `M226 ${TY + 70}Q280 ${TY + 104} 334 ${TY + 70}`, "stroke-dasharray": "2 5" }, { fill: "none", stroke: "var(--gold)", strokeWidth: mw, strokeLinecap: "round" }));
        k.push(T(280, TY + 118, `Lm/L = ${fmt(st.km, 3)}`, { fill: "var(--ink)", fontSize: "11.5px" }, { "text-anchor": "middle" }));
        // what each coupling does in this mode
        const cLine = odd ? "Cm sees 2V across it: C → C + Cm (frequency down)" : "Both ends at +V: Cm carries nothing, C → C − Cm (frequency up)";
        const lLine = odd ? "Currents oppose: L → L − Lm (frequency up)" : "Currents aid: L → L + Lm (frequency down)";
        k.push(T(280, GY + 34, cLine, { fontSize: "11.5px" }, { "text-anchor": "middle" }));
        k.push(T(280, GY + 52, lLine, { fontSize: "11.5px" }, { "text-anchor": "middle" }));
        k.push(T(20, 16, `${odd ? "Odd" : "Even"} mode: ${fmt(odd ? m.odd : m.even, 5)} GHz`, { fill: "var(--ink)", fontWeight: 600, fontSize: "11.5px" }));
        svg.replaceChildren(...k);
      }

      /* ----- controls ----- */
      const viewSeg = RF.seg(ui.ctl, { labelText: "Show", options: [{ v: "odd", label: "Odd mode (+V, −V)" }, { v: "even", label: "Even mode (+V, +V)" }], value: st.view, onChange: (v) => { st.view = v; update(); } });
      const keSl = RF.slider(ui.ctl, { id: "ct-ke", label: "Electric Cm/C", min: 0, max: 0.06, step: 0.0005, value: st.ke, fmt: (v) => fmt(v, 3), onInput: (v) => { st.ke = v; update(); } });
      const kmSl = RF.slider(ui.ctl, { id: "ct-km", label: "Magnetic Lm/L", min: 0, max: 0.06, step: 0.0005, value: st.km, fmt: (v) => fmt(v, 3), onInput: (v) => { st.km = v; update(); } });
      const f0Sl = RF.slider(ui.ctl, { id: "ct-f0", label: "Uncoupled f₀", min: 1, max: 40, step: 0.001, value: st.f0, fmt: (v) => fmt(v, 4) + " GHz", onInput: (v) => { st.f0 = v; update(); } });
      const set = (o) => {
        Object.assign(st, o);
        viewSeg.set(st.view, true); keSl.set(st.ke, true); kmSl.set(st.km, true); f0Sl.set(st.f0, true);
        update();
      };
      RF.presets(ui.ctl, "Try", [
        { label: "Pure electric", go: () => set({ ke: 0.03, km: 0 }) },
        { label: "Pure magnetic", go: () => set({ ke: 0, km: 0.03 }) },
        { label: "Equal, cancels", go: () => set({ ke: 0.03, km: 0.03 }) },
      ]);
      RF.presets(ui.ctl, "Example pair", [
        { label: "Vias centred", go: () => set({ ke: 0.03, km: 0.0173, f0: 9.263 }) },
        { label: "Vias away from gap", go: () => set({ ke: 0.03, km: 0.0075, f0: 9.263 }) },
        { label: "Vias toward gap", go: () => set({ ke: 0.03, km: 0.032, f0: 9.263 }) },
      ]);
      ui.ctl.append(el("div", { class: "caveat" }, [el("b", { text: "Caveat" }),
        el("span", { text: "These presets are an illustrative pair: net k of 0.0127, 0.0225 and 0.0020 as the vias move from centred, to away from the gap, to toward it. The split between Cm and Lm is made up for illustration; a two-peak measurement only gives the net k." })]));
      const status = el("div", { class: "presets" });
      ui.ctl.append(status);
      const ro = RF.readouts(ui.ctl, [
        { key: "odd", label: "Odd mode f_e" }, { key: "even", label: "Even mode f_m" }, { key: "k", label: "Net k (signed)" },
      ]);

      /* three-solve lumped fit: shows why Ke and Km need very tight convergence */
      st.err = 0;
      const fit = el("div", { class: "mini-calc" }, [el("div", { class: "card-title", text: "Three-solve fit: can you split Ke and Km?" })]);
      RF.slider(fit, { id: "ct-err", label: "Error in the f₀ solve", min: 0, max: 0.5, step: 0.001, value: 0, fmt: (v) => fmt(v, 2) + " %", onInput: (v) => { st.err = v; update(); } });
      const fitOut = el("div", { class: "mono", style: "font-size:13px;white-space:pre-wrap" });
      const fitPill = el("div");
      fit.append(el("div", { class: "muted", style: "font-size:12.5px", text: "Inputs are f_e, f_m and f₀ from one resonator solved alone. The slider nudges f₀ the way mesh noise would. Try 0.004 %, 0.01 %, then the 0.35 % the eigenmode runs had. Rule: the error must stay well below k_E·k_M/2." }), fitOut, fitPill);
      ui.ctl.append(fit);

      /* ----- plots ----- */
      const pM = RF.plot(ui.plots, { x: { min: 0, max: 0.06 }, y: { min: 0, max: 1 }, series: [{ pts: [[0, 0], [1, 1]], color: "var(--s1)" }] });
      const pD = RF.plot(ui.plots, { x: { min: 0, max: 1 }, y: { min: -60, max: 0 }, series: [{ pts: [[0, 0], [1, 1]], color: "var(--s1)" }] });

      function update() {
        const m = modesOf(st.f0, st.ke, st.km);
        const lo = Math.min(m.odd, m.even), hi = Math.max(m.odd, m.even);
        const k = (hi * hi - lo * lo) / (hi * hi + lo * lo);
        const net = st.ke - st.km;
        const type = Math.abs(net) < 0.0005 ? ["", "About zero: the two couplings cancel"] : net > 0 ? ["good", "Odd lower → electric wins"] : ["warn", "Even lower → magnetic wins"];
        status.replaceChildren(el("span", { class: "pill " + type[0], text: type[1] }));
        drawBench(m);
        const kS = (m.even * m.even - m.odd * m.odd) / (m.even * m.even + m.odd * m.odd);
        ro.update({
          odd: [fmt(m.odd, 5), "GHz"], even: [fmt(m.even, 5), "GHz"],
          k: [(kS >= 0 ? "+" : "−") + fmt(Math.abs(kS), 3), kS >= 0 ? "electric" : "magnetic"],
        });

        // lumped fit from three frequencies, with f0 perturbed by the error slider
        const f0m = st.f0 * (1 + st.err / 100);
        const a = (f0m / m.odd) ** 2, c = (f0m / m.even) ** 2;
        const dd = (a - c) / 2, pp = 1 - (a + c) / 2;
        const disc = dd * dd + 4 * pp;
        const netLine = `k_E − k_M = ${fmt(dd, 4)}  (true ${fmt(st.ke - st.km, 4)})  ← barely moves\nk_E · k_M = ${fmt(pp, 3)}  (true ${fmt(st.ke * st.km, 3)})  ← the fragile k² term\nlimit: error ≪ k_E·k_M/2 = ${fmt((100 * st.ke * st.km) / 2, 2)} %`;
        if (disc < 0) {
          fitOut.textContent = `(f₀/f_e)² = (1 − k_M)(1 + k_E) = ${fmt(a, 6)}\n(f₀/f_m)² = (1 + k_M)(1 − k_E) = ${fmt(c, 6)}\n${netLine}\nNo real solution: the error has swamped the k² term.`;
          fitPill.replaceChildren(el("span", { class: "pill bad", text: "Can't separate Ke and Km at this accuracy" }));
        } else {
          const uE = (dd + Math.sqrt(disc)) / 2, uM = uE - dd;
          const errE = Math.abs(uE - st.ke), errM = Math.abs(uM - st.km);
          const ok = errE <= 0.1 * Math.max(st.ke, 0.003) && errM <= 0.1 * Math.max(st.km, 0.003);
          fitOut.textContent = `(f₀/f_e)² = ${fmt(a, 6)}   (f₀/f_m)² = ${fmt(c, 6)}\n${netLine}\nrecovered k_E = ${fmt(uE, 3)}  (true ${fmt(st.ke, 3)})\nrecovered k_M = ${fmt(uM, 3)}  (true ${fmt(st.km, 3)})`;
          fitPill.replaceChildren(el("span", { class: "pill " + (ok ? "good" : "bad"), text: ok ? "Recovered within 10 %" : "Recovered values are off by more than 10 %" }));
        }

        // mode frequencies vs Lm/L
        const xs = RF.linspace(0, 0.06, 121);
        const po = xs.map((x) => [x, modesOf(st.f0, st.ke, x).odd]);
        const pe = xs.map((x) => [x, modesOf(st.f0, st.ke, x).even]);
        const all = po.concat(pe).map((p) => p[1]);
        const ymin = Math.min(...all), ymax = Math.max(...all);
        const pad = (ymax - ymin) * 0.08 || st.f0 * 0.01;
        pM.update({
          title: "Mode frequencies as magnetic coupling grows",
          subtitle: `Electric coupling held at Cm/C = ${fmt(st.ke, 3)}. The lines cross where Lm/L = Cm/C. There k = 0 and the modes swap order.`,
          height: 280,
          x: { min: 0, max: 0.06, label: "Lm/L", fmt: (v) => fmt(v, 2) },
          y: { min: ymin - pad, max: ymax + pad, label: "GHz", fmt: (v) => fmt(v, 4) },
          series: [{ name: "Odd mode", pts: po, color: "var(--s1)" }, { name: "Even mode", pts: pe, color: "var(--s2)" }],
          vlines: [{ x: st.km, label: "you", dy: 16 }].concat(st.ke > 0 && st.ke <= 0.06 ? [{ x: st.ke, label: "k = 0", color: "var(--muted)", dy: 32, anchor: "end" }] : []),
          markers: [{ x: st.km, y: m.odd, color: "var(--s1)" }, { x: st.km, y: m.even, color: "var(--s2)" }],
          tipX: (v) => "Lm/L " + fmt(v, 3), tipY: (v) => fmt(v, 5) + " GHz",
        });

        // weakly fed two-port: magnitude only
        const Qe = 30000, Qu = 3000;
        const span = Math.max((hi - lo) * 1.6, (st.f0 / 2700) * 10);
        const fc = (lo + hi) / 2;
        const fs = RF.linspace(fc - span, fc + span, 800);
        const pts = fs.map((f) => {
          const ae = cx.C(1 / Qe + 1 / Qu, f / m.even - m.even / f);
          const ao = cx.C(1 / Qe + 1 / Qu, f / m.odd - m.odd / f);
          const s21 = cx.scale(cx.sub(cx.inv(ae), cx.inv(ao)), 1 / Qe);
          return [f, RF.db20(Math.max(1e-7, cx.abs(s21)))];
        });
        pD.update({
          title: "What a weakly fed two-port shows you",
          subtitle: "Two peaks either way. The spacing gives k's size, but the magnitude can't tell you which peak is odd (Swanson p42).",
          height: 250,
          x: { min: fs[0], max: fs[fs.length - 1], label: "GHz", fmt: (v) => fmt(v, 5) },
          y: { min: -60, max: 0, label: "S21 (dB)" },
          series: [{ name: "S21", pts, color: "var(--s3)" }],
          vlines: [{ x: lo, label: "f₁", anchor: "end", dy: 16 }, { x: hi, label: "f₂", dy: 16 }],
          tipX: (v) => fmt(v, 5) + " GHz", tipY: (v) => fmt(v, 3) + " dB",
        });

        RF.setEqs(ui.eqs, [
          { name: "Odd mode: Cm adds to C, Lm subtracts from L", f: `f_odd = f₀ / √((1 − Lm/L)(1 + Cm/C)) = ${fmt(st.f0, 4)} / √(${fmt(1 - st.km, 4)} × ${fmt(1 + st.ke, 4)}) = ${b(fmt(m.odd, 5) + " GHz")}` },
          { name: "Even mode: the reverse", f: `f_even = f₀ / √((1 + Lm/L)(1 − Cm/C)) = ${fmt(st.f0, 4)} / √(${fmt(1 + st.km, 4)} × ${fmt(1 - st.ke, 4)}) = ${b(fmt(m.even, 5) + " GHz")}` },
          { name: "From the two peaks alone, k is always positive: its size can't give the type", f: `k = (f₂² − f₁²)/(f₂² + f₁²) = ${b(fmt(k, 3))}   ≈ |Cm/C − Lm/L| = ${fmt(Math.abs(net), 3)}` },
          { name: "Signed net k, once you know which mode is which (convention here: f_e = odd, f_m = even)", f: `k_net = (f_m² − f_e²)/(f_m² + f_e²) = ${b((kS >= 0 ? "+" : "−") + fmt(Math.abs(kS), 3))}   positive = net electric, negative = net magnetic` },
          { name: "The rule", f: `lower mode = ${b(net >= 0 ? "odd → electric" : "even → magnetic")}` },
          { name: "Pure cases (exact for lumped LC)", f: `electric: odd 1/(2π√(L(C+Cm))), even 1/(2π√(L(C−Cm)))    magnetic: odd 1/(2π√((L−Lm)C)), even 1/(2π√((L+Lm)C))` },
        ]);
      }

      RF.setSay(ui.say, {
        quote: "Which mode is lower tells you the coupling type. Electric coupling pulls the odd mode down through the mutual capacitance; magnetic pulls the even mode down through the mutual inductance. In the example pair the odd mode is lower with the vias centred, so it's electric. Moving the vias toward the gap adds magnetic coupling that cancels it, so k drops to 0.002 and the even mode ends up lower.",
        bullets: [
          "Odd mode: +V and −V, zero volts on the midplane, an electric wall (Perfect E).",
          "Even mode: +V and +V, no current crosses the midplane, a magnetic wall (Perfect H).",
          "Electric coupling dominates where voltage maxima face each other (open ends). Magnetic dominates where current maxima face each other (shorted ends, vias).",
          "In HFSS: plot a signed field (Ez or E vectors, not |E|) for modes 1 and 2. Opposite signs = odd. Or put Perfect E, then Perfect H, on the midplane of a symmetric model: the first gives the odd frequency, the second the even.",
          "Don't mix this up with coupled-line Z0e and Z0o. Same symmetry idea, applied to a line pair. In an edge-coupled filter the gap sets Z0e − Z0o, which sets k.",
        ],
      });

      RF.predict(ui.predict, [
        { q: "Pure electric coupling, Cm/C = 0.02, f₀ = 10 GHz. Where is the odd mode?", unit: "GHz", answer: () => 10 / Math.sqrt(1.02), absTol: 0.02, apply: () => set({ ke: 0.02, km: 0, f0: 10, view: "odd" }), explain: "The odd mode sees C + Cm: 10/√1.02 = 9.90 GHz, and the even mode goes up to 10.10." },
        { q: "Pure magnetic coupling, Lm/L = 0.03, f₀ = 10 GHz. Where is the lower mode?", unit: "GHz", answer: () => 10 / Math.sqrt(1.03), absTol: 0.02, apply: () => set({ ke: 0, km: 0.03, f0: 10, view: "even" }), explain: "The lower mode is the even one, at L + Lm: 10/√1.03 = 9.85 GHz." },
        { q: "A resonator pair has modes at 9.205 and 9.322 GHz, odd lower. What's k?", unit: "", answer: () => (9.322 ** 2 - 9.205 ** 2) / (9.322 ** 2 + 9.205 ** 2), absTol: 0.0012, apply: () => set({ ke: 0.03, km: 0.0173, f0: 9.263, view: "odd" }), explain: "(9.322² − 9.205²)/(9.322² + 9.205²) = 0.0127. Odd is lower, so it's net electric." },
        { q: "Cm/C and Lm/L are both 0.03. What's k?", unit: "", answer: () => 0, absTol: 0.002, apply: () => set({ ke: 0.03, km: 0.03 }), explain: "They cancel. The modes land on top of each other and k ≈ 0." },
      ], "ctype");

      update();
      return {};
    },
  });
})();
