---
title: 'Parallax: telling an AI agent where its drawing is wrong'
description: A five-phase image pipeline that helps an AI agent reconstruct engineering diagrams such as PCB traces and RF filter layouts. On 13 diagrams it beat single-shot multimodal reconstruction every time, with mean geometry IoU 0.95 against 0.59.
publishDate: '2026-07-07'
isFeatured: true
seo:
  image:
    src: '/2026/parallax/bench-chart.png'
    alt: Geometry IoU of agentic Parallax against single-shot multimodal reconstruction on 13 diagrams
---

<figure>
<img class="wide" src="/2026/parallax/bench-chart.png" alt="Geometry IoU of agentic Parallax against single-shot multimodal reconstruction on 13 diagrams">
<figcaption>Same model, 13 diagrams, scored by geometry IoU against the original (annotation pixels excluded). Parallax won all 13: mean 0.95 against 0.59.</figcaption>
</figure>

## The problem

Published engineering figures, such as PCB traces and RF filter layouts, are covered in dimension arrows and labels. Ask a multimodal model to redraw the traces and it gets the rough shape but invents the proportions. To rebuild a design from a figure, an agent needs to know where its drawing is wrong, by how much, and which part to fix.

## The pipeline

Parallax runs five phases on every attempt:

1. **Ingest** the reference: colour profile, scale and render parameters. It detects six trace and background styles on its own, from grey on white to copper traces and dark traces on a grey substrate.
2. **Decompose** it into a binary trace mask and its connected components.
3. **Compare** the agent's render with the original: IoU, a pixel diff, and error regions tagged with the component that needs fixing.
4. **Crop** the worst error regions side by side.
5. **Report** a compact `agent_context` block that the agent pastes into its next correction.

The agent iterates: read the report, fix its drawing script, re-render, and run Parallax again until the IoU converges.

## Measuring the right thing

On a Ku-band filter, raw IoU stalled near 0.90 and looked like a ceiling. It wasn't the geometry; it was the annotations. Dimension lines cross the traces in the reference figure, so even a perfect reconstruction can't match those pixels. Masking annotation pixels out of the score, and later detecting the grey leader lines too, moved the same fifth iteration from **0.904 raw to 0.992 geometry IoU**.

<figure>
<img class="full" src="/2026/parallax/ku-band-iterations.png" alt="The agent's Ku-band filter reconstruction over five iterations">
<figcaption>The agent's Ku-band filter reconstruction converging: iteration 1, 3 and 5 against the reference figure.</figcaption>
</figure>

## Results

- **Agentic vs single-shot:** with the same model on 13 diagrams, Parallax won every one, with mean geometry IoU 0.95 against 0.59. The biggest gains came where the model misread the figure entirely: a crossover went from 0.10 to 0.94, and a hollow-outline schematic from 0.11 to 0.87.
- **From iterating to extracting:** a later version extracts the geometry from the pixels itself and nudges every edge to maximise the masked IoU. On the Ku-band filter that first draft scored 0.997 with no model iterations at all, beating the 0.992 that five iterations had reached. The model's job changed from guessing geometry to reviewing a machine-extracted draft, which is easier to check.

<figure>
<img class="full" src="/2026/parallax/compare-test2.png" alt="Ku-band filter: original, multimodal only, Parallax">
<figcaption>Ku-band filter: multimodal only 0.41, Parallax 0.96.</figcaption>
</figure>

<figure>
<img class="full" src="/2026/parallax/compare-test14.png" alt="Crossover: original, multimodal only, Parallax">
<figcaption>Crossover: multimodal only 0.10, Parallax 0.94.</figcaption>
</figure>

<figure>
<img class="full" src="/2026/parallax/compare-test5.png" alt="Coupled-line resonator: original, multimodal only, Parallax">
<figcaption>Coupled-line resonator: multimodal only 0.75, Parallax 1.00.</figcaption>
</figure>

<figure>
<img class="full" src="/2026/parallax/compare-test10.png" alt="Two-layer filter: original, multimodal only, Parallax">
<figcaption>Two-layer layout, top and bottom views: multimodal only 0.88, Parallax 0.95.</figcaption>
</figure>
