## 01_computeProportion.js
Calculates the area of each class in each classification region. These calculations will estimate the number of training samples in each class. 

## 02_samplePoints.js
Sort 15,000 training samples.

## 03_getSignatures.R
Use the points generated in the previous step to extract the spectral signatures from the Landsat mosaic for each year. 

## 04_rfClassification.R
Performs the model training (`ee.Classifier.smileRandomForest()` ) and classification of the annual Landsat mosaics for each region. 

## 05_gapFill.js
No-data values (gaps) due to cloud and/or cloud shadow contaminated pixels in a given image were filled by the temporally nearest future valid classification. If no future valid classification was available, then the no-data value was replaced by its previous valid classification. Therefore, gaps should only remain in the final classified map when a given pixel was consistently classified as no-data throughout the entire temporal series. 

## 06_frequency.js
The frequency filter was applied only on pixels classified as native vegetation at least 90% of the time-series. If such a pixel was classified as Forest Formation over more than 75% of the time, that class was assigned to the pixel over the whole period. The same rule was applied for the Savanna Formation, Wetland, and Grassland Formation, but using a frequency criterion of 50% of the time-series. In the case of Rocky Outcrop, a criterion of 70% was applied in the first round of classification and 90% in the second. This frequency filter resulted in a more stable classification of native vegetation classes. Another significant result was the removal of noise in the first and last years of the classification, which the temporal filter cannot adequately assess.

## 07_spatial.js
The spatial filter avoids misclassifications at the edge of pixel groups and was built based on the "connectedPixelCount" function. Native to the GEE platform, this function locates connected components (neighbors) that share the same pixel value. Thus, only pixels that do not share connections to a predefined number of identical neighbors are considered isolated. At least six connected pixels are required to reach the minimum connection value. Consequently, the minimum mapping unit is directly affected by the spatial filter applied, and it was defined as six pixels (0.54 hectares).

## 08_computeProportion_step2.js
Same as 01_computeProportion.js, but using Rocky Outcrop samples from the last step 

## 09_samplePoints_step2.js
Same as 02_samplePoints.js

## 10_getSignatures_step2.R
Same as 03_getSignatures.R

## 11_rfClassification_step2.R
Same as 04_rfClassification.R

## 12_gapfill_step2_js
Same as 05_gapFill.js

## 13_frequency_step2.js
Same as 06_frequency.js

## 14_spatial_step2.js
Same as 07_spatial.js

## 15_integrate.js
Integrates the Rocky Outcrop map over the general map 

## Classification schema:
![alt text](https://github.com/mapbiomas-brazil/cerrado/blob/mapbiomas70/2-rocky-outcrop/_aux/Rocky%20-%20C7.png?raw=true)
Overview of the methodology for the BETA classification of Rocky Outcrop in Collection 7.0. Each gray geometry (cylinders for databases and rectangles for processes) represents a key step in the classification scheme—with the respective name inside. The gray text near databases and processes offers a short description of the step, while the green text highlights the main differences among stepwise classification. Arrows with a continuous black line connecting the key steps represent the main direction of the processing flux, and arrows with dotted black lines represent the databases that feed the main processes. Red text inside arrows refers to the asset type in the Google Earth Engine (GEE), while blue text offers a short description of the asset content.
