---
title: 'birdcage-palace: an MRI birdcage coil builder for Palace'
description: An open-source, scriptable builder for MRI birdcage RF coils. It sizes the capacitors with a ladder-network model, solves the full-wave eigenmodes with the Palace FEM solver, and picks out the homogeneous k = 1 mode automatically. Simulation only.
publishDate: '2026-10-23'
isFeatured: true
repo: 'https://github.com/benjhardy/birdcage-palace'
seo:
  image:
    src: '/2026/birdcage-palace/birdcage-palace-hero.png'
    alt: '16-rung birdcage coil in its RF shield next to the uniform k = 1 quadrature B1+ map and the k = 2 map with a null at the centre'
---

A birdcage coil with N rungs has about N resonant modes, and only one of them, the k = 1 pair, makes the uniform
transverse B1 field used for imaging. birdcage-palace builds the coil in Gmsh, solves its eigenmodes with the
open-source [Palace](https://github.com/awslabs/palace) finite-element solver, labels every mode from its
rung-current pattern and field map, and retunes the capacitors until the homogeneous pair sits on the Larmor
frequency. Everything on this page is simulated; nothing is measured.

**[Open the birdcage builder →](/birdcage-builder/)** Set the specs of a low-pass, high-pass or band-pass coil in
the browser, see the ladder-model spectrum and the first-guess capacitor, and download a package that builds, solves
and tunes the coil with this code.

<figure>
<img class="full" src="/2026/birdcage-palace/birdcage-palace-hero.png" alt="16-rung birdcage coil with the k = 1 and k = 2 field maps">
<figcaption>The tuned 16-rung low-pass coil in its shield, with the uniform k = 1 quadrature B1+ map and the k = 2 map, which has a null at the centre (simulated).</figcaption>
</figure>

## The design

- 16-rung low-pass head coil for ¹H at 3 T: 42.577 MHz/T × 3 T = 127.7 MHz.
- 28 cm diameter, 25 cm between end-ring centrelines, 12 mm rungs and 15 mm end rings.
- Zero-thickness PEC strips, one lumped capacitor across a 5 mm gap in the middle of each rung.
- Closed PEC shield, 34 cm in diameter and 45 cm long. No load.

## How it works

1. **Ladder-network model.** Neumann-integral self and mutual inductances, an image-current shield and the discrete
   Fourier modes of the periodic ladder give every mode frequency in closed form, the same family of model as
   BirdcageBuilder (Chin et al., Penn State, 2002). It gives the first-guess capacitor.
2. **Gmsh model.** PEC strips on the coil cylinder, capacitor patches in the rungs (low-pass) or end rings
   (high-pass), the shield, and an optional saline phantom.
3. **Palace eigenmode solve.** Each capacitor is a lumped element in the eigenproblem. Shift-and-invert
   Krylov-Schur, order-2 Nédélec elements, direct MUMPS factorisation.
4. **Mode identification.** A spatial DFT of the 16 capacitor currents gives k. About 4,000 field probes give the
   B1 uniformity. Modes whose capacitors carry almost no current are flagged as stray-capacitance resonances.
5. **Retuning.** 1/f² is linear in C, so a secant step lands on target in one or two solves on the same mesh.

Python (numpy, matplotlib, gmsh, pyvista) and Palace 0.16, headless from the command line:
`birdcage build | solve | modes | tune`.

## Results

| | |
|---|---|
| k = 1 pair | **127.73 MHz** (127.726 and 127.741 MHz, split 15 kHz) |
| capacitor per rung | **1.83 pF** (ladder first guess 2.81 pF) |
| ROI std/mean of \|B1\|, one linear mode | 4.0 % (r < 0.6 R, \|z\| < L/6) |
| quadrature B1+ (pair driven 90° apart) | std/mean 2.3 %, \|B1−\| / \|B1+\| = 4.0 % |

With the ladder first guess of 2.81 pF, Palace puts k = 1 at 111.1 MHz, 13 % low. Two retuning solves bring it to
127.73 MHz at 1.83 pF. A fit of 1/f² = L_eff (C + C_stray) gives a stray capacitance of 1.21 pF per rung, two-thirds
of the lumped value, and L_eff = 511 nH against 553 nH from the ladder model.

**Ladder model vs Palace** (MHz; same mesh, Palace pairs averaged)

| k | ladder, 2.81 pF | Palace, 2.81 pF | ladder, 1.83 pF | Palace, 1.83 pF |
|---|---|---|---|---|
| 1 | **127.7** | 111.1 | 158.3 | **127.7** |
| 2 | 189.9 | 173.7 | 235.3 | 202.8 |
| 3 | 220.9 | 206.2 | 273.8 | 242.2 |
| 4 | 239.5 | 225.4 | 296.7 | 265.2 |
| 5 | 251.6 | 237.8 | 311.8 | 280.0 |
| 6 | 259.5 | 245.8 | 321.6 | 289.5 |
| 7 | 264.1 | 250.4 | 327.3 | 294.9 |
| 8 | 265.6 | 251.9 | 329.1 | 296.6 |

<figure>
<img class="wide" src="/2026/birdcage-palace/spectrum_compare.png" alt="Mode spectrum, ladder model vs Palace">
<figcaption>Mode spectrum at the ladder first guess (a) and after retuning in Palace (b). Open circles are the ladder model, filled dots are Palace eigenmodes; the orange dot is the homogeneous k = 1 pair (simulated).</figcaption>
</figure>

<figure>
<img class="wide" src="/2026/birdcage-palace/b1_maps.png" alt="B1 maps per mode">
<figcaption>Transverse |B| on the axial and coronal planes. Only k = 1 fills the region of interest uniformly; k = 2 has a null at the centre (simulated).</figcaption>
</figure>

<figure>
<video controls playsinline preload="metadata" poster="/2026/birdcage-palace/birdcage_modes_poster.png" style="display: block; width: 100%; max-width: 480px; margin: 0 auto; border-radius: 8px;">
  <source src="/2026/birdcage-palace/birdcage_modes.mp4" type="video/mp4">
</video>
<figcaption>A 38-second clip: the coil, its mode spectrum, the B1 map of each mode, and the tuned k = 1 result (simulated).</figcaption>
</figure>

**Solve cost.** Each production solve has 1.12 M unknowns (order-2 elements) and takes 14 to 20 minutes on 4 MPI
ranks with about 16 GB of RAM. A later convergence study (eighth-symmetry models up to the equivalent of about 8 M
unknowns) shows the production mesh puts k = 1 about 0.7 % high: the extrapolated k = 1 at 1.83 pF is about 126.9 MHz,
so landing exactly on 127.7 MHz needs about 1.79 pF. The error comes from the strip edges and shrinks slowly with mesh size.

**Symmetry planes.** For one k = 1 member, the plane across which the rung currents are antisymmetric is a perfect-electric
(PEC) plane and the other is a perfect-magnetic (PMC) plane, which is Palace's default boundary. A quarter model gives
127.61 MHz with 0.30 M unknowns, 3.7 GB and about 1 minute, against 127.73 MHz, 1.12 M unknowns, 16.6 GB and 11 minutes
for the full coil. Each PEC/PMC combination keeps only some modes; the four combinations together reproduce all 20 modes
of the full model within 0.11 %.

**Port tuning in circuitRF.** The 16 capacitor gaps become ports; four symmetric eighth-model sweeps rebuild the full
16-port S-matrix, and circuitRF (open source) tunes the capacitors and a capacitive-divider feed: 1.844 pF unloaded and
1.632 pF with a saline phantom, with |S11|, |S22| and |S21| at or below −20 dB. A Palace eigen solve with the tuned values
reproduces the predicted shift to 1 kHz. Capacitor ESR (0.68 Ω) is an assumption, since the conductors are lossless.

**Limits.** Simulation only. The conductors are lossless and the capacitors ideal; cables, baluns, matching and the
drive ports are not modelled, and the quadrature map is a superposition of the two eigenmodes, not a driven two-port
solve. The repo also has a coarse-mesh saline-phantom check and a high-pass check.
