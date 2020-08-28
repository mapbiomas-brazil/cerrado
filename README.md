<div class="fluid-row" id="header">
    <img src='./misc/arcplan-logo.jpeg' height='70' width='auto' align='right'>
    <h1 class="title toc-ignore">Cerrado</h1>
    <h4 class="author"><em>Developed by  IPAM - felipe.lenti@ipam.org.br</em></h4>
</div>

# About
This folder contains the scripts to classify and post-process the Cerrado Biome.

We recommend that you read the Cerrado Biome Appendix of the Algorithm Theoretical Basis Document (ATBD).

# Pre-processing (Google Earth Engine Code Editor JavaScript)
Step01: build stable pixels from Colleciton 4.1 and save a new asset. 
Step02: calculate area proportion for each class to each region that will be used to generate training samples
Step03: export balanced training samples for each region
Step04: export training samples for each year

# Classification (Google Earth Engine Python API)
Step04a: export classification for each region

# Post-processing (Google Earth Engine Code Editor JavaScript)
Step05: merge classification of each region and apply Gap fill filter to remove NODATA
Step06a: create asset with 10 an 12 changes in classification
Step06b: apply incident filter to remove pixels with 10 an 12 changes from forest class
Step07: apply temporal filter
Step08: apply spatial filter
Step09: apply frequency filter
