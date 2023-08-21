## -- -- -- -- 05_rfClassification
## Run smileRandomForest classifier - Mapbiomas Collection 8.0
## dhemerson.costa@ipam.org.br and barbara.silva@ipam.org.br
# -- -- -- -- 05_rfClassification
## Run smileRandomForest classifier - Mapbiomas Collection 8.0
# barbara.silva@ipam.org.br


## read libraries
library(rgee)
ee_Initialize()
ee_Initialize(user = 'barbara.silva@ipam.org.br', drive = TRUE, gcs = TRUE)

## define strings to be used as metadata
samples_version <- '1'   # input training samples version
output_version <-  '1'   # output classification version 

## define hyperparameters for then rf classifier
n_tree <- 300

## define output asset
output_asset <- 'users/barbarasilvaIPAM/collection8/c8-general/'

## read landsat mosaic 
mosaic <- ee$ImageCollection('projects/nexgenmap/MapBiomas2/LANDSAT/BRAZIL/mosaics-2')$
  filterMetadata('biome', 'equals', 'CERRADO')

## set the number of bands (with highest score) to be used in each region
## actual rule uses 2/3 of the total ~(*66.6) descriptor
n_bands <- round(length(mosaic$first()$bandNames()$getInfo()) / 100 * 66.6, digits= 0)

## define output asset
output_asset <- 'users/barbarasilvaIPAM/collection8/c8-general-class/'
## import mosaic rules 
rules <- read.csv('D:\\Users\\barba\\OneDrive\\Documentos\\17. IPAM\\1. Cerrado\\cerrado-mapbiomas71\\cerrado-mapbiomas71\\1-general-map\\_aux\\mosaic_rules.csv')

## define years to be classified
years <- unique(mosaic$aggregate_array('year')$getInfo())

## import mosaic rules 
rules <- read.csv('./_aux/mosaic_rules.csv')

## read classification regions (vetor)
regions_vec <- ee$FeatureCollection('users/dh-conciani/collection7/classification_regions/vector_v2')
## time since last fire
fire_age <- ee$Image('users/barbarasilvaIPAM/collection8/masks/fire_age_v2')

## define regions to be processed 
regions_list <- sort(unique(regions_vec$aggregate_array('mapb')$getInfo()))

### training samples (prefix string)
training_dir <- 'users/barbarasilvaIPAM/collection8/training/'

### classification regions (imageCollection, one region per image)
regions_ic <- 'users/dh-conciani/collection7/classification_regions/eachRegion_v2_10m/'

## read classification parameters
param_bands <- read.csv('./_aux/bands.csv', sep= '')
param_rf <- read.csv('./_aux/rf.csv', sep= '')

## for each region
for (i in 1:length(regions_list)) {
  print(paste0('processing region [', regions_list[i], ']'))
  ## get the vector for the regon [i]
  region_i_vec <- regions_vec$filterMetadata('mapb', 'equals', regions_list[i])$geometry()
  ## get the raster for the region [i]
  region_i_ras = ee$Image(paste0(regions_ic, 'reg_', regions_list[i]))
  
  ## get variable importance for the region i
  param_bands_i <- subset(param_bands, region == regions_list[i])
  ## remove auxiliary bands from relational computation
  param_bands_i <- subset(param_bands_i,  band != "hand" & band != 'longitude_sin' & band != 'longitude_cos')
  ## get the most important bands, using thresholh cut 
  bands <- levels(reorder(param_bands_i$band, -as.numeric(param_bands_i$mean)))[1:n_bands]
  
  ## get best classification parameters for the region i
  n_tree <- subset(param_rf, region == regions_list[i])$ntree
  n_mtry <- subset(param_rf, region == regions_list[i])$mtry
  
  ## compute static auxiliary bands
  geo_coordinates <- ee$Image$pixelLonLat()$clip(region_i_vec)
  ## get latitude
  lat <- geo_coordinates$select('latitude')$add(5)$multiply(-1)$multiply(1000)$toInt16()
  ## get longitude
  lon_sin <- geo_coordinates$select('longitude')$multiply(pi)$divide(180)$
    sin()$multiply(-1)$multiply(10000)$toInt16()$rename('longitude_sin')
  ## cosine
  lon_cos <- geo_coordinates$select('longitude')$multiply(pi)$divide(180)$
    cos()$multiply(-1)$multiply(10000)$toInt16()$rename('longitude_cos')
  
  ## get heigth above nearest drainage
  hand <- ee$ImageCollection("users/gena/global-hand/hand-100")$mosaic()$toInt16()$
    clip(region_i_vec)$rename('hand')
  
  fire_age <- ee$Image('users/barbarasilvaIPAM/collection8/masks/fire_age_v2')
  
  ## for each year
  for (j in 1:length(years)) {
    print(paste0('----> ', years[j]))
    
    ## get the sentinel mosaic for the current year 
    mosaic_i <- mosaic$filterMetadata('year', 'equals', years[j])$
      filterMetadata('satellite', 'equals', subset(rules, year == years[j])$sensor)$
      mosaic()$
      updateMask(region_i_ras)$   # filter for the region
      select(bands)               # select only relevant bands
    
    ## compute the NDVI amplitude, following mosaic rules 
    ## if the year is greater than 1986, get the 3yr NDVI amplitude
    if (years[j] > 1986) {
      ##print('Computing NDVI Amplitude (3yr)')
      ## get previous year mosaic 
      mosaic_i1 <- mosaic$filterMetadata('year', 'equals', years[j] - 1)$
        filterMetadata('satellite', 'equals', subset(rules, year == years[j])$sensor_past1)$
        mosaic()$select(c('ndvi_median_dry','ndvi_median_wet'))$clip(region_i_vec)
      ## get previous 2yr mosaic 
      mosaic_i2 <- mosaic$filterMetadata('year', 'equals', years[j] - 2)$
        filterMetadata('satellite', 'equals', subset(rules, year == years[j])$sensor_past2)$
        mosaic()$select(c('ndvi_median_dry','ndvi_median_wet'))$clip(region_i_vec)
      
      ## compute the minimum NDVI over dry season 
      min_ndvi <- ee$ImageCollection$fromImages(c(mosaic_i$select('ndvi_median_dry'),
                                                  mosaic_i1$select('ndvi_median_dry'),
                                                  mosaic_i2$select('ndvi_median_dry')))$min()
      
      ## compute the mmaximum NDVI over wet season 
      max_ndvi <- ee$ImageCollection$fromImages(c(mosaic_i$select('ndvi_median_wet'),
                                                  mosaic_i1$select('ndvi_median_wet'),
                                                  mosaic_i2$select('ndvi_median_wet')))$max()
      
      ## get the amplitude
      amp_ndvi <- max_ndvi$subtract(min_ndvi)$rename('amp_ndvi_3yr')$clip(region_i_vec)
      
      ## get the time since last fire
      fire_age_i <- fire_age$select(paste0('classification_', years[j]))$rename('fire_age')$clip(region_i_vec)
    }
    
    ## if the year[j] is lower than 1987, get null image as amp
    if (years[j] < 1987){
      amp_ndvi <- ee$Image(0)$rename('amp_ndvi_3yr')$clip(region_i_vec)
      fire_age_i <- ee$Image(5)$rename('fire_age')$clip(region_i_vec)
    }
    
    
    ## bind mapbiomas mosaic and auxiliary bands
    mosaic_i <- mosaic_i$addBands(lat)$
      addBands(lon_sin)$
      addBands(lon_cos)$
      addBands(hand)$
      addBands(amp_ndvi)$
      addBands(fire_age_i)
    
    ## limit water samples only to 175 samples (avoid over-estimation)
    water_samples <- ee$FeatureCollection(paste0(training_dir, 'v', samples_version, '/train_col8_reg', regions_list[i], '_', years[j], '_v', samples_version))$
      filter(ee$Filter$eq("reference", 33))$
      filter(ee$Filter$eq("hand", 0))$
      limit(175)                        ## insert water samples limited to 175 
    
    ## merge filtered water with other classes
    training_ij <- ee$FeatureCollection(paste0(training_dir, 'v', samples_version, '/train_col8_reg', regions_list[i], '_', years[j], '_v', samples_version))$
      filter(ee$Filter$neq("reference", 33))$ ## remove water samples
      merge(water_samples)
    
    ## train classifier
    classifier <- ee$Classifier$smileRandomForest(
      numberOfTrees= n_tree,
      variablesPerSplit= n_mtry)$
      train(training_ij, 'reference', bands)
    
    ## perform classification and mask only to region 
    predicted <- mosaic_i$classify(classifier)$mask(mosaic_i$select(0))
    
    ## add year as bandname
    predicted <- predicted$rename(paste0('classification_', as.character(years[j])))$toInt8()
    
    ## set properties
    predicted <- predicted$
      set('collection', '8')$
      set('version', output_version)$
      set('biome', 'CERRADO')$
      set('mapb', as.numeric(regions_list[i]))$
      set('year', as.numeric(years[j]))
    
    ## stack classification
    if (years[j] == 1985) {
      stacked_classification <- predicted
    } else {
      stacked_classification <- stacked_classification$addBands(predicted)    
    }
    
  } ## end of year processing
  print('exporting stacked classification')
  
  ## create filename
  file_name <- paste0('CERRADO_reg', regions_list[i], '_col8_v', output_version)
  
  ## build task
  task <- ee$batch$Export$image$toAsset(
    image= stacked_classification$toInt8(),
    description= file_name,
    assetId= paste0(output_asset, file_name),
    scale= 30,
    maxPixels= 1e13,
    pyramidingPolicy= list('.default' = 'mode'),
    region= region_i_vec
  )
  
  ## export 
  task$start()
  print ('------------> NEXT REGION --------->')
}

print('end, now wait few hours and have fun :)')
