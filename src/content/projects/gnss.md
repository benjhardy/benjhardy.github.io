---
title: 'GPS Satellite Tracker & Simulator for Wireless InSite'
description: Python tool that predicts GPS signal strength at wearable devices over time by feeding real satellite positions into Wireless InSite ray tracing.
publishDate: '2026-02-01'
isFeatured: true
seo:
  image:
    src: '/2026/cards/gnss.svg'
    alt: GPS satellite tracker and simulator
---

**Project Overview:**

A Python tool I built at [Remcom](https://www.remcom.com) that links real GPS satellite positions to Wireless InSite ray-tracing simulations. It predicts the carrier-to-noise ratio (CNR) over time for a device at any latitude and longitude, including wearables on a person, and the results were checked against measurements from real receivers.

**What it does:**

- Works out where each GPS satellite is in the sky over a chosen time window, from public orbital data.
- Sets up and runs the matching Wireless InSite simulations in batches.
- Compares simulated CNR with measured receiver data and produces comparison plots.

**Tech:** Python, NumPy, Matplotlib, Skyfield and Wireless InSite.
