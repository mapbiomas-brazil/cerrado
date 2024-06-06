## -- -- -- -- 05_rfClassification
## Run smileRandomForest classifier - Mapbiomas Collection 9
## barbara.silva@ipam.org.br 

## Read libraries
library(rgee)
library(dplyr)
library(stringr)
ee_Initialize()

## Define strings to be used as metadata
samples_version <- '3'   # input training samples version
output_version <-  '4'   # output classification version 

## Define output asset
output_asset <- 'projects/mapbiomas-workspace/COLECAO_DEV/COLECAO9_DEV/CERRADO/C9-ROCKY-GENERAL-MAP-PROBABILITY/'

## Read landsat mosaic 
mosaic <- ee$ImageCollection('projects/nexgenmap/MapBiomas2/LANDSAT/BRAZIL/mosaics-2')$
  filterMetadata('biome', 'equals', 'CERRADO')

## Get mosaic rules 
rules <- read.csv('./_aux/mosaic_rules.csv')

## Define years to be classified
years <- unique(mosaic$aggregate_array('year')$getInfo())

## Read area of interest
aoi_vec <- ee$FeatureCollection('projects/barbaracosta-ipam/assets/collection-9_rocky-outcrop/masks/aoi_v3')$geometry()
aoi_img <- ee$Image(1)$clip(aoi_vec)

## Get bandnames to be extracted
bands <- mosaic$first()$bandNames()$getInfo()

## Remove bands with 'cloud' or 'shade' into their names
bands <- bands[- which(sapply(strsplit(bands, split='_', fixed=TRUE), function(x) (x[1])) == 'cloud' |
                      sapply(strsplit(bands, split='_', fixed=TRUE), function(x) (x[1])) == 'shade') ]

# Import geomorphometric variables calculated with SRTM images 
relative <- ee$Image ('projects/barbaracosta-ipam/assets/base/CERRADO_MERIT_RELATIVERELIEF')$rename('relative')
valleydepth <- ee$Image('projects/barbaracosta-ipam/assets/base/CERRADO_MERIT_VALLEYDEPTH')$rename('valleydepth')
tpi <- ee$Image('projects/barbaracosta-ipam/assets/base/CERRADO_MERIT_TPI')$rename('tpi')
dem <- ee$Image ('projects/barbaracosta-ipam/assets/base/CERRADO_SRTM_ELEVATION_30m')$rename('dem')

## paste auxiliary bandnames
aux_bands <- c('latitude', 'longitude_sin', 'longitude_cos', 'hand', 'amp_ndvi_3yr')

## Training samples (prefix string)
training_dir <- 'projects/barbaracosta-ipam/assets/collection-9_rocky-outcrop/training/'

## define class dictionary
classDict <- list(
  class= c(1, 2, 29),
  name = c('Natural', 'Antropic', 'RockyOutcrop')
)

## For each year
for (j in 1:length(years)) {
  print(paste0('----> ', years[j]))
  
  ## Compute additional bands
  geo_coordinates <- ee$Image$pixelLonLat()$updateMask(aoi_img$eq(1))
  
  ## Get latitude
  lat <- geo_coordinates$select('latitude')$
    add(5)$
    multiply(-1)$
    multiply(1000)$
    toInt16()
  
  ## Get longitude
  lon_sin <- geo_coordinates$select('longitude')$
    multiply(pi)$
    divide(180)$
    sin()$
    multiply(-1)$
    multiply(10000)$
    toInt16()$
    rename('longitude_sin')
  
  ## Cosine
  lon_cos <- geo_coordinates$select('longitude')$
    multiply(pi)$
    divide(180)$
    cos()$
    multiply(-1)$
    multiply(10000)$
    toInt16()$
    rename('longitude_cos')
  
  ## Get heigth above nearest drainage
  hand <- ee$ImageCollection("users/gena/global-hand/hand-100")$
    mosaic()$
    toInt16()$
    updateMask(aoi_img$eq(1))$
    rename('hand')
  
  ## Get the landsat mosaic for the current year 
  mosaic_i <- mosaic$filterMetadata('year', 'equals', years[j])$
    filterMetadata('satellite', 'equals', subset(rules, year == years[j])$sensor)$
    mosaic()$select(bands)$
    updateMask(aoi_img$eq(1))
  
  ## Compute the NDVI amplitude, following mosaic rules
  ## If the year is greater than 1986, get the 3yr NDVI amplitude
  if (years[j] > 1986) {
    print('Computing NDVI Amplitude (3yr)')
    
    ## Get previous year mosaic 
    mosaic_i1 <- mosaic$filterMetadata('year', 'equals', years[j] - 1)$
      filterMetadata('satellite', 'equals', subset(rules, year == years[j])$sensor_past1)$
      mosaic()$select(c('ndvi_median_dry','ndvi_median_wet'))$updateMask(aoi_img$eq(1))
    
    ## Get previous 2yr mosaic 
    mosaic_i2 <- mosaic$filterMetadata('year', 'equals', years[j] - 2)$
      filterMetadata('satellite', 'equals', subset(rules, year == years[j])$sensor_past2)$
      mosaic()$select(c('ndvi_median_dry','ndvi_median_wet'))$updateMask(aoi_img$eq(1))
    
    ## Compute the minimum NDVI over dry season 
    min_ndvi <- ee$ImageCollection$fromImages(c(mosaic_i$select('ndvi_median_dry'),
                                                mosaic_i1$select('ndvi_median_dry'),
                                                mosaic_i2$select('ndvi_median_dry')))$min()
    
    ## Compute the maximum NDVI over wet season 
    max_ndvi <- ee$ImageCollection$fromImages(c(mosaic_i$select('ndvi_median_wet'),
                                                mosaic_i1$select('ndvi_median_wet'),
                                                mosaic_i2$select('ndvi_median_wet')))$max()
    
    ## Get the amplitude
    amp_ndvi <- max_ndvi$subtract(min_ndvi)$rename('amp_ndvi_3yr')$updateMask(aoi_img$eq(1))
  }
  
  ## If the year[j] is lower than 1987, get null image as amp
  if (years[j] < 1987) {
    amp_ndvi <- ee$Image(0)$rename('amp_ndvi_3yr')$updateMask(aoi_img$eq(1))
  }
  
  ## Join the mapbiomas mosaic with the auxiliary bands
  mosaic_i <- mosaic_i$addBands(lat)$
    addBands(lon_sin)$
    addBands(lon_cos)$
    addBands(hand)$
    addBands(amp_ndvi)$
    addBands(relative)$
    addBands(valleydepth)$
    addBands(tpi)$
    addBands(dem)
  
  ## Get bands
  bandNames_list <- mosaic_i$bandNames()$getInfo()
  
  ## Get training samples
  training_ij <- ee$FeatureCollection(paste0(training_dir, 'v', samples_version, '/train_col9_rocky_', years[j], '_v', samples_version))
  
  ## Train classifier
  classifier <- ee$Classifier$smileRandomForest(
    numberOfTrees= 300)$
    setOutputMode('MULTIPROBABILITY')$
    train(training_ij, 'class', bandNames_list)
  
  ## Perform classification and mask only to AOI region 
  predicted <- mosaic_i$classify(classifier)$
    updateMask(aoi_img)
  
  ## Retrieve classified classes
  classes <- sort(training_ij$aggregate_array('class')$distinct()$getInfo())
  
  ## Flatten array of probabilities
  probabilities <- predicted$arrayFlatten(list(as.character(classes)))
  
  ## Rename
  probabilities <- probabilities$select(as.character(classes), 
                                        classDict$name[match(classes, classDict$class)])
  
  ## Acale probabilities to 0-100
  probabilities <- probabilities$multiply(100)$round()$toInt8()
  
  ## Get classification from maximum value of probability 
  ## Convert probabilities to an array
  probabilitiesArray <- probabilities$toArray()$
    ## get position of max value
    arrayArgmax()$
    ## get values
    arrayGet(0)
  
  ## Remap to mapbiomas collection
  classificationImage <- probabilitiesArray$remap(
    from= seq(0, length(classes)-1),
    to= as.numeric(classes)
  )$rename('classification')
  
  ## Include classification as a band 
  toExport <- classificationImage$addBands(probabilities)
  
  ## Set properties
  toExport <- toExport$
    set('collection', '9')$
    set('version', output_version)$
    set('biome', 'CERRADO')$
    set('year', as.numeric(years[j]))
  
  ## Export each year as a separate image in the collection
  file_name <- paste0('CERRADO_ROCKY_', years[j], '_v', output_version)
  task <- ee$batch$Export$image$toAsset(
    image = toExport,
    description = file_name,
    assetId = paste0(output_asset, file_name),
    scale = 30,
    maxPixels = 1e13,
    pyramidingPolicy = list('.default' = 'mode'),
    region = aoi_vec
  )
  task$start()
  print(paste("Task started:", file_name))
}

print('All tasks have been started. Now wait a few hours and have fun :)')
