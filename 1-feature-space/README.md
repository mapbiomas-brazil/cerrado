### Table of contents
* <b>Step 1</b>: Extract yearly spectral signatures and export as .csv
* <b>Step 2</b>: Merge yearly .csv's and export as a unique .txt
* <b>Step 1.1</b>: Plot exploratory graphics (correlation matrix and PCA)
* <b>Step 2</b>: Train multiple Random Forest classifiers and estimate variables importance (MeanDecreaseGini) using a grid of classes
* <b>Step 3</b>: Select top variables by using thresholds of importance
* <b>Step 3.1</b>: Plot boxplots of importance by class design and compute shared top variables 
* <b>Step 4</b>: Train multiple Random Forest classifiers and estimate accuracy (1- OOB Error) using a grid of predictors
* <b>Step 5</b>: Plot accuracy results and test statistical difference between predictors designs (Tukey HSD) 

### Short description
It was defined with a statistical approach by fitting several preliminary Random Forest classification models (400 per 'design'), each using a subset of 500 unique samples per class, and considering Landsat mosaics (90 bands) from five years (1989, 1994, 2007, 2011, and 2016). Variable importance for each case was evaluated in terms of mean decrease in accuracy (MeanDecreaseGini) when a given variable was absent in the model. We evaluated mean decrease in accuracy in general terms (global accuracy), and in specific terms (for each native vegetation class: Forest, Savanna and Grassland). Evaluated training designs are described below:
```R
## 1. Global (all classes)
samples <- rbind (sample_agricultura, sample_agua, sample_campestre, sample_florestal, sample_savanica, sample_pastagem)
## 2. Only native classes
samples <- rbind (sample_campestre, sample_florestal, sample_savanica)
```
For next designs, we isolated the native class of interest and 'dissolved' all the other classes in a unique sample. Below an exemple for "forest formation" class:
```R
## 3. Forest vs. all
data2 <- rbind (agricultura, agua, campestre, savanica, outros, pastagem)
data2$class <- "Outros"
sample_outros <- data2[sample(1:nrow(data2), n_samples),]
samples <- rbind (sample_florestal, sample_outros)
## 4. Savanna vs. all
## 5. Grassland vs. all
```
The final feature space was selected among the 30 variables with the highest average importance for global accuracy, as well as the 30 top variables considering the accuracy of each of the above-mentioned classes. As expected, these sets shared several variables, so that, according to these criteria, we ended up with 59 variables forming the candidate feature space for the final training/classification. We evaluated training accuracy by fitting 400 preliminary Random Forest classification global models (1. All classes) for each 'design' of predictors described below:
```R
## 1. All the 90 predictors 
## 2. 59 pre-selected predictors
## 3. 48 predictors used in collection 4.1 and 5
## 4. 31 worse predictors (total 90 - 59 pre-selected)
## 5. Top 30 predictors (from 59 pre-selected)
## 6. Top 20 predictors
## 7. Top 10 predictors
## 8. Top 5 predictors
```
We submited the results to a TukeyHSD test to evaluate statistical significance on the accuracies (95% C.I). </br>

## Step 0_extractSignatures.js <br>
Extract spectral signatures from reference points by using the 90 bands from Landsat mosaics to be used in the MapBiomas collection 6 classification. Note that the parameter ```year: [any value from 1985 to 2018]``` need to be set in the line number 6. After adjusting, press Run in GEE console and authorize task exportation.

Spectral signatures will be exported to a temporary folder '/TEMP' on the <b>Google Drive</b> root in the base name 'year.csv'. After exporting, users need to download csv files from <b>Google Drive</b> and put them into the local folder './_csv/'.

Considering Landsat sensors stratification, our analysis was performed by using the years 1989, 1994, 2007, 2011, and 2016. By default, these .csv files are already available in the folder './_csv/'

## Step 1_0_preProc_table.R <br>
Format and merge all the yearly .csv files inside the folder './_csv/'. Merged table is exported as a single pre-formated text file 'spectral_signatures.txt' in the folder './_txt/'. This file will be used in the next steps. 

## Steps 1_1_plotExploratory.R <br>
* Plot correlation `corrplot` comparing each one of the 90 band predictors for each land use and land cover class 
* Plot Principal Component Analyses (PCA) `base::prcomp` and `ggfortify::autoplot`

## Step 2_trainModel.R <br>
We train a `randomForest` classifier using `ntree= 100` and `mtry= 4` in a `control` k-fold cross-validation
```R
  control <- trainControl(method="repeatedcv", number=5, repeats=3, classProbs=TRUE) 
```
```R
rfModel <- randomForest(dataValues, as.factor(dataClass[,1]),
                          ntree= 100,
                          mtry= 4,
                          trControl=control,
                          preProc = c ("center", "scale"),
                          allowParallel = TRUE)
```
This procedure was repeated `n_models= 400` times for each one of the five class designs.
```R
for (i in 1:n_models) { 
function (x) {} 
}
```
For each design, `n_samples= 500` was used for each class.  
```R
sample_class <- sample_class[sample(1:nrow(sample_class), n_samples),]
```
In the end, a 'importance.txt' file is exported to the path './_txt/'

## Step 3_0_select_topVariables.R <br>
Compute the top 30 variables by each class design. Note that some variables can appear inside top 30 for different designs. Cuts of importance were made to use in the next steps (all variables that occurs at least once in top 30, literal top 30, top 20, top 10, top 5 and variables that don't appear any time in top 30 for none design). These files were exported with "topXX.txt" base name at path './_txt/'

## Step 3_1_plot_Importance.R <br>
Plot boxplots of variables importance by class desing `ggplot2::geom_boxplot` and compute shared top variables

## Step 4_trainModel_ciclo2.R <br> 
Repeat <b>Step 2_trainModel.R</b> considering a set of different variables as design. For this, the code import variable names generated in the <b>Step 3_0_select_topVariables.R</b> and a list with the variables used in the collections 4.1 and 5 avaliable in the folder './_txt'. 

## Step 5_plot_Accuracy.R <br> 
Plot boxplots of predictors design accuracy `ggplot2::geom_boxplot` and compute `base::tukeyHSD` statistical test

## Experiment schema:
![alt text](https://github.com/musx/mapbiomas-cerrado-col6/blob/main/1-feature-space/www/feature%20space.png?raw=true)

