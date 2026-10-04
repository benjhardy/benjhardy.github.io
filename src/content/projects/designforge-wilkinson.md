---
title: 'DesignForge: One-Shot 10 GHz Wilkinson Splitter in HFSS'
description: An agent in DesignForge AI designs a 10 GHz Wilkinson power splitter in Ansys HFSS in one shot, tuning for parasitics along the way.
publishDate: '2026-04-29'
isFeatured: true
seo:
  image:
    src: '/2026/designforge/wilkinson-splitter.png'
    alt: 10 GHz Wilkinson splitter designed in HFSS with DesignForge AI
---

**Overview:**

At [DesignForge AI](https://www.designforgeai.com), I build RF knowledge into the platform so the agent has the context it needs to execute one-shot designs directly in Ansys HFSS. A simple example is a Wilkinson power splitter at 10 GHz:

- Trace widths are set for 50 Ω from the dielectric and frequency, using deterministic scripts.
- The agent accounts for the extra capacitance from parasitics at higher frequencies, and sweeps a correction factor to find the best length for the quarter-wave traces.

**Result:** S11 = −16.79 dB, S21 = −3.21 dB and S23 = −25.56 dB.

Built on [PyAEDT](https://aedt.docs.pyansys.com/), the Python scripting library for Ansys HFSS.

<figure>
<video controls playsinline preload="metadata" poster="/2026/designforge/wilkinson-splitter.png" style="width: 100%; border-radius: 8px;">
  <source src="/2026/designforge/wilkinson-splitter.mp4" type="video/mp4">
</video>
<figcaption>The agent sets up the splitter in HFSS, sweeps the quarter-wave length, and reports S-parameters.</figcaption>
</figure>
