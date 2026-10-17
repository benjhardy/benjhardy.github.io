---
title: 'FDTD, FEM or MoM? An EM Solver Guide'
description: "An interactive guide to the three main full-wave EM solvers. See the real mesh each solver uses on 20 devices, learn how each one works, and pick a solver and a tool for your problem. Runs in the browser."
publishDate: '2026-10-17'
isFeatured: true
repo: 'https://github.com/benjhardy/em-solver-guide'
seo:
  image:
    src: '/2026/em-solver-guide/em-solver-guide.png'
    alt: 'The first screen of the EM solver guide: FDTD, FEM or MoM?'
---

**[Open the guide →](/em-solver-guide/)** · **[Source on GitHub](https://github.com/benjhardy/em-solver-guide)**

It runs in your browser. There's nothing to install.

**Overview**

The guide explains how FDTD, FEM and MoM work and when to use each one.

- **Devices in 3D:** 20 devices, from an on-chip spiral to a ship, each with the real mesh made with Gmsh: FEM tetrahedra, an FDTD Yee grid and MoM surface triangles.
- **How each solver works:** step-by-step 3D lessons on the Yee cell, the tetrahedron and the RWG basis function, each with a short quiz.
- **Convergence:** when is each solver done? Demos include FEM adaptive passes, an FDTD ring-down, the Courant limit and a thin-wire MoM solve of a dipole that runs in the browser.
- **Picker:** set the size, frequency and problem type, and the method ranking and the first tools to look at update live.
- **Tools:** data for 62 commercial, open-source and free tools, with paper counts from OpenAlex.
- **Companion page, [Rays, PO or Hata?](/em-solver-guide/asymptotic.html):** ray tracing, physical optics, diffraction (UTD and knife-edge), SBR and empirical planning models, each with a live demo checked against an exact reference.

**Tech:** one self-contained HTML file with three.js. The meshes come from Gmsh scripts in the repo.

![FEM mesh of a 28 GHz antenna in package](/2026/em-solver-guide/devices-aip-fem.png)
*The FEM mesh of a 28 GHz antenna in package, with the solver ranking for that device.*
