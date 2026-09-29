---
title: 'In-Cabin Range-Doppler Simulations for Breathing Detection'
description: Range-Doppler simulations for detecting breathing rate of children in cars; supports neural network work for breathing anomaly detection.
publishDate: '2026-02-01'
isFeatured: true
seo:
  image:
    src: '/2026/breathing_in_cabin/POWERPNT_BKCgcldBox.gif'
    alt: In-cabin range-Doppler breathing simulation
---

**Project Overview:**

This project focuses on **in-cabin range-Doppler simulations** for **detecting breathing rate**—especially for **children in cars**—using radar and electromagnetic simulation. The goal is to enable vital-sign monitoring (breathing) in vehicle cabins for safety and health applications. The work ties into **neural network** methods for **breathing anomaly detection** from synthetic radar returns.

**Approach:**

- **Range-Doppler simulation** — Simulate radar returns from a breathing subject in a cabin environment; range-Doppler processing isolates the breathing signature from clutter.
- **In-cabin geometry** — Cabin and occupant geometry (e.g. child in car seat) are modeled; breathing motion is animated (e.g. via Blender or similar pipelines) and run through the simulation.
- **Detection of breathing rate** — From the simulated (or measured) returns, breathing rate and anomalies can be inferred; this feeds into CNN-based detection (see linked paper below).

![In-cabin range-Doppler simulation](/2026/breathing_in_cabin/POWERPNT_BKCgcldBox.gif)
*Range-Doppler visualization for in-cabin breathing.*

![Paths and geometry](/2026/breathing_in_cabin/paths.png)
*Simulation paths and cabin geometry.*

---

## Related research

For the **neural network** side—synthetic radar return-based detection of breathing anomalies—see:

[**Synthetic Radar Return-Based Neural Network for Detecting Breathing Anomaly**](/2026/Synthetic%20Radar%20Return-Based%20Neural%20Network%20for%20Detecting%20Breathing%20Anomaly%20.pptx.pdf) (PDF).

That work uses synthetic breathing waveforms and radar phase data to train a CNN for detecting abnormal breathing patterns; the in-cabin range-Doppler setup provides a realistic scenario for such signals.
