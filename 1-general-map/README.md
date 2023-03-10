## 01_trainingMask.js
Build the training mask based on stable pixels (from 1985 to 2020), reference maps, and GEDI-based filtering 
```javascript
// read training mask
var trainingMask = ee.Image('users/dh-conciani/collection7/masks/cerrado_stablePixels_1985_2020_v3');
var vis = {
    'min': 0,
    'max': 49,
    'palette': require('users/mapbiomas/modules:Palettes.js').get('classification6')
    };
// plot 
Map.addLayer(trainingMask, vis, 'trainingMask'); 
```
[Link to script](https://code.earthengine.google.com/2fe1a3f5958c0f22901e5541a1fd6429)

## 02_computeProportion.js
Calculates the area of each class in each classification region. These calculations will estimate the number of training samples in each class. 

## 03_samplePoints.js
Uses the stable pixels to sort 7,000 training samples for each classification region (38). 
```javascript
// read training samples
var samplePoints = ee.FeatureCollection('users/dh-conciani/collection7/sample/points/samplePoints_v7');
// plot
Map.addLayer(samplePoints, {}, 'samplePoints');
```
[Link to script](https://code.earthengine.google.com/4c949df27bf33031a0e5af7f85e1224d)

## 04_getSignatures.R
Use the points generated in the previous step to extract the spectral signatures from the Landsat mosaic for each year. 
```javascript
// inspect a sample of the training dataset 
var trainingPoints = ee.FeatureCollection('users/dh-conciani/collection7/training/v2/train_col7_reg34_2021_v2');
Map.addLayer(trainingPoints, {}, 'trainingSamples');
```
[Link to script](https://code.earthengine.google.com/98596da0d1e5dbec9bb66e0c274a694b)

## 05_rfClassification.R
Performs the model training (`ee.Classifier.smileRandomForest()` ) and classification of the annual Landsat mosaics for each region. 

## 06_gapFill.js
No-data values (gaps) due to cloud and/or cloud shadow contaminated pixels in a given image were filled by the temporally nearest future valid classification. If no future valid classification was available, then the no-data value was replaced by its previous valid classification. Therefore, gaps should only remain in the final classified map when a given pixel was consistently classified as no-data throughout the entire temporal series. 

## 7_incidence.js
An incident filter was applied to remove pixels that changed too many times over the 37 years. All pixels that changed more than 12 times, and were connected to less than six same-class pixels that also changed more than 12 times, were replaced by the pixel MODE value. This avoids spurious transitions at the border of the same-class pixel group. Note that this filter was not applied to the Wetland (11) and Rocky Outcrop (29) classes.  

## 8_temporal.js
The temporal filter uses the subsequent years to replace pixels that have invalid transitions in a given year. It follows sequential steps:
1. As a first step, the filter evaluates all pixels in a 5- (from 1986 to 2018) and 4-year (from 1986 to 2019) moving window to correct any value that has a given class in the past year (year -1), changes in the current year and return to the initial class in the last year (year +2 or +3). This process is applied for each class, observing this order: Savanna formation (4), Forest Formation (3), Grassland Formation (12), Wetland (11), Mosaic of Uses (21), River, Lake, and Ocean (33), and Other Non-vegetated Area (25).  

2. The second step is similar to the first but consists of a 3-year moving window (from 1986 to 2020) that corrects all the middle years (concerning -1 and +1 years), running in the same class order as the first.    

3. In the third step, the filter searches for any native vegetation class (Forest, Savanna, Wetland, and Grassland) that was not classified as such in 1985 and was correctly classified in 1986 and 1987, and then corrects the 1985 value.

4. In the last step, the filter searches for pixel values that were not Mosaic of Uses (21) in 2021 but were classified as such in 2019 and 2020. The value in 2021 is then corrected to match the previous years to avoid any regeneration, which cannot be corroborated in the last year.

(insert 7.1 update here)

## 9_frequency.js
The frequency filter was applied only on pixels classified as native vegetation at least 90% of the time-series. If such a pixel was classified as Forest Formation over more than 75% of the time, that class was assigned to the pixel over the whole period. The same rule was applied for the Savanna Formation, Wetland, and Grassland Formation, but using a frequency criterion of 50% of the time-series. In the case of Rocky Outcrop, a criterion of 70% was applied in the first round of classification and 90% in the second. This frequency filter resulted in a more stable classification of native vegetation classes. Another significant result was the removal of noise in the first and last years of the classification, which the temporal filter cannot adequately assess.

## 10_geomorfology.js
Uses IBGE's (2009) geomorphology - "Floodplain" - to optimize wetland classification in the Araguaia basin

## 11_spatial.js
The spatial filter avoids misclassifications at the edge of pixel groups and was built based on the "connectedPixelCount" function. Native to the GEE platform, this function locates connected components (neighbors) that share the same pixel value. Thus, only pixels that do not share connections to a predefined number of identical neighbors are considered isolated. At least six connected pixels are required to reach the minimum connection value. Consequently, the minimum mapping unit is directly affected by the spatial filter applied, and it was defined as six pixels (0.54 hectares).

## Classification schema:
![alt text](https://github.com/mapbiomas-brazil/cerrado/blob/mapbiomas70/1-general-map/utils/Collection%207.png?raw=true)
Overview of the methodological approach utilized for classifying the Cerrado native vegetation in Collection 7.0. Each gray geometry (cylinders for databases and rectangles for processes) represents a key step in the classification scheme—with the respective name inside. The gray text near databases and processes offers a short description of the step, while the green text highlights the main innovations in Collection 7.0. Arrows with a continuous black line connecting the key steps represent the main direction of the processing flux. In contrast, arrows with dotted black lines represent the databases that feed the main processes. Red text inside arrows refers to the asset type in the Google Earth Engine (GEE), while blue text offers a short description of the asset content.
