---
title: 'Evaluating an HFSS agent: benchmarks and an honest loss'
description: How I evaluated an AI agent that drives Ansys HFSS. An atomic prompt suite and gold benchmarks graded against reference projects, and an A/B race between two agents on the same task.
publishDate: '2026-09-22'
isFeatured: true
seo:
  image:
    src: '/2026/agent-evals/gold-designs.png'
    alt: Top views of four gold benchmark designs in HFSS
---

An agent that drives Ansys HFSS can look convincing and still build the wrong model. I built the benchmarks that tell the difference, graded against gold AEDT reference projects.

## The benchmarks

- **An atomic prompt suite**, each prompt a single HFSS task, graded against a gold reference project.
- **Design-level gold benchmarks:** a 50 Ω line, a modify-in-place edit with protected invariants, a 2.4 GHz branch-line hybrid, a coupled-line bandpass filter and a 28 GHz antenna rebuilt from a published paper. Structure is checked from the saved project and RF performance from the exported Touchstone.

<figure>
<img class="full" src="/2026/agent-evals/gold-designs.png" alt="Top views of four gold benchmark designs">
<figcaption>Four of the gold designs, top views from HFSS.</figcaption>
</figure>

<figure>
<img class="full" src="/2026/agent-evals/siw-bowtie-iso.png" alt="The 28 GHz SIW-fed bow-tie antenna in HFSS">
<figcaption>The paper reproduction: an SIW-fed bow-tie at 28 GHz (Esmail and Koziel, <em>Sci. Rep.</em> 14:3203, 2024).</figcaption>
</figure>

<figure>
<img class="full" src="/2026/agent-evals/siw-bowtie-s11-vs-paper.png" alt="Simulated S11 of the bow-tie against the paper">
<figcaption>Simulated |S11| against the paper. Still a candidate: the band sits higher than the paper's.</figcaption>
</figure>

## An honest loss: the A/B race

Two agents on the same model had four hours to design a 1:6 power divider from 2 to 18 GHz, graded only on the Touchstone file each delivered. Agent B also had a corpus of past design lessons.

<figure>
<video class="wide" controls playsinline preload="metadata" poster="/2026/agent-evals/ab-race.jpg" style="border-radius: 8px;">
  <source src="/2026/agent-evals/ab-race.mp4" type="video/mp4">
</video>
<figcaption>Four hours at 150x. The scoreboard steps up with each delivered design.</figcaption>
</figure>

Agent A won the graded metric, even though B met more of the spec's gates and cost less. B got stuck on an amplitude tilt and kept a mesh that made its solves much slower. Neither agent was told how it would be graded, and a rerun should tell them.
