## -- -- -- -- 03b_calibrateParameters
## select featureSpace and calibrate RF hyperparameters for each classification region.
## dhemerson.costa@ipam.org.br

## load packages
library(rgee)
library(tidyverse)

## avoidtidyr## avoid scientific notation
options(scipen= 9e3)

## initialize earth engine 
ee_Initialize()

## set the version of training samples to used
version <- "4"

## set training folder 
folder <- paste0('users/dh-conciani/collection9/training/v', version, '/')

## read classification regions
regions <- ee$FeatureCollection('users/dh-conciani/collection7/classification_regions/vector_v2')

## get unique region names as string
region_name <- as.character(1:38)

## get landsat mosaic rules
rules <- read.csv('./_aux/mosaic_rules.csv')

################## set sample size functions ##############################
## get the number of years to be used
yearSize <- function(end_year, start_year, proportion) {
  return (
    round((end_year - start_year + 1)/ 100 * proportion, digits=0)
  )
}

## get years to be used in calibration 
getYears <- function(start_year, end_year, proportion) {
  return(
    sample(x= start_year:end_year, 
           size= yearSize(end_year, start_year, proportion), replace= F)
  )
}

## set grid of parameters to be tested
combinations <- expand.grid(
  ntree=c(100, 200, 400, 800),
  mtry=c(5, 10, 20, 40)
)


## set recipes
paramTable <- as.data.frame(NULL)
importanceTable <- as.data.frame(NULL)

## for each region ## for eaNULLch region 
for (i in 1:length(region_name)) {
  print(paste0('processing region ', region_name[i],' --- ', i, ' of ', length(region_name)))
  
  ## sort random years to calibrate parameters 
  # set_of_years <- getYears(start_year= 1985,
  #                          end_year= 2023, 
  #                          proportion= 20)
  set_of_years(1985:2023)
  
  ## for each classification region
  for (j in 1:length(set_of_years)) {
    print(paste0('year ', j, ' of ', length(set_of_years), ' ----> ', set_of_years[j]))
    
    ## read training samples for the region [i] and year [j]
    samples_ij <- ee$FeatureCollection(paste0(folder, 'train_col9_reg', region_name[i], '_', set_of_years[j], '_v', version))
    
    ## get bandNames
    bands <- names(samples_ij$first()$getInfo()$properties)
    
    ## remove descriptots
    bands <- bands[!bands %in% c('mapb', 'year')]
    
    ## for each combination in search grid
    for(k in 1:nrow(combinations)) {
      print(paste0('training combination ', k, ' of ', nrow(combinations)))
      ## separate into training and test 
      samples_ij <- samples_ij$randomColumn()
      samples_ij_training <- samples_ij$filter('random <= 0.7')
      samples_ij_test <- samples_ij$filter('random > 0.8')
      
      # train a smile.randomForest 
      trainedClassifier <- ee$Classifier$smileRandomForest(
        numberOfTrees = combinations[k,]$ntree,
        variablesPerSplit = combinations[k,]$mtry
      )$train(
        features= samples_ij_training,
        classProperty= 'reference',
        inputProperties= bands
      )
      
      ## get a confusion matrix and overall accuracy for the test sample.
      samples_ij_test <- samples_ij_test$classify(trainedClassifier)
      testAccuracy <- samples_ij_test$errorMatrix('reference', 'classification');
      
      ## build accuracy table
      tempParam <- as.data.frame(rbind(cbind(
        ntree= combinations[k,]$ntree,
        mtry= combinations[k,]$mtry,
        region= region_name[i],
        year= set_of_years[j],
        accuracy= round(testAccuracy$accuracy()$getInfo(), digits=4)
        )))
      
      ## temp iomportance
      tempImportance <- as.data.frame(rbind(cbind(
        ntree= combinations[k,]$ntree,
        mtry= combinations[k,]$mtry,
        region= region_name[i],
        year= set_of_years[j],
        bandNames= bands[bands != 'reference'],
        importance= as.numeric(unlist(trainedClassifier$explain()$get('importance')$getInfo()))
      )))

      ## bind data
      paramTable <- rbind(paramTable, tempParam)
      importanceTable <- rbind(importanceTable, tempImportance)
      
    }
    
  }
  
}

## save data locally to be used 
write.table(paramTable, file = './_aux/modelParams.csv', row.names= FALSE)
write.table(importanceTable, file = './_aux/varImportance.csv', row.names=FALSE)
importanceTable
