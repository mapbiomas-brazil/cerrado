Cerrado
Developed by IPAM - felipe.lenti@ipam.org.br
About
This folder contains the scripts to classify and post-process the Cerrado Biome.

We recommend that you read the Cerrado Appendix of the Algorithm Theoretical Basis Document (ATBD).

Pre-processing (JavasScript - Google Earth Engine Code Editor)
Step01: build stable pixels from Colleciton 4.1 and save a new asset. Step02: calculate area proportion for each class to each region that will be used to generate training samples Step03: export the geometryes for balanced samples for each region Step04: export training samples for each year

Classification (Python)
Step04a: export classification for each region

Post-processing (JavasScript - Google Earth Engine Code Editor)
Step05: merge classification of each region and apply Gap fill filter to remove NODATA Step06a: create asset with 10 an 12 changes in classification Step06b: apply incident filter to remove pixels with 10 an 12 changes from forest class Step07: apply temporal filter Step08: apply spatial filter Step09: apply frequency filter
