## 01_generate_AOI.js
Compute an area of interest (AOI) based on height to the nearest drainage (HAND).
```javascript
var aoi = ee.Image('projects/mapbiomas-workspace/AUXILIAR/CERRADO/c6-wetlands/input_masks/aoi_wetlands_c6');
Map.addLayer(aoi, {palette: ['white', 'blue', 'green'], min:0, max:2}, 'aoi');
```
[Link to script](https://code.earthengine.google.com/a5e1780d5f431ec8cb09a4b8bb8a4a96)

## 02_generate_waterFreq.js
Compute monthly water frequency (from 1985 to 2019).
```javascript
// plot water frequency from GT Água
var wFreq= ee.Image('projects/mapbiomas-workspace/AUXILIAR/CERRADO/c6-wetlands/input_masks/waterFreq_CERRADO_1985_2019');
Map.addLayer(wFreq, {palette: ['blue', 'green', 'yellow', 'orange', 'red'], min:1, max:300}, 'water freq.');
```
[Link to script](https://code.earthengine.google.com/3521035a5b4f4e7f1b7b4c54e89bd5bc)

## 03_generate_stablePixels.js
Compute stable pixels over all the time-series (1985-2019) from collection 5 and filter them using reference data.
```javascript
// plot stable pixels
var stable = ee.Image('projects/mapbiomas-workspace/AUXILIAR/CERRADO/c6-wetlands/input_masks/stablePixels_C5');

var palettes = require('users/mapbiomas/modules:Palettes.js');
var vis = {
    'min': 0,
    'max': 45,
    'palette': palettes.get('classification5')
    };
        
Map.addLayer(stable, vis, 'stable pixels');
```
[Link to script](https://code.earthengine.google.com/4f4f5fb572256caddeae76194a3de6bc)

## 04_generate_trainingMask.js
Perform a selection of pixels with a high probability to be wetlands in Cerrado and blend with stable samples from collection 5. For this, we applied the following spatio-temporal filters:
1. Monthly frequency of water among 3 and 100 from 1985 to 2019.
2. HAND equal or less than 15 meters.
3. SLOPE equal or less than 10.
4. Potential wetlands needs to be classified as grassland or savanna into collection 5.
5. Filter potential wetlands by using reference data.
```javascript
// plot trainingMask
var trainingMask = ee.Image('projects/mapbiomas-workspace/AUXILIAR/CERRADO/c6-wetlands/input_masks/trainingMask_wetlands_c6');

var palettes = require('users/mapbiomas/modules:Palettes.js');
var vis = {
    'min': 0,
    'max': 49,
    'palette': palettes.get('classification6')
    };
    
Map.addLayer(trainingMask, vis, 'trainingMask');
```
[Link to script](https://code.earthengine.google.com/f290a31a660ace81ed656994dbee7757)

## 05_computeArea_byRegion.js
Compute area *(squared-kilometer)* for each class in each classification region. These calculations are used as input in next steps to balance training samples.

## 06_samplePoints.js
Sort 5,000 sample points over stable pixels distributed proportionally to each class area for each region (x38). From this, reserve 10% for potential wetlands and 10% for unstable class.
```javascript
// plot sample points
var samplePoints = ee.FeatureCollection('projects/mapbiomas-workspace/AMOSTRAS/Cerrado/col6/wetlands/samples_v1/samples_wetland_col6_v1');
Map.addLayer(samplePoints, {}, 'samplePoints');
```
[Link to script](https://code.earthengine.google.com/3581103c13bfee14310b66930e23e32a)

## 07_trainingSamples.py
Extract spectral signatures for each year from Landsat mosaics and build training dataset.
```javascript
// plot a sample of training dataset (one region and one year)
var trainingPoints = ee.FeatureCollection('projects/mapbiomas-workspace/AMOSTRAS/Cerrado/col6/wetlands/training_v53_c2/train_col_6_CERRADO_wetland_reg16_ano_2020');
Map.addLayer(trainingPoints, {}, 'trainingSamples');
```
[Link to script](https://code.earthengine.google.com/9eccb00382e0a0a4d91763ae1fe876ca)

## 08_RFclasification.py 
Perform the classification of the Cerrado Landsat SR mosaics by using the `ee.Classifier.smileRandomForest()` added with auxiliary mosaics and training samples.

## 09_postGapfill.js
No-data values (gaps) produced by cloud covered (or cloud shadow) pixels in a given image, were filled by the temporally nearest future valid classification. If no future valid classification was available, then the no-data value was replaced by its previous valid classification. Therefore, gaps should only remain in the final classified map when a given pixel was consistently classified as no-data throughout the entire temporal series.

## 10a_postCalc_Incidence.js
Compute an image in which each pixel-value represents the number of times that a given pixel as changed among different classes.

## 10b_postApply_Incidence.js
An incident filter was applied to remove pixels that changed too many times over the 36 years. All pixels that changed more than eight times, and were connected to less than 6 same-class pixels that also changed more than eight times, were replaced by the MODE value. This avoids spurious transitions at the border of the same-class pixel group.

Savanna Formation and Grassland pixels that changed more than ten times, and were connected to less than 66 pixels that also changed more than ten times, were classified as Other Non-Vegetated Areas (Class 25). Natural classes tend to be stable, and these areas that change too often are likely not native vegetation.

As a final rule, all forest pixels that changed more than eight times, and were connected to more than 66 pixels that also changed more than eight times, were also classified as Other Non-Vegetated Areas (Class 25). This rule aims to filter out areas of commercial tree plantations mapped as Forest Formation; as the growth period for Eucalyptus sp. and Pinus sp. commercial forest stands is approximately seven to eight years.

## 11_postTemporal.js
The temporal filter uses the subsequent years to replace pixels that have invalid transitions in a given year. It follows sequential steps:

1. As a first step, the filter searches for any native vegetation class (Forest, Savanna, Wetland and Grassland) that was not classified as such in 1985, and was correctly classified in 1986 and 1987, and then corrects the 1985 value.

2. In the second step, the filter searches for pixel values that were not Pasture, Agriculture, or Other Non Vegetated Areas (classes representing anthropogenic use) in 2020, but were classified as such in 2018 and 2019. The value in 2020 is then corrected to match the previous years to avoid any regeneration detection in the last year (which can not be corroborated).

3. In the third step, the filter evaluates all pixels in a 3-year moving window to correct any value that changes in the second year (midpoint of the window) but returns to the same class in the third year. This process is applied observing prevalence rules, in this order: Pasture (15), Agriculture (19), Other non Vegetated Areas (25), River, Lake and Ocean (33), Savanna (4), Grassland (12), Wetland (11) and Forest (3).

4. The last step is similar to the third process, but consists of a 4- and 5-year moving window that corrects all middle years running in the same order of class prevalence.

## 12_postSpatial.js
The spatial filter avoids misclassifications at the edge of pixel groups, and was built based on the connectedPixelCount function. Native to the GEE platform, this function locates connected components (neighbours) that share the same pixel value. Thus, only pixels that do not share connections to a predefined number of identical neighbours are considered isolated. At least six connected pixels are required to reach the minimum connection value. Consequently, the minimum mapping unit is directly affected by the spatial filter applied, and it was defined as six pixels (~0,5 ha).

## 13_postFreq.js
The frequency filter was applied only on pixels that were classified as native vegetation (no conversion transitions) throughout the time series. If such a pixel was classified as the same class over more than 50% of the period for wetland, that class was assigned to that pixel over the whole period. The results of this frequency filter was a more stable classification of native vegetation classes. Another important result was the removal of noise in the first and last year of the classification, which can not be adequately assessed by the temporal filter.

## 14_generate_trainingMask_ciclo2.js
Compute wetlands stable pixels over all the time-series (1985-2020) from generated product and create a new training mask for the second phase of the classifier.
```javascript
// plot trainingMask
var trainingMask = ee.Image('projects/mapbiomas-workspace/AUXILIAR/CERRADO/c6-wetlands/input_masks/trainingMask_wetlands_c6_ciclo2_v53');

var palettes = require('users/mapbiomas/modules:Palettes.js');
var vis = {
    'min': 0,
    'max': 49,
    'palette': palettes.get('classification6')
    };
    
Map.addLayer(trainingMask, vis, 'trainingMask');
```
[Link to script](https://code.earthengine.google.com/71173d56749eb16492401906be2907c3)

## Next steps
From step *15_computeArea_byRegion_ciclo2.js* to step *24_postFreq.js*, we repeat the same processes that have previously explained- however, using the training mask from phase 2. 

## Classification schema:
![alt text](https://github.com/musx/mapbiomas-cerrado-col6/blob/main/3-wetlands/www/wetlands%20-%20c6%20-%20color.png?raw=true)
