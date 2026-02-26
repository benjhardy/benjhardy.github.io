---
title: 'Geometry Optimization with Particle Swarm and Custom UIs'
description: Particle-swarm optimization with custom UIs for optimization and parameter creation—tune geometry and design parameters with automated search and visual feedback.
publishDate: '2026-02-01'
isFeatured: true
seo:
  image:
    src: '/2026/geometry-optimization/ParticleSwarmUI.png'
    alt: Particle swarm optimization UI
---

**Project Overview:**

This project implements **particle swarm optimization (PSO)** for geometry and design parameters, with **custom UIs** for defining optimization objectives, parameter bounds, and for visualizing results. Users can drive electromagnetic or other simulations with automated parameter search instead of manual sweeps.

**Features:**

- **Particle swarm optimization** — Multi-parameter search with configurable swarm size, iterations, and objective (e.g. minimize S11, maximize gain).
- **Custom parameter creation** — Define which geometry or simulation parameters are free variables and their bounds.
- **Custom UIs** — Interfaces for setting up runs, monitoring progress, and inspecting outputs (e.g. S11, far field, autoparam).
- **Integration** — Fits into simulation workflows (e.g. Remcom tools) so that each particle evaluation runs a simulation and the optimizer uses the result.

![Particle swarm UI](/2026/geometry-optimization/ParticleSwarmUI.png)
*Custom UI for particle swarm optimization and parameter setup.*

![Architecture overview](/2026/geometry-optimization/architecture.jpg)
*Architecture linking optimizer, parameters, and simulation.*

![S11 result](/2026/geometry-optimization/s11.png)
*Example S11 result from an optimized design.*

![Autoparam](/2026/geometry-optimization/autoparam.png)
*Parameter and autoparam visualization.*
