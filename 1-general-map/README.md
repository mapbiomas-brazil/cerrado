## 01_trainingMask.js
Build the training mask based on stable pixels from MapBiomas Collection 8 (1985 to 2022), reference maps, and GEDI-based filtering 
```javascript
// read training mask
var trainingMask = ee.Image('users/dh-conciani/collection9/masks/cerrado_trainingMask_1985_2022_v4');
var vis = {
    'min': 0,
    'max': 62,
    'palette': require('users/mapbiomas/modules:Palettes.js').get('classification8')
    };
// plot 
Map.addLayer(trainingMask, vis, 'trainingMask'); 
```
[Link to script](https://code.earthengine.google.com/1946c6a6cc6c0f753ab189990b3ce2a6)

## 02_computeProportion.js
Calculates the area of each land use and land cover class in each classification region. The main objective is to estimate the number of training samples required for each class, ensuring that the distribution of samples adequately reflects the diversity of the regions.

## 03_samplePoints.js
Uses the stable pixels to sort 7,000 training samples for each classification region (38 regions). 
```javascript
// read training samples
var samplePoints = ee.FeatureCollection('users/dh-conciani/collection9/sample/points/samplePoints_v4');

// plot
Map.addLayer(samplePoints, {}, 'samplePoints');
```
[Link to script](https://code.earthengine.google.com/b72984eb093a132408fa5ebc56c6dcaf)

## 04_getSignatures.R
Use the sample points generated in the previous step to extract the spectral signatures from the Landsat image mosaic for each year.
```javascript
// inspect a sample of the training dataset 
var trainingPoints = ee.FeatureCollection('projects/mapbiomas-workspace/COLECAO_DEV/COLECAO9_DEV/CERRADO/training/v8/train_col9_reg10_1985_v8');

// plot
Map.addLayer(trainingPoints, {}, 'trainingSamples');
```
[Link to script](https://code.earthengine.google.com/9a2b7176c9a33d22890d72e7e7ca9b13)

## 05_rfClassification.R
Perfoms the model using the Random Forest classifier (ee.Classifier.smileRandomForest()) and subsequently classifies the annual Landsat mosaics for each region of interest.

## 06_gapFill.js
No-data values (gaps) due to cloud and/or cloud shadow contaminated pixels in a given image were filled by the temporally nearest future valid classification. If no future valid classification was available, then the no-data value was replaced by its previous valid classification. Therefore, gaps should only remain in the final classified map when a given pixel was consistently classified as no-data throughout the entire temporal series. 

## 07_incidence.js
An incident filter was applied to remove pixels that changed too many times over the 39 years. All pixels that changed more than 13 times (1/3 of the time series), and were connected to less than seven same-class pixels that also changed more than 10 times, were replaced by the pixel MODE value. This avoids spurious transitions at the border of the same-class pixel group. Note that this filter was not applied to the Forest (3) and Rocky Outcrop (29) classes.  

## 08_temporal.js
This filter uses subsequent years to replace pixels that show invalid transitions in a given year, following the sequential steps detailed below:
1. The filter evaluates all the pixels in a 5-year moving window (from 1986 to 2020) and a 4-year moving window (from 1986 to 2021). The objective is to correct pixel values that present a specific class in the previous year (year -1), change in the current year and return to the initial class in the last year of the window (year +2 or year +3). It is applied to each land use and cover class in the following order: Savanna Formation (4), Forest Formation (3), Grassland Formation (12), Wetland (11), Mosaic of Uses (21), River, Lake and Ocean (33), and Other Non-Vegetated Areas (25).
2. This step is analogous to the initial step, employing a moving window of three years (1986-2022). The objective is to rectify the values of the intermediate years (-1 and +1) to address any inappropriate changes in the current year. The correction is executed in the same order of classes as in the initial step, ensuring temporal consistency over time.
3. The filter identifies any class of native vegetation (forest, savanna, wetland, or grassland) that was not classified as such in 1985 but was correctly classified in 1986 and 1987. The year 1985 is then corrected to reflect the correct classification, ensuring the continuity of native vegetation over the years.
4. The filter searches for pixel values that were not classified as Mosaic of Uses (21) in 2023, but were classified as such in 2022 and 2021. The 2023 class is corrected to match the previous year, avoiding any regeneration that cannot be confirmed in the last year.
5. The filter allows for regeneration of native vegetation in the last year in areas of at least 1 hectare. Pixels indicating regeneration between 2022 and 2023 are evaluated, and areas smaller than 1 hectare are discarded to ensure classification consistency. 

## 09_frequency.js
The frequency filter was applied exclusively to pixels classified as native vegetation for a minimum of 90% of the time series. In the event that a pixel was classified as Forest Formation for a period exceeding 75% of the time, that class was assigned to the pixel for the entirety of the period. The same rule was applied to Wetlands (60%), Savanna Formation (50%) and Grassland Formation (50%). This frequency filter resulted in a more stable classification of native vegetation classes. Another noteworthy outcome was the removal of noise in the ﬁrst and last years of classification, which the temporal filter may not have adequately assessed.

## 10_noFalseRegrowth.js
This filter avoids the incorrect classification of native forest regeneration in forestry areas and the false regeneration of wetlands in recent years. The process follows specific steps: 
1. The filter is initially applied to areas that have been mapped as "Mosaic of Uses" for a minimum of 15 consecutive years. These areas are identified and monitored in order to prevent new silvicultures from being misclassified as forest regeneration. The filter considers the minimum time needed for a new silviculture to achieve spectral characteristics similar to a native forest.
2. The second stage of the filter is the classification of wetlands. It employs the classification from the previous five years (2018-2023) to correct the classification from the previous year (year -1). This retrospective analysis helps to normalize the classifications over time, preventing the false regeneration of wetlands in the final years of the series. The normalization between years ensures that the temporal transitions are coherent.

## 11_spatial.js
The spatial filter avoids misclassifications at the edge of pixel groups and was built based on the "connectedPixelCount" function. Native to the GEE platform, this function locates connected components (neighbors) that share the same pixel value. Thus, only pixels that do not share connections to a predefined number of identical neighbors are considered isolated. At least six connected pixels are required to reach the minimum connection value. Consequently, the minimum mapping unit is directly affected by the spatial filter applied, and it was defined as six pixels (0.54 hectares).

## Classification and methodology
For detailed information about the classification and methodology, please read the Cerrado biome Appendix of the [Algorithm Theoretical Basis Document (ATBD).](https://mapbiomas.org/download-dos-atbds)


