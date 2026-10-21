---
title: 'Birdcage Builder: MRI Coil Specs to a Palace Run'
description: "Set the specs of an MRI birdcage coil (low-pass, high-pass or band-pass, rungs, size, shield, field strength). The browser computes the ladder-model modes and the first-guess capacitor, and the last step writes a package that builds, solves and tunes the coil in the Palace FEM solver."
publishDate: '2026-10-21'
isFeatured: true
repo: 'https://github.com/benjhardy/birdcage-palace'
seo:
  image:
    src: '/2026/birdcage-builder/birdcage-builder.png'
    alt: 'The birdcage builder: a 16-rung low-pass coil in its shield with the k = 1 rung currents, next to the coil specs'
---

**[Open the builder →](/birdcage-builder/)** · **[Source on GitHub](https://github.com/benjhardy/birdcage-palace)**

The page runs in your browser. The Palace solve runs on your own machine.

**Overview**

The builder is the front end of [birdcage-palace](/projects/birdcage-palace/). Set the specs and the page shows the coil and its ladder-network modes. The **Open in Palace and begin tuning** button writes a package that does the full-wave part.

**What's on the page**

- **Inputs:** ¹H at any B0 (1.5, 3 and 7 T presets), low-pass, high-pass or band-pass, 8 to 32 rungs, diameter, length, rung and ring widths, capacitor gap, shield, optional saline phantom, mesh preset, FE order and symmetry model. The page checks the ranges, for example that the shield clears the rungs and the gap fits in the rung.
- **3D view:** the cage, the capacitors by type, the shield as a wireframe and the k = 1 rung currents (linear or quadrature).
- **Ladder model:** a port of the Python model, checked against it on 24 random designs (worst difference 1.4e-13). It gives every mode frequency and the capacitor that puts k = 1 on f0.
- **Accuracy:** our Palace results for the 3 T reference coils. At the ladder first guess (2.81 pF) the low-pass coil resonates at 111.1 MHz; the tuned value is 1.83 pF. The ladder model is a first guess, and that is why the package tunes.
- **Cost:** unknowns, memory and time for the chosen mesh, scaled from measured Palace runs.
- **Package:** spec.json, run.sh (Linux or WSL), run.ps1 (Windows) and a README with the requirements. The script installs birdcage-palace from GitHub, runs `birdcage build`, `solve`, `modes` and `tune`. There is also a prompt for a coding agent that uses [palace-agent-tools](https://github.com/benjhardy/palace-agent-tools).

**Tested end to end:** a package for a 12-rung high-pass coil (24 cm, 3 T, coarse mesh) ran from a fresh venv in WSL. The ladder value of 24.29 pF put k = 1 at 134.18 MHz in Palace; one tune step moved it to 128.15 MHz (+0.33 %) at 26.80 pF. Two solves took 40 s each. Simulation only.

**Tech:** one HTML file with a canvas 3D view and JSZip, no framework. Part of the [agent.rf lab](/agent-rf/).

![The birdcage builder](/2026/birdcage-builder/birdcage-builder.png)
*A 16-rung low-pass coil with the k = 1 quadrature currents, next to the coil specs.*
