---
title: 'MMIC LPF Builder: from a filter spec to an HFSS-verified lumped MMIC layout'
description: A local web tool that turns a filter spec into a lumped filter laid out on a GaAs MMIC process and verified in full-wave EM. Low-pass and high-pass run end to end; band-pass runs at circuit level.
publishDate: '2026-09-28'
isFeatured: true
seo:
  image:
    src: '/2026/mmic-lpf/lpf-10ghz-verified.png'
    alt: 10 GHz elliptic low-pass filter verified in HFSS against its mask
---

A local web tool that turns a filter spec into a lumped filter laid out on a GaAs MMIC process and verified in full-wave EM. Low-pass and high-pass run end to end; band-pass runs at circuit level.

## The flow

1. **Spec**: band edges, return loss, insertion loss, rejection.
2. **Synthesis**: a synthesis and tuning tool gives the ladder (elliptic with shunt traps, or Chebyshev).
3. **Cells**: each L and C becomes a reusable parametric 3D component (square spiral or MIM capacitor), sized
from HFSS characterizations.
4. **Build**: a pyaedt script builds the filter in classic HFSS with a tuning port in every cell. A rule-based
trap check resizes any trap whose notch lands more than 4 % off.
5. **Port tuning**: the same HFSS N-port is tuned in two engines, the synthesis and tuning tool and AEDT Circuit.
6. **Verification**: tuned values resize the cells and HFSS solves the real filter, looping until it meets the mask.

## Results

* 10 GHz elliptic low-pass (N = 5): meets its own mask in HFSS at the first tuning pass in three runs, with
0.85 to 0.86 dB loss, 18.0 to 18.3 dB return loss and 30.3 to 30.6 dB rejection.
* Also verified: 6 GHz (pass 1), 8 GHz (pass 4), 12 GHz (pass 3), and a 10 GHz elliptic high-pass (pass 5: 16.07 dB
return loss, 31.8 dB rejection, 0.70 dB loss). At 15 GHz the lumped traps run out, and the tool reports the miss.
* Synthesis matches textbook values: 64 of 64 elements within 1 %.
* Spec to verified filter in about 8 to 10 minutes, unattended.

![10 GHz elliptic low-pass verified in HFSS](/2026/mmic-lpf/lpf-10ghz-verified.png)
*10 GHz elliptic low-pass (N = 5), verified in HFSS at the first tuning pass.*

![10 GHz elliptic high-pass verified in HFSS](/2026/mmic-lpf/hpf-10ghz-verified.png)
*10 GHz elliptic high-pass (N = 5), verified in HFSS at loop pass 5.*

<!-- VIDEO SLOT: the demo video goes here.
<video controls playsinline preload="metadata" poster="/2026/mmic-lpf/demo.png" style="width: 100%; border-radius: 8px;">
  <source src="/2026/mmic-lpf/demo.mp4" type="video/mp4">
</video>
*Caption for the demo.*
-->

## Root cause: why one notch always landed high

The upper trap's notch verified 5 to 8 % above the tuner's prediction in every low-pass run; the lower one agreed
to 0.1 %. Two controlled HFSS experiments took it apart. Shrinking the tuning gap from 6 to 1 um changed nothing.
Metal in place of shorted gap ports explained about 1.5 %. The rest, about 5.7 %, came from the resize: the tuner
adds series inductance as ideal parts, but built, those spirals roughly double in size beside the trap and pull
its notch up. The loop now corrects such a trap on its next pass, and keeps notches the tuner moved on purpose.

## Authorship

Ben specified, directed, reviewed and ran it. The build is deterministic scripting:
the same spec gives the same model every run, with no AI in the loop at run time.
