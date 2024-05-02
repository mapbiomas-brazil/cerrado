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
  mtry=c(5, 10, 20, 40),
  region=c(1:38),
  year=c(1985:2023)
)

################# check already processed files ################## comment if is the first run 
processedTable <- read.csv('./_aux/temp/modelParams.csv', sep=' ')

# Find combinations that are not present in processedTable
combinations <- anti_join(combinations, processedTable, by = c("ntree", "mtry", "region", "year"))
######################################################################################################
#combinations <- combinations[1:2000,]
###################

## set recipes
paramTable <- as.data.frame(NULL)
importanceTable <- as.data.frame(NULL)

## set count
count <- 0

## for each region 
for (i in 1:length(unique(combinations$region))) {
  print(paste0('processing region ', unique(combinations$region)[i],' --- ',
               i, ' of ', length(unique(combinations$region))))
  
  ## sort random years to calibrate parameters 
  # set_of_years <- getYears(start_year= 1985,
  #                          end_year= 2023, 
  #                          proportion= 20)
  
  ## for each classification region
  for (j in 1:length(unique(combinations$year))) {
    print(paste0('year ', j, ' of ', length(unique(combinations$year)), ' ----> ', unique(combinations$year)[j]))
    
    ## read training samples for the region [i] and year [j]
    samples_ij <- ee$FeatureCollection(paste0(folder, 'train_col9_reg', unique(combinations$region)[i],
                                              '_', unique(combinations$year)[j], '_v', version))
    ## get bandNames
    bands <- names(samples_ij$first()$getInfo()$properties)
    
    ## remove descriptots
    bands <- bands[!bands %in% c('mapb', 'year')]
    
    ## get combinations for region 
    try(combinations_k <- subset(combinations, region == unique(combinations$region)[i] &
                               year == unique(combinations$year)[j]), silent = TRUE)
    
    if (nrow(combinations_k) == 0) {
      count <- count + 1
      next
      
    }
    ## for each combination in search grid
    for(k in 1:nrow(combinations_k)) {
      ## set count
      count <- count + 1
      print(paste0('training combination ', k, ' of ', nrow(combinations_k), 
                   ' ~ iteration ', count, ' of ', nrow(combinations)))
      
      ## store initializing time
      startTime <- Sys.time()
      
      ## separate into training and test 
      samples_ij <- samples_ij$randomColumn()
      samples_ij_training <- samples_ij$filter('random <= 0.7')
      samples_ij_test <- samples_ij$filter('random > 0.8')
      
      # train a smile.randomForest 
      trainedClassifier <- ee$Classifier$smileRandomForest(
        numberOfTrees = combinations_k[k,]$ntree,
        variablesPerSplit = combinations_k[k,]$mtry
      )$train(
        features= samples_ij_training,
        classProperty= 'reference',
        inputProperties= bands
      )
      
      ## get a confusion matrix and overall accuracy for the test sample.
      samples_ij_test <- samples_ij_test$classify(trainedClassifier)
      testAccuracy <- samples_ij_test$errorMatrix('reference', 'classification');
      
      print('Getting model results')
      ## build accuracy table
      try(tempParam <- as.data.frame(rbind(cbind(
        ntree= combinations_k[k,]$ntree,
        mtry= combinations_k[k,]$mtry,
        region= unique(combinations$region)[i],
        year= unique(combinations$year)[j],
        accuracy= round(testAccuracy$accuracy()$getInfo(), digits=4)
      ))), silent= T)
      
      if(exists('tempParam') == FALSE) {
        ## get end time and estimated time to end
        endTime <- Sys.time()
        print(paste0('Task Runtime: ', round(endTime - startTime, digits=1),'s -------------> Estimated to end all tasks: ',
                     round((endTime - startTime) * nrow(combinations)/3600, digits=1), ' hours'))
        next
        
      }
      
      ## temp iomportance
      try(tempImportance <- as.data.frame(rbind(cbind(
        ntree= combinations_k[k,]$ntree,
        mtry= combinations_k[k,]$mtry,
        region= unique(combinations$region)[i],
        year= unique(combinations$year)[j],
        bandNames= bands[bands != 'reference'],
        importance= as.numeric(unlist(trainedClassifier$explain()$get('importance')$getInfo()))
      ))), silent= T)
      
      if(exists('tempImportance') == FALSE) {
        ## get end time and estimated time to end
        endTime <- Sys.time()
        print(paste0('Task Runtime: ', round(endTime - startTime, digits=1),'s -------------> Estimated to end all tasks: ',
                     round((endTime - startTime) * nrow(combinations)/3600, digits=1), ' hours'))
        next
        
      }
      
      ## bind data
      paramTable <- rbind(paramTable, tempParam)
      importanceTable <- rbind(importanceTable, tempImportance)
      
      ## get end time and estimated time to end
      endTime <- Sys.time()
      print(paste0('Task Runtime: ', round(endTime - startTime, digits=1),'s -------------> Estimated to end all tasks: ',
                   round((endTime - startTime) * nrow(combinations)/3600, digits=1), ' hours'))
      
      rm(tempParam)
      rm(tempImportance)
      
    }

  }
  
}

## save data locally to be used 
write.table(paramTable, file = './_aux/modelParams.csv', row.names= FALSE)
write.table(importanceTable, file = './_aux/varImportance.csv', row.names=FALSE)
