/* RF Bench core: complex math, formatting, UI builders, line plot, Smith chart. */
(function () {
  "use strict";
  const RF = (window.RF = {});

  /* ---------- complex numbers ---------- */
  const C = (re, im = 0) => ({ re, im });
  const cx = {
    C,
    add: (a, b) => C(a.re + b.re, a.im + b.im),
    sub: (a, b) => C(a.re - b.re, a.im - b.im),
    mul: (a, b) => C(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re),
    div: (a, b) => {
      const d = b.re * b.re + b.im * b.im;
      return C((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d);
    },
    inv: (a) => {
      const d = a.re * a.re + a.im * a.im;
      return C(a.re / d, -a.im / d);
    },
    abs: (a) => Math.hypot(a.re, a.im),
    scale: (a, k) => C(a.re * k, a.im * k),
    par: (a, b) => cx.div(cx.mul(a, b), cx.add(a, b)),
    gamma: (z, z0) => cx.div(cx.sub(z, C(z0)), cx.add(z, C(z0))),
    zFromGamma: (g, z0) => cx.scale(cx.div(cx.add(C(1), g), cx.sub(C(1), g)), z0),
    /* Input impedance of a lossless line: Zc, electrical length theta (rad), load ZL */
    line: (zc, theta, zl) => {
      const t = Math.tan(theta);
      const num = cx.add(zl, C(0, zc * t));
      const den = cx.add(C(zc), cx.mul(C(0, t), zl));
      return cx.scale(cx.div(num, den), zc);
    },
  };
  RF.cx = cx;

  /* ---------- numbers ---------- */
  RF.db10 = (x) => 10 * Math.log10(x);
  RF.db20 = (x) => 20 * Math.log10(x);
  RF.clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  RF.linspace = (a, b, n) => Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1));
  RF.logspace = (a, b, n) => Array.from({ length: n }, (_, i) => a * Math.pow(b / a, i / (n - 1)));

  /* significant-figure formatting without trailing clutter */
  RF.fmt = function (v, sig = 3) {
    if (!isFinite(v)) return v > 0 ? "∞" : v < 0 ? "−∞" : "—";
    if (v === 0) return "0";
    const a = Math.abs(v);
    let s;
    if (a >= 1e5 || a < 1e-3) s = v.toExponential(sig - 1);
    else {
      const d = Math.max(0, sig - 1 - Math.floor(Math.log10(a)));
      s = v.toFixed(Math.min(d, 6));
    }
    return s.replace("-", "−");
  };
  /* SI prefixes: RF.si(1.2e-9, "H") -> "1.20 nH" */
  RF.si = function (v, unit, sig = 3) {
    if (!isFinite(v)) return RF.fmt(v) + " " + unit;
    const pre = [
      [1e12, "T"], [1e9, "G"], [1e6, "M"], [1e3, "k"], [1, ""],
      [1e-3, "m"], [1e-6, "µ"], [1e-9, "n"], [1e-12, "p"], [1e-15, "f"],
    ];
    const a = Math.abs(v);
    for (const [k, p] of pre) {
      if (a >= k * 0.9995) return RF.fmt(v / k, sig) + " " + p + unit;
    }
    return RF.fmt(v / 1e-15, sig) + " f" + unit;
  };
  RF.parseNum = function (s) {
    if (s == null) return NaN;
    const m = String(s).replace(/,/g, "").replace(/−/g, "-").match(/[-+]?\d*\.?\d+(e[-+]?\d+)?/i);
    return m ? parseFloat(m[0]) : NaN;
  };

  /* ---------- storage (convenience only) ---------- */
  RF.store = {
    get(key, dflt) {
      try {
        const v = localStorage.getItem("rfbench:" + key);
        return v == null ? dflt : JSON.parse(v);
      } catch (e) {
        return dflt;
      }
    },
    set(key, val) {
      try {
        localStorage.setItem("rfbench:" + key, JSON.stringify(val));
      } catch (e) { /* storage unavailable */ }
    },
  };

  /* ---------- DOM helpers ---------- */
  RF.el = function (tag, attrs, kids) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === "text") e.textContent = attrs[k];
      else if (k === "html") e.innerHTML = attrs[k];
      else if (k === "class") e.className = attrs[k];
      else if (k.startsWith("on")) e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    }
    if (kids) for (const c of [].concat(kids)) if (c != null) e.append(c);
    return e;
  };
  const SVGNS = "http://www.w3.org/2000/svg";
  RF.s = function (tag, attrs, style) {
    const e = document.createElementNS(SVGNS, tag);
    if (attrs) for (const k in attrs) {
      if (k === "text") e.textContent = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    if (style) for (const k in style) e.style[k] = style[k];
    return e;
  };
  /* pointer position in an SVG's viewBox coordinates */
  RF.svgPoint = function (svg, evt) {
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    const m = svg.getScreenCTM();
    return m ? pt.matrixTransform(m.inverse()) : { x: 0, y: 0 };
  };
  /* Drag on a persistent SVG root whose children re-render freely.
     pick(point) returns a move handler for whatever sits under the pointer, or null. */
  RF.dragSvg = function (svg, pick) {
    svg.addEventListener("pointerdown", (e) => {
      const h = pick(RF.svgPoint(svg, e));
      if (!h) return;
      e.preventDefault();
      svg.setPointerCapture(e.pointerId);
      svg.style.cursor = "grabbing";
      const move = (ev) => h(RF.svgPoint(svg, ev), ev);
      const up = () => {
        svg.style.cursor = "";
        svg.removeEventListener("pointermove", move);
        svg.removeEventListener("pointerup", up);
        svg.removeEventListener("pointercancel", up);
      };
      svg.addEventListener("pointermove", move);
      svg.addEventListener("pointerup", up);
      svg.addEventListener("pointercancel", up);
      move(e);
    });
    svg.addEventListener("pointermove", (e) => {
      if (e.buttons) return;
      svg.style.cursor = pick(RF.svgPoint(svg, e)) ? "grab" : "";
    });
  };

  /* ---------- module registry & scaffold ---------- */
  RF.modules = [];
  RF.register = (m) => RF.modules.push(m);

  RF.scaffold = function (root, o) {
    const head = RF.el("header", { class: "mod-head" }, [
      o.who ? RF.el("div", { class: "who", text: o.who }) : null,
      RF.el("h2", { text: o.title }),
      RF.el("p", { text: o.lede }),
    ]);
    const predict = RF.el("div", { class: "card predict" });
    const draw = RF.el("div", { class: "drawing" });
    const ctl = RF.el("div", { class: "controls" });
    const left = RF.el("div", { class: "card panel" }, [
      RF.el("div", { class: "card-title", text: o.benchTitle || "Bench" }), draw, ctl,
    ]);
    const plots = RF.el("div", { class: "plots" });
    const right = RF.el("div", { class: "card panel" }, [
      RF.el("div", { class: "card-title", text: o.plotTitle || "Response" }), plots,
    ]);
    const eqs = RF.el("div", { class: "card eqs" }, [
      RF.el("div", { class: "card-title", text: "Equations, with your numbers" }),
    ]);
    const eqList = RF.el("div", { class: "eq-list" });
    eqs.append(eqList);
    const say = RF.el("div", { class: "card say" }, [
      RF.el("div", { class: "card-title", text: "Say it in the room" }),
    ]);
    root.append(head, predict, RF.el("div", { class: "bench" }, [left, right]),
      RF.el("div", { class: "explain" }, [eqs, say]));
    return { predict, draw, ctl, plots, eqs: eqList, say };
  };

  /* slider with label and readout; supports log scale */
  RF.slider = function (parent, o) {
    const id = o.id;
    const N = 1000;
    const toPos = (v) => o.log
      ? Math.round((N * Math.log(v / o.min)) / Math.log(o.max / o.min))
      : v;
    const fromPos = (p) => {
      if (!o.log) return +p;
      const v = o.min * Math.pow(o.max / o.min, p / N);
      return o.snap ? o.snap(v) : v;
    };
    const input = RF.el("input", {
      type: "range", id,
      min: o.log ? 0 : o.min, max: o.log ? N : o.max, step: o.log ? 1 : (o.step || "any"),
    });
    const out = RF.el("output", { for: id });
    const row = RF.el("div", { class: "ctl" }, [RF.el("label", { for: id, text: o.label }), input, out]);
    parent.append(row);
    let value = o.value;
    const show = () => (out.textContent = o.fmt ? o.fmt(value) : RF.fmt(value));
    const api = {
      get: () => value,
      set(v, silent) {
        value = RF.clamp(v, o.min, o.max);
        input.value = toPos(value);
        show();
        if (!silent && o.onInput) o.onInput(value);
      },
      input,
    };
    input.addEventListener("input", () => {
      value = fromPos(input.value);
      show();
      if (o.onInput) o.onInput(value);
    });
    api.set(value, true);
    return api;
  };

  /* segmented control */
  RF.seg = function (parent, o) {
    const wrap = RF.el("div", { class: "seg", role: "group", "aria-label": o.label || "" });
    let value = o.value;
    const btns = o.options.map((opt) => {
      const b = RF.el("button", { type: "button", text: opt.label, "aria-pressed": String(opt.v === value) });
      b.addEventListener("click", () => api.set(opt.v));
      wrap.append(b);
      return b;
    });
    const api = {
      get: () => value,
      set(v, silent) {
        value = v;
        o.options.forEach((opt, i) => btns[i].setAttribute("aria-pressed", String(opt.v === v)));
        if (!silent && o.onChange) o.onChange(v);
      },
      el: wrap,
    };
    parent.append(o.labelText ? RF.el("div", { class: "presets" }, [RF.el("span", { class: "muted", text: o.labelText }), wrap]) : wrap);
    return api;
  };

  /* preset buttons */
  RF.presets = function (parent, label, items) {
    const row = RF.el("div", { class: "presets" }, [RF.el("span", { class: "muted", text: label })]);
    for (const it of items) row.append(RF.el("button", { type: "button", class: "btn small", text: it.label, onclick: it.go }));
    parent.append(row);
    return row;
  };

  /* readout tiles */
  RF.readouts = function (parent, items) {
    const wrap = RF.el("div", { class: "readouts" });
    const cells = {};
    for (const it of items) {
      const v = RF.el("div", { class: "v" });
      cells[it.key] = v;
      wrap.append(RF.el("div", { class: "ro" }, [RF.el("div", { class: "k", text: it.label }), v]));
    }
    parent.append(wrap);
    return {
      update(vals) {
        for (const k in vals) {
          const [num, unit] = [].concat(vals[k]);
          cells[k].textContent = num;
          if (unit) cells[k].append(RF.el("small", { text: unit }));
        }
      },
    };
  };

  /* equations: items [{name, f}] where f is trusted markup built by the modules */
  RF.setEqs = function (el, items) {
    el.replaceChildren(...items.map((it) =>
      RF.el("div", { class: "eq" }, [RF.el("div", { class: "name", text: it.name }), RF.el("div", { class: "f", html: it.f })])));
  };
  RF.b = (v) => "<b>" + v + "</b>";

  RF.setSay = function (el, o) {
    const title = el.firstChild;
    el.replaceChildren(title, RF.el("blockquote", { text: "“" + o.quote + "”" }));
    if (o.bullets) el.append(RF.el("ul", null, o.bullets.map((t) => RF.el("li", { text: t }))));
    if (o.note) el.append(RF.el("div", { class: "note", text: o.note }));
  };

  /* ---------- predict-first card ---------- */
  RF.predict = function (el, prompts, key) {
    let i = RF.store.get("predict:" + key, 0) % prompts.length;
    function render() {
      const p = prompts[i];
      const input = RF.el("input", { type: "text", id: "pred-" + key, inputmode: "decimal", autocomplete: "off", "aria-label": "Your prediction" });
      const verdict = RF.el("div", { class: "verdict", "aria-live": "polite" });
      const form = RF.el("form", null, [input, RF.el("span", { class: "unit", text: p.unit || "" }),
        RF.el("button", { type: "submit", class: "btn primary", text: "Check" }),
        RF.el("button", { type: "button", class: "btn ghost", text: "Show me", onclick: () => reveal(NaN) })]);
      form.addEventListener("submit", (e) => { e.preventDefault(); reveal(RF.parseNum(input.value)); });
      function reveal(guess) {
        const ans = p.answer();
        if (p.apply) p.apply();
        verdict.replaceChildren();
        let pill;
        if (isNaN(guess)) pill = RF.el("span", { class: "pill", text: "No guess" });
        else {
          const tolAbs = Math.max(Math.abs(ans) * (p.tol ?? 0.1), p.absTol ?? 0);
          const err = Math.abs(guess - ans);
          const ok = err <= tolAbs;
          const near = err <= tolAbs * 3;
          pill = RF.el("span", { class: "pill " + (ok ? "good" : near ? "warn" : "bad"), text: ok ? "Right" : near ? "Close" : "Off" });
        }
        verdict.append(pill, " Answer: ", RF.el("span", { class: "val", text: p.fmt ? p.fmt(ans) : RF.fmt(ans) + " " + (p.unit || "") }), ". ", p.explain || "");
      }
      const nav = RF.el("div", { class: "nav" }, [
        RF.el("span", { text: "Predict first · " + (i + 1) + " of " + prompts.length }),
        RF.el("button", { type: "button", class: "btn small", text: "Next question", onclick: () => { i = (i + 1) % prompts.length; RF.store.set("predict:" + key, i); render(); } }),
      ]);
      el.replaceChildren(nav, RF.el("div", { class: "q", text: p.q }), form, verdict);
    }
    render();
  };

  /* ---------- line plot ---------- */
  function niceStep(span, target) {
    const raw = span / target;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const n = raw / mag;
    return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag;
  }
  function linTicks(a, b, target) {
    const st = niceStep(b - a, target);
    const out = [];
    for (let v = Math.ceil(a / st - 1e-9) * st; v <= b + st * 1e-9; v += st) out.push(Math.abs(v) < st * 1e-9 ? 0 : v);
    return out;
  }
  function logTicks(a, b) {
    const out = [];
    for (let e = Math.floor(Math.log10(a)); e <= Math.ceil(Math.log10(b)); e++) {
      for (const m of [1, 2, 5]) {
        const v = m * Math.pow(10, e);
        if (v >= a * 0.999 && v <= b * 1.001) out.push(v);
      }
    }
    return out;
  }
  let clipSeq = 0;

  RF.plot = function (parent, init) {
    const box = RF.el("div", { class: "plot" });
    const h3 = RF.el("h3");
    const sub = RF.el("p", { class: "sub" });
    const legend = RF.el("div", { class: "legend" });
    const svg = RF.s("svg", { role: "img" });
    const tip = RF.el("div", { class: "tip", hidden: "" });
    box.append(h3, sub, legend, svg, tip);
    parent.append(box);
    const clipId = "clip" + ++clipSeq;
    let o = null, sx = null, sy = null, geo = null;

    function update(opts) {
      o = opts;
      const W = 640, H = o.height || 280;
      const m = { l: 56, r: 18, t: 14, b: 40 };
      const pw = W - m.l - m.r, ph = H - m.t - m.b;
      geo = { W, H, m, pw, ph };
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      svg.setAttribute("aria-label", o.aria || o.title || "plot");
      h3.textContent = o.title || "";
      sub.textContent = o.subtitle || "";
      sub.hidden = !o.subtitle;
      const X = o.x, Y = o.y;
      sx = X.log
        ? (v) => m.l + (pw * Math.log(v / X.min)) / Math.log(X.max / X.min)
        : (v) => m.l + (pw * (v - X.min)) / (X.max - X.min);
      sy = Y.log
        ? (v) => m.t + ph - (ph * Math.log(v / Y.min)) / Math.log(Y.max / Y.min)
        : (v) => m.t + ph - (ph * (v - Y.min)) / (Y.max - Y.min);
      const kids = [];
      const defs = RF.s("defs");
      const cp = RF.s("clipPath", { id: clipId });
      cp.append(RF.s("rect", { x: m.l, y: m.t, width: pw, height: ph }));
      defs.append(cp);
      kids.push(defs);
      kids.push(RF.s("rect", { x: m.l, y: m.t, width: pw, height: ph }, { fill: "var(--surface)" }));
      // bands (labels are drawn after the grid so gridlines don't cut through them)
      const bandLabels = [];
      for (const b of o.bands || []) {
        const x0 = sx(Math.max(b.x0, X.min)), x1 = sx(Math.min(b.x1, X.max));
        if (x1 > x0) {
          kids.push(RF.s("rect", { x: x0, y: m.t, width: x1 - x0, height: ph }, { fill: b.color || "var(--gold)", opacity: b.opacity ?? 0.1 }));
          if (b.label) bandLabels.push(RF.s("text", { x: (x0 + x1) / 2, y: m.t + 13, "text-anchor": "middle", "font-size": 11, text: b.label }, { fill: "var(--ink-2)", paintOrder: "stroke", stroke: "var(--surface)", strokeWidth: 3 }));
        }
      }
      // grid + ticks
      const xt = X.ticks || (X.log ? logTicks(X.min, X.max) : linTicks(X.min, X.max, X.nt || 6));
      const yt = Y.ticks || (Y.log ? logTicks(Y.min, Y.max) : linTicks(Y.min, Y.max, Y.nt || 5));
      const fx = X.fmt || RF.fmt, fy = Y.fmt || RF.fmt;
      for (const v of xt) {
        const x = sx(v);
        kids.push(RF.s("line", { x1: x, x2: x, y1: m.t, y2: m.t + ph }, { stroke: "var(--grid)", strokeWidth: 1 }));
        kids.push(RF.s("text", { x, y: m.t + ph + 16, "text-anchor": "middle", "font-size": 11.5, text: fx(v) }, { fill: "var(--muted)", fontVariantNumeric: "tabular-nums" }));
      }
      for (const v of yt) {
        const y = sy(v);
        kids.push(RF.s("line", { x1: m.l, x2: m.l + pw, y1: y, y2: y }, { stroke: "var(--grid)", strokeWidth: 1 }));
        kids.push(RF.s("text", { x: m.l - 7, y: y + 4, "text-anchor": "end", "font-size": 11.5, text: fy(v) }, { fill: "var(--muted)", fontVariantNumeric: "tabular-nums" }));
      }
      kids.push(RF.s("line", { x1: m.l, x2: m.l + pw, y1: m.t + ph, y2: m.t + ph }, { stroke: "var(--axis)", strokeWidth: 1 }));
      kids.push(RF.s("line", { x1: m.l, x2: m.l, y1: m.t, y2: m.t + ph }, { stroke: "var(--axis)", strokeWidth: 1 }));
      if (X.label) kids.push(RF.s("text", { x: m.l + pw / 2, y: H - 4, "text-anchor": "middle", "font-size": 12, text: X.label }, { fill: "var(--ink-2)" }));
      if (Y.label) kids.push(RF.s("text", { x: 14, y: m.t + ph / 2, "text-anchor": "middle", "font-size": 12, transform: `rotate(-90 14 ${m.t + ph / 2})`, text: Y.label }, { fill: "var(--ink-2)" }));
      kids.push(...bandLabels);
      // reference lines
      const g = RF.s("g", { "clip-path": `url(#${clipId})` });
      for (const hl of o.hlines || []) {
        const y = sy(hl.y);
        g.append(RF.s("line", { x1: m.l, x2: m.l + pw, y1: y, y2: y }, { stroke: hl.color || "var(--ink-2)", strokeWidth: 1, opacity: 0.7 }));
        if (hl.label) g.append(RF.s("text", { x: m.l + pw - 4, y: y - 5, "text-anchor": "end", "font-size": 11, text: hl.label }, { fill: "var(--ink-2)" }));
      }
      for (const vl of o.vlines || []) {
        const x = sx(vl.x);
        g.append(RF.s("line", { x1: x, x2: x, y1: m.t, y2: m.t + ph }, { stroke: vl.color || "var(--ink-2)", strokeWidth: 1, opacity: 0.7 }));
        if (vl.label) g.append(RF.s("text", { x: x + (vl.anchor === "end" ? -4 : 4), y: m.t + (vl.dy || 26), "text-anchor": vl.anchor || "start", "font-size": 11, text: vl.label }, { fill: "var(--ink-2)" }));
      }
      // series
      for (const s of o.series) {
        let d = "";
        let pen = false;
        for (const [xv, yv] of s.pts) {
          if (!isFinite(yv) || !isFinite(xv)) { pen = false; continue; }
          const yy = RF.clamp(sy(yv), -2000, 2000);
          d += (pen ? "L" : "M") + sx(xv).toFixed(1) + " " + yy.toFixed(1);
          pen = true;
        }
        if (s.area) {
          const p0 = s.pts[0], p1 = s.pts[s.pts.length - 1];
          g.append(RF.s("path", { d: d + `L${sx(p1[0])} ${sy(s.area)}L${sx(p0[0])} ${sy(s.area)}Z` }, { fill: s.color, opacity: 0.1, stroke: "none" }));
        }
        g.append(RF.s("path", { d }, {
          fill: "none", stroke: s.color, strokeWidth: s.width || 2, strokeLinejoin: "round", strokeLinecap: "round", opacity: s.opacity ?? 1,
        }));
      }
      kids.push(g);
      // markers
      for (const mk of o.markers || []) {
        if (!isFinite(mk.x) || !isFinite(mk.y)) continue;
        const x = sx(mk.x), y = sy(mk.y);
        if (x < m.l - 1 || x > m.l + pw + 1 || y < m.t - 1 || y > m.t + ph + 1) continue;
        kids.push(RF.s("circle", { cx: x, cy: y, r: mk.r || 5 }, { fill: mk.color || "var(--ink)", stroke: "var(--surface)", strokeWidth: 2 }));
        if (mk.label) {
          const right = x < m.l + pw * 0.75;
          kids.push(RF.s("text", { x: x + (right ? 9 : -9), y: y + (mk.dy ?? -8), "text-anchor": right ? "start" : "end", "font-size": 11.5, "font-weight": 600, text: mk.label }, { fill: "var(--ink)" }));
        }
      }
      // crosshair layer
      const hair = RF.s("line", { y1: m.t, y2: m.t + ph, visibility: "hidden" }, { stroke: "var(--ink-2)", strokeWidth: 1 });
      const hit = RF.s("rect", { x: m.l, y: m.t, width: pw, height: ph }, { fill: "transparent" });
      kids.push(hair, hit);
      svg.replaceChildren(...kids);
      // legend
      legend.replaceChildren();
      const named = o.series.filter((s) => s.name && !s.noLegend);
      legend.hidden = named.length < 2;
      for (const s of named) {
        const sw = RF.el("i");
        sw.style.background = s.color;
        legend.append(RF.el("span", null, [sw, document.createTextNode(s.name)]));
      }
      if (o.crosshair !== false) {
        const invx = X.log
          ? (px) => X.min * Math.pow(X.max / X.min, (px - m.l) / pw)
          : (px) => X.min + ((px - m.l) / pw) * (X.max - X.min);
        const onMove = (e) => {
          const p = RF.svgPoint(svg, e);
          const xv = invx(RF.clamp(p.x, m.l, m.l + pw));
          hair.setAttribute("x1", sx(xv));
          hair.setAttribute("x2", sx(xv));
          hair.setAttribute("visibility", "visible");
          tip.replaceChildren(RF.el("div", { class: "hd", text: (o.tipX || fx)(xv) }));
          for (const s of o.series) {
            if (s.noTip) continue;
            const pts = s.pts;
            let lo = 0, hi = pts.length - 1;
            while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (pts[mid][0] < xv) lo = mid; else hi = mid; }
            const pt = Math.abs(pts[lo][0] - xv) < Math.abs(pts[hi][0] - xv) ? pts[lo] : pts[hi];
            const key = RF.el("i");
            key.style.background = s.color;
            tip.append(RF.el("div", { class: "row" }, [
              RF.el("span", null, [key, document.createTextNode(s.name || "")]),
              RF.el("b", { text: (o.tipY || fy)(pt[1]) }),
            ]));
          }
          tip.hidden = false;
          const r = box.getBoundingClientRect();
          const sr = svg.getBoundingClientRect();
          const px = e.clientX - r.left, py = e.clientY - r.top;
          const tw = tip.offsetWidth;
          tip.style.left = (px + 14 + tw > r.width ? px - tw - 14 : px + 14) + "px";
          tip.style.top = Math.max(sr.top - r.top, py - 20) + "px";
        };
        hit.addEventListener("pointermove", onMove);
        hit.addEventListener("pointerdown", onMove);
        hit.addEventListener("pointerleave", () => { tip.hidden = true; hair.setAttribute("visibility", "hidden"); });
      }
    }
    update(init);
    return { update, svg, box };
  };

  /* ---------- filter helpers ---------- */
  RF.buttG = (N) => Array.from({ length: N }, (_, i) => 2 * Math.sin(((2 * i + 1) * Math.PI) / (2 * N)));
  /* Chebyshev lowpass prototype g1..gN plus the load g(N+1) */
  RF.chebG = function (N, rippleDb) {
    const beta = Math.log(1 / Math.tanh(rippleDb / 17.37));
    const gam = Math.sinh(beta / (2 * N));
    const a = [], bb = [];
    for (let k = 1; k <= N; k++) {
      a.push(Math.sin(((2 * k - 1) * Math.PI) / (2 * N)));
      bb.push(gam * gam + Math.sin((k * Math.PI) / N) ** 2);
    }
    const g = [(2 * a[0]) / gam];
    for (let k = 2; k <= N; k++) g.push((4 * a[k - 2] * a[k - 1]) / (bb[k - 2] * g[k - 2]));
    const load = N % 2 ? 1 : 1 / Math.tanh(beta / 4) ** 2;
    return { g, load };
  };
  RF.rippleFromRL = (rl) => -10 * Math.log10(1 - Math.pow(10, -rl / 10));
  RF.rlFromRipple = (rip) => -10 * Math.log10(1 - Math.pow(10, -rip / 10));
  /* 2x2 complex ABCD helpers */
  const I2 = () => [cx.C(1), cx.C(0), cx.C(0), cx.C(1)];
  const mm = (p, q) => [
    cx.add(cx.mul(p[0], q[0]), cx.mul(p[1], q[2])), cx.add(cx.mul(p[0], q[1]), cx.mul(p[1], q[3])),
    cx.add(cx.mul(p[2], q[0]), cx.mul(p[3], q[2])), cx.add(cx.mul(p[2], q[1]), cx.mul(p[3], q[3])),
  ];
  RF.abcd = {
    I: I2,
    mul: mm,
    series: (Z) => [cx.C(1), Z, cx.C(0), cx.C(1)],
    shunt: (Y) => [cx.C(1), cx.C(0), Y, cx.C(1)],
    line: (Zc, th) => [cx.C(Math.cos(th)), cx.C(0, Zc * Math.sin(th)), cx.C(0, Math.sin(th) / Zc), cx.C(Math.cos(th))],
    /* S21 and S11 with source R0 and load RL (real) */
    sparams(M, R0, RL = R0) {
      const [A, B, Cc, D] = M;
      const den = cx.add(cx.add(cx.scale(A, RL), B), cx.add(cx.scale(Cc, R0 * RL), cx.scale(D, R0)));
      const s21 = cx.scale(cx.inv(den), 2 * Math.sqrt(R0 * RL));
      const num11 = cx.sub(cx.add(cx.scale(A, RL), B), cx.add(cx.scale(Cc, R0 * RL), cx.scale(D, R0)));
      return { s21, s11: cx.div(num11, den) };
    },
  };
  /* microstrip synthesis (Hammerstad): width in the same units as h */
  RF.msWidth = function (Z, er, h) {
    const A = (Z / 60) * Math.sqrt((er + 1) / 2) + ((er - 1) / (er + 1)) * (0.23 + 0.11 / er);
    let wh = (8 * Math.exp(A)) / (Math.exp(2 * A) - 2);
    if (wh > 2) {
      const B = (377 * Math.PI) / (2 * Z * Math.sqrt(er));
      wh = (2 / Math.PI) * (B - 1 - Math.log(2 * B - 1) + ((er - 1) / (2 * er)) * (Math.log(B - 1) + 0.39 - 0.61 / er));
    }
    return wh * h;
  };
  RF.eeff = (w, er, h) => (er + 1) / 2 + ((er - 1) / 2) / Math.sqrt(1 + (12 * h) / w);
  RF.SUBSTRATES = {
    gaas: { label: "GaAs 100 µm", er: 12.9, h: 100, minW: 10 },
    ro: { label: "RO4003C 20 mil", er: 3.55, h: 508, minW: 150 },
  };
  RF.lenStr = (um) => (um >= 1000 ? fmt(um / 1000, 3) + " mm" : fmt(um, 3) + " µm");
  function fmt(v, sg) { return RF.fmt(v, sg); }

  /* ---------- Smith chart ---------- */
  RF.smith = function (parent, init) {
    const box = RF.el("div", { class: "plot" });
    const h3 = RF.el("h3");
    const sub = RF.el("p", { class: "sub" });
    const legend = RF.el("div", { class: "legend" });
    const svg = RF.s("svg", { viewBox: "0 0 340 340", role: "img" });
    box.append(h3, sub, legend, svg);
    parent.append(box);
    const cxp = 170, cyp = 170, R = 150;
    const P = (g) => [cxp + g.re * R, cyp - g.im * R];
    const clipId = "sclip" + ++clipSeq;
    let o = init;

    function grid() {
      const kids = [];
      const defs = RF.s("defs");
      const cp = RF.s("clipPath", { id: clipId });
      cp.append(RF.s("circle", { cx: cxp, cy: cyp, r: R }));
      defs.append(cp);
      kids.push(defs);
      kids.push(RF.s("circle", { cx: cxp, cy: cyp, r: R }, { fill: "var(--surface)", stroke: "var(--axis)", strokeWidth: 1 }));
      const g = RF.s("g", { "clip-path": `url(#${clipId})` });
      for (const r of [0.2, 0.5, 1, 2, 5]) {
        const c = r / (1 + r), rad = 1 / (1 + r);
        g.append(RF.s("circle", { cx: cxp + c * R, cy: cyp, r: rad * R }, { fill: "none", stroke: r === 1 ? "var(--axis)" : "var(--grid)", strokeWidth: 1 }));
      }
      for (const x of [0.2, 0.5, 1, 2, 5]) {
        for (const sgn of [1, -1]) {
          g.append(RF.s("circle", { cx: cxp + R, cy: cyp - (sgn * R) / x, r: R / x }, { fill: "none", stroke: "var(--grid)", strokeWidth: 1 }));
        }
      }
      g.append(RF.s("line", { x1: cxp - R, x2: cxp + R, y1: cyp, y2: cyp }, { stroke: "var(--axis)", strokeWidth: 1 }));
      kids.push(g);
      for (const r of [0.2, 0.5, 1, 2, 5]) {
        const xg = (r - 1) / (r + 1);
        kids.push(RF.s("text", { x: cxp + xg * R + 3, y: cyp + 12, "font-size": 10, text: RF.fmt(r * (o.z0 || 50), 2) }, { fill: "var(--muted)" }));
      }
      kids.push(RF.s("text", { x: cxp, y: cyp - R - 6 + 0, "text-anchor": "middle", "font-size": 10.5, text: "+j (inductive)" }, { fill: "var(--muted)" }));
      kids.push(RF.s("text", { x: cxp, y: cyp + R + 14, "text-anchor": "middle", "font-size": 10.5, text: "−j (capacitive)" }, { fill: "var(--muted)" }));
      kids.push(RF.s("text", { x: cxp - R + 2, y: cyp + 14, "font-size": 10, text: "short" }, { fill: "var(--muted)" }));
      kids.push(RF.s("text", { x: cxp + R - 2, y: cyp + 14, "text-anchor": "end", "font-size": 10, text: "open" }, { fill: "var(--muted)" }));
      return kids;
    }

    function update(opts) {
      o = opts;
      h3.textContent = o.title || "";
      sub.textContent = o.subtitle || "";
      sub.hidden = !o.subtitle;
      svg.setAttribute("aria-label", o.aria || o.title || "Smith chart");
      const kids = grid();
      const g = RF.s("g", { "clip-path": `url(#${clipId})` });
      for (const c of o.circles || []) {
        const [x, y] = P(c.center || { re: 0, im: 0 });
        g.append(RF.s("circle", { cx: x, cy: y, r: c.r * R }, { fill: c.fill || "none", stroke: c.color, strokeWidth: c.width || 1.5, opacity: c.opacity ?? 1 }));
      }
      for (const p of o.paths || []) {
        const d = p.pts.map((gm, i) => (i ? "L" : "M") + P(gm).map((v) => v.toFixed(1)).join(" ")).join("");
        g.append(RF.s("path", { d }, { fill: "none", stroke: p.color, strokeWidth: p.width || 2, strokeLinejoin: "round", strokeLinecap: "round", opacity: p.opacity ?? 1 }));
      }
      kids.push(g);
      for (const pt of o.points || []) {
        const [x, y] = P(pt.g);
        kids.push(RF.s("circle", { cx: x, cy: y, r: pt.r || 6 }, { fill: pt.color, stroke: "var(--surface)", strokeWidth: 2 }));
        if (pt.label) kids.push(RF.s("text", { x: x + 10, y: y - 8, "font-size": 11.5, "font-weight": 600, text: pt.label }, { fill: "var(--ink)" }));
      }
      svg.replaceChildren(...kids);
      legend.replaceChildren();
      const named = (o.legend || []);
      legend.hidden = named.length < 2;
      for (const s of named) {
        const sw = RF.el("i");
        sw.style.background = s.color;
        legend.append(RF.el("span", null, [sw, document.createTextNode(s.name)]));
      }
    }
    if (init.onDrag) {
      RF.dragSvg(svg, (p) => {
        if (Math.hypot(p.x - cxp, p.y - cyp) > R + 8 || !o.onDrag) return null;
        return (q) => {
          let gr = (q.x - cxp) / R, gi = -(q.y - cyp) / R;
          const mag = Math.hypot(gr, gi);
          if (mag > 0.995) { gr *= 0.995 / mag; gi *= 0.995 / mag; }
          o.onDrag({ re: gr, im: gi });
        };
      });
    }
    update(init);
    return { update, svg, box };
  };
})();
