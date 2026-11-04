/* Module: square wave to spectrum. Trapezoid harmonics, the two envelope corners, and what a faster edge does. */
(function () {
  "use strict";
  const { el, s, fmt, b } = RF;
  const sinc = (x) => (Math.abs(x) < 1e-12 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x));
  const si = (v, u, sg = 3) => (v === 0 ? "0" : RF.si(v, u, sg));

  RF.register({
    id: "spectrum",
    tab: "Square wave",
    sub: "harmonics · rise time",
    build(root) {
      const ui = RF.scaffold(root, {
        who: "Senior question · rise time",
        title: "A square wave is a spectrum, and the edge sets where it ends",
        lede: "The clock sets where the harmonics sit. The pulse width sets the first corner of their envelope, and the rise time sets the second. Make the edge faster and the low harmonics don't move. Only the high ones come up.",
        benchTitle: "One edge, zoomed in",
        plotTitle: "Waveform and spectrum",
      });
      const st = { f0: 1e3, duty: 0.5, trA: 50e-6, trB: 20e-6, keep: 15, A: 1 };

      function calc() {
        const T = 1 / st.f0, tau = st.duty * T;
        const lim = 0.98 * Math.min(tau, T - tau);
        const trA = Math.min(st.trA, lim), trB = Math.min(st.trB, lim);
        const cn = (n, tr) => 2 * st.A * st.duty * Math.abs(sinc(n * st.duty)) * Math.abs(sinc((n * tr) / T));
        const env = (f, tr) => 2 * st.A * st.duty * Math.min(1, 1 / (Math.PI * f * tau)) * Math.min(1, 1 / (Math.PI * f * tr));
        return { T, tau, trA, trB, cn, env, clipped: st.trA > lim || st.trB > lim, f1: 1 / (Math.PI * tau), f2A: 1 / (Math.PI * trA), f2B: 1 / (Math.PI * trB) };
      }
      /* trapezoid with its 50 % points at t = 0 and t = tau */
      function wave(t, c, tr) {
        const u = ((t % c.T) + c.T) % c.T;
        const r = tr / 2;
        if (u < r) return st.A * (0.5 + u / tr);
        if (u < c.tau - r) return st.A;
        if (u < c.tau + r) return st.A * (0.5 - (u - c.tau) / tr);
        if (u < c.T - r) return 0;
        return st.A * (0.5 + (u - c.T) / tr);
      }

      /* ----- drawing: the edge ----- */
      const svg = s("svg", { viewBox: "0 0 560 170", role: "img", "aria-label": "One rising edge for each rise time, with the rise time marked" });
      ui.draw.append(svg, el("div", { class: "hint", text: "Same step, two edges. tᵣ here is the full 0 to 100 % ramp. A 10 to 90 % figure is 0.8 of that, and the ratio between two edges doesn't change." }));
      function drawBench(c) {
        const k = [];
        const span = 1.5 * Math.max(c.trA, c.trB);
        const x = (t) => 280 + (t / span) * 240;
        const yLo = 132, yHi = 34;
        const path = (tr, color, w) => {
          const d = `M${x(-span)} ${yLo}L${x(-tr / 2)} ${yLo}L${x(tr / 2)} ${yHi}L${x(span)} ${yHi}`;
          return s("path", { d }, { fill: "none", stroke: color, strokeWidth: w, strokeLinejoin: "round" });
        };
        k.push(s("line", { x1: 40, x2: 520, y1: yLo, y2: yLo }, { stroke: "var(--axis)", strokeWidth: 1 }));
        k.push(path(c.trA, "var(--s1)", 3), path(c.trB, "var(--s2)", 3));
        const T = (tx, ty, t, color) => s("text", { x: tx, y: ty, "font-size": 12, "font-weight": 600, text: t }, { fill: color });
        k.push(T(42, 24, `tᵣ ${si(c.trA, "s")}`, "var(--s1)"), T(42, 42, `tᵣ ${si(c.trB, "s")}`, "var(--s2)"));
        k.push(s("text", { x: 280, y: 156, "text-anchor": "middle", "font-size": 11.5, text: `Shown ${si(2 * span, "s")} wide. The period is ${si(c.T, "s")}.` }, { fill: "var(--ink-2)" }));
        svg.replaceChildren(...k);
      }

      /* ----- controls ----- */
      const trFmt = (v) => si(v, "s");
      const aSl = RF.slider(ui.ctl, { id: "sq-a", label: "Rise time A", min: 1e-12, max: 1e-3, log: true, value: st.trA, fmt: trFmt, onInput: (v) => { st.trA = v; update(); } });
      const bSl = RF.slider(ui.ctl, { id: "sq-b", label: "Rise time B", min: 1e-12, max: 1e-3, log: true, value: st.trB, fmt: trFmt, onInput: (v) => { st.trB = v; update(); } });
      const fSl = RF.slider(ui.ctl, { id: "sq-f", label: "Repetition rate", min: 100, max: 1e10, log: true, value: st.f0, fmt: (v) => si(v, "Hz"), onInput: (v) => { st.f0 = v; update(); } });
      const dSl = RF.slider(ui.ctl, { id: "sq-d", label: "Duty cycle", min: 0.05, max: 0.95, step: 0.01, value: st.duty, fmt: (v) => fmt(v * 100, 3) + " %", onInput: (v) => { st.duty = v; update(); } });
      const kSl = RF.slider(ui.ctl, { id: "sq-k", label: "Harmonics kept", min: 1, max: 99, step: 1, value: st.keep, fmt: (v) => "up to " + v, onInput: (v) => { st.keep = v; update(); } });
      const set = (o) => {
        Object.assign(st, o);
        aSl.set(st.trA, true); bSl.set(st.trB, true); fSl.set(st.f0, true); dSl.set(st.duty, true); kSl.set(st.keep, true);
        update();
      };
      RF.presets(ui.ctl, "Try", [
        { label: "1 kHz, 50 → 20 µs", go: () => set({ f0: 1e3, trA: 50e-6, trB: 20e-6, duty: 0.5 }) },
        { label: "1 GHz clock, 50 → 20 ps", go: () => set({ f0: 1e9, trA: 50e-12, trB: 20e-12, duty: 0.5 }) },
        { label: "100 MHz, 1 ns → 100 ps", go: () => set({ f0: 1e8, trA: 1e-9, trB: 100e-12, duty: 0.5 }) },
        { label: "20 % duty", go: () => set({ duty: 0.2 }) },
      ]);
      const ro = RF.readouts(ui.ctl, [
        { key: "f1", label: "Corner 1, 1/(π·τ)" },
        { key: "fa", label: "Corner 2, edge A" },
        { key: "fb", label: "Corner 2, edge B" },
        { key: "knee", label: "Knee 0.35/tᵣ, B" },
        { key: "lift", label: "Far above both" },
        { key: "n", label: "Harmonics to knee, B" },
      ]);
      const warn = el("div", { class: "presets" });
      const tblBox = el("div", { class: "tscroll" });
      ui.ctl.append(warn, tblBox);

      /* ----- plots ----- */
      const blank = { x: { min: 1, max: 10 }, y: { min: 0, max: 1 }, series: [{ pts: [[1, 0], [10, 1]], color: "var(--s1)" }] };
      const pT = RF.plot(ui.plots, blank);
      const pS = RF.plot(ui.plots, { x: { min: 1, max: 10, log: true }, y: { min: -100, max: 0 }, series: blank.series });
      const pD = RF.plot(ui.plots, { x: { min: 1, max: 10, log: true }, y: { min: 0, max: 10 }, series: blank.series });

      function update() {
        const c = calc();
        drawBench(c);
        const lift = 20 * Math.log10(c.trA / c.trB);
        const knee = 0.35 / c.trB;
        ro.update({
          f1: si(c.f1, "Hz"), fa: si(c.f2A, "Hz"), fb: si(c.f2B, "Hz"), knee: si(knee, "Hz"),
          lift: [(lift >= 0 ? "+" : "−") + fmt(Math.abs(lift), 3), "dB"], n: fmt(knee / st.f0, 3),
        });
        warn.replaceChildren();
        if (c.clipped) warn.append(el("span", { class: "pill warn", text: "An edge is longer than the pulse, so it's capped at the pulse width" }));

        // time
        const ts = RF.linspace(-0.25 * c.T, 1.25 * c.T, 1500);
        const fourier = (t, tr) => {
          let v = st.A * st.duty;
          for (let n = 1; n <= st.keep; n++) v += ((2 * st.A * st.duty * sinc(n * st.duty) * sinc((n * tr) / c.T)) * Math.cos((2 * Math.PI * n * (t - c.tau / 2)) / c.T));
          return v;
        };
        pT.update({
          title: `Time: the same pulse, rebuilt from its first ${st.keep} harmonic${st.keep > 1 ? "s" : ""}`,
          subtitle: "Slide the harmonics down to 1 and the square wave becomes a sine. Square corners need the high harmonics.",
          height: 220,
          x: { min: ts[0], max: ts[ts.length - 1], label: "Time", fmt: (v) => si(v, "s", 2) },
          y: { min: -0.25 * st.A, max: 1.3 * st.A, label: "Volts" },
          series: [
            { name: "Fourier sum, edge B", pts: ts.map((t) => [t, fourier(t, c.trB)]), color: "var(--s3)", width: 1.5 },
            { name: "Edge A", pts: ts.map((t) => [t, wave(t, c, c.trA)]), color: "var(--s1)" },
            { name: "Edge B", pts: ts.map((t) => [t, wave(t, c, c.trB)]), color: "var(--s2)" },
          ],
          tipX: (v) => si(v, "s"), tipY: (v) => fmt(v, 3) + " V",
        });

        // spectrum
        const fa = st.f0 * 0.5, fb = Math.max(c.f2B, c.f2A) * 30;
        const ymin = -100;
        const stems = (tr) => {
          const pts = [];
          const nMax = Math.min(600, Math.floor(fb / st.f0));
          for (let n = 1; n <= nMax; n++) {
            const v = c.cn(n, tr);
            if (v < 1e-7) continue;
            const f = n * st.f0;
            pts.push([f, ymin], [f, RF.db20(v)], [NaN, NaN]);
          }
          return pts;
        };
        const fs = RF.logspace(fa, fb, 300);
        const envelope = (tr) => fs.map((f) => [f, RF.db20(c.env(f, tr))]);
        const lo = Math.min(c.trA, c.trB) === c.trA ? c.trB : c.trA;
        const hi = lo === c.trA ? c.trB : c.trA;
        const colorOf = (tr) => (tr === c.trA ? "var(--s1)" : "var(--s2)");
        pS.update({
          title: "Spectrum: the edge only changes what's past its corner",
          subtitle: "Stems are the harmonics. Lines are the envelope: flat, then −20 dB/decade, then −40 dB/decade.",
          height: 300,
          x: { min: fa, max: fb, log: true, label: "Frequency", fmt: (v) => si(v, "Hz", 2) },
          y: { min: ymin, max: 10, label: "Amplitude (dB re 1 V)" },
          series: [
            { name: "", pts: stems(hi), color: colorOf(hi), width: 1, opacity: 0.45, noTip: true, noLegend: true },
            { name: "", pts: stems(lo), color: colorOf(lo), width: 1, opacity: 0.45, noTip: true, noLegend: true },
            { name: `Envelope, tᵣ ${si(c.trA, "s")}`, pts: envelope(c.trA), color: "var(--s1)", width: 2.5 },
            { name: `Envelope, tᵣ ${si(c.trB, "s")}`, pts: envelope(c.trB), color: "var(--s2)", width: 2.5 },
          ],
          vlines: [
            { x: c.f1, label: "1/(π·τ)" },
            { x: c.f2A, label: "A", color: "var(--s1)", dy: 40 },
            { x: c.f2B, label: "B", color: "var(--s2)", dy: 40 },
          ],
          tipX: (v) => si(v, "Hz"), tipY: (v) => fmt(v, 3) + " dB",
        });

        // change in envelope
        const liftMax = Math.max(1, Math.abs(lift) * 1.25);
        pD.update({
          title: "Envelope change, B relative to A",
          subtitle: "Zero up to the slower corner, then a ramp, then a flat step of 20·log(tᵣA/tᵣB).",
          height: 170,
          x: { min: fa, max: fb, log: true, label: "Frequency", fmt: (v) => si(v, "Hz", 2) },
          y: { min: Math.min(0, lift * 1.25, -0.5), max: Math.max(liftMax, 0.5), label: "dB" },
          series: [{ pts: fs.map((f) => [f, RF.db20(c.env(f, c.trB) / c.env(f, c.trA))]), color: "var(--s3)", area: 0.0001 }],
          bands: [{ x0: Math.min(c.f2A, c.f2B), x1: Math.max(c.f2A, c.f2B), opacity: 0.12 }],
          tipX: (v) => si(v, "Hz"), tipY: (v) => fmt(v, 3) + " dB",
        });

        // harmonic table
        const t = el("table", { class: "mini" });
        t.append(el("tr", null, ["Harmonic", "Frequency", "Edge A", "Edge B", "Change"].map((h) => el("th", { text: h }))));
        const list = [1, 3, 5, 9, 15, 25, 49, 99, 199, 399];
        for (const n of list) {
          const a = c.cn(n, c.trA), bb = c.cn(n, c.trB);
          if (a < 1e-9 || bb < 1e-9) continue;
          t.append(el("tr", null, [
            el("td", { text: String(n) }), el("td", { text: si(n * st.f0, "Hz") }),
            el("td", { text: fmt(RF.db20(a), 3) }), el("td", { text: fmt(RF.db20(bb), 3) }),
            el("td", { text: (RF.db20(bb / a) >= 0 ? "+" : "") + fmt(RF.db20(bb / a), 2) }),
          ]));
        }
        tblBox.replaceChildren(el("div", { class: "muted", style: "font-size:12.5px;margin-bottom:4px", text: "Amplitudes in dB re 1 V. Change in dB. The exact harmonic can differ from the envelope near a sinc null." }), t);

        RF.setEqs(ui.eqs, [
          { name: "Harmonic n of a trapezoid (Fourier series)", f: `cₙ = 2A·d·|sinc(n·d)|·|sinc(n·tᵣ/T)|,  d = τ/T = ${fmt(st.duty, 3)}` },
          { name: "First corner: from the pulse width. Above it, −20 dB/decade", f: `f₁ = 1/(π·τ) = 1/(π × ${si(c.tau, "s")}) = ${b(si(c.f1, "Hz"))}` },
          { name: "Second corner: from the edge. Above it, −40 dB/decade", f: `f₂ = 1/(π·tᵣ):  A ${b(si(c.f2A, "Hz"))},  B ${b(si(c.f2B, "Hz"))}` },
          { name: "How much the envelope lifts above both corners", f: `20·log₁₀(tᵣA/tᵣB) = 20·log₁₀(${fmt(c.trA / c.trB, 3)}) = ${b(fmt(lift, 3) + " dB")}` },
          { name: "Bandwidth rule of thumb for a 10 to 90 % edge", f: `BW ≈ 0.35/tᵣ = ${b(si(knee, "Hz"))} for edge B` },
          { name: "Ideal square wave, 50 % duty: odd harmonics only", f: `cₙ = 2A/(n·π):  fundamental ${fmt(RF.db20((2 * st.A) / Math.PI), 3)} dB, third is 1/3 of it, −9.5 dBc` },
        ]);
      }

      RF.setSay(ui.say, {
        quote: "The rise time sets the bandwidth, not the clock. A square wave's harmonics fall at 20 dB per decade, and the edge adds a second corner at one over pi tᵣ, where they start falling at 40. Going from 50 to 20 moves that corner by 2.5 times. The fundamental and the low harmonics don't change. Above the new corner, every harmonic comes up 8 dB, because 20 log of 2.5 is 8. So the same clock now needs 2.5 times the channel bandwidth, and it radiates and couples more.",
        bullets: [
          "Anchors for 50 % duty: third harmonic −9.5 dBc, fifth −14 dBc. Even harmonics vanish, and any duty error brings them back.",
          "The ratio is what matters: 50 to 20 is +8 dB in any time unit. Corners: 50 µs is 6.4 kHz and 20 µs is 16 kHz. 50 ps is 6.4 GHz and 20 ps is 16 GHz.",
          "Why it matters: crosstalk and reflections respond to the edge. Slowing an edge is often the cheapest EMI fix, if timing allows.",
          "Check the definition: 0.35/tᵣ assumes a 10 to 90 % edge through a single-pole response. The corner above uses the full linear ramp.",
          "Energy barely moves: the pulse's RMS is nearly the same. What changes is a small amount of energy at much higher frequencies.",
        ],
      });

      RF.predict(ui.predict, [
        { q: "Rise time goes from 50 µs to 20 µs. Far above both corners, how much does the envelope rise?", unit: "dB", answer: () => 20 * Math.log10(2.5), absTol: 0.7, apply: () => set({ f0: 1e3, trA: 50e-6, trB: 20e-6, duty: 0.5 }), explain: "20·log(50/20) = 8 dB. It's a lift above the corner, not a change everywhere." },
        { q: "Where is the second corner for a 50 µs edge?", unit: "kHz", answer: () => 1 / (Math.PI * 50e-6) / 1e3, absTol: 0.5, apply: () => set({ f0: 1e3, trA: 50e-6, trB: 20e-6, duty: 0.5 }), explain: "1/(π × 50 µs) = 6.4 kHz. At 20 µs it moves to 16 kHz." },
        { q: "In the same change, how many dB does the 1 kHz fundamental move?", unit: "dB", answer: () => 20 * Math.log10(sinc(0.02) / sinc(0.05)), absTol: 0.1, apply: () => set({ f0: 1e3, trA: 50e-6, trB: 20e-6, duty: 0.5 }), explain: "About 0.03 dB, so effectively nothing. The fundamental is far below the corner." },
        { q: "Third harmonic of an ideal 50 % square wave, relative to the fundamental?", unit: "dBc", answer: () => -20 * Math.log10(3), absTol: 0.7, explain: "1/3 in voltage is −9.5 dB. The fifth is −14 dB." },
        { q: "A 10 to 90 % edge of 20 ps. How much bandwidth, by the 0.35 rule?", unit: "GHz", answer: () => 17.5, absTol: 1, apply: () => set({ f0: 1e9, trA: 50e-12, trB: 20e-12, duty: 0.5 }), explain: "0.35/20 ps = 17.5 GHz, even though the clock is only 1 GHz." },
      ], "spectrum");

      update();
      return {};
    },
  });
})();
