# GPS Satellite Tracker & Simulator — Portfolio Summary

A **Python-based GPS satellite tracking and simulation system** that bridges real-world GNSS measurements with **Wireless InSite** ray-tracing: it computes satellite positions and plane-wave inputs from TLE data, drives InSite batch runs, and validates simulation results against RINEX observations.

---

## What It Does

- **Satellite tracking** — Uses **Skyfield** and TLE (two-line element) ephemeris to compute GPS satellite positions, azimuth, elevation, and visibility for a given receiver location and time window.
- **Power & geometry** — Computes received power density, path loss (free-space + atmospheric), and angles of arrival at a configurable reference altitude (e.g. 100 km) for use as plane-wave inputs.
- **Ray-tracing integration** — Generates CSV inputs and updates Wireless InSite study-area XMLs (plane-wave angles, power, polarization). Runs **wibatch** for batch simulations and parses `.p2m` power outputs.
- **Validation** — Compares InSite received power (or derived CNR) with **RINEX** ground truth; produces overlay plots and summary statistics (mean/max difference, RMSE).

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

| Tool | Role |
|------|------|
| **gnss_simulator** | End-to-end simulation: positions, path loss, SNR over time for a receiver and optional CSV/JSON output. |
| **generate_wireless_insite_inputs** | One-time or multi-satellite plane-wave CSV (theta, phi, power density) for InSite. |
| **generate_hourly_satellite_csv** | Hourly (or sub-hourly) plane-wave CSV for a single satellite over a day. |
| **update_wi_study_area_xml_from_csv** | Updates InSite “pseudo-XML” study-area files from CSV (plane-wave blocks); optional wibatch run. |
| **run_wi_g15_6to12_validation** | Automated G15 06:00–11:45 run: derive CSV → update 3 antenna XMLs → compare XMLs to reference → run wibatch → validate p2m vs reference. |
| **build_wireless_insite_results_from_p2m** | Parses wibatch `*.power.*.p2m` files → consolidated received-power CSV. |
| **calculate_snr_from_insite** | Converts received power to SNR/CNR for comparison with RINEX. |
| **extract_rinex_data** / **rinex_to_ground_truth** | Parse RINEX observations; export ground-truth JSON (positions, CNR). |
| **compare_wireless_insite_with_rinex** | InSite vs RINEX comparison; optional publication-style figures. |
| **plot_satellite_daily** | Daily RINEX CNR + azimuth/elevation (and optional TLE trajectory). |
| **plot_insite_vs_rinex_daily** | Overlay InSite and RINEX CNR (and elevation) for one satellite/day; supports multiple InSite runs and time windows (e.g. 15-min slots, custom Tx mapping). |
| **validate_satellite_positions** | Check computed satellite positions against TLE/reference. |

---

## Core Library (`src/core`)

- **satellite_position.py** — `GPSSatellitePosition`: TLE load/cache, visibility, trajectory (az/el over time), NORAD↔PRN mapping.
- **path_loss.py** — Path loss to reference altitude (free-space + atmospheric).
- **noise.py** — Noise floor and SNR/CNR from power.
- **angles.py** — Azimuth/elevation at reference altitude.
- **utils.py** — Coordinate conversions (e.g. ECEF ↔ lat/lon/alt).
- **config.py** — Defaults (elevation mask, L1 power, reference altitude).

---

## Outcomes

- **Reproducible pipeline**: RINEX → ground truth; TLE → plane-wave CSV → InSite XML → wibatch → p2m → CNR comparison and plots.
- **Validation workflow**: Preliminary XML diff (generated vs reference) before long runs; post-run p2m comparison (per-antenna, per time-slot) with mean/max difference reporting.
- **Publication-ready figures**: InSite vs RINEX CNR overlays, optional elevation subplot, configurable time windows and antenna/study-area comparison.

---

## Project Context

Built to support **GNSS ray-tracing research**: Wireless InSite does not model distant GPS satellites, so this codebase provides the orbit, power, and geometry inputs and then validates InSite’s received power (or CNR) against real RINEX observations from a fixed receiver.
