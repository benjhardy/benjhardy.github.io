---
title: 'HFSS knowledge graph'
description: An OWL ontology and SHACL-checked RDF graph of the PyAEDT knowledge layer an HFSS agent uses, with SPARQL competency questions. 52,732 triples, rebuilt in three seconds.
publishDate: '2026-09-30'
isFeatured: true
seo:
  image:
    src: '/2026/hfss-kg/hfss-kg-full-graph.png'
    alt: Obsidian graph view of the HFSS knowledge graph
---

![Full graph](/2026/hfss-kg/hfss-kg-full-graph.png)

## The problem

An agent that drives Ansys HFSS through PyAEDT has to find the right call before it can make it.
The knowledge layer I wrote for one has three parts: a markdown mirror of the PyAEDT 0.18.1 API
(4,151 documented methods and properties), 108 worked examples in 14 categories, and 48 agent
skills. Index and map files route the agent from a topic to an example, or from a feature area to
a class map to a method page. That routing was a graph already, but nothing could check it or ask
it questions.

## The ontology

I modelled it in OWL: 18 classes (API module, class, method, property; navigation index;
practical example and category; skill and skill reference; HFSS concept), 10 object properties
such as `memberOf`, `indexes`, `inCategory`, `usesApi` and `returnsType`, and a 30-concept SKOS
scheme for physics and workflow ideas like radiation boundaries, wave ports and frequency sweeps.
A Python builder (rdflib) walks the source read-only. It turns links and index tables into
navigation edges, and parses every example's Python with `ast` to find the PyAEDT members it
really calls. The result is 52,732 triples: about 5,500 nodes and 18,855 edges, rebuilt in three
seconds.

![HFSS knowledge graph schema](/2026/hfss-kg/hfss-kg-schema.png)
*The schema: OWL classes and the properties between them, with node and edge counts.*

## SHACL checks

Seventeen SHACL shapes split problems three ways: modelling bugs (violations), defects in the
source content (warnings), and coverage signals (info). The final graph has no violations. Along
the way the shapes caught two bugs in my own builder, and I fixed both in the builder rather than
loosening the shapes. The 48 warnings are real content findings: 2,813 broken links in ten
per-application API maps, 25 indexes that lead nowhere, and one example that calls a method
PyAEDT 0.18.1 doesn't have.

## Competency questions

Twelve SPARQL queries define what the graph has to answer. A few of them:

- Which examples demonstrate assigning a radiation boundary? 14 examples and one skill reference.
- Which HFSS methods does no example use? 315 of 399, so the examples cover 21%.
- Which index reaches `create_open_region` fastest? The class map, in one hop; from the root
  index it takes six.
- Which categories overlap most? The canonical drivers and geometry share 25 API members.
- Which skill pages are verbatim copies of an example page? 3, recorded with `prov:wasDerivedFrom`
  so they don't drift.

![Neighbourhood of the boundary_conditions category](/2026/hfss-kg/hfss-kg-boundary-conditions.png)
*Two hops around the boundary_conditions category: its examples, the PyAEDT calls they make, the concepts they apply, and the skill pages copied from them.*
