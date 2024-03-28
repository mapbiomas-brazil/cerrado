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

################## set cross-vaidation functions #########################
## create a empty model as recipe 
improvedClassifier <- list(type = "Classification", library = "randomForest", loop = NULL)

## set model's parameters
improvedClassifier$parameters <- data.frame(parameter = c("mtry", "ntree"),
                                            reference = rep("numeric", 2),
                                            label = c("mtry", "ntree"))

## set searching method 
improvedClassifier$grid <- function(x, y, len = NULL, search = "grid") { }

## set function to computed training estimates 
improvedClassifier$fit <- function(x, y, wts, param, lev, last, weights, classProbs) {
  return(
    randomForest(x, y, mtry = param$mtry, ntree=param$ntree)
  )
}

## set function to compute predictions 
improvedClassifier$predict <- function(modelFit, newdata, preProc = NULL, submodels = NULL) {
  return(
    predict(modelFit, newdata)
  )
}

## set funciton to store probabilities 
improvedClassifier$prob <- function(modelFit, newdata, preProc = NULL, submodels = NULL)

## set data-structure functions 
improvedClassifier$sort <- function(x) x[order(x[,1]),]
improvedClassifier$levels <- function(x) x$reference       ## set data-structure functions 

########################## set cross-validation ###########################
control <- trainControl(method="repeatedcv", 
                        number= 10, 
                        repeats= 3,
                        allowParallel = TRUE)
  
## for each region 
for (i in 1:length(region_name)) {
  print(paste0('processing region ', region_name[i],' --- ', i, ' of ', length(region_name)))
  
  ## sort random years to calibrate parameters 
  set_of_years <- getYears(start_year= 1985,
                           end_year= 2023, 
                           proportion= 20)
  
  ## for each classification region
  for (i in 1:length(region_name)) {
    print(paste0('year ', j, ' of ', length(set_of_years), ' ----> ', set_of_years[j]))
    
    ## read training samples for the region [i] and year [j]
    samples_ij <- ee$FeatureCollection(paste0(folder, 'train_col9_reg', region_name[i], '_', set_of_years[j], '_v', version))
    
    ## 
    ## get spectral signatures from GEE and ingest locally 
    print('Ingesting array of samples locally')
    sample_ij <- as.data.frame(na.omit(ee_as_sf(samples_ij, via = 'drive')))
    
    ## remove description columns 
    sample_ij <- sample_ij[ , -which(names(sample_ij) %in% c("id","mapb", "geometry"))]
    
    ## set a grid of parameters to be tested (half of default, default and double)
    tunegrid <- expand.grid(.mtry=c(round(sqrt(ncol(sample_ij)))/2, round(sqrt(ncol(sample_ij))), round(sqrt(ncol(sample_ij))*2)),
                            .ntree=c(100, 300, 500))
    
    ## train model 
    custom <- train(as.factor(reference)~.,
                    data= sample_ij, 
                    method= improvedClassifier, 
                    metric= 'Accuracy', 
                    tuneGrid= tunegrid, 
                    trControl= control)
     
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
