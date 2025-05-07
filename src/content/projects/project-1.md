---
title: 'Convolutional Neural Network to Predict Breathing Patterns'
description: I created a convolutional neural network to predict breathing patterns from Radar returns off of an animated human chest.
publishDate: 'May 05 2025'
seo:
  image:
    src: '/fig1-large.png'
    alt: Project preview
---

![True versus predictions after training on only 200 breathing waveforms](/fig1-large.png)

Final results of the CNN's predictions with 5 distinct and never before seen phase waveforms representing abnormal breathing types (hyper-ventilation, hypo-ventilation, hyper-apnea, and tachypnea).


The CNN was only trained on 200 sets of breathing and phase waveforms. The total simulation time for these 200 waveforms was about 40 hours. The model would perform much better if we beefed up the dataset which is part of the future direction.

**Project Overview:**

The goal of this project was to train a neural network to predict breathing waveforms from simulated phase returned in a radar system.

Although not novel, detecting breathing patterns with radar is becoming more common for human detection since it is more private than camera based methods.

I fully automated a process that generated anatomically accurate breathing patterns with variable amplitude, breath rate, and inspiration to expiration ratios using python. These waveforms were imported into a Blender project using the Python bpy toolbox to export CAD objects with the associated waveform. In order to call blender 200+ times to generate a library of CAD models, I wrapped the call to blender with a Windows Batch script to loop over multiple directories and outputs.

These objects were then loaded into WaveFarer, a simulation engine, using a JavaScript language and UI interface runs and returns the phase data.

These Phase data for every breathing waveform were input into a CNN to train it.

In order to toy and adjust with the learning rate, batch size, and NN architecture, I ran the CNN inside of a jupyter notebook for fast iteration and adjustments.


![Breathing Human Inside of Blender with Corresponding Waveform](/breathingBlender.gif)



## Tech Stack
- Python
- TensorFlow
- Jupyter Notebook
- Windows Batch
- JavaScript


