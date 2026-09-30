---
title: 'DesignForge: A Klopfenstein Taper from One Prompt'
description: One prompt in DesignForge AI designs, builds and solves a 50→90 Ω Klopfenstein taper in Ansys HFSS, then checks it against the analytical model. The orchestrator ran on Claude Sonnet 5.
publishDate: '2026-09-03'
isFeatured: true
seo:
  image:
    src: '/2026/designforge/taper-slide.png'
    alt: Taper design end to end in DesignForge AI, from one prompt to a verified HFSS result
---

**Overview:**

At [DesignForge AI](https://www.designforgeai.com), one prompt took a 50→90 Ω Klopfenstein taper on 0.254 mm FR4 from specification to a solved, verified Ansys HFSS model. Deterministic apps supply every number, and the orchestrator runs the toolchain. **The orchestrator ran on Claude Sonnet 5.**

**How it works:**

- **Impedance Width Calculator** (deterministic app): target Z₀, εr and height in; trace width out.
- **Taper Transition Calculator** (deterministic app): 50→90 Ω, ripple and length in; the width profile and the analytical S11 and S21 out.
- **Taper Builder** (skill): builds and solves the taper in HFSS from the calculator widths.
- **/plot-s-parameters** (skill): overlays the HFSS sweep on the analytical model.

**Result:** the HFSS S11 and S21 follow the analytical Klopfenstein response from 1 to 60 GHz. It took about 20 minutes end to end, simulation time included.

![Taper design, end to end](/2026/designforge/taper-slide.png)
*From the prompt, through the deterministic calculators and skills, to the solved HFSS model and the comparison plot.*

![HFSS vs analytical S-parameters](/2026/designforge/taper-hfss-vs-analytical.png)
*HFSS (solid) against the analytical model (dashed), S11 and S21 from 1 to 60 GHz.*

![The taper in HFSS](/2026/designforge/taper-hfss.png)
*The complete taper, built and solved in HFSS.*
