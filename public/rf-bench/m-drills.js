/* Module: drills. Interleaved retrieval practice, weighted toward the card types you miss. */
(function () {
  "use strict";
  const { el, fmt } = RF;
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const log10 = Math.log10;

  const TOPICS = ["dB and dBm", "Mismatch", "Reactance and λ", "Matching", "Q and coupling", "PA", "Filters"];

  /* each generator returns { q, ans, unit, tolRel?, tolAbs?, sol: [lines], anchor } */
  const TYPES = [
    { id: "dbm2w", topic: 0, gen() {
      const p = pick([-10, -3, 0, 3, 6, 10, 13, 17, 20, 23, 27, 30, 33, 37, 40, 43, 47]);
      const mw = Math.pow(10, p / 10);
      const inW = p > 30;
      return { q: `Convert ${p > 0 ? "+" : ""}${p} dBm to ${inW ? "watts" : "milliwatts"}.`, ans: inW ? mw / 1000 : mw, unit: inW ? "W" : "mW", tolRel: 0.12,
        sol: [`P = 10^(dBm/10) mW = 10^(${p}/10) = ${fmt(mw, 3)} mW${inW ? ` = ${fmt(mw / 1000, 3)} W` : ""}`],
        anchor: "0 dBm = 1 mW, +30 dBm = 1 W. +3 dB doubles, +10 dB is ×10. So 37 dBm = 30 + 10 − 3 = 5 W." };
    } },
    { id: "w2dbm", topic: 0, gen() {
      const [v, u] = pick([[0.5, "mW"], [2, "mW"], [10, "mW"], [100, "mW"], [0.5, "W"], [1, "W"], [2, "W"], [4, "W"], [10, "W"], [20, "W"], [50, "W"], [100, "W"]]);
      const mw = u === "W" ? v * 1000 : v;
      const d = 10 * log10(mw);
      return { q: `Convert ${v} ${u} to dBm.`, ans: d, unit: "dBm", tolAbs: 0.5,
        sol: [`dBm = 10·log₁₀(P / 1 mW) = 10·log₁₀(${fmt(mw, 4)}) = ${fmt(d, 3)} dBm`],
        anchor: "1 W = 30 dBm. 2 W = 33, 4 W = 36, 10 W = 40, 50 W = 47, 100 W = 50." };
    } },
    { id: "chain", topic: 0, gen() {
      const pin = pick([-20, -15, -10, -5, 0]), g = pick([10, 12, 15, 20, 25]), att = pick([3, 6]);
      const out = pin + g - 3 - att;
      return { q: `${pin} dBm goes into an amplifier with ${g} dB of gain, then an ideal 2-way splitter, then a ${att} dB pad on one output. What comes out of that pad?`, ans: out, unit: "dBm", tolAbs: 0.5,
        sol: [`${pin} + ${g} − 3 (splitter) − ${att} (pad) = ${out} dBm`], anchor: "In dB everything adds. An ideal 2-way splitter is −3 dB per output (half the power)." };
    } },
    { id: "gamma", topic: 1, gen() {
      const r = pick([10, 20, 25, 30, 75, 100, 150, 200]);
      const g = Math.abs((r - 50) / (r + 50));
      return { q: `A ${r} Ω load sits on a 50 Ω line. What's |Γ|?`, ans: g, unit: "", tolAbs: 0.02,
        sol: [`Γ = (Z_L − Z₀)/(Z_L + Z₀) = (${r} − 50)/(${r} + 50) = ${fmt((r - 50) / (r + 50), 3)}`], anchor: "25 Ω and 100 Ω both give |Γ| = 1/3. 75 Ω gives 0.2." };
    } },
    { id: "rl", topic: 1, gen() {
      const g = pick([0.05, 0.1, 0.2, 0.3, 0.33, 0.5, 0.7, 0.8, 0.9]);
      const rl = -20 * log10(g);
      return { q: `|Γ| = ${g}. What's the return loss?`, ans: rl, unit: "dB", tolAbs: 0.6,
        sol: [`RL = −20·log₁₀(${g}) = ${fmt(rl, 3)} dB`], anchor: "Γ 0.1 → 20 dB, 0.2 → 14, 0.33 → 10, 0.5 → 6, 0.7 → 3, 0.9 → 0.9." };
    } },
    { id: "pct", topic: 1, gen() {
      const rl = pick([3, 6, 10, 14, 20, 30]);
      const p = 100 * Math.pow(10, -rl / 10);
      return { q: `A part has ${rl} dB return loss. What percent of the incident power reflects?`, ans: p, unit: "%", tolRel: 0.15, tolAbs: 0.3,
        sol: [`|Γ|² = 10^(−RL/10) = 10^(−${rl}/10) = ${fmt(p, 3)} %`], anchor: "Power uses /10, voltage uses /20. 10 dB → 10 %, 20 dB → 1 %, 3 dB → 50 %." };
    } },
    { id: "vswr", topic: 1, gen() {
      const r = pick([25, 75, 100, 150, 12.5]);
      const v = Math.max(r / 50, 50 / r);
      return { q: `A purely resistive ${r} Ω load on a 50 Ω line. What's the VSWR?`, ans: v, unit: ": 1", tolRel: 0.05,
        sol: [`For a real load, VSWR = larger R / smaller R = ${fmt(Math.max(r, 50), 3)} / ${fmt(Math.min(r, 50), 3)} = ${fmt(v, 3)}`], anchor: "VSWR 1.5 ↔ Γ 0.2 ↔ 14 dB. VSWR 2 ↔ Γ 0.33 ↔ 9.5 dB." };
    } },
    { id: "xc", topic: 2, gen() {
      const c = pick([0.1, 0.2, 0.5, 1, 2, 5]), f = pick([1, 2, 5, 10, 20, 40]);
      const x = 1 / (2 * Math.PI * f * 1e9 * c * 1e-12);
      return { q: `What's the reactance of ${c} pF at ${f} GHz?`, ans: x, unit: "Ω", tolRel: 0.12,
        sol: [`X_C = 1/(2πfC) = 1/(2π × ${f}e9 × ${c}e-12) = ${fmt(x, 3)} Ω`], anchor: "1 pF at 10 GHz ≈ 16 Ω. X_C scales as 1/(f·C)." };
    } },
    { id: "xl", topic: 2, gen() {
      const l = pick([0.1, 0.2, 0.5, 1, 2]), f = pick([1, 2, 5, 10, 20, 40]);
      const x = 2 * Math.PI * f * 1e9 * l * 1e-9;
      return { q: `What's the reactance of ${l} nH at ${f} GHz?`, ans: x, unit: "Ω", tolRel: 0.12,
        sol: [`X_L = 2πfL = 2π × ${f}e9 × ${l}e-9 = ${fmt(x, 3)} Ω`], anchor: "1 nH at 10 GHz ≈ 63 Ω. X_L scales as f·L." };
    } },
    { id: "fres", topic: 2, gen() {
      const l = pick([0.1, 0.25, 0.5, 1, 2, 4]), c = pick([0.1, 0.25, 0.5, 1, 2, 4]);
      const f = 5.033 / Math.sqrt(l * c);
      return { q: `${l} nH resonates with ${c} pF at what frequency?`, ans: f, unit: "GHz", tolRel: 0.1,
        sol: [`f₀ = 1/(2π√(LC)) = 5.03 / √(${l} × ${c}) = ${fmt(f, 3)} GHz`], anchor: "1 nH + 1 pF = 5.03 GHz. Every 4× in L·C halves f₀." };
    } },
    { id: "lambda", topic: 2, gen() {
      const f = pick([1, 2, 3, 5, 10, 20, 30, 40]);
      const onGaAs = Math.random() < 0.5;
      const l0 = 300 / f;
      if (!onGaAs) return { q: `What's the free-space wavelength at ${f} GHz?`, ans: l0, unit: "mm", tolRel: 0.08, sol: [`λ = c/f = 300 / ${f} = ${fmt(l0, 3)} mm`], anchor: "λ(mm) = 300 / f(GHz). 10 GHz is 30 mm." };
      const lg = l0 / Math.sqrt(7) / 4;
      return { q: `How long is a quarter wavelength at ${f} GHz on GaAs microstrip with ε_eff ≈ 7?`, ans: lg, unit: "mm", tolRel: 0.1,
        sol: [`λ_g = λ₀/√ε_eff = ${fmt(l0, 3)} / 2.65 = ${fmt(l0 / Math.sqrt(7), 3)} mm`, `λ_g/4 = ${fmt(lg, 3)} mm`], anchor: "GaAs εr ≈ 12.9, microstrip ε_eff ≈ 7, so lines are about 2.6× shorter than in air." };
    } },
    { id: "qwt", topic: 3, gen() {
      const r = pick([2.5, 5, 10, 12.5, 20, 25, 100, 200]);
      const z = Math.sqrt(50 * r);
      return { q: `Quarter-wave transformer from ${r} Ω to 50 Ω. What impedance is the line?`, ans: z, unit: "Ω", tolRel: 0.05,
        sol: [`Z₁ = √(${r} × 50) = ${fmt(z, 3)} Ω`], anchor: "Geometric mean. 12.5 Ω → 25 Ω line, 5 Ω → 15.8 Ω line." };
    } },
    { id: "lnq", topic: 3, gen() {
      const r = pick([2.5, 5, 10, 12.5, 25]);
      const q = Math.sqrt(50 / r - 1);
      return { q: `Single L-section from ${r} Ω up to 50 Ω. What's its Q?`, ans: q, unit: "", tolRel: 0.06,
        sol: [`Q = √(R_high/R_low − 1) = √(${fmt(50 / r, 3)} − 1) = ${fmt(q, 3)}`, `rough fractional bandwidth ≈ 1/Q = ${fmt(100 / q, 3)} %`], anchor: "10:1 → Q = 3. 4:1 → Q = 1.7. 2:1 → Q = 1." };
    } },
    { id: "qbw", topic: 4, gen() {
      const f0 = pick([2, 5, 10, 20, 40]), bw = pick([20, 50, 100, 200, 400]);
      const q = (f0 * 1000) / bw;
      return { q: `A resonator at ${f0} GHz has a ${bw} MHz 3 dB bandwidth. What's its Q?`, ans: q, unit: "", tolRel: 0.05,
        sol: [`Q = f₀ / BW = ${f0 * 1000} MHz / ${bw} MHz = ${fmt(q, 3)}`], anchor: "Watch the units: put both in MHz." };
    } },
    { id: "qu", topic: 4, gen() {
      const ql = pick([50, 80, 100, 150, 200]), d = pick([-1, -3, -6, -10, -20]);
      const s = Math.pow(10, d / 20), qu = ql / (1 - s);
      return { q: `Measured loaded Q is ${ql} and |S21| at resonance is ${d} dB. What's the unloaded Q?`, ans: qu, unit: "", tolRel: 0.08,
        sol: [`|S21| = 10^(${d}/20) = ${fmt(s, 3)} linear`, `Qᵤ = Q_L / (1 − |S21|) = ${ql} / ${fmt(1 - s, 3)} = ${fmt(qu, 3)}`], anchor: "−6 dB is 0.5, so Qᵤ = 2·Q_L. At −20 dB, Q_L ≈ Qᵤ (weak coupling)." };
    } },
    { id: "kmodes", topic: 4, gen() {
      const f0 = pick([10, 20, 30]), k = pick([0.02, 0.03, 0.05, 0.08]);
      const r = Math.sqrt(k * k + 4);
      const f1 = +((f0 * (r - k)) / 2).toFixed(2), f2 = +((f0 * (r + k)) / 2).toFixed(2);
      const km = (f2 * f2 - f1 * f1) / (f2 * f2 + f1 * f1);
      return { q: `Eigenmode on two coupled resonators gives ${f1} GHz and ${f2} GHz. What's k?`, ans: km, unit: "", tolAbs: 0.004,
        sol: [`k = (f₂² − f₁²)/(f₂² + f₁²) = ${fmt(km, 3)}`, `shortcut: Δf/f₀ = ${fmt(f2 - f1, 3)} / ${fmt((f1 + f2) / 2, 3)} = ${fmt((f2 - f1) / ((f1 + f2) / 2), 3)}`], anchor: "k ≈ Δf / f₀. Square the mode frequencies for the exact form." };
    } },
    { id: "periph", topic: 5, gen() {
      const n = pick([4, 6, 8, 10, 12, 16]), u = pick([50, 75, 100, 125, 150, 200]), dens = pick([4, 5, 6]);
      const w = (n * u) / 1000, p = w * dens;
      return { q: `${n} fingers × ${u} µm on a ${dens} W/mm process. About how much output power?`, ans: p, unit: "W", tolRel: 0.06,
        sol: [`W = ${n} × ${u} µm = ${fmt(w, 3)} mm`, `P = ${fmt(w, 3)} mm × ${dens} W/mm = ${fmt(p, 3)} W`], anchor: "Periphery first. 1 mm of GaN is roughly 4 to 6 W at 28 V." };
    } },
    { id: "ropt", topic: 5, gen() {
      const vdd = pick([20, 28, 48]), vk = pick([3, 4, 5]), im = pick([0.5, 0.8, 1, 2, 4]);
      const r = (2 * (vdd - vk)) / im;
      return { q: `V_DD = ${vdd} V, knee ${vk} V, I_max = ${im} A. What's R_opt?`, ans: r, unit: "Ω", tolRel: 0.06,
        sol: [`R_opt = 2(V_DD − V_k)/I_max = 2 × ${vdd - vk} / ${im} = ${fmt(r, 3)} Ω`], anchor: "Load line: half of I_max swings across the full V_DD − V_k." };
    } },
    { id: "roptp", topic: 5, gen() {
      const p = pick([5, 10, 20, 50, 100]);
      const r = (24 * 24) / (2 * p);
      return { q: `A ${p} W class-A PA on 28 V with a 4 V knee. About what R_opt?`, ans: r, unit: "Ω", tolRel: 0.06,
        sol: [`R = (V_DD − V_k)² / (2P) = 24² / (2 × ${p}) = ${fmt(r, 3)} Ω`], anchor: "Voltage is capped, so R = V²/2P. 10 W ≈ 29 Ω, 50 W ≈ 6 Ω, 100 W ≈ 3 Ω." };
    } },
  ];

  TYPES.push(
    { id: "lpfL", topic: 6, gen() {
      const g = pick([0.6, 1, 1.2, 1.5, 2]), fc = pick([2, 5, 6, 10, 20]);
      const L = (g * 50) / (2 * Math.PI * fc * 1e9) * 1e9;
      return { q: `Low-pass prototype g = ${g} as a series inductor, f_c = ${fc} GHz, 50 Ω. How many nH?`, ans: L, unit: "nH", tolRel: 0.08,
        sol: [`L = g·Z₀/ω_c = ${g} × 50 / (2π × ${fc}e9) = ${fmt(L, 3)} nH`], anchor: "g = 1 at 5 GHz is 1.59 nH. Scale by g, divide by f_c." };
    } },
    { id: "lpfC", topic: 6, gen() {
      const g = pick([0.6, 1, 1.2, 1.5, 2]), fc = pick([2, 5, 6, 10, 20]);
      const C = g / (50 * 2 * Math.PI * fc * 1e9) * 1e12;
      return { q: `Low-pass prototype g = ${g} as a shunt capacitor, f_c = ${fc} GHz, 50 Ω. How many pF?`, ans: C, unit: "pF", tolRel: 0.08,
        sol: [`C = g/(Z₀·ω_c) = ${g} / (50 × 2π × ${fc}e9) = ${fmt(C, 3)} pF`], anchor: "g = 1 at 5 GHz is 0.64 pF." };
    } },
    { id: "buttRej", topic: 6, gen() {
      const N = pick([3, 5, 7]), r = pick([1.5, 2, 3]);
      const a = 10 * log10(1 + Math.pow(r, 2 * N));
      return { q: `Butterworth low-pass, N = ${N}. Rejection at ${r}·f_c?`, ans: a, unit: "dB", tolAbs: 1.5,
        sol: [`L_A = 10·log(1 + ${r}^${2 * N}) = ${fmt(a, 3)} dB`], anchor: "Far out, 6N dB per octave: N = 5 at 2·f_c is about 30 dB." };
    } },
    { id: "stepLen", topic: 6, gen() {
      const g = pick([0.8, 1, 1.5, 2]), zh = pick([80, 100, 120, 150]);
      const deg = ((g * 50) / zh) * 180 / Math.PI;
      return { q: `Stepped-impedance low-pass: series element g = ${g} as a ${zh} Ω line. Electrical length at f_c?`, ans: deg, unit: "°", tolAbs: 2.5,
        sol: [`βl = g·Z₀/Z_h = ${g} × 50 / ${zh} = ${fmt((g * 50) / zh, 3)} rad = ${fmt(deg, 3)}°`], anchor: "Keep sections under about 45°. A shunt C as a Z_l line: βl = g·Z_l/Z₀." };
    } },
    { id: "rip2rl", topic: 6, gen() {
      const rip = pick([0.01, 0.04, 0.1, 0.25, 0.5, 1]);
      const rl = -10 * log10(1 - Math.pow(10, -rip / 10));
      return { q: `A Chebyshev filter has ${rip} dB passband ripple. What's its passband return loss?`, ans: rl, unit: "dB", tolAbs: 1,
        sol: [`RL = −10·log(1 − 10^(−ripple/10)) = ${fmt(rl, 3)} dB`], anchor: "0.1 dB ↔ 16.4 dB RL. 0.044 dB ↔ 20 dB. 0.01 dB ↔ 26 dB." };
    } },
    { id: "cohn", topic: 6, gen() {
      const [N, sg] = pick([[3, 2.8], [5, 6.5], [7, 10.4]]), fbw = pick([0.05, 0.1, 0.2]), qu = pick([90, 150, 300]);
      const il = (4.343 * sg) / (fbw * qu);
      return { q: `${N}-pole bandpass (Σg ≈ ${sg}), ${fbw * 100} % bandwidth, Qᵤ = ${qu}. Midband loss?`, ans: il, unit: "dB", tolRel: 0.1,
        sol: [`IL ≈ 4.343·Σg/(FBW·Qᵤ) = 4.343 × ${sg} / (${fbw} × ${qu}) = ${fmt(il, 3)} dB`], anchor: "7 poles, 10 %, Qᵤ 150 is about 3 dB. Loss scales with poles, 1/bandwidth, 1/Q." };
    } },
  );

  const NAMES = {
    lpfL: "g to nH", lpfC: "g to pF", buttRej: "Butterworth rejection", stepLen: "stepped-impedance length", rip2rl: "ripple to return loss", cohn: "bandpass loss (Cohn)",
    dbm2w: "dBm to watts", w2dbm: "watts to dBm", chain: "gain chains", gamma: "Γ from a load", rl: "return loss from Γ",
    pct: "percent reflected", vswr: "VSWR", xc: "capacitor reactance", xl: "inductor reactance", fres: "LC resonance",
    lambda: "wavelength", qwt: "quarter-wave transformer", lnq: "L-network Q", qbw: "Q from bandwidth",
    qu: "unloaded Q from S21", kmodes: "k from mode frequencies", periph: "periphery to power", ropt: "R_opt from the load line", roptp: "R_opt from power",
  };

  const ANCHORS = [
    ["0 dBm", "1 mW"], ["+30 dBm", "1 W"], ["+3 dB", "×2 power"], ["+10 dB", "×10 power"],
    ["Γ 0.2", "14 dB RL, 4 %, VSWR 1.5"], ["Γ 0.1", "20 dB RL, 1 %"], ["Γ 0.33", "9.5 dB, 11 %, VSWR 2"],
    ["1 pF at 10 GHz", "16 Ω"], ["1 nH at 10 GHz", "63 Ω"], ["1 nH + 1 pF", "5.03 GHz"],
    ["λ at 10 GHz", "30 mm in air, ~11 mm on GaAs"], ["λ/4 5 → 50 Ω", "15.8 Ω line"],
    ["L-section 10:1", "Q = 3, ~33 % BW"], ["R_opt", "2(V_DD − V_k)/I_max"], ["GaN", "~5 W/mm at 28 V"],
  ];

  RF.register({
    id: "drills",
    tab: "Drills",
    sub: "10 a day",
    build(root) {
      root.append(el("header", { class: "mod-head" }, [
        el("div", { class: "who", text: "The lightning round" }),
        el("h2", { text: "Number drills, mixed and weighted to your misses" }),
        el("p", { text: "Every card is freshly generated, so you practise the method, not the answer. Topics are shuffled together on purpose. Card types you miss come back more often. Rough answers count: most allow about 10 %." }),
      ]));
      const load = () => RF.store.get("drills", {});
      let stats = load();
      const session = { n: 0, ok: 0, streak: 0 };
      let focus = RF.store.get("drills:focus", -1);
      let cur = null, lastId = null, t0 = 0, answered = false;

      const grid = el("div", { class: "drill-grid" });
      const card = el("div", { class: "card drill-card" });
      const side = el("div", { class: "card stats" });
      const anchors = el("div", { class: "card stats" });
      grid.append(card, el("div", { style: "display:grid;gap:14px" }, [side, anchors]));

      const filterRow = el("div", { class: "presets" });
      root.append(filterRow, grid);
      function drawFilters() {
        filterRow.replaceChildren(el("span", { class: "muted", text: "Topics" }));
        const seg = el("div", { class: "seg", role: "group", "aria-label": "Topic filter" });
        [[-1, "All mixed"], ...TOPICS.map((t, i) => [i, t])].forEach(([v, label]) => {
          const bt = el("button", { type: "button", text: label, "aria-pressed": String(focus === v) });
          bt.addEventListener("click", () => { focus = v; RF.store.set("drills:focus", v); drawFilters(); next(); });
          seg.append(bt);
        });
        filterRow.append(seg);
      }

      function weight(t) {
        const sx = stats[t.id] || { n: 0, ok: 0, streak: 0 };
        if (sx.n === 0) return 2.5;
        const miss = 1 - sx.ok / sx.n;
        return Math.max(0.3, 1 + 4 * miss - 0.3 * Math.min(sx.streak, 3));
      }
      function choose() {
        let pool = TYPES.filter((t) => focus === -1 || t.topic === focus);
        if (pool.length > 1) pool = pool.filter((t) => t.id !== lastId);
        const ws = pool.map(weight);
        let r = Math.random() * ws.reduce((a, c) => a + c, 0);
        for (let i = 0; i < pool.length; i++) { r -= ws[i]; if (r <= 0) return pool[i]; }
        return pool[pool.length - 1];
      }

      function next() {
        const type = choose();
        lastId = type.id;
        cur = Object.assign({ type }, type.gen());
        answered = false;
        t0 = performance.now();
        renderCard();
      }
      function renderCard(result) {
        const input = el("input", { type: "text", id: "drill-in", inputmode: "decimal", autocomplete: "off", "aria-label": "Your answer" });
        const form = el("form", null, [input, el("span", { class: "unit mono muted", text: cur.unit || "" }),
          el("button", { type: "submit", class: "btn primary", text: "Check" }),
          el("button", { type: "button", class: "btn ghost", text: "I don't know", onclick: () => grade(NaN) })]);
        form.addEventListener("submit", (e) => { e.preventDefault(); if (answered) next(); else grade(RF.parseNum(input.value)); });
        const tally = el("div", { class: "muted", text: `This session: ${session.ok} of ${session.n} right · streak ${session.streak}` });
        card.replaceChildren(el("div", { class: "topic", text: TOPICS[cur.type.topic] }), el("div", { class: "qtext", text: cur.q }), form, tally);
        if (result) {
          input.value = result.guessText;
          input.disabled = true;
          const sol = el("div", { class: "sol", "aria-live": "polite" });
          sol.append(el("div", null, [
            el("span", { class: "pill " + (result.ok ? "good" : result.near ? "warn" : "bad"), text: result.ok ? "Right" : result.near ? "Close, not counted" : isNaN(result.guess) ? "Skipped" : "Off" }),
            document.createTextNode(`  Answer ${fmt(cur.ans, 3)} ${cur.unit || ""} · ${fmt(result.secs, 2)} s`),
          ]));
          for (const line of cur.sol) sol.append(el("div", { class: "f", text: line }));
          sol.append(el("div", { class: "anchor", text: "Anchor: " + cur.anchor }));
          const nx = el("button", { type: "button", class: "btn primary", text: "Next card  ⏎", onclick: next });
          sol.append(el("div", null, [nx]));
          card.append(sol);
          nx.focus();
        } else {
          input.focus({ preventScroll: true });
        }
      }
      function grade(guess) {
        if (answered) return;
        answered = true;
        const tol = Math.max(Math.abs(cur.ans) * (cur.tolRel || 0), cur.tolAbs || 0);
        const err = Math.abs(guess - cur.ans);
        const ok = !isNaN(guess) && err <= tol;
        const near = !isNaN(guess) && !ok && err <= tol * 3;
        const sx = stats[cur.type.id] || { n: 0, ok: 0, streak: 0 };
        sx.n++;
        if (ok) { sx.ok++; sx.streak++; } else sx.streak = 0;
        stats[cur.type.id] = sx;
        RF.store.set("drills", stats);
        session.n++;
        if (ok) { session.ok++; session.streak++; } else session.streak = 0;
        const secs = (performance.now() - t0) / 1000;
        renderCard({ ok, near, guess, guessText: isNaN(guess) ? "" : String(guess), secs });
        drawStats();
      }

      let confirmReset = false;
      function drawStats() {
        side.replaceChildren(el("div", { class: "card-title", text: "Accuracy by topic (all sessions, this browser)" }));
        TOPICS.forEach((t, i) => {
          let n = 0, ok = 0;
          for (const ty of TYPES) if (ty.topic === i && stats[ty.id]) { n += stats[ty.id].n; ok += stats[ty.id].ok; }
          const pct = n ? (100 * ok) / n : 0;
          const fill = el("div", { class: "fill" });
          fill.style.width = pct + "%";
          side.append(el("div", { class: "bar-row" }, [
            el("span", { text: t }),
            el("div", { class: "track", role: "img", "aria-label": `${t}: ${n ? Math.round(pct) + " percent of " + n : "no cards yet"}` }, [fill]),
            el("span", { class: "n", text: n ? `${Math.round(pct)}% · ${n}` : "—" }),
          ]));
        });
        const weakest = TYPES.map((t) => ({ t, s: stats[t.id] })).filter((x) => x.s && x.s.n >= 2).sort((a, b) => a.s.ok / a.s.n - b.s.ok / b.s.n)[0];
        if (weakest) side.append(el("div", { class: "muted", text: `Weakest card type so far: ${NAMES[weakest.t.id]} (${Math.round((100 * weakest.s.ok) / weakest.s.n)} % of ${weakest.s.n}).` }));
        const rb = el("button", { type: "button", class: "btn small", text: confirmReset ? "Click again to erase progress" : "Reset progress" });
        rb.addEventListener("click", () => {
          if (!confirmReset) { confirmReset = true; drawStats(); return; }
          confirmReset = false; stats = {}; RF.store.set("drills", stats); drawStats();
        });
        side.append(el("div", null, [rb]));
      }

      anchors.append(el("div", { class: "card-title", text: "Anchor numbers: know these cold" }));
      const tbl = el("table", { class: "mini" });
      for (const [a, v] of ANCHORS) tbl.append(el("tr", null, [el("td", { text: a }), el("td", { text: v })]));
      anchors.append(tbl);

      drawFilters();
      drawStats();
      next();
      return {};
    },
  });
})();
