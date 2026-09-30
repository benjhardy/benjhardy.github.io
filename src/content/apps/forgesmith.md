---
title: "Forge Smith: The Smithy's Forge and the Smith Chart Tutor"
description: "A Smith chart game and a guided tutor. Solder parts onto a bench, watch the impedance move on the chart, and learn matching from the Smithy. Runs in the browser."
publishDate: '2026-09-30'
isFeatured: true
seo:
  image:
    src: '/2026/forgesmith/smithy-forge-game.png'
    alt: "The Smithy's Forge: a Smith chart with a solder bench and the Smithy character"
---

**[Play The Smithy's Forge →](/forgesmith/smithy-forge-game.html)** · **[Open the Smith Chart Tutor →](/forgesmith/smith-chart-tutor.html)**

Both run in your browser. There's nothing to install.

**Overview**

Forge Smith teaches the Smith chart two ways. **The Smithy's Forge** is a game: the Smithy, a cranky RF expert, trains you at his solder bench. Drag coils, capacitors, lines and stubs onto the glowing pads, watch the impedance move on the chart, and earn XP up to "Master of the Forge". The **Smith Chart Tutor** covers the same material as guided lessons, with a sandbox mode for free play.

**Content:** 6 modules, 25 steps.

1. **Read the Chart:** normalization, Γ, VSWR, and the short, open and match landmarks.
2. **Transmission Lines:** rotation, the λ/2 lap, quarter-wave transformers and stubs.
3. **Forge a Match:** L-networks, shunt-first and series-first, and single-stub matching.
4. **The Mirror World:** admittance, the λ/4 impedance inverter, and single-element matches.
5. **Meter Craft:** converting between Γ, VSWR and return loss, and voltage minima and maxima.
6. **Master Trials:** series-first L-networks, open-stub matching, and a randomized final match.

**Verified, not just convincing**

Every hint value and pass/fail check is checked numerically against the app's own RF engine, run headlessly in Node against the shipped code:

- all 25 tutor checks pass with the reference solution in their hint text;
- all 24 numeric claims the Smithy makes check out;
- a scripted playthrough completes all 25 quest steps at 450/450 XP;
- a sweep of all 7,371 possible random loads in the final trial shows every one can be matched below |Γ| < 0.05 with in-range parts.

**Tech:** self-contained HTML, CSS and JavaScript with no dependencies or build step, built to drop into an Electron window for [DesignForge AI](https://www.designforgeai.com).

![The Smithy's Forge](/2026/forgesmith/smithy-forge-game.png)
*The Smithy's Forge: the solder bench, the Smith chart, and the Smithy's first lesson.*

![Smith Chart Tutor](/2026/forgesmith/smith-chart-tutor.png)
*The Smith Chart Tutor: guided lessons on the left, the chart in the middle, the circuit bench on the right.*
