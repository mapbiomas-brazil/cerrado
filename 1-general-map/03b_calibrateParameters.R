## -- -- -- -- 03b_calibrateParameters
## select featureSpace and calibrate RF hyperparameters for each classification region.
## dhemerson.costa@ipam.org.br

## load packages
library(rgee)
library(sf)
library(caret)
library(randomForest)
library(AppliedPredictiveModeling)
library(reshape2)
library(DMwR2)

## avoid scientific notation
options(scipen= 9e3)

## initialize earth engine 
ee_Initialize(drive= TRUE)

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

## set grid to be tested
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
  set_of_years <- getYears(start_year= 1985,
                           end_year= 2023, 
                           proportion= 20)
  
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
        importance= trainedClassifier$explain()$get('importance')$getInfo()
      )))
      
      ## insert bandnames
      tempImportance$bandNames <- row.names(tempImportance)
      
      
      
      
      #print(trainedClassifier$explain()$getInfo())
      
    }
    
    
    
    
    
    
    
    
    
    ## 
    ## get spectral signatures from GEE and ingest locally 
    print('Ingesting array of samples locally')
    sample_ij <- as.data.frame(na.omit(ee_as_sf(samples_ij, via = 'drive')))
    
    ## remove description columns 
    sample_ij <- sample_ij[ , -which(names(sample_ij) %in% c("id","mapb", "geometry"))]
    
    
 
    
    
    
    
    
     
  }
  
}


## set a number of random years to be used in the estimation (20% of total)

## define the number of models repetitions ito be used in heuristic search for each year 
n_rep <- 10 # NAO PRECISA

## set sub sample of proportion (%) - used to improved performance into cross-validation k-folds
p <- 10 # nao precisa, faz com 100% 

 estimation
  
  
  ## get spectral signatures for a random year (repeat n times)
  for (j in 1:n_years) {
   
    
   
    

    
    ## standardize seed
    set.seed(1)
    
    ## run n times
    for (k in 1:n_rep) {
      print(paste0('Training RF repetition ', k, ' of ', n_rep, ' (with 10 x 3 k-folds each)'))
      
      ## perform sub sample
      sub_sample <- sample_ij[sample(x= 1: nrow(sample_ij),
                                     size = round(nrow(sample_ij) / 100 * p)) ,]
      
      ## train model 
      custom <- train(as.factor(reference)~.,
                      data= sub_sample, 
                      method= customRF, 
                      metric= 'Accuracy', 
                      tuneGrid= tunegrid, 
                      trControl= control)
      
      ## in the first iteration, build objects
      if (exists('tune') == FALSE) {
        ## get best parameters
        tune <- custom$bestTune
        imp <- varImp(custom, scale= TRUE)$importance
        imp$band <- row.names(imp)
      } else {
        ## get best parameters
        ## add
        tune <- rbind(tune, custom$bestTune)
        imp_x <- varImp(custom, scale= TRUE)$importance
        imp_x$band <- row.names(imp_x)
        imp <- rbind(imp, imp_x)
      }
      
    } ## end of sub-sample repetition
    
    
    
    ## aggregate statistics for tuning parameters
    tune_file_ij <- as.data.frame(cbind(mtry= round(mean(tune$mtry)), 
                                        ntree= round(mean(tune$ntree)), 
                                        region = region_name[i],
                                        year = set_of_years[j]))
    
    rm(tune)
    
    ## compile all years of each region
    if (exists('tune_y') == FALSE) {
      tune_y <- tune_file_ij
    } else {
      tune_y <- rbind(tune_y, tune_file_ij)
    }
    
    ## aggregate statistics for variable importance
    bands_file_ij <- as.data.frame(cbind(band= unique(imp$band),
                                         sum= aggregate(x=list(sum = imp$Overall), by=list(band= imp$band), FUN= 'sum')$sum,
                                         mean= aggregate(x=list(mean = imp$Overall), by=list(band= imp$band), FUN= 'mean')$mean,
                                         sd= aggregate(x=list(sd = imp$Overall), by=list(band= imp$band), FUN= 'sd')$sd,
                                         region= region_name[i],
                                         year= set_of_years[j]))
    
    rm(imp)
    
    ## compile all years of each region
    if (exists('bands_y') == FALSE) {
      bands_y <- bands_file_ij
    } else {
      bands_y <- rbind(bands_y, bands_file_ij)
    }
    
    
  } ## end of years loop
  
  ## aggregate statistics for tuning parameters
  tune_file_i <- as.data.frame(cbind(mtry= round(mean(tune_y$mtry)), 
                                     ntree= round(mean(tune_y$ntree)), 
                                     region = region_name[i]))
  
  ## insert into database
  ## rf parameters
  if (exists('tune_xx') == FALSE) {
    tune_xx <- tune_file_i
  } else {
    tune_xx <- rbind(tune_xx, tune_file_i)
  }
  
  ## aggregate region metrics
  bands_file_i <- as.data.frame(cbind(band= unique(bands_y$band),
                                      sum= aggregate(x=list(sum = as.numeric(bands_y$sum)), by=list(band= bands_y$band), FUN= 'mean')$sum,
                                      mean= aggregate(x=list(mean = as.numeric(bands_y$mean)), by=list(band= bands_y$band), FUN= 'mean')$mean,
                                      sd= aggregate(x=list(sd = as.numeric(bands_y$sd)), by=list(band= bands_y$band), FUN= 'mean')$sd,
                                      region= region_name[i]))
  
  ## variable importance
  if (exists('bands_xx') == FALSE) {
    bands_xx <- bands_file_i
  } else {
    bands_xx <- rbind(bands_xx, bands_file_i)
  }
  
  rm(tune_y, bands_y)
  
  print ('done :) -----------> next')
  
  ## clean regional variables
  #rm (mosaic_i, samples_i, geo_coordinates, lat, lon_sin, lon_cos, hand)
} ## end of regions loop

## export tables
write.table(bands_xx, file = './_params/bands.csv')
write.table(tune_xx, file = './_params/rf.csv')
print('end o/')
