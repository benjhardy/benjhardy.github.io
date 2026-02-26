# Antenna Rerun Workflow — Remcom Fusion Studio

Short portfolio summary of the **antenna rerun** pipeline in Remcom Fusion Studio (Fusion) for re-simulating Wireless InSite study areas with different TX/RX antenna patterns without re-running full ray-tracing.

---

## Context

- **Remcom Fusion Studio (Fusion)** — Desktop application (Dear PyGui) that orchestrates Remcom tools (Wireless InSite, WaveFarer, XFdtd). It manages node-based projects, tool configs, and a **simulation queue** for batch runs.
- **Antenna rerun** — Reuses existing path data (`.bin.idx`) from a study area and re-computes received power/phase for new antenna configurations. This avoids repeating expensive ray-tracing when only antenna patterns change.

---

## Workflow Overview

1. **Entry** — User configures antenna rerun from the Wireless InSite node (job name, num paths, TX/RX antenna links, frequency/waveform) and submits. Fusion calls `_submit_antenna_rerun_simulation`.
2. **Base study area** — Either use an **existing** study area or **create a new one**: set all antennas to isotropic, run the **base simulation** (full ray-tracing) once, then use that study area as the base for all rerun jobs.
3. **Job combination logic** — Fusion builds TX and RX location sets from the project and `antenna_txrx_links` (which transceivers use which antenna configs). It then enumerates:
   - **RX-only:** one job per RX antenna (or “use existing” per RX location).
   - **TX-only:** one job per TX antenna (or “use existing” per TX location).
   - **TX × RX:** one job per (TX antenna or existing) × (RX antenna or existing), skipping the case where both are “existing.”
4. **Per-job creation** — For each combination, Fusion calls `_create_and_run_rerun_job`. **WirelessInsiteProject**:
   - Ensures antennas exist in the setup (add isotropic, or copy UAN and add UserDefined/MIMO/IndexedMIMO as needed).
   - Generates rerun job XML (IndexFileName → `.bin.idx`, TX/RX antenna lists, optional sweep parameters) via `WirelessInSiteXMLGenerator`.
   - Writes the XML and optionally appends the rerun spec to the setup file.
5. **Execution** — Each job runs via **wibatch** (`wibatch -file <xml> -outdir <dir> -prefix <prefix>`). Jobs can be run immediately or queued through Fusion’s simulation queue manager.

---

## Technical Highlights

- **Rerun XML** — Root `<InSite>` / `<remcom::rxapi::RerunAntennaJob>`, with IndexFileName, NumPaths, TxAntennaList, RxAntennaList, and optional angle-sweep parameters. File naming: `{job_name}.tx{tx_ids}.rx{rx_ids}.rerun.xml`.
- **Antenna handling** — Support for isotropic (“use existing”), UserDefined (UAN pattern file), and MIMO/IndexedMIMO (sub-antennas, index file). UANs are resolved from the Fusion project (e.g. `uans/`) and copied into the InSite project when needed.
- **Headless path** — Same job-creation and wibatch execution logic is used from a headless workflow (`antenna_rerun_workflow.py`) for automation/CI.

---

## Relevant Code

| Layer | Responsibility |
|-------|----------------|
| **remcom_fusion_studio.py** | `_submit_antenna_rerun_simulation`, `_create_and_run_rerun_job` — entry, base study area, TX×RX loops, queue integration. |
| **wireless_insite_project.py** | `create_antenna_rerun_job`, `run_antenna_rerun`, `_create_rerun_xml_content` — antenna setup, XML write, setup update, wibatch invocation. |
| **wireless_insite_xml_generator.py** | `generate_rerun_job_xml()` — XML structure (ElementTree). |
| **antenna_rerun_workflow.py** | Headless entry point that reuses project creation and wibatch. |
| **simulation_queue_manager.py** | Queue mixin used by Fusion for submitting and managing jobs. |

---

*Summary for portfolio use; describes the antenna rerun workflow in Remcom Fusion Studio.*
