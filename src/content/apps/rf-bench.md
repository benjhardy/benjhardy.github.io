---
title: 'RF Bench: Interactive RF Fundamentals'
description: "An interactive bench for RF and microwave fundamentals. Change a part on the left and watch S-parameters, Smith charts and load lines respond on the right. Runs in the browser."
publishDate: '2026-09-30'
isFeatured: true
seo:
  image:
    src: '/2026/rf-bench/rf-bench-mismatch.png'
    alt: RF Bench mismatch tab with a standing wave, Smith chart and return-loss ruler
---

**[Open RF Bench →](/rf-bench/)** It runs entirely in your browser. There's nothing to install.

**Overview**

RF Bench is a set of small interactive benches for the ideas RF engineers use every day. Each tab puts a circuit or a layout on the left and live plots on the right, with the equations filled in with your numbers underneath. Drag a part, move a slider, and see the physics respond.

**What's inside**

- **Mismatch:** Γ, return loss and VSWR from one load, with the standing wave, a draggable Smith chart and a conversion ruler.
- **Resonator & Q:** L and C set f₀; metal loss sets unloaded Q; the coupling gap sets external Q. Includes ring-down.
- **Matching:** a low-impedance die to 50 Ω with L-networks and quarter-wave sections, and why a bigger ratio means less bandwidth.
- **Splitter:** why Wilkinson arms step wider toward the outputs, with lines drawn to scale on GaAs or RO4003C.
- **PA load line:** why a big transistor wants a few ohms, with an interdigitated transistor layout you can grow.
- **Coupled resonators:** mode splitting, the coupling coefficient k, external Q from the tap, and electric vs magnetic coupling.
- **Filter order:** how many poles a bandpass filter needs, and what each extra pole costs in loss.
- **Low-pass filter:** a guided 60-minute lesson, from the prototype ladder to a stepped-impedance layout.
- **Drills:** mixed number drills that come back to the card types you miss.

**How it's meant to be used**

Each tab asks you to predict a number before it shows you the answer, then explains the gap. The drills interleave topics on purpose, so you practise choosing the right formula, not just applying it.

**Tech:** plain HTML, CSS and JavaScript with hand-drawn SVG plots. No framework, no server.

![RF Bench mismatch tab](/2026/rf-bench/rf-bench-mismatch.png)
*Mismatch: pick a load and read Γ, return loss and VSWR off the same point.*

![RF Bench splitter tab](/2026/rf-bench/rf-bench-splitter.png)
*Splitter: a 7-section Chebyshev arm covers 2 to 18 GHz at 20 dB return loss. The narrow lines near the junction are the high-impedance sections.*

![RF Bench coupled resonators tab](/2026/rf-bench/rf-bench-coupled.png)
*Coupled resonators: the gap sets k, the tap sets Qₑ, and the two-pole response goes flat when k·Qₑ = 1.*
