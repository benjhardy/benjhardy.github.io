---
title: Bench to bore ramifications of inter-subject head differences on RF shimming and specific absorption rates at 7T
excerpt: A study on the effects of inter-subject head differences on RF shimming and specific absorption rates at 7T.
publishDate: 'October 2022'
isFeatured: true
seo:
  image:
    src: '/blah.jpg'
    alt: nonya
---


![Figure 1: ](/sim_coil.png)
*Figure 1: Simulated coil geometry and head model used in the study. The coil is a 7T 8 channel transmit surface-loop array. The head model is the Duke model with 71 segmented tissues. The model was placed on the shoulders and neck of the Duke model to simulate a realistic head position in the coil.*

**Highlights**
-------------
7T decoupled coil array transmit metrics simulated for 72 head models.

RF coil traces within 2 cm of the subject may exceed tissue heating limits.

Non-linear RF shimming over a population outperforms circularly polarized shims.

Average tissue heating rates differ for each patient depending on the sequence.

**Abstract**
-------------
***Purpose:***
This study shows how inter-subject variation over a dataset of 72 head models results in specific absorption rate (SAR) and B1+ field homogeneity differences using common shim scenarios.
***Methods:***
MR-CT datasets were used to segment 71 head models into 10 tissue compartments. These head models were affixed to the shoulders and neck of the virtual family Duke model and placed within an 8 channel transmit surface-loop array to simulate the electromagnetic fields of a 7T imaging experiment. Radio frequency (RF) shimming using the Gerchberg-Saxton algorithm and Circularly Polarized shim weights over the entire brain and select slices of each model was simulated. Various SAR metrics and B1+ maps were calculated to demonstrate the contribution of head variation to transmit inhomogeneity and SAR variability.
***Results:***
With varying head geometries the loading for each transmit loop changes as evidenced by changes in S-parameters. The varying shim conditions and head geometries are shown to affect excitation uniformity, spatial distributions of local SAR, and SAR averaging over different pulse sequences. The Gerchberg-Saxton RF shimming algorithm outperforms circularly polarized shimming for all head models. Peak local SAR within the coil most often occurs nearest the coil on the periphery of the body. Shim conditions vary the spatial distribution of SAR.
***Conclusion:***
The work gives further support to the need for fast and more subject specific SAR calculations to maintain safety. Local SAR10g is shown to vary spatially given shim conditions, subject geometry and composition, and position within the coil.


link to the [paper](https://doi.org/10.1016/j.mri.2022.07.009)