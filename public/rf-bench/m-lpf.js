/* Module: low-pass filter, as a guided 60-minute lesson on the bench. */
(function () {
  "use strict";
  const { cx, el, s, fmt, b } = RF;
  const Z0 = 50, TWO_PI = 2 * Math.PI;

  RF.register({
    id: "lpf",
    tab: "Low-pass filter",
    sub: "60-minute lesson",
    build(root) {
      const ui = RF.scaffold(root, {
        who: "One hour, seven steps",
        title: "Low-pass filters, from the ladder to the layout",
        lede: "Work through the steps in order. Each one sets up the bench, gives you something to try, and asks one question before you see the answer. The last step is the question you'll get in the interview: pick the order from a spec.",
        benchTitle: "The filter",
      });
      const st = { kind: "butt", N: 3, rl: 20, fc: 6, first: "L", real: "ideal", QL: 30, QC: 100, Zh: 100, Zl: 20, sub: "ro", fs: 12, A: 40 };

      /* ---------- model ---------- */
      function proto() {
        if (st.kind === "butt") return { g: RF.buttG(st.N), load: 1 };
        return RF.chebG(st.N, RF.rippleFromRL(st.rl));
      }
      function elements() {
        const { g } = proto();
        const wc = TWO_PI * st.fc * 1e9;
        return g.map((gk, k) => {
          const series = st.first === "L" ? k % 2 === 0 : k % 2 === 1;
          const e = { k: k + 1, g: gk, series };
          if (series) { e.L = (gk * Z0) / wc; e.Z = st.Zh; e.theta = (gk * Z0) / st.Zh; }
          else { e.C = gk / (Z0 * wc); e.Z = st.Zl; e.theta = (gk * st.Zl) / Z0; }
          return e;
        });
      }
      function response(f, mode = st.real) {
        const els = elements();
        const w = TWO_PI * f * 1e9;
        let M = RF.abcd.I();
        for (const e of els) {
          let m;
          if (mode === "stepped") m = RF.abcd.line(e.Z, e.theta * (f / st.fc));
          else if (e.series) m = RF.abcd.series(cx.C(mode === "lossy" ? (w * e.L) / st.QL : 0, w * e.L));
          else m = RF.abcd.shunt(cx.C(mode === "lossy" ? (w * e.C) / st.QC : 0, w * e.C));
          M = RF.abcd.mul(M, m);
        }
        const sp = RF.abcd.sparams(M, Z0, Z0);
        return { s21: cx.abs(sp.s21), s11: cx.abs(sp.s11) };
      }
      const dB = (x) => RF.db20(Math.max(x, 1e-9));

      /* ---------- drawing ---------- */
      const svg = s("svg", { viewBox: "0 0 560 230", role: "img", "aria-label": "Low-pass ladder schematic, or its stepped-impedance layout" });
      const hint = el("div", { class: "hint" });
      ui.draw.append(svg, hint);
      function drawBench(els) {
        const k = [];
        const T = (x, y, t, sty = {}, at = {}) => s("text", Object.assign({ x, y, "font-size": 11, text: t }, at), Object.assign({ fill: "var(--ink-2)" }, sty));
        const W = (d, w = 1.5) => s("path", { d }, { fill: "none", stroke: "var(--ink)", strokeWidth: w, strokeLinejoin: "round" });
        if (st.real !== "stepped") {
          hint.textContent = "Series inductors block high frequencies. Shunt capacitors short them to ground. Values update as you move the cutoff.";
          const yT = 70, yG = 180, x0 = 60, x1 = 500;
          const n = els.length, step = (x1 - x0) / (n + 1);
          k.push(T(16, yT + 4, "50 Ω", { fill: "var(--ink)", fontWeight: 600 }));
          k.push(T(544, yT + 4, "50 Ω", { fill: "var(--ink)", fontWeight: 600 }, { "text-anchor": "end" }));
          k.push(W(`M44 ${yG}H516`, 2.5));
          let xPrev = 44;
          els.forEach((e, i) => {
            const x = x0 + step * (i + 1);
            if (e.series) {
              const lw = Math.min(step * 0.7, 46);
              k.push(W(`M${xPrev} ${yT}H${x - lw / 2}`));
              let coil = `M${x - lw / 2} ${yT}`;
              for (let j = 0; j < 4; j++) coil += `a${lw / 8} ${lw / 8} 0 0 1 ${lw / 4} 0`;
              k.push(W(coil));
              xPrev = x + lw / 2;
              k.push(T(x, yT - 18, RF.si(e.L, "H"), { fill: "var(--ink)", fontWeight: 600 }, { "text-anchor": "middle" }));
              k.push(T(x, yT - 32, `g${e.k} ${fmt(e.g, 3)}`, { fontSize: "10px" }, { "text-anchor": "middle" }));
              if (st.real === "lossy") k.push(T(x, yT + 22, `Q ${fmt(st.QL, 3)}`, { fontSize: "10px", fill: "var(--muted)" }, { "text-anchor": "middle" }));
            } else {
              k.push(W(`M${xPrev} ${yT}H${x}`));
              xPrev = x;
              const my = (yT + yG) / 2;
              k.push(W(`M${x} ${yT}V${my - 5}M${x - 14} ${my - 5}H${x + 14}M${x - 14} ${my + 5}H${x + 14}M${x} ${my + 5}V${yG}`));
              k.push(s("circle", { cx: x, cy: yT, r: 2.5 }, { fill: "var(--ink)" }));
              k.push(T(x + 18, my + 4, RF.si(e.C, "F"), { fill: "var(--ink)", fontWeight: 600 }));
              k.push(T(x + 18, my - 12, `g${e.k} ${fmt(e.g, 3)}`, { fontSize: "10px" }));
              if (st.real === "lossy") k.push(T(x + 18, my + 18, `Q ${fmt(st.QC, 3)}`, { fontSize: "10px", fill: "var(--muted)" }));
            }
          });
          k.push(W(`M${xPrev} ${yT}H516`));
          k.push(T(280, 214, `${st.kind === "butt" ? "Butterworth" : "Chebyshev"}, N = ${st.N}, f_c = ${fmt(st.fc, 3)} GHz`, { fill: "var(--ink)" }, { "text-anchor": "middle" }));
        } else {
          const sub = RF.SUBSTRATES[st.sub];
          hint.textContent = `Top view on ${sub.label}, widths and lengths to scale. Narrow high-Z lines act as the inductors, wide low-Z lines as the capacitors.`;
          const w50 = RF.msWidth(50, sub.er, sub.h);
          const secs = els.map((e) => {
            const w = RF.msWidth(e.Z, sub.er, sub.h);
            const lg = 300 / (st.fc * Math.sqrt(RF.eeff(w, sub.er, sub.h))); // mm
            return { e, w, len: ((e.theta / TWO_PI) * lg) * 1000 }; // µm
          });
          const total = secs.reduce((a, c) => a + c.len, 0);
          const feed = total * 0.12;
          const scale = 470 / (total + 2 * feed);
          const wpx = (w) => RF.clamp((w / w50) * 12, 1.5, 90);
          const yc = 105;
          k.push(s("rect", { x: 8, y: 14, width: 544, height: 186, rx: 6 }, { fill: "var(--substrate)", stroke: "var(--substrate-edge)", strokeWidth: 1 }));
          let x = 45;
          k.push(s("rect", { x, y: yc - wpx(w50) / 2, width: feed * scale, height: wpx(w50) }, { fill: "var(--gold)" }));
          k.push(T(x, yc - wpx(w50) / 2 - 6, "50 Ω", { fill: "var(--ink)" }));
          x += feed * scale;
          secs.forEach((sc) => {
            const h = wpx(sc.w), wd = sc.len * scale;
            k.push(s("rect", { x, y: yc - h / 2, width: wd + 0.4, height: h }, { fill: "var(--gold)", stroke: "var(--gold-ink)", strokeWidth: 0.6 }));
            const deg = (sc.e.theta * 180) / Math.PI;
            if (els.length <= 9) {
              k.push(T(x + wd / 2, sc.e.series ? yc - h / 2 - 20 : yc + h / 2 + 14, `${fmt(sc.e.Z, 3)} Ω`, { fill: "var(--ink)", fontWeight: 600, fontSize: "10.5px" }, { "text-anchor": "middle" }));
              k.push(T(x + wd / 2, sc.e.series ? yc - h / 2 - 7 : yc + h / 2 + 27, `${fmt(deg, 2)}°`, { fontSize: "10px", fill: deg > 45 ? "var(--bad)" : "var(--ink-2)" }, { "text-anchor": "middle" }));
            }
            x += wd;
          });
          k.push(s("rect", { x, y: yc - wpx(w50) / 2, width: feed * scale, height: wpx(w50) }, { fill: "var(--gold)" }));
          k.push(T(x + feed * scale, yc - wpx(w50) / 2 - 6, "50 Ω", { fill: "var(--ink)" }, { "text-anchor": "end" }));
          k.push(T(280, 222, `filter length ${RF.lenStr(total)} · angles are electrical length at f_c (red above 45°)`, { fill: "var(--ink)" }, { "text-anchor": "middle" }));
        }
        svg.replaceChildren(...k);
      }

      /* ---------- controls ---------- */
      const C = {};
      C.kind = RF.seg(ui.ctl, { labelText: "Response", options: [{ v: "butt", label: "Butterworth" }, { v: "cheb", label: "Chebyshev" }], value: st.kind, onChange: (v) => { st.kind = v; update(); } });
      C.real = RF.seg(ui.ctl, { labelText: "Built from", options: [{ v: "ideal", label: "Ideal L and C" }, { v: "lossy", label: "Lossy L and C" }, { v: "stepped", label: "Stepped-impedance lines" }], value: st.real, onChange: (v) => { st.real = v; update(); } });
      C.N = RF.slider(ui.ctl, { id: "lp-n", label: "Order N", min: 1, max: 11, step: 1, value: st.N, fmt: (v) => String(v), onInput: (v) => { st.N = v; update(); } });
      C.fc = RF.slider(ui.ctl, { id: "lp-fc", label: "Cutoff f_c", min: 0.5, max: 40, step: 0.1, value: st.fc, fmt: (v) => fmt(v, 3) + " GHz", onInput: (v) => { st.fc = v; update(); } });
      C.rl = RF.slider(ui.ctl, { id: "lp-rl", label: "Chebyshev RL", min: 8, max: 30, step: 0.1, value: st.rl, fmt: (v) => `${fmt(v, 3)} dB (${fmt(RF.rippleFromRL(v), 2)} dB ripple)`, onInput: (v) => { st.rl = v; update(); } });
      C.first = RF.seg(ui.ctl, { labelText: "First element", options: [{ v: "L", label: "Series L" }, { v: "C", label: "Shunt C" }], value: st.first, onChange: (v) => { st.first = v; update(); } });
      C.QL = RF.slider(ui.ctl, { id: "lp-ql", label: "Inductor Q", min: 5, max: 300, log: true, value: st.QL, fmt: (v) => fmt(v, 3), onInput: (v) => { st.QL = v; update(); } });
      C.QC = RF.slider(ui.ctl, { id: "lp-qc", label: "Capacitor Q", min: 10, max: 1000, log: true, value: st.QC, fmt: (v) => fmt(v, 3), onInput: (v) => { st.QC = v; update(); } });
      C.Zh = RF.slider(ui.ctl, { id: "lp-zh", label: "High-Z line", min: 60, max: 150, step: 1, value: st.Zh, fmt: (v) => fmt(v, 3) + " Ω", onInput: (v) => { st.Zh = v; update(); } });
      C.Zl = RF.slider(ui.ctl, { id: "lp-zl", label: "Low-Z line", min: 8, max: 45, step: 0.5, value: st.Zl, fmt: (v) => fmt(v, 3) + " Ω", onInput: (v) => { st.Zl = v; update(); } });
      C.sub = RF.seg(ui.ctl, { labelText: "Substrate", options: [{ v: "ro", label: RF.SUBSTRATES.ro.label }, { v: "gaas", label: RF.SUBSTRATES.gaas.label }], value: st.sub, onChange: (v) => { st.sub = v; update(); } });
      C.fs = RF.slider(ui.ctl, { id: "lp-fs", label: "Check rejection at", min: 0.6, max: 80, step: 0.1, value: st.fs, fmt: (v) => fmt(v, 3) + " GHz", onInput: (v) => { st.fs = v; update(); } });
      C.A = RF.slider(ui.ctl, { id: "lp-a", label: "Rejection needed", min: 10, max: 80, step: 1, value: st.A, fmt: (v) => fmt(v, 3) + " dB", onInput: (v) => { st.A = v; update(); } });
      const set = (o) => {
        Object.assign(st, o);
        for (const key of Object.keys(C)) C[key].set(st[key], true);
        update();
      };
      const status = el("div", { class: "presets" });
      ui.ctl.append(status);
      const ro = RF.readouts(ui.ctl, [
        { key: "atfc", label: "S21 at f_c" }, { key: "rej", label: "Rejection at check" }, { key: "pass", label: "Worst below f_c" },
        { key: "rldc", label: "Worst RL below f_c" }, { key: "ang", label: "Longest section" }, { key: "nmin", label: "Fewest N for spec" },
      ]);
      const tblBox = el("div", { class: "tscroll" });
      ui.ctl.append(tblBox);

      /* ---------- plots ---------- */
      const pM = RF.plot(ui.plots, { x: { min: 0, max: 1 }, y: { min: -80, max: 0 }, series: [{ pts: [[0, 0], [1, 0]], color: "var(--s1)" }] });
      const pair = el("div", { class: "plots two" });
      ui.plots.append(pair);
      const pZ = RF.plot(pair, { x: { min: 0, max: 1 }, y: { min: -3, max: 0 }, series: [{ pts: [[0, 0], [1, 0]], color: "var(--s1)" }] });
      const pE = RF.plot(pair, { x: { min: 0, max: 1 }, y: { min: 0, max: 1 }, series: [{ pts: [[0, 0], [1, 1]], color: "var(--s1)" }], crosshair: false });

      function minOrder() {
        const rip = st.kind === "cheb" ? RF.rippleFromRL(st.rl) : 3.0103;
        const r = st.fs / st.fc;
        if (r <= 1) return NaN;
        const num = Math.sqrt((Math.pow(10, st.A / 10) - 1) / (Math.pow(10, rip / 10) - 1));
        return st.kind === "cheb" ? Math.acosh(num) / Math.acosh(r) : Math.log(num) / Math.log(r);
      }

      function update() {
        const els = elements();
        drawBench(els);
        const maxTheta = Math.max(...els.map((e) => e.theta));
        const fSpur = st.fc * (Math.PI / maxTheta);
        const fmax = st.real === "stepped" ? Math.min(st.fc * 10, Math.max(3 * st.fc, fSpur * 1.25, st.fs * 1.15)) : Math.max(3 * st.fc, st.fs * 1.15);
        const fs = RF.linspace(0.005 * st.fc, fmax, 800);
        const resp = fs.map((f) => response(f));
        const series = [
          { name: "S21", pts: fs.map((f, i) => [f, dB(resp[i].s21)]), color: "var(--s1)", width: 2.5 },
          { name: "S11", pts: fs.map((f, i) => [f, dB(resp[i].s11)]), color: "var(--s2)", width: 1.5 },
        ];
        if (st.real !== "ideal") series.push({ name: "Ideal S21", pts: fs.map((f) => [f, dB(response(f, "ideal").s21)]), color: "var(--s3)", width: 1.5 });
        const rej = -dB(response(st.fs).s21);
        const at = response(st.fc);
        pM.update({
          title: "Response",
          subtitle: st.real === "stepped" ? `The lines repeat: near ${fmt(fSpur, 3)} GHz the longest section is λ/2 and the filter passes again.` : "Passband below f_c, stopband above.",
          height: 300,
          x: { min: 0, max: fmax, label: "Frequency (GHz)", fmt: (v) => fmt(v, 3) },
          y: { min: -80, max: 2, label: "dB" },
          series,
          vlines: [{ x: st.fc, label: `f_c ${fmt(st.fc, 3)}`, dy: 16 }],
          hlines: [{ y: -st.A, label: `need −${fmt(st.A, 3)} dB` }],
          markers: [{ x: st.fs, y: -rej, color: "var(--s1)", label: `${fmt(rej, 3)} dB at ${fmt(st.fs, 3)} GHz` }],
          tipX: (v) => fmt(v, 4) + " GHz", tipY: (v) => fmt(v, 3) + " dB",
        });

        // passband zoom
        const zf = RF.linspace(0.005 * st.fc, 1.15 * st.fc, 400);
        const zr = zf.map((f) => response(f));
        const inPass = zr.filter((_, i) => zf[i] <= st.fc);
        const worstIL = -Math.min(...inPass.map((r) => dB(r.s21)));
        const worstRL = -Math.max(...inPass.map((r) => dB(r.s11)));
        const ylo = -Math.max(3.5, Math.min(worstIL * 1.4 + 0.3, 20));
        pZ.update({
          title: "Passband close-up",
          subtitle: st.kind === "cheb" ? `Ripple ${fmt(RF.rippleFromRL(st.rl), 3)} dB is the same thing as ${fmt(st.rl, 3)} dB return loss` : "Butterworth: maximally flat, −3 dB at f_c",
          height: 250,
          x: { min: 0, max: 1.15 * st.fc, label: "GHz", fmt: (v) => fmt(v, 3) },
          y: { min: ylo, max: 0.3, label: "S21 (dB)" },
          series: [{ name: "S21", pts: zf.map((f, i) => [f, dB(zr[i].s21)]), color: "var(--s1)" }].concat(st.real !== "ideal" ? [{ name: "Ideal", pts: zf.map((f) => [f, dB(response(f, "ideal").s21)]), color: "var(--s3)", width: 1.5 }] : []),
          vlines: [{ x: st.fc, label: "f_c", dy: 16 }],
          tipX: (v) => fmt(v, 4) + " GHz", tipY: (v) => fmt(v, 3) + " dB",
        });

        // element stems: degrees for stepped, g-values otherwise
        const stepped = st.real === "stepped";
        const ys = els.map((e) => (stepped ? (e.theta * 180) / Math.PI : e.g));
        const stems = [];
        els.forEach((e, i) => stems.push([i + 1, 0], [i + 1, ys[i]], [i + 1, NaN]));
        pE.update({
          title: stepped ? "Section lengths at f_c" : "Prototype values g₁…g_N",
          subtitle: stepped ? "Keep each under about 45° (λ/8) or the line stops acting like a lumped part." : "The recipe. Scale by Z₀ and f_c to get nH and pF.",
          height: 250,
          x: { min: 0.4, max: els.length + 0.6, label: "Element", ticks: els.map((e) => e.k), fmt: (v) => String(v) },
          y: { min: 0, max: Math.max(...ys, stepped ? 50 : 1) * 1.2, label: stepped ? "degrees" : "g", fmt: (v) => fmt(v, 2) },
          series: [{ name: "stems", pts: stems, color: "var(--s1)", width: 2.5 }],
          hlines: stepped ? [{ y: 45, label: "λ/8 = 45°" }] : [],
          markers: els.map((e, i) => ({ x: i + 1, y: ys[i], color: stepped && ys[i] > 45 ? "var(--bad)" : "var(--s1)" })),
          crosshair: false,
        });

        const nmin = minOrder();
        ro.update({
          atfc: [fmt(dB(at.s21), 3), "dB"], rej: [fmt(rej, 3), "dB"], pass: [fmt(worstIL, 3), "dB"],
          rldc: [fmt(worstRL, 3), "dB"], ang: stepped ? [fmt((maxTheta * 180) / Math.PI, 3), "° at f_c"] : ["—", "lines only"],
          nmin: [isFinite(nmin) ? String(Math.ceil(nmin - 1e-9)) : "—", isFinite(nmin) ? `(${fmt(nmin, 3)})` : "check f above f_c"],
        });
        const pills = [el("span", { class: "pill " + (rej >= st.A ? "good" : "bad"), text: rej >= st.A ? `Meets ${fmt(st.A, 3)} dB at ${fmt(st.fs, 3)} GHz` : `Short of ${fmt(st.A, 3)} dB at ${fmt(st.fs, 3)} GHz` })];
        if (st.kind === "cheb" && st.N % 2 === 0) pills.push(el("span", { class: "pill warn", text: `Even-order Chebyshev wants a ${fmt(Z0 * proto().load, 3)} Ω load. With 50 Ω you see the mismatch at DC` }));
        if (stepped && maxTheta > Math.PI / 4) pills.push(el("span", { class: "pill warn", text: "A section is longer than λ/8: raise Zh or lower Zl" }));
        status.replaceChildren(...pills);

        // element table
        const t = el("table", { class: "mini" });
        t.append(el("tr", null, ["#", "Kind", "g", "Value", stepped ? "Line" : "", stepped ? "At f_c" : ""].map((h) => el("th", { text: h }))));
        for (const e of els) {
          t.append(el("tr", null, [
            el("td", { text: String(e.k) }), el("td", { text: e.series ? "series L" : "shunt C" }), el("td", { text: fmt(e.g, 4) }),
            el("td", { text: e.series ? RF.si(e.L, "H") : RF.si(e.C, "F") }),
            el("td", { text: stepped ? `${fmt(e.Z, 3)} Ω` : "" }), el("td", { text: stepped ? `${fmt((e.theta * 180) / Math.PI, 3)}°` : "" }),
          ]));
        }
        tblBox.replaceChildren(t);

        const rip = RF.rippleFromRL(st.rl);
        RF.setEqs(ui.eqs, [
          { name: "Prototype to parts (Z₀ = 50 Ω, ω_c = 2πf_c)", f: `L = g·Z₀/ω_c,  C = g/(Z₀·ω_c).  g = 1 at ${fmt(st.fc, 3)} GHz → ${b(RF.si(Z0 / (TWO_PI * st.fc * 1e9), "H"))} or ${b(RF.si(1 / (Z0 * TWO_PI * st.fc * 1e9), "F"))}` },
          st.kind === "butt"
            ? { name: "Butterworth: −3 dB at f_c, then 6N dB per octave", f: `L_A = 10·log(1 + (f/f_c)^(2N)) → at ${fmt(st.fs, 3)} GHz: ${b(fmt(10 * Math.log10(1 + Math.pow(st.fs / st.fc, 2 * st.N)), 3) + " dB")}` }
            : { name: "Chebyshev: ripple ε, steeper skirt", f: `L_A = 10·log(1 + ε²·T_N²(f/f_c)),  ε² = 10^(ripple/10) − 1 = ${fmt(Math.pow(10, rip / 10) - 1, 3)}` },
          { name: "Fewest poles for the spec", f: st.kind === "cheb" ? `N ≥ acosh(√((10^(A/10) − 1)/ε²)) / acosh(f_s/f_c) = ${b(fmt(nmin, 3))}` : `N ≥ log(√((10^(A/10) − 1)/ε²)) / log(f_s/f_c) = ${b(fmt(nmin, 3))}` },
          { name: "Stepped impedance: each part becomes a short line", f: `inductor: βl = g·Z₀/Z_h,   capacitor: βl = g·Z_l/Z₀,   keep βl ≲ 45° at f_c` },
          { name: "Ripple and return loss are the same spec", f: `ripple = −10·log(1 − 10^(−RL/10)):  RL ${fmt(st.rl, 3)} dB ↔ ${b(fmt(rip, 3) + " dB ripple")}` },
        ]);
      }

      RF.setSay(ui.say, {
        quote: "A low-pass ladder alternates series inductors that block high frequencies with shunt capacitors that short them. I pick the order from the rejection I need at a given frequency: Butterworth adds 6 dB per octave per order, and Chebyshev gets a steeper skirt by allowing ripple, which is the same thing as a return-loss spec. I scale the g-values with L = gZ₀/ω_c and C = g/(Z₀ω_c). On a board I realize them as stepped impedance, high-Z lines for the L's and low-Z lines for the C's, kept under about λ/8. On MMIC it's spirals and MIM caps, and the spiral Q sets the loss near cutoff.",
        bullets: [
          "Stepped-impedance filters pass again when a section reaches λ/2. That spurious band limits how far the stopband goes.",
          "A bigger Z_h/Z_l ratio keeps sections short and the skirt sharp, but very high Z_h means very narrow, lossy lines.",
          "Even-order Chebyshev needs unequal terminations. With 50 Ω on both ends, use odd N.",
          "Series-L-first and shunt-C-first give the same response. Pick the one whose end elements are easier to build.",
        ],
      });

      /* ---------- the lesson card (replaces the predict card) ---------- */
      const LESSONS = [
        {
          min: 6, title: "What a low-pass ladder does",
          setup: { kind: "butt", N: 3, fc: 6, first: "L", real: "ideal", fs: 12, A: 20 },
          do: ["Drag the cutoff slider and watch the −3 dB point follow it.", "Switch the first element between series L and shunt C. The response doesn't change.", "Read the element table: three parts, values in nH and pF."],
          q: { text: "3rd-order Butterworth. What's S21 at exactly f_c?", unit: "dB", answer: () => -3.01, absTol: 0.25 },
          notice: "Every Butterworth is −3 dB at f_c, whatever the order. That's the definition of its cutoff.",
        },
        {
          min: 8, title: "Order sets the skirt",
          setup: { kind: "butt", N: 5, fc: 6, real: "ideal", fs: 12, A: 30 },
          do: ["Step N from 1 to 9 and watch the rejection at 12 GHz (twice f_c).", "Note how the passband stays flat while the skirt steepens."],
          q: { text: "Butterworth N = 5. Rejection at 2·f_c?", unit: "dB", answer: () => 10 * Math.log10(1 + 2 ** 10), absTol: 1 },
          notice: "10·log(1 + 2¹⁰) = 30 dB. Far out, each order adds 6 dB per octave, 20 dB per decade.",
        },
        {
          min: 8, title: "Chebyshev trades ripple for a steeper skirt",
          setup: { kind: "cheb", N: 5, fc: 6, rl: RF.rlFromRipple(0.1), real: "ideal", fs: 12, A: 30 },
          do: ["Compare with the Butterworth you just had: same N, more rejection.", "Slide the Chebyshev RL down to 10 dB and up to 25 dB. More ripple buys a steeper skirt.", "Look at the passband close-up: the ripple is S21 bouncing between 0 and −ripple."],
          q: { text: "Chebyshev N = 5 with 0.1 dB ripple. Rejection at 2·f_c?", unit: "dB", answer: () => { const e2 = 10 ** 0.01 - 1, T = Math.cosh(5 * Math.acosh(2)); return 10 * Math.log10(1 + e2 * T * T); }, absTol: 1.5 },
          notice: "About 35 dB, 5 dB more than Butterworth at the same order. And 0.1 dB of ripple is 16.4 dB of return loss: same spec, two names.",
        },
        {
          min: 8, title: "From g-values to real parts",
          setup: { kind: "cheb", N: 5, fc: 5, rl: 20, first: "L", real: "ideal", fs: 10, A: 40 },
          do: ["Read g₁…g₅ in the stem plot, then the nH and pF in the table.", "Double f_c: every value halves.", "Switch to shunt-C-first: the same g's become the other kind of part."],
          q: { text: "g = 1.0 as a series inductor, f_c = 5 GHz, 50 Ω. How many nH?", unit: "nH", answer: () => (50 / (TWO_PI * 5e9)) * 1e9, tol: 0.05 },
          notice: "L = g·Z₀/ω_c = 50 / (2π × 5 GHz) = 1.59 nH. For a capacitor, C = g/(Z₀·ω_c): g = 1 is 0.64 pF.",
        },
        {
          min: 12, title: "Stepped impedance: lines instead of parts",
          setup: { kind: "cheb", N: 5, fc: 6, rl: 20, first: "L", real: "stepped", Zh: 120, Zl: 15, sub: "ro", fs: 12, A: 30 },
          do: ["Compare the stepped S21 and S11 with the thin ideal curve. Close, but the return loss is already worse than the 20 dB design.", "Drop Z_h to 80 Ω and raise Z_l to 35 Ω. Sections get longer, the skirt softens, S11 degrades, and angles turn red.", "Find the spurious passband at the right of the response plot, where the longest section is λ/2.", "Switch the substrate to GaAs and read the line widths. This is what a stepped-impedance layout looks like before tuning."],
          q: { text: "A series inductor with g = 1.5 becomes a 100 Ω line. Electrical length at f_c?", unit: "°", answer: () => (1.5 * 50 / 100) * 180 / Math.PI, absTol: 2 },
          notice: "βl = g·Z₀/Z_h = 0.75 rad = 43°, right at the λ/8 guideline. The simple mapping ignores the step discontinuities, so real designs then tune the lengths. That's what port tuning is for.",
        },
        {
          min: 8, title: "Real parts have Q",
          setup: { kind: "cheb", N: 5, fc: 6, rl: 20, real: "lossy", QL: 30, QC: 100, fs: 12, A: 30 },
          do: ["Watch the passband close-up: loss is small at low frequency and grows toward f_c.", "Drop the inductor Q to 15, then raise the capacitor Q. Which one moves the loss more?", "On MMIC, spirals have Q around 20 to 40 and MIM caps 50 to 100 or more."],
          q: { text: "With Q_L = 30 and Q_C = 100, what's the worst loss below f_c?", unit: "dB", answer: () => { const zf = RF.linspace(0.01 * st.fc, st.fc, 300); return -Math.min(...zf.map((f) => dB(response(f).s21))); }, absTol: 0.3 },
          notice: "Loss peaks near the cutoff because group delay peaks there. The same effect makes bandpass filters lose most at their band edges.",
        },
        {
          min: 10, title: "Pick the order from a spec",
          setup: { kind: "cheb", N: 5, fc: 6, rl: RF.rlFromRipple(0.1), real: "ideal", fs: 12, A: 40 },
          do: ["Spec: f_c = 6 GHz, 0.1 dB ripple, at least 40 dB at 12 GHz.", "Step N until the pill turns green. Compare with the formula in the equations.", "Try N = 6 and look at S11 near DC. Then use 7."],
          q: { text: "Fewest Chebyshev poles for 40 dB at 12 GHz, 0.1 dB ripple, f_c 6 GHz?", unit: "poles", answer: () => 6, absTol: 0.4 },
          notice: "The formula gives 5.45, so 6 on paper. With 50 Ω on both ends, use 7: even-order Chebyshev needs unequal terminations.",
        },
      ];
      const done = RF.store.get("lpf:done", {});
      let cur = RF.store.get("lpf:cur", 0) % LESSONS.length;
      let t0 = null, acc = 0, timer = null;
      const card = ui.predict;
      card.style.borderLeftColor = "var(--s1)";
      const clock = el("span", { class: "mono", text: "00:00" });
      const pace = el("span", { class: "muted" });
      function tick() {
        const ms = acc + (t0 ? Date.now() - t0 : 0);
        const m = Math.floor(ms / 60000), sec = Math.floor((ms % 60000) / 1000);
        clock.textContent = `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
        let cum = 0, where = LESSONS.length - 1;
        for (let i = 0; i < LESSONS.length; i++) { cum += LESSONS[i].min; if (m < cum) { where = i; break; } }
        pace.textContent = ms ? `on this clock you'd be on step ${where + 1}` : "60 minutes total";
      }
      const startBtn = el("button", { type: "button", class: "btn small", text: "Start the hour" });
      startBtn.addEventListener("click", () => {
        if (t0) { acc += Date.now() - t0; t0 = null; clearInterval(timer); startBtn.textContent = "Resume"; }
        else { t0 = Date.now(); timer = setInterval(tick, 1000); startBtn.textContent = "Pause"; }
        tick();
      });

      function renderLesson() {
        const L = LESSONS[cur];
        const nav = el("div", { class: "fc-actions" });
        LESSONS.forEach((ls, i) => {
          const bt = el("button", { type: "button", class: "btn small" + (i === cur ? " primary" : ""), text: `${done[i] ? "✓ " : ""}${i + 1}` });
          bt.title = `${ls.title} (${ls.min} min)`;
          bt.addEventListener("click", () => { cur = i; RF.store.set("lpf:cur", cur); renderLesson(); });
          nav.append(bt);
        });
        nav.append(el("span", { class: "spacer" }), startBtn, clock, pace);
        const input = el("input", { type: "text", id: "lpf-q", inputmode: "decimal", autocomplete: "off", "aria-label": "Your prediction" });
        const verdict = el("div", { class: "verdict", "aria-live": "polite" });
        const form = el("form", null, [input, el("span", { class: "unit", text: L.q.unit }),
          el("button", { type: "submit", class: "btn primary", text: "Check" }),
          el("button", { type: "button", class: "btn ghost", text: "Show me", onclick: () => reveal(NaN) })]);
        form.addEventListener("submit", (e) => { e.preventDefault(); reveal(RF.parseNum(input.value)); });
        function reveal(guess) {
          const ans = L.q.answer();
          const tol = Math.max(Math.abs(ans) * (L.q.tol || 0), L.q.absTol || 0);
          const ok = !isNaN(guess) && Math.abs(guess - ans) <= tol;
          const near = !isNaN(guess) && !ok && Math.abs(guess - ans) <= 3 * tol;
          verdict.replaceChildren(
            el("span", { class: "pill " + (ok ? "good" : near ? "warn" : isNaN(guess) ? "" : "bad"), text: ok ? "Right" : near ? "Close" : isNaN(guess) ? "No guess" : "Off" }),
            " Answer: ", el("span", { class: "val", text: `${fmt(ans, 3)} ${L.q.unit}` }), ". ", L.notice,
          );
          done[cur] = true;
          RF.store.set("lpf:done", done);
          nextBtn.hidden = false;
        }
        const nextBtn = el("button", { type: "button", class: "btn", text: cur < LESSONS.length - 1 ? "Next step →" : "Finish: say it out loud ↓", hidden: "" });
        nextBtn.addEventListener("click", () => {
          if (cur < LESSONS.length - 1) { cur++; RF.store.set("lpf:cur", cur); renderLesson(); setup(); }
          else ui.say.scrollIntoView({ behavior: "smooth", block: "center" });
        });
        card.replaceChildren(
          nav,
          el("div", { class: "fc-tag", text: `Step ${cur + 1} of ${LESSONS.length} · ${L.min} min` }),
          el("div", { class: "q", style: "font-family:var(--font-head);font-size:20px;font-weight:600", text: L.title }),
          el("div", { class: "fc-actions" }, [el("button", { type: "button", class: "btn", text: "Set up the bench for this step", onclick: setup })]),
          el("ul", { style: "margin:0;padding-left:18px;display:grid;gap:3px" }, L.do.map((t) => el("li", { text: t }))),
          el("div", { class: "q", text: "Predict: " + L.q.text }),
          form, verdict, el("div", null, [nextBtn]),
        );
        tick();
      }
      function setup() { set(Object.assign({}, LESSONS[cur].setup)); }

      renderLesson();
      set(Object.assign({}, LESSONS[cur].setup));
      return {};
    },
  });
})();
