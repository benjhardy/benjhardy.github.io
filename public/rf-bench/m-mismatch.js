/* Module: mismatch. Γ, return loss, VSWR, standing waves, Smith chart. */
(function () {
  "use strict";
  const { cx, el, s, fmt, b } = RF;

  RF.register({
    id: "mismatch",
    tab: "Mismatch",
    sub: "Γ · RL · VSWR",
    build(root) {
      const ui = RF.scaffold(root, {
        who: "Senior question · opening",
        title: "What happens when the load isn't 50 Ω",
        lede: "Set a load, then read Γ, return loss and VSWR off the same point. Drag the resistor or drag the point on the Smith chart. The goal is number sense: glance at a load and know roughly how bad it is.",
      });
      const st = { z0: 50, r: 75, x: 0 };
      let anim = null, phase = 0, instPath = null, gamma = cx.C(0);

      /* ----- drawing ----- */
      const svg = s("svg", { viewBox: "0 0 560 262", role: "img", "aria-label": "Source, 50 ohm transmission line, and load, with the standing-wave envelope drawn above the line" });
      ui.draw.append(svg, el("div", { class: "hint", text: "Drag the resistor up or down to change R. The curve above the line is the voltage envelope along one wavelength." }));
      const LX0 = 80, LX1 = 420, YC = 72, A = 25;
      const xOfD = (dl) => LX1 - (LX1 - LX0) * dl;

      function drawBench() {
        const k = [];
        const T = (x, y, t, o = {}) => s("text", Object.assign({ x, y, "font-size": 12, text: t }, o.attrs || {}), Object.assign({ fill: "var(--ink-2)" }, o.style || {}));
        // envelope zone: ±|V(d)| around a centre axis, instantaneous wave inside it
        for (const u of [-1, 1]) k.push(s("line", { x1: LX0, x2: LX1, y1: YC - A * u, y2: YC - A * u }, { stroke: "var(--grid)", strokeWidth: 1 }));
        k.push(s("line", { x1: LX0, x2: LX1, y1: YC, y2: YC }, { stroke: "var(--axis)", strokeWidth: 1 }));
        k.push(T(LX1 + 6, YC - A + 4, "±1 = matched", { style: { fill: "var(--muted)", fontSize: "11px" } }));
        const g = cx.abs(gamma);
        let up = "", dn = "";
        const N = 160;
        for (let i = 0; i <= N; i++) {
          const dl = i / N;
          const ph = -4 * Math.PI * dl;
          const v = cx.abs(cx.add(cx.C(1), cx.mul(gamma, cx.C(Math.cos(ph), Math.sin(ph)))));
          const px = xOfD(dl).toFixed(1);
          up += (i ? "L" : "M") + px + " " + (YC - A * v).toFixed(1);
          dn = "L" + px + " " + (YC + A * v).toFixed(1) + dn;
        }
        k.push(s("path", { d: up + dn.replace(/^L/, "L") + "Z" }, { fill: "var(--s1)", opacity: 0.1 }));
        instPath = s("path", { d: "" }, { fill: "none", stroke: "var(--ink-2)", strokeWidth: 1.2, opacity: 0.7 });
        k.push(instPath);
        k.push(s("path", { d: up }, { fill: "none", stroke: "var(--s1)", strokeWidth: 2, strokeLinejoin: "round" }));
        k.push(s("path", { d: "M" + dn.slice(1) }, { fill: "none", stroke: "var(--s1)", strokeWidth: 2, strokeLinejoin: "round" }));
        k.push(T(LX0, 14, `Vmax / Vmin = ${fmt((1 + g) / Math.max(1e-9, 1 - g), 3)} = VSWR`, { style: { fill: "var(--ink)", fontWeight: 600 } }));
        // conductors
        k.push(s("line", { x1: 40, x2: 492, y1: 236, y2: 236 }, { stroke: "var(--via)", strokeWidth: 3 }));
        k.push(s("rect", { x: LX0, y: 137, width: LX1 - LX0, height: 7, rx: 1 }, { fill: "var(--gold)" }));
        k.push(s("path", { d: `M40 168V140.5H${LX0}M${LX1} 140.5H480V150` }, { fill: "none", stroke: "var(--ink)", strokeWidth: 1.5 }));
        // source
        k.push(s("circle", { cx: 40, cy: 188, r: 20 }, { fill: "var(--surface)", stroke: "var(--ink)", strokeWidth: 1.5 }));
        k.push(s("path", { d: "M29 188q5.5-9 11 0t11 0" }, { fill: "none", stroke: "var(--ink)", strokeWidth: 1.5 }));
        k.push(s("line", { x1: 40, x2: 40, y1: 208, y2: 236 }, { stroke: "var(--ink)", strokeWidth: 1.5 }));
        k.push(T(64, 184, "Source"));
        k.push(T(64, 199, `Z₀ = ${fmt(st.z0, 3)} Ω`, { style: { fill: "var(--muted)", fontSize: "11px" } }));
        // distance ticks
        const labels = ["0 (load)", "λ/4", "λ/2", "3λ/4", "λ"];
        for (let i = 0; i <= 4; i++) {
          const x = xOfD(i / 4);
          k.push(s("line", { x1: x, x2: x, y1: 146, y2: 152 }, { stroke: "var(--muted)", strokeWidth: 1 }));
          k.push(T(x, 164, labels[i], { attrs: { "text-anchor": "middle" }, style: { fontSize: "10.5px", fill: "var(--muted)" } }));
        }
        k.push(T((LX0 + LX1) / 2, 222, `line, Z₀ = ${fmt(st.z0, 3)} Ω`, { attrs: { "text-anchor": "middle" }, style: { fill: "var(--muted)", fontSize: "11px" } }));
        // load: resistor zigzag
        let zz = "M480 150V156";
        for (let i = 0; i < 6; i++) zz += `L${i % 2 ? 471 : 489} ${160 + i * 5}`;
        zz += "L480 188V196";
        k.push(s("path", { d: zz }, { fill: "none", stroke: "var(--ink)", strokeWidth: 1.6, strokeLinejoin: "round" }));
        // reactance: inductor coil or capacitor plates or wire
        if (st.x > 0.5) {
          let coil = "M480 196";
          for (let i = 0; i < 4; i++) coil += `a6 5 0 1 1 0 ${9}`;
          k.push(s("path", { d: coil + "V236" }, { fill: "none", stroke: "var(--ink)", strokeWidth: 1.6 }));
        } else if (st.x < -0.5) {
          k.push(s("path", { d: "M480 196V212M468 212H492M468 219H492M480 219V236" }, { fill: "none", stroke: "var(--ink)", strokeWidth: 1.6 }));
        } else {
          k.push(s("line", { x1: 480, x2: 480, y1: 196, y2: 236 }, { stroke: "var(--ink)", strokeWidth: 1.6 }));
        }
        k.push(T(498, 176, `R = ${fmt(st.r, 3)} Ω`, { style: { fill: "var(--ink)", fontWeight: 600 } }));
        const xs = Math.abs(st.x) < 0.5 ? "X = 0" : `X = ${st.x > 0 ? "+" : "−"}j${fmt(Math.abs(st.x), 3)} Ω`;
        k.push(T(498, 218, xs, { style: { fill: "var(--ink)" } }));
        k.push(T(498, 232, st.x > 0.5 ? "inductive" : st.x < -0.5 ? "capacitive" : "", { style: { fill: "var(--muted)", fontSize: "10.5px" } }));
        // drag handle
        k.push(s("circle", { cx: 480, cy: 172, r: 11 }, { fill: "var(--gold)", opacity: 0.18, stroke: "var(--gold)", strokeWidth: 1.5 }));
        svg.replaceChildren(...k);
        drawInstant();
      }
      function drawInstant() {
        if (!instPath) return;
        let d = "";
        const N = 120;
        for (let i = 0; i <= N; i++) {
          const dl = i / N, bd = 2 * Math.PI * dl;
          // V(d) = e^{jβd} + Γ e^{-jβd}, times e^{jωt}
          const fwd = cx.C(Math.cos(bd + phase), Math.sin(bd + phase));
          const ref = cx.mul(gamma, cx.C(Math.cos(-bd + phase), Math.sin(-bd + phase)));
          const v = fwd.re + ref.re;
          d += (i ? "L" : "M") + xOfD(dl).toFixed(1) + " " + (YC - A * v).toFixed(1);
        }
        instPath.setAttribute("d", d);
      }
      RF.dragSvg(svg, (p) => {
        if (Math.hypot(p.x - 480, p.y - 172) > 26) return null;
        const y0 = p.y, r0 = st.r;
        return (q) => { rSl.set(RF.clamp(r0 * Math.exp(-(q.y - y0) / 45), 0.5, 2000)); };
      });

      /* ----- controls ----- */
      const rSl = RF.slider(ui.ctl, { id: "mm-r", label: "Load R", min: 0.5, max: 2000, log: true, value: st.r, fmt: (v) => fmt(v, 3) + " Ω", onInput: (v) => { st.r = v; update(); } });
      const xSl = RF.slider(ui.ctl, { id: "mm-x", label: "Load X", min: -300, max: 300, step: 1, value: st.x, fmt: (v) => (v >= 0 ? "+j" : "−j") + fmt(Math.abs(v), 3) + " Ω", onInput: (v) => { st.x = v; update(); } });
      const zSl = RF.slider(ui.ctl, { id: "mm-z0", label: "System Z₀", min: 25, max: 100, step: 1, value: st.z0, fmt: (v) => fmt(v, 3) + " Ω", onInput: (v) => { st.z0 = v; update(); } });
      const set = (r, x) => { st.r = r; st.x = x; rSl.set(r, true); xSl.set(x, true); update(); };
      RF.presets(ui.ctl, "Try", [
        { label: "75 Ω", go: () => set(75, 0) },
        { label: "100 Ω", go: () => set(100, 0) },
        { label: "25 Ω", go: () => set(25, 0) },
        { label: "5 Ω PA die", go: () => set(5, 0) },
        { label: "50 + j50", go: () => set(50, 50) },
        { label: "Short", go: () => set(0.5, 0) },
        { label: "Open", go: () => set(2000, 0) },
      ]);
      const ro = RF.readouts(ui.ctl, [
        { key: "g", label: "|Γ|" }, { key: "rl", label: "Return loss" }, { key: "s11", label: "S11" },
        { key: "vswr", label: "VSWR" }, { key: "pr", label: "Power reflected" }, { key: "ml", label: "Mismatch loss" },
      ]);

      /* ----- plots ----- */
      ui.plots.classList.add("two");
      const onSmithDrag = (g) => {
        const z = cx.zFromGamma(g, st.z0);
        set(RF.clamp(z.re, 0.5, 2000), RF.clamp(z.im, -300, 300));
      };
      const smith = RF.smith(ui.plots, { title: "Smith chart", onDrag: onSmithDrag, points: [] });
      const powerBox = el("div", { class: "plot" });
      ui.plots.append(powerBox);
      const rulerBox = el("div", { class: "plot" });
      rulerBox.style.gridColumn = "1 / -1";
      ui.plots.append(rulerBox);

      function drawPower(pr) {
        const W = 300, H = 300;
        const k = [];
        const bx = 110, bw = 44, top = 30, hh = 220;
        const hRef = hh * pr, hDel = hh - hRef;
        const gap = pr > 0.002 && pr < 0.998 ? 2 : 0;
        if (hDel > 0) k.push(s("path", { d: roundTopBar(bx, top + hRef + gap, bw, Math.max(0, hDel - gap), pr < 0.002) }, { fill: "var(--s1)" }));
        if (hRef > 0.5) k.push(s("rect", { x: bx, y: top, width: bw, height: Math.max(0.5, hRef), rx: 0 }, { fill: "var(--s2)" }));
        k.push(s("line", { x1: bx - 14, x2: bx + bw + 14, y1: top + hh, y2: top + hh }, { stroke: "var(--axis)", strokeWidth: 1 }));
        const lab = (y, t1, t2, c) => {
          k.push(s("rect", { x: bx + bw + 14, y: y - 9, width: 12, height: 3, rx: 1.5 }, { fill: c }));
          k.push(s("text", { x: bx + bw + 32, y: y - 3, "font-size": 16, "font-weight": 600, text: t1 }, { fill: "var(--ink)", fontFamily: "var(--font-mono)" }));
          k.push(s("text", { x: bx + bw + 32, y: y + 13, "font-size": 11.5, text: t2 }, { fill: "var(--ink-2)" }));
        };
        lab(Math.max(top + 12, top + hRef / 2), fmt(pr * 100, 3) + " %", "reflected", "var(--s2)");
        lab(Math.min(top + hh - 8, Math.max(top + hRef + 44, top + hRef + hDel / 2)), fmt((1 - pr) * 100, 3) + " %", "delivered to load", "var(--s1)");
        k.push(s("text", { x: bx + bw / 2, y: top + hh + 20, "text-anchor": "middle", "font-size": 11.5, text: "100 % incident" }, { fill: "var(--muted)" }));
        const sv = s("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": `${fmt(pr * 100, 3)} percent of incident power reflected` });
        sv.append(...k);
        powerBox.replaceChildren(el("h3", { text: "Where the power goes" }), el("p", { class: "sub", text: "Γ is a voltage ratio. Square it for power." }), sv);
      }
      function roundTopBar(x, y, w, h, roundTop) {
        const r = roundTop ? Math.min(4, h) : 0;
        return `M${x} ${y + h}V${y + r}q0 -${r} ${r} -${r}H${x + w - r}q${r} 0 ${r} ${r}V${y + h}Z`;
      }

      function drawRuler(rl) {
        const W = 640, H = 150, L = 118, R = 16, x0 = L, x1 = W - R;
        const maxRL = 40;
        const X = (v) => x0 + ((x1 - x0) * Math.min(v, maxRL)) / maxRL;
        const ticks = [3, 6, 10, 14, 20, 30, 40];
        const k = [];
        const rows = [
          ["Return loss (dB)", (v) => fmt(v, 2)],
          ["|Γ|", (v) => fmt(Math.pow(10, -v / 20), 2)],
          ["% reflected", (v) => fmt(100 * Math.pow(10, -v / 10), 2)],
          ["VSWR", (v) => { const g = Math.pow(10, -v / 20); return g >= 0.999 ? "∞" : fmt((1 + g) / (1 - g), 3); }],
        ];
        rows.forEach(([name], i) => k.push(s("text", { x: 0, y: 34 + i * 26, "font-size": 11.5, text: name }, { fill: i ? "var(--ink-2)" : "var(--ink)", fontWeight: i ? 400 : 600 })));
        k.push(s("line", { x1: x0, x2: x1, y1: 40, y2: 40 }, { stroke: "var(--axis)", strokeWidth: 1 }));
        for (const t of ticks) {
          const x = X(t);
          k.push(s("line", { x1: x, x2: x, y1: 18, y2: 118 }, { stroke: "var(--grid)", strokeWidth: 1 }));
          rows.forEach(([, f], i) => k.push(s("text", { x, y: 34 + i * 26, "text-anchor": "middle", "font-size": 11.5, text: f(t) }, { fill: i ? "var(--ink-2)" : "var(--ink)", fontFamily: "var(--font-mono)" })));
        }
        const xm = X(rl);
        k.push(s("line", { x1: xm, x2: xm, y1: 12, y2: 124 }, { stroke: "var(--gold)", strokeWidth: 2 }));
        k.push(s("path", { d: `M${xm - 6} 8L${xm + 6} 8L${xm} 15Z` }, { fill: "var(--gold)" }));
        k.push(s("text", { x: RF.clamp(xm, x0 + 60, x1 - 60), y: 142, "text-anchor": "middle", "font-size": 12, "font-weight": 600, text: `you are here: ${rl > maxRL ? "> 40" : fmt(rl, 3)} dB` }, { fill: "var(--gold-ink)" }));
        const sv = s("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Conversion ruler between return loss, reflection coefficient, percent reflected and VSWR" });
        sv.append(...k);
        const wrap = el("div", { class: "tscroll" }, [sv]);
        sv.style.minWidth = "520px";
        rulerBox.replaceChildren(el("h3", { text: "Conversion ruler: memorize the columns" }), el("p", { class: "sub", text: "Each column is one mismatch described four ways. Higher return loss means a better match." }), wrap);
      }

      function update() {
        const z = cx.C(st.r, st.x);
        gamma = cx.gamma(z, st.z0);
        const g = Math.min(cx.abs(gamma), 0.99999);
        const rl = -RF.db20(g);
        const pr = g * g;
        const vswr = (1 + g) / (1 - g);
        const ml = -RF.db10(1 - pr);
        const ang = (Math.atan2(gamma.im, gamma.re) * 180) / Math.PI;
        ro.update({
          g: fmt(g, 3), rl: [fmt(rl, 3), "dB"], s11: [fmt(-rl, 3), "dB"],
          vswr: [vswr > 1e4 ? "∞" : fmt(vswr, 3), ": 1"], pr: [fmt(pr * 100, 3), "%"], ml: [fmt(ml, 3), "dB"],
        });
        drawBench();
        smith.update({
          title: "Smith chart", subtitle: "Drag anywhere inside to move the load", z0: st.z0,
          onDrag: onSmithDrag,
          circles: [{ r: g, color: "var(--s1)", opacity: 0.5, width: 1.5 }],
          points: [{ g: gamma, color: "var(--s1)", label: `Γ = ${fmt(g, 2)}∠${fmt(ang, 3)}°` }],
          aria: `Load point on the Smith chart at reflection coefficient ${fmt(g, 2)}`,
        });
        drawPower(pr);
        drawRuler(rl);
        const zs = `${fmt(st.r, 3)}${Math.abs(st.x) < 0.5 ? "" : (st.x > 0 ? " + j" : " − j") + fmt(Math.abs(st.x), 3)}`;
        RF.setEqs(ui.eqs, [
          { name: "Reflection coefficient (a voltage ratio)", f: `Γ = (Z<sub>L</sub> − Z<sub>0</sub>) / (Z<sub>L</sub> + Z<sub>0</sub>) = (${zs} − ${fmt(st.z0, 3)}) / (${zs} + ${fmt(st.z0, 3)}) → |Γ| = ${b(fmt(g, 3))}` },
          { name: "Power reflected: square it", f: `|Γ|² = ${fmt(g, 3)}² = ${b(fmt(pr * 100, 3) + " %")}` },
          { name: "Return loss (positive, bigger is better). S11 is the same number, negative.", f: `RL = −20·log₁₀|Γ| = ${b(fmt(rl, 3) + " dB")}     S11 = ${fmt(-rl, 3)} dB` },
          { name: "VSWR: ratio of the envelope peak to its valley", f: `VSWR = (1 + |Γ|) / (1 − |Γ|) = ${b(vswr > 1e4 ? "∞" : fmt(vswr, 3))}` },
          { name: "Mismatch loss: power that never reaches the load", f: `ML = −10·log₁₀(1 − |Γ|²) = ${b(fmt(ml, 3) + " dB")}` },
        ]);
      }

      RF.setSay(ui.say, {
        quote: "Γ is 25 over 125, so 0.2. That's 4 percent of the power reflected, 14 dB return loss, VSWR 1.5, and under 0.2 dB of mismatch loss. It's a mild mismatch. It fails a 15 to 20 dB return loss spec, but it won't hurt anything.",
        bullets: [
          "Why 50 Ω: air coax handles the most power near 30 Ω and has the lowest loss near 77 Ω. 50 is the compromise.",
          "Anchors: Γ 0.1 is 20 dB and 1 %. Γ 0.2 is 14 dB and 4 %. Γ 0.33 is 10 dB and 11 %. Γ 0.5 is 6 dB and 25 %.",
          "1 dB of return loss is nearly an open or a short. A big number is a good match.",
          "A 5 Ω die straight on 50 Ω gives Γ 0.82 and 1.7 dB RL. That's why PAs need matching networks.",
        ],
      });

      RF.predict(ui.predict, [
        { q: "A 50 Ω system drives a 75 Ω load. What percent of the power reflects?", unit: "%", answer: () => 4, tol: 0.15, apply: () => set(75, 0), explain: "Γ = 25/125 = 0.2, and power goes as Γ², so 4 %." },
        { q: "Same 75 Ω load. What's the return loss?", unit: "dB", answer: () => 13.98, absTol: 0.7, apply: () => set(75, 0), explain: "−20·log(0.2) = 14 dB. Remember it as the Γ 0.2 anchor." },
        { q: "A 5 Ω PA die is connected straight to 50 Ω. What's |Γ|?", unit: "", answer: () => 45 / 55, absTol: 0.03, apply: () => set(5, 0), explain: "45/55 = 0.82. That reflects 67 % of the power, about 1.7 dB of return loss." },
        { q: "A part has 20 dB return loss. What percent of the power reflects?", unit: "%", answer: () => 1, tol: 0.15, apply: () => set(50 * 1.1 / 0.9, 0), explain: "20 dB means Γ = 0.1, and 0.1² = 1 %." },
        { q: "A load has VSWR 2:1. What's its return loss?", unit: "dB", answer: () => 9.54, absTol: 0.6, apply: () => set(100, 0), explain: "VSWR 2 means Γ = 1/3, and −20·log(1/3) = 9.5 dB. 100 Ω on 50 Ω gives exactly this." },
        { q: "100 Ω on a 50 Ω line. What's the mismatch loss?", unit: "dB", answer: () => 0.512, absTol: 0.1, apply: () => set(100, 0), explain: "Γ² = 1/9, and −10·log(8/9) = 0.51 dB. Even a 2:1 VSWR only costs half a dB of delivered power." },
      ], "mismatch");

      update();

      function loop() {
        phase -= 0.06;
        drawInstant();
        anim = requestAnimationFrame(loop);
      }
      const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      return {
        show() { if (!reduce && !anim) anim = requestAnimationFrame(loop); },
        hide() { if (anim) cancelAnimationFrame(anim); anim = null; },
      };
    },
  });
})();
