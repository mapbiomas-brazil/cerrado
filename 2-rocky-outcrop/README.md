## 01_trainingMask.js
Build the training mask based on stable pixels from MapBiomas Collection 8 (1985 to 2022), aggregating in classes: native vegetation (1), non‑vegetation (2) and rocky outcrop (29)
```javascript
// read training mask
var trainingMask = ee.Image('projects/barbaracosta-ipam/assets/collection-9_rocky-outcrop/masks/cerrado_rockyTrainingMask_1985_2022_v3');
var vis = {
    'min': 0,
    'max': 62,
    'palette': require('users/mapbiomas/modules:Palettes.js').get('classification8')
    };

// plot 
Map.addLayer(trainingMask, vis, 'trainingMask'); 
```
[Link to script](https://code.earthengine.google.com/fd4301fbd5d9f35157e0267e3958d972)

## 02_computeProportion.js
Calculates the area of native vegetation (1), non‑vegetation (2) and rocky outcrop (29). The main objective is to estimate the number of training samples required for each class, ensuring that the distribution of samples adequately reflects the diversity of the regions.

## 03_samplePoints.js
Uses the stable pixels to categorize 13,000 training samples. These are then combined with samples collected by a specialist for the rock outcrop class. 
```javascript
// read training samples
var samplePoints = ee.FeatureCollection('projects/barbaracosta-ipam/assets/collection-9_rocky-outcrop/sample/points/samplePoints_v3');

// plot
Map.addLayer(samplePoints, {}, 'samplePoints');
```
[Link to script](https://code.earthengine.google.com/ad213218885b37629f70a750fbe49b02)

## 04_getSignatures.R
Use the sample points generated in the previous step to extract the spectral signatures from the Landsat image mosaic for each year.
```javascript
// inspect a sample of the training dataset 
var trainingPoints = ee.FeatureCollection('projects/barbaracosta-ipam/assets/collection-9_rocky-outcrop/training/v3/train_col9_rocky_1985_v3');

// plot
Map.addLayer(trainingPoints, {}, 'trainingSamples');
```
[Link to script](https://code.earthengine.google.com/5ec379f450999658c1e55fe75334f57d)

## 05_rfClassification.R
Perfoms the model using the Random Forest classifier (ee.Classifier.smileRandomForest()) and subsequently classifies the annual Landsat mosaics

## 06_gapFill.js
No-data values (gaps) due to cloud and/or cloud shadow contaminated pixels in a given image were filled by the temporally nearest future valid classification. If no future valid classification was available, then the no-data value was replaced by its previous valid classification. Therefore, gaps should only remain in the final classified map when a given pixel was consistently classified as no-data throughout the entire temporal series. 

## 07_frequency.js
The frequency filter was applied exclusively to pixels classified as rocky outcrop for a minimum of 50% of the time series. This frequency filter resulted in a more stable classification of rocky outcrop class.

## 08_spatial.js
The spatial filter avoids misclassifications at the edge of pixel groups and was built based on the "connectedPixelCount" function. Native to the GEE platform, this function locates connected components (neighbors) that share the same pixel value. Thus, only pixels that do not share connections to a predefined number of identical neighbors are considered isolated. At least six connected pixels are required to reach the minimum connection value. Consequently, the minimum mapping unit is directly affected by the spatial filter applied, and it was defined as six pixels (0.54 hectares).

## Classification and methodology
For detailed information about the classification and methodology, please read the Cerrado biome Appendix of the [Algorithm Theoretical Basis Document (ATBD).](https://mapbiomas.org/download-dos-atbds)

