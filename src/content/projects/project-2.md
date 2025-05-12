---
title: 'Blender Animation Import Utility'
description: A utility to import Blender animations into Remcom's platform, streamlining the workflow for simulating antennas with moving humans.
publishDate: 'May 04 2025'
isFeatured: true
seo:
  image:
    src: '/project-2.jpg'
    alt: Project preview
---


**Project Overview:**

Incorporating human or object motion in simulation is an important feature that is sometimes ignored in complex electromagnetic simulations.
Simulations across multiple time points will only be more commonplace as compute power and GPU clusters become more advanced.

To address this for the Remcom platform, I designed a utility that interfaces with the Blender backend python module bpy to access a project's animations and import them into Remcom tools.
Users may now use their highly detailed animated models within Remcom's suite of tools in order to capture device performance across many human poses or simulate something like a human or cat breathing.

![Example of man walking with monopole on wrist](/walking-ReturnLoss.gif)
*Figure 1: A walking animation from Blender imported into XFdtd. A watch's return loss is simulated at every pose with the body . As the arm swings back and forth the reflected power at the port changes slightly.*

The python application was compiled with pyinstaller and is called within Remcom's JavaScript based macro language.






![Blender Import Macro](/blenderImport.gif)
*Figure 2: The utility interacts with blender via the python blender module 'bpy'. The application accesses the project and finds objects that have an associated animation. The user specifies the sample rate across the animation time frame and the decimation of the model to simplify the number of facets if the model is highly detailed. The utility then groups the objects into an assembly for use within Remcom's tools.*