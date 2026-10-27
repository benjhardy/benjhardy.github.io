---
title: 'Filter Surrogate: Edge-Coupled Band-Pass Filter in the Browser'
description: "An edge-coupled microstrip band-pass filter model (3-7 GHz, RO4350B) that runs in the browser: a Pozar coupled-line prior plus a DeepONet correction trained on 261 Palace FEM solves. Six geometry sliders, |S21| and |S11| with the five-seed spread, Palace reference curves, and an inverse search from f0, bandwidth and return loss."
publishDate: '2026-10-26'
isFeatured: true
repo: 'https://github.com/benjhardy/rfsurrogates'
seo:
  image:
    src: '/2026/filter-surrogate/filter-surrogate.png'
    alt: 'The filter surrogate: |S21| and |S11| of the tuned nominal filter with the ensemble band, next to the six geometry sliders'
---

**[Open the app →](/filter-surrogate/)** · **[Source on GitHub](https://github.com/benjhardy/rfsurrogates)** · **[Model card](https://huggingface.co/rfsurrogates/edge-coupled-bpf)**

The page runs in your browser. The Palace solve runs on your own machine.

**Overview**

The surrogate is the front of [rfsurrogates](https://github.com/benjhardy/rfsurrogates), an open library of surrogate models for passive microwave devices: one model per device family, trained on full-wave solves that anyone can contribute from their own machine. The first family is the edge-coupled microstrip band-pass filter on RO4350B (3 to 7 GHz). Its model is an analytic prior (Pozar coupled-line filter, Kirschning-Jansen coupled microstrip, Kobayashi dispersion) plus a DeepONet correction trained on 261 Palace FEM solves. Set the six geometry parameters and the page gives |S21| and |S11| in about 2 ms. The device selector has one family for now; the next one is the hairpin band-pass filter.

**What's on the page**

- **Inputs:** strip widths w₁, w₂, coupling gaps g₁, g₂ and coupled lengths l₁, l₂ (mm) inside the sampling box (±30 % on widths and gaps, ±15 % on lengths around the tuned nominal); substrate fixed. The page checks the geometry rule (clearance > 0.05 mm, otherwise the strips fuse) and shows the distance to the box edge.
- **3D layout:** the filter on its substrate with the ground, the air box and the two wave ports, drawn from the same rectangles as the mesh generator. It moves with the sliders, lights up the dimension under the pointer, has an exploded view, and shows port pulses sized by |S11| and |S21| at the plot cursor.
- **Models:** prior only, prior + DeepONet (five seeds) or DeepONet from scratch (five seeds); the plot shows the ensemble mean, a ±1 std band over the seeds and the prior as a dashed line.
- **Metrics:** f0 as the |S21|² centroid, 3 dB bandwidth with a split-passband flag, insertion loss at f0, return loss between the outer reflection zeros, and the ensemble spread in the passband; all recomputed on every slider move.
- **Palace references:** the tuned nominal and five held-out test designs with their Palace curves and the measured error of each model.
- **Inverse design:** f0, 3 dB bandwidth, a return-loss floor and optional rejection points. 256 Latin-hypercube starts in the box, the best eight refined with Nelder-Mead, under 2 s, with a warning when the spec is outside the training range.
- **Verify in Palace:** the sample record and the commands that build, solve (about 11 min on 4 ranks, 2 GB), collect and check the design with the repo.

**Accuracy** (held-out 26 designs, passband |S21| error / f0 error): prior only 2.86 dB / 61 MHz; prior + DeepONet 0.52 dB / 7.9 MHz; from scratch 0.32 dB / 4.2 MHz. Against a converged mesh the coarse-trained model is 0.91 dB off, and the coarse mesh itself is 1.03 dB off. The prior helps below about 50 training samples; the model trained from scratch is ahead from about 100. Simulated vs simulated (Palace FEM), one substrate, not measured.

**Tech:** one HTML file plus a dependency-free JavaScript port of the prior and of the network forward pass, checked against the Python code on 24 random designs (prior 1.2e-14 in S, network 4e-5 dB). The weights are 2.6 MB of base64 float32. Part of the [agent.rf lab](/agent-rf/).

![The filter surrogate](/2026/filter-surrogate/filter-surrogate.png)
*The tuned nominal filter: |S21| and |S11| with the five-seed band, next to the geometry sliders.*
