# Breathing Animation Workflow — Remcom Fusion Studio

Short summary of the **breathing animation pipeline** implemented in Remcom Fusion Studio (Fusion) for generating and simulating human breathing in WaveFarer/InSite projects.

---

## Overview

The workflow turns a Blender human model and breathing parameters into **time-series geometry** (per-frame .object files), places them in a WaveFarer project, and supports **phase post-processing** of simulation results. It is driven from a single **Extract Animation** dialog with tabbed controls.

---

## Pipeline Steps

1. **Breathing waveform generation** — Configurable, deterministic waveforms (breathing rate, I:E ratio, amplitude, optional heart, noise, drift). Multiple waveforms can be generated and previewed in-dialog.
2. **Blender CLI** — A shipped Python script runs inside Blender (headless) to apply movement data to shape keys (chest, shoulders, back, arms, etc.), then exports per-frame geometry and writes Wireless InSite–style .object files and a .setup.
3. **Scratch and setup output** — Artifacts are written under the WaveFarer project’s `.scratch` tree; generated .setup files are discovered and listed for placement and submission.
4. **Placement and preview** — User sets translation (X, Y, Z) and rotation (Roll, Pitch, Yaw). A single action creates a preview setup and launches WaveFarer for visual check.
5. **Phase post-processing** — After runs, phase is extracted from .p2m data, unwrapped (reference or NumPy method), and written to CSV with optional in-dialog plotting (phase and power vs frame).
6. **Simulation submission** — Generated setups can be submitted into Fusion’s simulation queue for batch runs.

---

## Technical Highlights

- **Deterministic waveforms** — Optional seed for reproducible breathing curves; inspiratory/expiratory model with configurable I:E ratio and amplitude.
- **Shipped Blender script** — The breathing script lives under `assets/scripts/` and is resolved at runtime (no user path); Blender executable is user-configurable with a path check (green indicator when found) and browse.
- **Body-group control** — Blender Settings tab toggles and amplitude scaling for Chest, Shoulders, Arms, and Back.
- **Phase unwrapping** — Reference (custom) and NumPy unwrap; results plotted in the Post-processing tab after “Run Phase Post-Process.”

---

## UI (Extract Animation Dialog)

| Tab | Purpose |
|-----|--------|
| **Breathing** | Waveform parameters (4-column table: Waveform, Breathing, Noise/drift, Heartbeat), seed, Generate Preview, and waveform plot. |
| **Blender Settings** | Blender executable (with status icon and browse), body toggles/amplitudes, “Build Animation Artifacts.” |
| **Simulation Submission** | WaveFarer target, generated setup combo, placement table (translation / rotation), “Create Preview & Launch WF,” submit count and “Submit Simulations.” |
| **Post-processing** | Unwrap method (Reference / Numpy), “Run Phase Post-Process,” and phase/power vs frame plot. |

---

## Relevant Code / Assets

- **Fusion UI and orchestration:** `src/remcom_fusion_studio.py` (Extract Animation dialog, callbacks, queue integration).
- **Waveform generation and Blender CLI orchestration:** `src/fusion_blender_animation.py` (config, `generate_breathing_waveforms`, `build_blender_cli_command`, `create_preview_from_setup`, setup discovery).
- **Phase post-processing:** `src/wf_phase_postprocess.py` (parse .p2m, collect phase series, reference/NumPy unwrap).
- **Shipped script:** `assets/scripts/breathing_blender_script.py` (Blender shape-key animation and .object/.setup export).

---

*Summary for portfolio use; describes the breathing workflow as implemented in Remcom Fusion Studio.*
