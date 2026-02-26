---
title: 'GPS Satellite Tracker & Simulator for Wireless InSite'
description: Python-based GPS satellite tracking and simulation—TLE/Skyfield positions, plane-wave inputs for Wireless InSite, batch runs, and validation against RINEX for CNR at wearable devices on the ground.
publishDate: '2026-02-01'
isFeatured: true
seo:
  image:
    src: '/2026/gnss/cnr_comparison_publication3.png'
    alt: InSite vs RINEX CNR comparison
---

**Project Overview:**

A **Python-based GPS satellite tracking and simulation system** that bridges real-world GNSS measurements with **Wireless InSite** ray-tracing: it computes satellite positions and plane-wave inputs from TLE data, drives InSite batch runs, and validates simulation results against RINEX observations. Built to support **GNSS ray-tracing research**—e.g. determining **CNR (carrier-to-noise ratio)** of satellites transmitting to **wearable devices on the ground**. Wireless InSite does not model distant GPS satellites, so this codebase provides the orbit, power, and geometry inputs and then validates InSite’s received power (or CNR) against real RINEX observations from a fixed receiver.

---

## What It Does

- **Satellite tracking** — Uses **Skyfield** and TLE (two-line element) ephemeris to compute GPS satellite positions, azimuth, elevation, and visibility for a given receiver location and time window.
- **Power & geometry** — Computes received power density, path loss (free-space + atmospheric), and angles of arrival at a configurable reference altitude (e.g. 100 km) for use as plane-wave inputs.
- **Ray-tracing integration** — Generates CSV inputs and updates Wireless InSite study-area XMLs (plane-wave angles, power, polarization). Runs **wibatch** for batch simulations and parses `.p2m` power outputs.
- **Validation** — Compares InSite received power (or derived CNR) with **RINEX** ground truth; produces overlay plots and summary statistics (mean/max difference, RMSE).

![InSite vs RINEX CNR comparison](/2026/gnss/cnr_comparison_publication3.png)
*Publication-style figure: InSite vs RINEX CNR comparison.*

![Wearable poses and GNSS](/2026/gnss/gnss-poses-wearables.jpg)
*Wearable device poses and satellite geometry.*

![Measurement vs simulation](/2026/gnss/measurement_vs_simulation.png)
*Measurement vs simulation validation.*

![Satellites in InSite](/2026/gnss/satellites-in-insite.gif)
*Satellite plane-wave setup in Wireless InSite.*

---

## Tech Stack

| Area | Choice |
|------|--------|
| **Language** | Python 3.8+ |
| **Orbit / time** | Skyfield (TLE, SGP4, UTC) |
| **Numerics** | NumPy |
| **Plotting** | Matplotlib |
| **Data** | CSV, JSON, RINEX (compressed and raw) |
| **External** | Remcom Wireless InSite (wibatch, XML job files, p2m exports) |

---

## Key Tools (CLI)

- **gnss_simulator** — End-to-end simulation: positions, path loss, SNR over time for a receiver and optional CSV/JSON output.
- **generate_wireless_insite_inputs** — One-time or multi-satellite plane-wave CSV (theta, phi, power density) for InSite.
- **update_wi_study_area_xml_from_csv** — Updates InSite study-area files from CSV; optional wibatch run.
- **build_wireless_insite_results_from_p2m** — Parses wibatch `*.power.*.p2m` files → consolidated received-power CSV.
- **calculate_snr_from_insite** — Converts received power to SNR/CNR for comparison with RINEX.
- **compare_wireless_insite_with_rinex** — InSite vs RINEX comparison; optional publication-style figures.
- **plot_insite_vs_rinex_daily** — Overlay InSite and RINEX CNR (and elevation) for one satellite/day.

---

## Outcomes

- **Reproducible pipeline:** RINEX → ground truth; TLE → plane-wave CSV → InSite XML → wibatch → p2m → CNR comparison and plots.
- **Validation workflow:** Preliminary XML diff (generated vs reference) before long runs; post-run p2m comparison with mean/max difference reporting.
- **Publication-ready figures:** InSite vs RINEX CNR overlays, optional elevation subplot, configurable time windows.
