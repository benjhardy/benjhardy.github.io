/* Module: link budget. EIRP, path loss, the noise floor, Friis noise figure, and margin. */
(function () {
  "use strict";
  const { el, s, fmt, b } = RF;
  const C0 = 299792458;

  RF.register({
    id: "link",
    tab: "Link budget",
    sub: "FSPL · noise · margin",
    build(root) {
      const ui = RF.scaffold(root, {
        who: "Senior question · does the link close?",
        title: "Link budget: add it up in dB and read the margin",
        lede: "Start at the transmitter, add gains, subtract losses, and compare what arrives with what the receiver needs. Everything is a sum in dB, and the answer is one number: the margin.",
        benchTitle: "The chain, in dBm",
        plotTitle: "Levels and range",
      });
      const st = { pt: 20, gt: 6, ltx: 1, f: 2.4, d: 100, n: 2, extra: 0, gr: 2, lrx: 1, gl: 15, nfl: 2, nfb: 8, bw: 20, snr: 10, lnaFirst: true };

      function calc(dist = st.d) {
        const lam = C0 / (st.f * 1e9);
        /* free space to 1 m, then the path exponent; n = 2 is exactly FSPL */
        const fspl = 20 * Math.log10((4 * Math.PI) / lam) + 10 * st.n * Math.log10(dist);
        const eirp = st.pt + st.gt - st.ltx;
        const pr = eirp - fspl - st.extra + st.gr;
        return { lam, fspl, eirp, pr };
      }
      /* Friis over the receive chain: the cable, the LNA, then the rest of the receiver */
      function receiver() {
        const F = (nf) => Math.pow(10, nf / 10), G = (g) => Math.pow(10, g / 10);
        const stages = st.lnaFirst
          ? [{ nf: st.nfl, g: st.gl }, { nf: st.lrx, g: -st.lrx }, { nf: st.nfb, g: 0 }]
          : [{ nf: st.lrx, g: -st.lrx }, { nf: st.nfl, g: st.gl }, { nf: st.nfb, g: 0 }];
        let Ftot = 0, Gc = 1;
        stages.forEach((sg, i) => {
          Ftot += i === 0 ? F(sg.nf) : (F(sg.nf) - 1) / Gc;
          Gc *= G(sg.g);
        });
        return { nf: 10 * Math.log10(Ftot) };
      }

      /* ----- drawing: the chain ----- */
      const svg = s("svg", { viewBox: "0 0 560 118", role: "img", "aria-label": "Transmitter, antennas, path and receiver chain" });
      ui.draw.append(svg, el("div", { class: "hint", text: "The cable position is the lesson: a loss before the LNA adds directly to the noise figure." }));
      function drawBench() {
        const k = [];
        const box = (x, w, t, sub, on) => {
          k.push(s("rect", { x, y: 34, width: w, height: 40, rx: 6 }, { fill: on ? "var(--gold-soft)" : "var(--surface)", stroke: "var(--axis)", strokeWidth: 1 }));
          k.push(s("text", { x: x + w / 2, y: 52, "text-anchor": "middle", "font-size": 11.5, "font-weight": 600, text: t }, { fill: "var(--ink)" }));
          k.push(s("text", { x: x + w / 2, y: 67, "text-anchor": "middle", "font-size": 10.5, text: sub }, { fill: "var(--ink-2)" }));
        };
        k.push(s("line", { x1: 16, x2: 544, y1: 54, y2: 54 }, { stroke: "var(--gold)", strokeWidth: 2 }));
        box(10, 62, "PA", `${fmt(st.pt, 3)} dBm`);
        box(80, 62, "Tx ant", `+${fmt(st.gt, 3)} dBi`);
        box(150, 102, "Path", `−${fmt(calc().fspl + st.extra, 3)} dB`);
        box(260, 62, "Rx ant", `+${fmt(st.gr, 3)} dBi`);
        if (st.lnaFirst) {
          box(330, 62, "LNA", `NF ${fmt(st.nfl, 2)}`, true);
          box(400, 62, "Cable", `−${fmt(st.lrx, 2)} dB`);
        } else {
          box(330, 62, "Cable", `−${fmt(st.lrx, 2)} dB`);
          box(400, 62, "LNA", `NF ${fmt(st.nfl, 2)}`, true);
        }
        box(470, 80, "Receiver", `NF ${fmt(st.nfb, 2)}`);
        k.push(s("text", { x: 280, y: 100, "text-anchor": "middle", "font-size": 12, text: `${fmt(st.d, 4)} m at ${fmt(st.f, 3)} GHz, path exponent ${fmt(st.n, 2)}` }, { fill: "var(--ink)" }));
        svg.replaceChildren(...k);
      }

      /* ----- controls ----- */
      const dbF = (u) => (v) => fmt(v, 3) + " " + u;
      const C = {};
      C.pt = RF.slider(ui.ctl, { id: "lk-pt", label: "Tx power", min: -10, max: 60, step: 0.5, value: st.pt, fmt: dbF("dBm"), onInput: (v) => { st.pt = v; update(); } });
      C.gt = RF.slider(ui.ctl, { id: "lk-gt", label: "Tx antenna gain", min: -5, max: 50, step: 0.5, value: st.gt, fmt: dbF("dBi"), onInput: (v) => { st.gt = v; update(); } });
      C.ltx = RF.slider(ui.ctl, { id: "lk-ltx", label: "Tx feed loss", min: 0, max: 6, step: 0.1, value: st.ltx, fmt: dbF("dB"), onInput: (v) => { st.ltx = v; update(); } });
      C.f = RF.slider(ui.ctl, { id: "lk-f", label: "Frequency", min: 0.1, max: 100, log: true, value: st.f, fmt: (v) => fmt(v, 3) + " GHz", onInput: (v) => { st.f = v; update(); } });
      C.d = RF.slider(ui.ctl, { id: "lk-d", label: "Distance", min: 1, max: 4e7, log: true, value: st.d, fmt: (v) => RF.si(v, "m"), onInput: (v) => { st.d = v; update(); } });
      C.n = RF.slider(ui.ctl, { id: "lk-n", label: "Path exponent", min: 2, max: 4.5, step: 0.1, value: st.n, fmt: (v) => fmt(v, 2), onInput: (v) => { st.n = v; update(); } });
      C.extra = RF.slider(ui.ctl, { id: "lk-ex", label: "Extra loss", min: 0, max: 40, step: 0.5, value: st.extra, fmt: dbF("dB"), onInput: (v) => { st.extra = v; update(); } });
      C.gr = RF.slider(ui.ctl, { id: "lk-gr", label: "Rx antenna gain", min: -5, max: 50, step: 0.5, value: st.gr, fmt: dbF("dBi"), onInput: (v) => { st.gr = v; update(); } });
      C.lrx = RF.slider(ui.ctl, { id: "lk-lrx", label: "Rx cable loss", min: 0, max: 10, step: 0.1, value: st.lrx, fmt: dbF("dB"), onInput: (v) => { st.lrx = v; update(); } });
      C.gl = RF.slider(ui.ctl, { id: "lk-gl", label: "LNA gain", min: 0, max: 35, step: 0.5, value: st.gl, fmt: dbF("dB"), onInput: (v) => { st.gl = v; update(); } });
      C.nfl = RF.slider(ui.ctl, { id: "lk-nfl", label: "LNA noise figure", min: 0.3, max: 8, step: 0.1, value: st.nfl, fmt: dbF("dB"), onInput: (v) => { st.nfl = v; update(); } });
      C.nfb = RF.slider(ui.ctl, { id: "lk-nfb", label: "Rest of receiver NF", min: 1, max: 20, step: 0.5, value: st.nfb, fmt: dbF("dB"), onInput: (v) => { st.nfb = v; update(); } });
      C.bw = RF.slider(ui.ctl, { id: "lk-bw", label: "Bandwidth", min: 0.01, max: 2000, log: true, value: st.bw, fmt: (v) => RF.si(v * 1e6, "Hz"), onInput: (v) => { st.bw = v; update(); } });
      C.snr = RF.slider(ui.ctl, { id: "lk-snr", label: "Required SNR", min: -10, max: 35, step: 0.5, value: st.snr, fmt: dbF("dB"), onInput: (v) => { st.snr = v; update(); } });
      const posSeg = RF.seg(ui.ctl, { labelText: "LNA position", options: [{ v: true, label: "At the antenna" }, { v: false, label: "After the cable" }], value: st.lnaFirst, onChange: (v) => { st.lnaFirst = v; update(); } });
      const set = (o) => {
        Object.assign(st, o);
        for (const k in C) C[k].set(st[k], true);
        posSeg.set(st.lnaFirst, true);
        update();
      };
      RF.presets(ui.ctl, "Try", [
        { label: "Wi-Fi 2.4 GHz, 100 m", go: () => set({ pt: 20, gt: 6, ltx: 1, f: 2.4, d: 100, n: 2, extra: 0, gr: 2, lrx: 1, gl: 15, nfl: 2, nfb: 8, bw: 20, snr: 10 }) },
        { label: "Indoor, n = 3", go: () => set({ f: 2.4, d: 30, n: 3, extra: 6 }) },
        { label: "28 GHz, phased array, 200 m", go: () => set({ pt: 24, gt: 25, ltx: 1, f: 28, d: 200, n: 2, extra: 3, gr: 20, lrx: 1, gl: 18, nfl: 3, nfb: 10, bw: 400, snr: 10 }) },
        { label: "LEO downlink, 12 GHz, 550 km", go: () => set({ pt: 40, gt: 30, ltx: 1, f: 12, d: 5.5e5, n: 2, extra: 2, gr: 35, lrx: 0.5, gl: 25, nfl: 1, nfb: 8, bw: 250, snr: 8 }) },
      ]);
      const ro = RF.readouts(ui.ctl, [
        { key: "eirp", label: "EIRP" },
        { key: "fspl", label: "Path loss" },
        { key: "pr", label: "At Rx antenna port" },
        { key: "nf", label: "Cascaded NF" },
        { key: "floor", label: "Noise floor" },
        { key: "sens", label: "Sensitivity" },
        { key: "snr", label: "SNR you get" },
        { key: "margin", label: "Margin" },
        { key: "cap", label: "Shannon limit" },
      ]);
      const status = el("div", { class: "presets" });
      ui.ctl.append(status);

      const blank = { x: { min: 0, max: 1 }, y: { min: 0, max: 1 }, series: [{ pts: [[0, 0], [1, 1]], color: "var(--s1)" }] };
      const pL = RF.plot(ui.plots, blank);
      const pR = RF.plot(ui.plots, { x: { min: 1, max: 10, log: true }, y: { min: 0, max: 1 }, series: [{ pts: [[1, 0], [10, 1]], color: "var(--s1)" }] });

      function update() {
        drawBench();
        const c = calc();
        const rx = receiver();
        const floor = -174 + 10 * Math.log10(st.bw * 1e6) + rx.nf;
        const sens = floor + st.snr;
        const snrGot = c.pr - floor;
        const margin = c.pr - sens;
        const cap = st.bw * 1e6 * Math.log2(1 + Math.pow(10, snrGot / 10));
        ro.update({
          eirp: [fmt(c.eirp, 3), "dBm"], fspl: [fmt(c.fspl, 4), "dB"], pr: [fmt(c.pr, 4), "dBm"], nf: [fmt(rx.nf, 3), "dB"],
          floor: [fmt(floor, 4), "dBm"], sens: [fmt(sens, 4), "dBm"], snr: [fmt(snrGot, 3), "dB"], margin: [fmt(margin, 3), "dB"], cap: [RF.si(cap, "b/s")],
        });
        const range = rangeAtZero(sens);
        status.replaceChildren(
          el("span", { class: "pill " + (margin >= 10 ? "good" : margin >= 0 ? "warn" : "bad"), text: margin >= 0 ? `Closes with ${fmt(margin, 3)} dB` : `Short by ${fmt(-margin, 3)} dB` }),
          el("span", { class: "pill", text: `Zero-margin range ${RF.si(range, "m")}` }),
        );

        // level diagram as stairs
        const levels = [["PA", st.pt], ["Feed", st.pt - st.ltx], ["Tx ant", c.eirp], ["Path", c.eirp - c.fspl - st.extra], ["Rx ant", c.pr]];
        const pts = [];
        levels.forEach(([, v], i) => pts.push([i, v], [i + 1, v]));
        const ymin = Math.min(floor, c.pr, sens) - 15, ymax = Math.max(st.pt, c.eirp) + 10;
        pL.update({
          title: "Level diagram",
          subtitle: "Each step is a gain or a loss. The gap at the end between signal and noise floor is your SNR.",
          height: 260,
          x: { min: 0, max: levels.length, label: "", ticks: levels.map((_, i) => i + 0.5), fmt: (v) => levels[Math.round(v - 0.5)] ? levels[Math.round(v - 0.5)][0] : "" },
          y: { min: ymin, max: ymax, label: "Level (dBm)" },
          series: [{ name: "Signal", pts, color: "var(--s1)", width: 2.5 }],
          hlines: [{ y: floor, label: `Noise floor ${fmt(floor, 3)} dBm`, color: "var(--s2)" }, { y: sens, label: `Sensitivity ${fmt(sens, 3)} dBm`, color: "var(--s3)" }],
          crosshair: false,
        });

        // range
        const ds = RF.logspace(Math.max(1, st.d / 1000), Math.max(st.d * 1000, 100), 200);
        const dLo = ds[0], dHi = ds[ds.length - 1];
        const prs = ds.map((d) => [d, calc(d).pr]);
        pR.update({
          title: "Received power against distance",
          subtitle: `${fmt(st.n * 10, 3)} dB per decade of distance. The link fails where the curve crosses sensitivity.`,
          height: 260,
          x: { min: dLo, max: dHi, log: true, label: "Distance", fmt: (v) => RF.si(v, "m", 2), ticks: Array.from({ length: 12 }, (_, i) => Math.pow(10, i)).filter((v) => v >= dLo && v <= dHi) },
          y: { min: Math.min(floor, ...prs.map((p) => p[1])) - 5, max: Math.max(...prs.map((p) => p[1])) + 5, label: "Received (dBm)" },
          series: [{ pts: prs, color: "var(--s1)" }],
          hlines: [{ y: sens, label: "Sensitivity", color: "var(--s3)" }],
          vlines: [{ x: st.d, label: "here" }],
          markers: [{ x: st.d, y: c.pr, color: "var(--s1)", label: `${fmt(c.pr, 3)} dBm` }],
          tipX: (v) => RF.si(v, "m"), tipY: (v) => fmt(v, 3) + " dBm",
        });

        const fsplFree = 20 * Math.log10((4 * Math.PI * st.d) / c.lam);
        RF.setEqs(ui.eqs, [
          { name: "The budget", f: `P_r = P_t − L_tx + G_t − L_path + G_r = ${fmt(st.pt, 3)} − ${fmt(st.ltx, 3)} + ${fmt(st.gt, 3)} − ${fmt(c.fspl + st.extra, 4)} + ${fmt(st.gr, 3)} = ${b(fmt(c.pr, 4) + " dBm")}` },
          { name: "Free-space path loss", f: `FSPL = 20·log(4πd/λ) = 32.45 + 20·log(f_MHz) + 20·log(d_km) = ${b(fmt(fsplFree, 4) + " dB")}` },
          { name: "Noise floor", f: `N = −174 + 10·log(BW) + NF = −174 + ${fmt(10 * Math.log10(st.bw * 1e6), 3)} + ${fmt(rx.nf, 3)} = ${b(fmt(floor, 4) + " dBm")}` },
          { name: "Friis for noise: the first stage dominates", f: `F = F₁ + (F₂−1)/G₁ + (F₃−1)/(G₁G₂)  →  NF = ${b(fmt(rx.nf, 3) + " dB")}` },
          { name: "Margin", f: `M = P_r − (N + SNR_req) = ${fmt(c.pr, 4)} − (${fmt(floor, 4)} + ${fmt(st.snr, 3)}) = ${b(fmt(margin, 3) + " dB")}` },
          { name: "Antenna gain from aperture", f: `G = 4π·A·η/λ²,  λ = ${RF.si(c.lam, "m")}` },
        ]);
      }
      function rangeAtZero(sens) {
        let lo = 1, hi = 1e9;
        if (calc(lo).pr < sens) return lo;
        for (let i = 0; i < 60; i++) {
          const m = Math.sqrt(lo * hi);
          if (calc(m).pr > sens) lo = m; else hi = m;
        }
        return lo;
      }

      RF.setSay(ui.say, {
        quote: "I add it in dB. EIRP, minus path loss, plus receive gain, gives the received power. The noise floor is minus 174 plus 10 log bandwidth plus noise figure. Add the SNR the demodulator needs and that's sensitivity. The difference is the margin. Double the distance and you lose 6 dB. Ten times the frequency costs 20 dB with fixed-gain antennas, but with fixed-size antennas you get it back on both ends, which is why millimeter-wave links use arrays. And put the LNA at the antenna, because every dB of loss before it adds directly to the noise figure.",
        bullets: [
          "Anchors: −174 dBm/Hz at 290 K. 1 MHz adds 60 dB, 20 MHz adds 73 dB, 100 MHz adds 80 dB.",
          "FSPL anchor: 2.4 GHz at 100 m is about 80 dB. Each doubling of distance adds 6 dB in free space.",
          "State what the margin covers: fading, rain, polarization, pointing, and component aging. A number with no list isn't a budget.",
          "Check linearity too. A budget that closes on noise can still fail if a strong nearby signal compresses the LNA.",
          "Radar is one-way twice: received power goes as 1/R⁴, so doubling range costs 12 dB.",
        ],
      });

      RF.predict(ui.predict, [
        { q: "Noise floor for 20 MHz bandwidth and a 6 dB noise figure?", unit: "dBm", answer: () => -174 + 73 + 6, absTol: 1, explain: "−174 + 73 + 6 = −95 dBm." },
        { q: "Free-space path loss at 2.4 GHz over 100 m?", unit: "dB", answer: () => 20 * Math.log10((4 * Math.PI * 100 * 2.4e9) / C0), absTol: 1.5, apply: () => set({ f: 2.4, d: 100, n: 2 }), explain: "32.45 + 20·log(2400) + 20·log(0.1) = 80 dB." },
        { q: "Double the distance in free space. How much more path loss?", unit: "dB", answer: () => 6.02, absTol: 0.5, explain: "20·log(2) = 6 dB." },
        { q: "2.8 GHz to 28 GHz, same antenna gains. How much more path loss?", unit: "dB", answer: () => 20, absTol: 1, explain: "20·log(10) = 20 dB. With the same aperture instead of the same gain, each antenna gains 20 dB back." },
        { q: "1 dB of cable before a 2 dB NF LNA with 15 dB gain, then an 8 dB receiver. Cascaded NF?", unit: "dB", answer: () => { const F = (x) => Math.pow(10, x / 10); return 10 * Math.log10(F(1) + (F(2) - 1) / F(-1) + (F(8) - 1) / F(14)); }, absTol: 0.25, apply: () => set({ lrx: 1, nfl: 2, gl: 15, nfb: 8, lnaFirst: false }), explain: "About 3.4 dB. Put the LNA first and it's about 2.6 dB, which is the same receiver with 0.9 dB more sensitivity." },
      ], "link");

      update();
      return {};
    },
  });
})();
