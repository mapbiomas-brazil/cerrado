## 01_computeProportion.js
Calculates the area of each class in each classification region. These calculations will estimate the number of training samples in each class. 

## 02_samplePoints.js
Sort 13,000 training samples.

## 03_getSignatures.R
Use the points generated in the previous step to extract the spectral signatures from the Landsat mosaic for each year. 

## 04_rfClassification.R
Performs the model training (`ee.Classifier.smileRandomForest()` ) and classification of the annual Landsat mosaics for each region. 

## 05_gapFill.js
No-data values (gaps) due to cloud and/or cloud shadow contaminated pixels in a given image were filled by the temporally nearest future valid classification. If no future valid classification was available, then the no-data value was replaced by its previous valid classification. Therefore, gaps should only remain in the final classified map when a given pixel was consistently classified as no-data throughout the entire temporal series. 

## 06_frequency.js
In the case of Rocky Outcrop, a criterion of 70% was applied in the first round of classification and 90% in the second. This frequency filter resulted in a more stable classification of rocky outcrop class.

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
Overview of the methodology for the classification of Rocky Outcrop in Collection 8.0. Each gray geometry (cylinders for databases and rectangles for processes) represents a key step in the classification scheme—with the respective name inside. The gray text near databases and processes offers a short description of the step, while the green text highlights the main differences among stepwise classification. Arrows with a continuous black line connecting the key steps represent the main direction of the processing flux, and arrows with dotted black lines represent the databases that feed the main processes. Red text inside arrows refers to the asset type in the Google Earth Engine (GEE), while blue text offers a short description of the asset content.

![Collection 8 - Rocky Outcrop](https://github.com/mapbiomas-brazil/cerrado/assets/132362599/670fd7e2-6c5a-4004-b75e-9b7e33336ef1)
