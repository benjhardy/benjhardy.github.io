/* RF Bench app shell: tabs, module mounting, remembered tab. */
(function () {
  "use strict";
  const { el } = RF;
  const tabs = document.getElementById("tabs");
  const main = document.getElementById("modules");
  const mounted = {};
  const buttons = {};

  for (const m of RF.modules) {
    if (m.into) {
      /* a section appended to an existing tab, no tab button of its own */
      const host = mounted[m.into];
      if (!host) continue;
      const sub = el("div", { class: "module sub-module", id: "m-" + m.id });
      host.sec.append(sub);
      try { m.build(sub); } catch (err) {
        sub.replaceChildren(el("p", { class: "muted", text: "This section failed to load: " + err.message }));
        console.error(err);
      }
      continue;
    }
    const sec = el("section", { class: "module", id: "m-" + m.id, role: "tabpanel", "aria-labelledby": "tab-" + m.id, hidden: "" });
    main.append(sec);
    const bt = el("button", { class: "tab", id: "tab-" + m.id, role: "tab", type: "button", "aria-controls": "m-" + m.id, "aria-selected": "false" }, [
      document.createTextNode(m.tab), el("small", { text: m.sub }),
    ]);
    bt.addEventListener("click", () => show(m.id, true));
    tabs.append(bt);
    buttons[m.id] = bt;
    try {
      mounted[m.id] = { sec, api: m.build(sec) || {} };
    } catch (err) {
      sec.replaceChildren(el("p", { class: "muted", text: "This tab failed to load: " + err.message }));
      mounted[m.id] = { sec, api: {} };
      console.error(err);
    }
  }

  let current = null;
  function show(id, remember) {
    if (!mounted[id]) id = RF.modules[0].id;
    if (current && mounted[current].api.hide) mounted[current].api.hide();
    for (const k in mounted) {
      mounted[k].sec.hidden = k !== id;
      buttons[k].setAttribute("aria-selected", String(k === id));
      buttons[k].tabIndex = k === id ? 0 : -1;
    }
    current = id;
    if (mounted[id].api.show) mounted[id].api.show();
    if (remember) {
      RF.store.set("tab", id);
      try { history.replaceState(null, "", "#" + id); } catch (e) { /* ignore */ }
    }
  }
  tabs.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const ids = RF.modules.filter((m) => !m.into).map((m) => m.id);
    const i = ids.indexOf(current);
    const nx = ids[(i + (e.key === "ArrowRight" ? 1 : ids.length - 1)) % ids.length];
    show(nx, true);
    buttons[nx].focus();
  });

  window.addEventListener("hashchange", () => {
    const h = (location.hash || "").slice(1);
    if (mounted[h] && h !== current) show(h, true);
  });
  const fromHash = (location.hash || "").slice(1);
  show(mounted[fromHash] ? fromHash : RF.store.get("tab", RF.modules[0].id), false);
})();
