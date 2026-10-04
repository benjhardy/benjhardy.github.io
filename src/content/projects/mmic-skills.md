---
title: 'MMIC skills and IMS 2026 demos'
description: Agent skills that turn hours of MMIC component work in Ansys HFSS into minutes, a skill chain that built a GaAs bandpass filter end to end, and the demos from the DesignForge booth at IMS 2026.
publishDate: '2026-08-18'
isFeatured: true
seo:
  image:
    src: '/2026/mmic-skills/spiral-inductor.jpg'
    alt: A square spiral inductor on GaAs built in HFSS by an agent skill
---

A skill packages one piece of RF know-how so an agent runs it the same way every time. I built skills for the MMIC components designers model over and over, and measured them against doing the same job by hand.

## Skills

| Skill | By hand | With the skill |
|---|---|---|
| Spiral inductor: solve for L and Q, export a turn sweep as one MDIF file | 90 to 150 min | about 2 min |
| Interdigital capacitor: drive the fingers to a target C and report Q | 60 to 100 min | about 2 min |

By-hand times are conservative estimates; the skill times are measured wall clock.

<figure>
<img class="full" src="/2026/mmic-skills/spiral-inductor.jpg" alt="A square spiral inductor on GaAs in HFSS">
<figcaption>A 2.5-turn square spiral on 100 µm GaAs: 1.32 nH, peak Q of 21.2 at 16.8 GHz. The 1.5, 2.5 and 3.5-turn variants went into one MDIF file for the circuit simulator.</figcaption>
</figure>

<figure>
<img class="full" src="/2026/mmic-skills/idc-capacitor.jpg" alt="An interdigital capacitor in HFSS">
<figcaption>An interdigital capacitor, finger count swept to hit a target capacitance.</figcaption>
</figure>

## A skill chain

Chained together, the skills built and solved a three-pole GaAs MMIC bandpass filter end to end in 36 minutes for $8.12 in agent cost: MIM capacitors, spiral inductors, air bridges and vias, then the HFSS solve. The first pass gave a real bandpass response, peaking near 3.2 GHz against a 2.3 GHz design target, so the next step is tuning.

<figure>
<img class="full" src="/2026/mmic-skills/gaas-bpf-skill-chain.png" alt="A three-pole GaAs MMIC bandpass filter built by a chain of skills">
<figcaption>Three shunt resonators with capacitive coupling, built by the skill chain.</figcaption>
</figure>

## IMS 2026 demos

Three of the demos from the DesignForge booth at IMS 2026.

<figure>
<video class="wide" controls playsinline preload="metadata" poster="/2026/mmic-skills/spiral-parameterized.jpg" style="border-radius: 8px;">
  <source src="/2026/mmic-skills/spiral-parameterized.mp4" type="video/mp4">
</video>
<figcaption>A fully parameterized Archimedean spiral, animated through its turns, width, radius and spacing.</figcaption>
</figure>

<figure>
<video class="wide" controls playsinline preload="metadata" poster="/2026/mmic-skills/filter-design.jpg" style="border-radius: 8px;">
  <source src="/2026/mmic-skills/filter-design.mp4" type="video/mp4">
</video>
<figcaption>A third-order coupled-line Chebyshev bandpass filter for 5.15 to 5.85 GHz, planned, built, solved and plotted.</figcaption>
</figure>

<figure>
<video class="wide" controls playsinline preload="metadata" poster="/2026/mmic-skills/patch-antenna.jpg" style="border-radius: 8px;">
  <source src="/2026/mmic-skills/patch-antenna.mp4" type="video/mp4">
</video>
<figcaption>A 2.4 GHz inset-fed patch antenna, sized from closed-form equations and built in HFSS.</figcaption>
</figure>
