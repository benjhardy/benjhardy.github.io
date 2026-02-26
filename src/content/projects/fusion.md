---
title: 'Remcom Fusion Studio — Bridging Remcom Products'
description: "Desktop application (Dear PyGui) that orchestrates Wireless InSite, WaveFarer, and XFdtd. Two major use cases: antenna rerun workflow and Blender breathing animation workflow."
publishDate: '2026-02-01'
isFeatured: true
seo:
  image:
    src: '/2026/Fusion/antenna-viewer.jpg'
    alt: Fusion antenna viewer
---

**Project Overview:**

**Remcom Fusion Studio (Fusion)** is a desktop application built with Dear PyGui that orchestrates Remcom tools: Wireless InSite, WaveFarer, and XFdtd. It manages node-based projects, tool configs, and a simulation queue for batch runs. Two major use cases are the **antenna rerun workflow** and the **Blender breathing animation workflow**.

![Fusion antenna viewer](/2026/Fusion/antenna-viewer.jpg)
*Fusion interface — antenna and study-area management.*

---

## Antenna Rerun Workflow

The antenna rerun pipeline re-simulates Wireless InSite study areas with different TX/RX antenna patterns **without re-running full ray-tracing**. It reuses existing path data (`.bin.idx`) and re-computes received power/phase for new antenna configurations.

**Workflow:** User configures antenna rerun from the Wireless InSite node (job name, num paths, TX/RX antenna links, frequency/waveform) and submits. Fusion builds a base study area (isotropic antennas, one full ray-trace), then enumerates TX×RX job combinations, generates rerun job XML for each, and runs them via **wibatch**. Supports isotropic, UserDefined (UAN), and MIMO/IndexedMIMO antennas. The same logic is available headless (`antenna_rerun_workflow.py`) for automation/CI.

---

## Blender Breathing Animation Workflow

The breathing workflow turns a Blender human model and breathing parameters into **time-series geometry** (per-frame .object files), places them in a WaveFarer project, and supports **phase post-processing** of simulation results.

**Pipeline steps:**

1. **Breathing waveform generation** — Configurable, deterministic waveforms (breathing rate, I:E ratio, amplitude, optional heart, noise, drift). Multiple waveforms can be generated and previewed in-dialog.
2. **Blender CLI** — A shipped Python script runs inside Blender (headless) to apply movement data to shape keys (chest, shoulders, back, arms, etc.), then exports per-frame geometry and writes Wireless InSite–style .object files and a .setup.
3. **Placement and preview** — User sets translation and rotation; one action creates a preview setup and launches WaveFarer for visual check.
4. **Phase post-processing** — After runs, phase is extracted from .p2m data, unwrapped (reference or NumPy method), and written to CSV with optional in-dialog plotting.
5. **Simulation submission** — Generated setups can be submitted into Fusion’s simulation queue for batch runs.

![Breathing workflow in Fusion](/2026/Fusion/breathing_workflow.jpg)
*Extract Animation dialog — breathing waveform and Blender integration.*

**Technical highlights:** Deterministic waveforms (optional seed); shipped Blender script under `assets/scripts/`; body-group control (Chest, Shoulders, Arms, Back); phase unwrapping (Reference / NumPy).
