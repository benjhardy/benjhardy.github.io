/* Module: signal integrity. Reflections, loss, and the eye, all from one transmission-line transfer function. */
(function () {
  "use strict";
  const { el, s, fmt, b } = RF;
  const C0 = 299792458;
  const sinc = (x) => (Math.abs(x) < 1e-12 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x));

  /* PRBS7 plus one extra zero: 128 bits, so a power-of-two period */
  const BITS = (() => {
    let r = 0x7f;
    const out = [];
    for (let i = 0; i < 127; i++) {
      const nb = ((r >> 6) ^ (r >> 5)) & 1;
      out.push(r & 1);
      r = ((r << 1) | nb) & 0x7f;
    }
    out.push(0);
    return out;
  })();
  const SPB = 16;

  RF.register({
    id: "si",
    tab: "Signal integrity",
    sub: "reflections · loss · eye",
    build(root) {
      const ui = RF.scaffold(root, {
        who: "Senior question · why did the eye close?",
        title: "Signal integrity: a trace is a transmission line once the edge is fast",
        lede: "Impedance sets the reflections, length sets when they land, and loss rises with frequency. Change one and watch the step response and the eye. Both plots come from the same line model.",
        benchTitle: "Driver, trace, receiver",
        plotTitle: "Step, loss and eye",
      });
      const st = { rate: 10, tr: 30, len: 150, z0: 50, rs: 50, rl: 50, dk: 4, df: 0.02, w: 150, vdd: 0.9, rip: 3, di: 10 };

      function line() {
        const perM = Math.sqrt(st.dk) / C0;        /* s/m */
        const L = st.len * 1e-3;
        const alphaC = (f) => (2.61e-7 * Math.sqrt(f)) / (st.w * 1e-6) / (2 * st.z0);   /* skin effect, Np/m */
        const alphaD = (f) => (Math.PI * f * Math.sqrt(st.dk) * st.df) / C0;             /* Np/m */
        const td = perM * L;
        const gs = (st.rs - st.z0) / (st.rs + st.z0), gl = (st.rl - st.z0) / (st.rl + st.z0);
        const K = st.z0 / (st.z0 + st.rs);
        /* transfer to the far end and the near end at frequency f (Hz); complex, e^(+jωt) */
        const H = (f) => {
          const ac = alphaC(Math.abs(f)) * L, ad = alphaD(Math.abs(f)) * L;
          const a = ac + ad;
          /* causal phase to go with the loss: skin effect adds as much phase as attenuation, and Dk falls with
             log f (Djordjevic-Sarkar form, referenced to 1 GHz) */
          const th = f === 0 ? 0 : 2 * Math.PI * f * td + Math.sign(f) * (ac - (2 / Math.PI) * ad * Math.log(Math.abs(f) / 1e9));
          const er = Math.exp(-a) * Math.cos(th), ei = -Math.exp(-a) * Math.sin(th);
          const e2r = er * er - ei * ei, e2i = 2 * er * ei;
          const dr = 1 - gs * gl * e2r, di = -gs * gl * e2i, dd = dr * dr + di * di;
          const fr = K * (1 + gl) * (er * dr + ei * di) / dd, fi = K * (1 + gl) * (ei * dr - er * di) / dd;
          const nr = 1 + gl * e2r, ni = gl * e2i;
          const nearR = K * (nr * dr + ni * di) / dd, nearI = K * (ni * dr - nr * di) / dd;
          return { fr, fi, nearR, nearI };
        };
        return { perM, td, gs, gl, H, alphaC, alphaD, L, K };
      }

      /* apply a filter to a periodic real signal, with the driver's edge included */
      function through(x, dt, ln, trS, end) {
        const N = x.length;
        const re = x.slice(), im = new Array(N).fill(0);
        RF.fft(re, im);
        for (let k = 0; k < N; k++) {
          const f = (k <= N / 2 ? k : k - N) / (N * dt);
          const h = ln.H(f);
          /* the ramp, delayed by tᵣ/2 so the edge starts at t = 0 */
          const e = sinc(f * trS), sh = -Math.PI * f * trS;
          const er = e * Math.cos(sh), ei = e * Math.sin(sh);
          const h0r = end === "near" ? h.nearR : h.fr, h0i = end === "near" ? h.nearI : h.fi;
          const hr = h0r * er - h0i * ei, hi = h0r * ei + h0i * er;
          const r = re[k] * hr - im[k] * hi;
          im[k] = re[k] * hi + im[k] * hr;
          re[k] = r;
        }
        RF.fft(re, im, true);
        return re;
      }

      function stepResponse(ln) {
        const trS = st.tr * 1e-12;
        const show = Math.max(10 * ln.td, 8 * trS, 200e-12);
        /* the period must outlast the ringing, or the falling edge lands inside it */
        const rho = Math.abs(ln.gs * ln.gl);
        const settle = rho > 1e-3 ? (2 * ln.td * Math.log(1e-3)) / Math.log(rho) : 0;
        const Tw = Math.max(4 * show, 40 * ln.td, 2 * (show + settle));
        const want = Math.max(Tw / Math.min(trS / 6, Math.max(ln.td / 8, trS / 40)), 1024);
        const N = Math.pow(2, Math.min(17, Math.ceil(Math.log2(want))));
        const dt = Tw / N;
        const x = Array.from({ length: N }, (_, i) => (i < N / 2 ? 1 : 0));
        return { dt, N, show, far: through(x, dt, ln, trS, "far"), near: through(x, dt, ln, trS, "near") };
      }

      function eye(ln) {
        const ui0 = 1e-9 / st.rate;
        const dt = ui0 / SPB;
        const x = [];
        for (const bit of BITS) for (let j = 0; j < SPB; j++) x.push(bit);
        const v = through(x, dt, ln, st.tr * 1e-12, "far");
        const N = v.length;
        const base = Math.round((ln.td + (st.tr * 1e-12) / 2) / dt);
        const mean = v.reduce((a, c) => a + c, 0) / N;
        let best = { h: -Infinity, off: base };
        const heightAt = (off) => {
          let lo1 = Infinity, hi0 = -Infinity;
          BITS.forEach((bit, i) => {
            const y = v[(((i * SPB + off) % N) + N) % N];
            if (bit) lo1 = Math.min(lo1, y); else hi0 = Math.max(hi0, y);
          });
          return lo1 - hi0;
        };
        for (let off = base - SPB; off <= base + 6 * SPB; off++) {
          const h = heightAt(off);
          if (h > best.h) best = { h, off };
        }
        /* eye width: walk out from the best phase, interpolating where the height crosses zero */
        let width = 0;
        if (best.h > 0) {
          const edge = (dir) => {
            let d = 0, hNow = best.h;
            while (Math.abs(d) < SPB) {
              const hNext = heightAt(best.off + d + dir);
              if (hNext <= 0) return Math.abs(d) + hNow / (hNow - hNext);
              d += dir;
              hNow = hNext;
            }
            return SPB;
          };
          width = Math.min(1, (edge(-1) + edge(1)) / SPB);
        }
        const pts = [];
        BITS.forEach((_, i) => {
          for (let j = -SPB; j <= SPB; j++) {
            const y = v[(((i * SPB + best.off + j) % N) + N) % N];
            pts.push([j / SPB, y]);
          }
          pts.push([NaN, NaN]);
        });
        return { height: best.h, width, pts, mean };
      }

      /* ----- drawing ----- */
      const svg = s("svg", { viewBox: "0 0 560 120", role: "img", "aria-label": "Driver with source resistance, a transmission line, and a receiver with load resistance" });
      ui.draw.append(svg, el("div", { class: "hint", text: "A real receiver is usually a high impedance, which is why terminations exist. Set R_L to 100 kΩ for an open end." }));
      function drawBench(ln) {
        const k = [];
        const T = (x, y, t, at = {}, sty = {}) => s("text", Object.assign({ x, y, "font-size": 11.5, text: t, "text-anchor": "middle" }, at), Object.assign({ fill: "var(--ink)" }, sty));
        k.push(s("line", { x1: 90, x2: 480, y1: 48, y2: 48 }, { stroke: "var(--gold)", strokeWidth: 4 }));
        k.push(s("rect", { x: 20, y: 28, width: 44, height: 40, rx: 6 }, { fill: "var(--surface)", stroke: "var(--axis)" }));
        k.push(T(42, 52, "Tx"));
        k.push(s("rect", { x: 66, y: 40, width: 30, height: 16, rx: 2 }, { fill: "var(--gold-soft)", stroke: "var(--gold-ink)" }));
        k.push(T(81, 82, `R_s ${fmt(st.rs, 3)} Ω`));
        k.push(s("rect", { x: 480, y: 40, width: 22, height: 16, rx: 2 }, { fill: "var(--gold-soft)", stroke: "var(--gold-ink)" }));
        k.push(T(490, 82, `R_L ${st.rl >= 1e4 ? "open" : fmt(st.rl, 3) + " Ω"}`));
        k.push(T(285, 30, `Z₀ ${fmt(st.z0, 3)} Ω, ${fmt(st.len, 4)} mm, delay ${RF.si(ln.td, "s")}`));
        k.push(T(285, 72, `Γ_source ${fmt(ln.gs, 2)}     Γ_load ${fmt(ln.gl, 2)}`, {}, { fill: "var(--ink-2)" }));
        k.push(T(285, 106, `${fmt(st.rate, 3)} Gb/s NRZ, tᵣ ${fmt(st.tr, 3)} ps, Dk ${fmt(st.dk, 3)}, Df ${fmt(st.df, 2)}`, {}, { fill: "var(--ink-2)" }));
        svg.replaceChildren(...k);
      }

      /* ----- controls ----- */
      const C = {};
      const add = (key, o) => { C[key] = RF.slider(ui.ctl, Object.assign({ id: "si-" + key, value: st[key], onInput: (v) => { st[key] = v; update(); } }, o)); };
      add("rate", { label: "Data rate", min: 0.5, max: 64, log: true, fmt: (v) => fmt(v, 3) + " Gb/s" });
      add("tr", { label: "Edge tᵣ", min: 5, max: 2000, log: true, fmt: (v) => fmt(v, 3) + " ps" });
      add("len", { label: "Length", min: 2, max: 1000, log: true, fmt: (v) => fmt(v, 3) + " mm" });
      add("z0", { label: "Trace Z₀", min: 25, max: 120, step: 1, fmt: (v) => fmt(v, 3) + " Ω" });
      add("rs", { label: "Source R_s", min: 1, max: 200, log: true, fmt: (v) => fmt(v, 3) + " Ω" });
      add("rl", { label: "Load R_L", min: 10, max: 1e5, log: true, fmt: (v) => (v >= 1e4 ? "open" : fmt(v, 3) + " Ω") });
      add("dk", { label: "Dk", min: 2.2, max: 4.8, step: 0.05, fmt: (v) => fmt(v, 3) });
      add("df", { label: "Df", min: 0.001, max: 0.03, log: true, fmt: (v) => fmt(v, 2) });
      add("w", { label: "Trace width", min: 50, max: 500, log: true, fmt: (v) => fmt(v, 3) + " µm" });
      const set = (o) => { Object.assign(st, o); for (const k in C) C[k].set(st[k], true); update(); };
      RF.presets(ui.ctl, "Try", [
        { label: "Matched, 10 Gb/s", go: () => set({ rate: 10, tr: 30, len: 150, z0: 50, rs: 50, rl: 50, dk: 4, df: 0.02 }) },
        { label: "Unterminated", go: () => set({ rs: 20, rl: 1e5, z0: 50, rate: 2, tr: 100, len: 150 }) },
        { label: "Series terminated", go: () => set({ rs: 50, rl: 1e5, z0: 50, rate: 2, tr: 100, len: 150 }) },
        { label: "Z₀ off: 40 Ω trace", go: () => set({ z0: 40, rs: 50, rl: 50, rate: 10, tr: 30, len: 150 }) },
        { label: "25 Gb/s on FR-4, 500 mm", go: () => set({ rate: 25, tr: 12, len: 500, z0: 50, rs: 50, rl: 50, dk: 4, df: 0.02 }) },
        { label: "Same on low-loss, Df 0.003", go: () => set({ rate: 25, tr: 12, len: 500, z0: 50, rs: 50, rl: 50, dk: 3.2, df: 0.003 }) },
      ]);
      const ro = RF.readouts(ui.ctl, [
        { key: "td", label: "Delay" },
        { key: "lc", label: "Terminate above" },
        { key: "nyq", label: "Nyquist" },
        { key: "il", label: "Loss at Nyquist" },
        { key: "over", label: "Overshoot" },
        { key: "eh", label: "Eye height" },
        { key: "ew", label: "Eye width" },
      ]);
      const status = el("div", { class: "presets" });
      ui.ctl.append(status);

      /* power integrity: target impedance */
      const pdn = el("div", { class: "mini-calc" });
      pdn.append(el("div", { class: "card-title", text: "Power integrity: target impedance" }));
      ui.ctl.append(pdn);
      const pdnOut = el("div", { class: "mono", style: "font-size:13.5px" });
      const pdnU = () => {
        const z = (st.vdd * st.rip * 0.01) / st.di;
        pdnOut.textContent = `Z_target = V·ripple/ΔI = ${fmt(st.vdd, 3)} × ${fmt(st.rip, 3)} % / ${fmt(st.di, 3)} A = ${fmt(z * 1e3, 3)} mΩ`;
      };
      RF.slider(pdn, { id: "si-vdd", label: "Rail", min: 0.5, max: 3.3, step: 0.05, value: st.vdd, fmt: (v) => fmt(v, 3) + " V", onInput: (v) => { st.vdd = v; pdnU(); } });
      RF.slider(pdn, { id: "si-rip", label: "Ripple allowed", min: 1, max: 10, step: 0.5, value: st.rip, fmt: (v) => fmt(v, 2) + " %", onInput: (v) => { st.rip = v; pdnU(); } });
      RF.slider(pdn, { id: "si-di", label: "Transient current", min: 0.1, max: 100, log: true, value: st.di, fmt: (v) => fmt(v, 3) + " A", onInput: (v) => { st.di = v; pdnU(); } });
      pdn.append(pdnOut);
      pdnU();

      const blank = { x: { min: 0, max: 1 }, y: { min: 0, max: 1 }, series: [{ pts: [[0, 0], [1, 1]], color: "var(--s1)" }] };
      const pS = RF.plot(ui.plots, blank);
      const pE = RF.plot(ui.plots, blank);
      const pL = RF.plot(ui.plots, blank);

      function lengthPill(ln) {
        const short = 2 * ln.td < (st.tr * 1e-12) / 3;
        const terminated = Math.abs(ln.gs) < 0.1 || Math.abs(ln.gl) < 0.1;
        if (short) return el("span", { class: "pill good", text: "Electrically short: the edge hides the echoes" });
        return el("span", { class: "pill " + (terminated ? "good" : "warn"), text: terminated ? "Long enough to matter, and terminated at one end" : "Long enough to ring: both ends reflect" });
      }

      function update() {
        const ln = line();
        drawBench(ln);
        const nyq = (st.rate * 1e9) / 2;
        const toDb = 8.686;
        const ilAt = (f) => (ln.alphaC(f) + ln.alphaD(f)) * ln.L * toDb;

        // step
        const r = stepResponse(ln);
        const stride = Math.max(1, Math.ceil(r.show / r.dt / 800));
        const idx = [];
        for (let i = 0; i * r.dt <= r.show && i < r.N; i += stride) idx.push(i);
        const farP = idx.map((i) => [i * r.dt * 1e9, r.far[i]]);
        const nearP = idx.map((i) => [i * r.dt * 1e9, r.near[i]]);
        const fin = st.rl / (st.rl + st.rs);
        const peak = Math.max(...r.far.slice(0, Math.floor(r.N / 2)));
        const over = fin > 0 ? Math.max(0, (peak - fin) / fin) * 100 : 0;
        const allY = farP.concat(nearP).map((p) => p[1]);
        pS.update({
          title: "Step response at both ends (1 V source)",
          subtitle: "Near end: the launch, then each echo arrives one round trip later. Far end: the first arrival, and whatever overshoot the load creates.",
          height: 240,
          x: { min: 0, max: r.show * 1e9, label: "Time (ns)", fmt: (v) => fmt(v, 3) },
          y: { min: Math.min(-0.1, ...allY) - 0.05, max: Math.max(1.05, ...allY) + 0.05, label: "Volts" },
          series: [
            { name: "Near end", pts: nearP, color: "var(--s1)" },
            { name: "Far end", pts: farP, color: "var(--s2)" },
          ],
          hlines: [{ y: fin, label: `final ${fmt(fin, 3)} V` }],
          tipX: (v) => fmt(v, 3) + " ns", tipY: (v) => fmt(v, 3) + " V",
        });

        // eye
        const ey = eye(ln);
        const ys = ey.pts.filter((p) => isFinite(p[1])).map((p) => p[1]);
        const yLo = Math.min(...ys), yHi = Math.max(...ys);
        const pad = 0.08 * Math.max(yHi - yLo, 0.01);
        pE.update({
          title: "Eye diagram (PRBS7 through the channel, two bit times)",
          subtitle: "Every bit laid on top of the others. Loss smears bits into their neighbours and reflections land as extra lines.",
          height: 240,
          x: { min: -1, max: 1, label: "Time (UI)", fmt: (v) => fmt(v, 2) },
          y: { min: yLo - pad, max: yHi + pad, label: "Volts" },
          series: [{ pts: ey.pts, color: "var(--s1)", width: 1, opacity: 0.4, noTip: true }],
          crosshair: false,
        });
        const swing = fin;
        const openPct = (ey.height / Math.max(swing, 1e-9)) * 100;
        const open = ey.height > 0;
        status.replaceChildren(
          el("span", { class: "pill " + (openPct > 40 ? "good" : open ? "warn" : "bad"), text: open ? `Eye open, ${fmt(openPct, 2)} % of the DC swing` : "Eye closed: the receiver would need equalization" }),
          lengthPill(ln),
        );

        // loss
        const fMax = Math.max(2 * nyq, Math.min(0.35 / (st.tr * 1e-12), 3 * nyq));
        const fs = RF.linspace(fMax / 300, fMax, 300);
        const ilN = ilAt(nyq);
        pL.update({
          title: "Insertion loss: skin effect goes as √f, dielectric as f",
          subtitle: "Smooth copper, no roughness or via stubs, so real boards are worse. On FR-4 the dielectric wins above about 2 GHz. On low-loss laminates the conductor dominates to tens of GHz.",
          height: 230,
          x: { min: 0, max: fMax / 1e9, label: "Frequency (GHz)", fmt: (v) => fmt(v, 3) },
          y: { min: -Math.max(ilAt(fMax) * 1.1, 1), max: 0, label: "Loss (dB)" },
          series: [
            { name: "Total", pts: fs.map((f) => [f / 1e9, -ilAt(f)]), color: "var(--s1)", width: 2.5 },
            { name: "Conductor", pts: fs.map((f) => [f / 1e9, -ln.alphaC(f) * ln.L * toDb]), color: "var(--s2)", width: 1.5 },
            { name: "Dielectric", pts: fs.map((f) => [f / 1e9, -ln.alphaD(f) * ln.L * toDb]), color: "var(--s3)", width: 1.5 },
          ],
          vlines: [{ x: nyq / 1e9, label: "Nyquist" }],
          markers: [{ x: nyq / 1e9, y: -ilN, color: "var(--s1)", label: `${fmt(ilN, 3)} dB` }],
          tipX: (v) => fmt(v, 3) + " GHz", tipY: (v) => fmt(v, 3) + " dB",
        });

        const lc = (st.tr * 1e-12) / (2 * ln.perM) * 1e3;
        ro.update({
          td: RF.si(ln.td, "s"), lc: [fmt(lc / 3, 3), "mm"], nyq: [fmt(nyq / 1e9, 3), "GHz"], il: [fmt(ilN, 3), "dB"],
          over: [fmt(over, 2), "%"], eh: [fmt(Math.max(ey.height, 0), 2), "V"], ew: [fmt(ey.width, 2), "UI"],
        });
        const perIn = 2.3 * (nyq / 1e9) * st.df * Math.sqrt(st.dk);
        RF.setEqs(ui.eqs, [
          { name: "Speed and delay", f: `v = c/√Dk,  ${fmt(ln.perM * 1e9, 3)} ps/mm = ${fmt(ln.perM * 25.4e9, 3)} ps/in,  delay ${b(RF.si(ln.td, "s"))}` },
          { name: "Reflection coefficient", f: `Γ = (R − Z₀)/(R + Z₀):  load ${b(fmt(ln.gl, 3))},  source ${b(fmt(ln.gs, 3))}` },
          { name: "Launched into the line, then each echo", f: `V₀ = V·Z₀/(Z₀ + R_s) = ${fmt(ln.K, 3)} V,  far end ${fmt(ln.K * (1 + ln.gl), 3)} V,  next ×Γ_s·Γ_L = ${fmt(ln.gs * ln.gl, 3)}` },
          { name: "Ringing is fully developed once the round trip equals the edge. Start terminating at about a third of that", f: `L = tᵣ/(2·t_pd) = ${b(fmt(lc, 3) + " mm")},  terminate above ≈ L/3 = ${b(fmt(lc / 3, 3) + " mm")}` },
          { name: "Nyquist for NRZ, half the bit rate. PAM4 at the same bit rate is half that.", f: `f_N = ${fmt(st.rate, 3)}/2 = ${b(fmt(nyq / 1e9, 3) + " GHz")}` },
          { name: "Conductor loss, one surface. A wide microstrip with ground loss can reach twice this", f: `α_c ≈ R_s/(2·Z₀·w),  R_s = 2.61×10⁻⁷·√f Ω/sq` },
          { name: "Dielectric loss rule of thumb", f: `≈ 2.3·f(GHz)·Df·√Dk dB/in = ${b(fmt(perIn, 3) + " dB/in")} at Nyquist` },
        ]);
      }

      RF.setSay(ui.say, {
        quote: "I look at it in three parts. Impedance: any change in Z₀ reflects by gamma, and once the round trip is a real fraction of the edge, you see it. Loss: skin effect goes as root f, dielectric as f, and I quote it at Nyquist, half the bit rate for NRZ. Crosstalk and the power rail come after that. Then I look at the eye, because that's what the receiver sees. Loss closes it by smearing bits together, and reflections land as extra lines. On a long channel I'd first look at material and via stubs, then equalization.",
        bullets: [
          "Anchors: FR-4 is about 170 ps/in. A 100 ps edge rings fully at about 7.5 mm, so start terminating near 2.5 mm.",
          "Termination: series at the source for point to point, so the far end doubles to full swing and the reflection dies at the source. Parallel at the load costs DC power.",
          "Crosstalk: near-end (backward) saturates once the coupled length exceeds half the edge in delay. Far-end grows with length and with faster edges, and it's zero in an ideal homogeneous stripline.",
          "Vias: an unused stub is a quarter-wave notch. A 1 mm stub in Dk 4 notches near 37 GHz, and that's why boards back-drill.",
          "Power integrity: keep the PDN impedance under the target from DC through the switching band. Decaps have a resonance, then act as inductors. The plane and package set the high end.",
          "Standards budget Nyquist loss. PCIe 5.0, for example, allows about 36 dB at 16 GHz, using equalization.",
          "This bench uses a smooth-copper loss model with causal phase, and ignores roughness, vias and crosstalk. Use it for intuition, not sign-off.",
        ],
      });

      RF.predict(ui.predict, [
        { q: "Trace in Dk = 4. Delay per inch?", unit: "ps/in", answer: () => (2 / C0) * 25.4e-3 * 1e12, absTol: 10, apply: () => set({ dk: 4 }), explain: "√4 / c = 6.7 ps/mm, or about 170 ps/in." },
        { q: "28 Gb/s NRZ. Nyquist frequency?", unit: "GHz", answer: () => 14, absTol: 0.5, apply: () => set({ rate: 28, tr: 12, len: 150, z0: 50, rs: 50, rl: 50 }), explain: "Half the bit rate: 14 GHz. PAM4 at 56 Gb/s has the same Nyquist." },
        { q: "A 40 Ω section in a 50 Ω line. Γ going in?", unit: "", answer: () => -10 / 90, absTol: 0.02, apply: () => set({ z0: 50, rs: 50, rl: 40, rate: 10, tr: 30 }), explain: "(40 − 50)/(40 + 50) = −0.11, about 11 %. A step down reflects negative." },
        { q: "Edge of 100 ps in Dk 4. At what length does the round trip equal the edge?", unit: "mm", answer: () => 100 / (2 * 6.67), absTol: 1, apply: () => set({ tr: 100, dk: 4 }), explain: "100 ps / (2 × 6.67 ps/mm) = 7.5 mm. Ringing is fully developed by then, so start terminating at about a third of that." },
        { q: "Open end, R_s = Z₀ = 50 Ω, 1 V source. What's the far-end first arrival?", unit: "V", answer: () => 1, absTol: 0.05, apply: () => set({ rs: 50, z0: 50, rl: 1e5, rate: 2, tr: 100, len: 150 }), explain: "0.5 V launched, Γ = +1 doubles it to 1 V. That's why series termination works." },
        { q: "10 GHz in Dk 4, Df 0.02. Dielectric loss per inch?", unit: "dB/in", answer: () => 2.3 * 10 * 0.02 * 2, absTol: 0.1, explain: "2.3 × 10 × 0.02 × 2 = 0.92 dB/in. At Df 0.003 it's about 0.14." },
      ], "si");

      update();
      return {};
    },
  });
})();
