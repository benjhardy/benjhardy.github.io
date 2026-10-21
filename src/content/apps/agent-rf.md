---
title: 'agent.rf — the RF lab'
description: "Learn RF by doing. An illustrated RF lab where each station opens an interactive tool or demo. Behind the glass is an agent lab, where AI agents run EM solvers against benchmarks with known answers. Runs in the browser."
publishDate: '2026-10-20'
isFeatured: true
seo:
  image:
    src: '/2026/agent-rf/agent-rf.png'
    alt: "An illustrated RF lab: solver library, blackboard with Maxwell's equations, VNA with a Smith chart, calculators, an MRI scanner and a glass-walled agent lab"
---

**[Open the lab →](/agent-rf/)** It runs in your browser. There's nothing to install.

**Overview**

agent.rf is one page that collects the RF tools on this site into a lab. Each station opens a tool or a demo. Stations marked building or coming soon are not public yet.

**Stations that are live**

- **Solver library:** [FDTD, FEM or MoM? An EM solver guide](/em-solver-guide/), with companion pages on rays and physical optics and on meshing.
- **Blackboard:** [Maxwell by Heart](/maxwell-by-heart/), Maxwell's equations one term at a time.
- **VNA:** [Smithy's Match](/smithys-match/smithys-match.html), a Smith chart matching game.
- **Bench:** [RF Bench](/rf-bench/), interactive RF fundamentals.
- **MRI scanner:** [birdcage-palace](/projects/birdcage-palace/), a birdcage coil builder for the Palace FEM solver.
- **Calculators:** [Visual RF calculators](/em-visual-calculators/).
- **Agent lab, tools agents call:** [palace-agent-tools](https://github.com/benjhardy/palace-agent-tools), which lets an agent set up, lint, run and check Palace simulations.

**Behind the glass**

The agent lab is where AI agents set up and run EM and circuit solves through tool servers, log every run and are scored against benchmarks with known answers. A person reviews before anything is built. Most of the lab is still being built; the screens on the page are illustrations.

**Tech:** one HTML file with a hand-drawn SVG scene, no framework.

![The agent.rf lab](/2026/agent-rf/agent-rf.png)
*The lab: click a station to open its tool.*
