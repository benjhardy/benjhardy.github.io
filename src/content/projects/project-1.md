---
title: 'Convolutional Neural Network to Predict Breathing Patterns'
description: I created a convolutional neural network to predict breathing patterns from Radar returns off of an animated human chest.
publishDate: 'May 05 2025'
isFeatured: true
seo:
  image:
    src: '/fig1-large.png'
    alt: Project preview
---


**Project Overview:**

The goal of this project was to train a convolutional neural network (CNN) to predict breathing waveforms from simulated phase from radar reflected off of a breathing human's chest.

![True versus predictions after training on only 200 breathing waveforms](/fig1-large.png)
*Figure 1: Comparison of true breathing waveforms versus model predictions after training on a limited dataset of 200 samples. 5 validation phase waveforms representing abnormal breathing types (hyper-ventilation, hypo-ventilation, hyper-apnea, and tachypnea) were input into the network. For future training, more waveforms with increased IE ratio and amplitude will be used in order to improve the hyper-ventilation cases.*

**Background and Implementation:**

Detecting vital signatures with radar is becoming more common for human detection because it is more private than camera-based systems and sensitive to chest movements due to the heart beat.

I fully automated a process that generated anatomically accurate breathing patterns with variable amplitude, breath rate, and inspiration to expiration (IE) ratios using python. 
These waveforms were imported into a Blender project using the Python bpy toolbox to animate CAD objects with the breathing waveform.

To call blender 200+ times to generate a library of CAD models, I wrapped the call to blender with a Windows Batch script to loop over multiple directories and outputs.
These objects were then loaded automatically into Remcom's ray tracer using a JavaScript workflow.

The phase data with the corresponding breathing waveform were input into a CNN  to train it. The result was a large synthetic dataset.

To adjust the learning rate, batch size, and NN architecture, I ran the CNN inside of a jupyter notebook for fast iteration and adjustments.


![Breathing Human Inside of Blender with Corresponding Waveform](/breathingBlender.gif)
*Figure 2: Example breathing animation inside of Blender. The chest displacement follows a known mathematical model for breathing. Heart rate was also super-imposed as a simple sinusoidal waveform.*


If you want to read more about this project, you can find the two page abstract here:
[Download Research Paper (PDF)](/Synthetic_Radar_Return_based_Neural_Network_for_Detecting_Breathing_Anomaly_FinalVersion.pdf)