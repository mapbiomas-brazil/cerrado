## -- -- -- -- 04_rfClassification
## Run smileRandomForest classifier - Mapbiomas Collection 7.0
## barbara.silva@ipam.org.br 

## import libraries
library(rgee)
ee_Initialize()

## define strings to be used as metadata
samples_version <- '3'   # input training samples version
output_version <-  '3'   # output classification version 

## define hyperparameters for then rf classifier
n_tree <- 300

## define output asset
output_asset <- 'projects/ee-barbarasilvaipam/assets/collection8-rocky/general-class/'

## read landsat mosaic 
mosaic <- ee$ImageCollection('projects/nexgenmap/MapBiomas2/LANDSAT/BRAZIL/mosaics-2')$
  filterMetadata('biome', 'equals', 'CERRADO')

## import mosaic rules 
rules <- read.csv('./_aux/mosaic_rules.csv')

## define years to be classified
years <- unique(mosaic$aggregate_array('year')$getInfo())

## read area of interest
aoi_vec <- ee$FeatureCollection('users/barbarasilvaIPAM/rocky_outcrop/collection8/masks/aoi_v3')
aoi_img <- ee$Image(1)$clip(aoi_vec)

## get predictor names to be used in the classification
bands <- mosaic$first()$bandNames()$getInfo()

## remove bands with 'cloud' or 'shade' into their names
bands <- bands[- which(sapply(strsplit(bands, split='_', fixed=TRUE), function(x) (x[1])) == 'cloud' |
                         sapply(strsplit(bands, split='_', fixed=TRUE), function(x) (x[1])) == 'shade') ]

## paste auxiliary bandnames
aux_bands <- c('latitude', 'longitude_sin', 'longitude_cos', 'hand', 'amp_ndvi_3yr')

## define assets
### training samples (prefix string)
training_dir <- 'projects/ee-barbarasilvaipam/assets/collection8-rocky/training/'

## for each year
for (j in 1:length(years)) {
  print(paste0('----> ', years[j]))
  
  ## compute additional bands
  geo_coordinates <- ee$Image$pixelLonLat()$updateMask(aoi_img$eq(1))
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
    rename('hand')$
    updateMask(aoi_img$eq(1))
  
  ## get the landsat mosaic for the current year 
  mosaic_i <- mosaic$filterMetadata('year', 'equals', years[j])$
    filterMetadata('satellite', 'equals', subset(rules, year == years[j])$sensor)$
    mosaic()$select(bands)$
    updateMask(aoi_img$eq(1))
  
  ## if the year is greater than 1986, get the 3yr NDVI amplitude
  if (years[j] > 1986) {
    print('Computing NDVI Amplitude (3yr)')
    ## get previous year mosaic 
    mosaic_i1 <- mosaic$filterMetadata('year', 'equals', years[j] - 1)$
      filterMetadata('satellite', 'equals', subset(rules, year == years[j])$sensor_past1)$
      mosaic()$select(c('ndvi_median_dry','ndvi_median_wet'))$updateMask(aoi_img$eq(1))
    ## get previous 2yr mosaic 
    mosaic_i2 <- mosaic$filterMetadata('year', 'equals', years[j] - 2)$
      filterMetadata('satellite', 'equals', subset(rules, year == years[j])$sensor_past2)$
      mosaic()$select(c('ndvi_median_dry','ndvi_median_wet'))$updateMask(aoi_img$eq(1))
    
    ## compute the minimum NDVI over dry season 
    min_ndvi <- ee$ImageCollection$fromImages(c(mosaic_i$select('ndvi_median_dry'),
                                                mosaic_i1$select('ndvi_median_dry'),
                                                mosaic_i2$select('ndvi_median_dry')))$min()
    
    ## compute the mmaximum NDVI over wet season 
    max_ndvi <- ee$ImageCollection$fromImages(c(mosaic_i$select('ndvi_median_wet'),
                                                mosaic_i1$select('ndvi_median_wet'),
                                                mosaic_i2$select('ndvi_median_wet')))$max()
    
    ## get the amplitude
    amp_ndvi <- max_ndvi$subtract(min_ndvi)$rename('amp_ndvi_3yr')$updateMask(aoi_img$eq(1))
  }
  
  ## if the year[j] is lower than 1987, get null image as amp
  if (years[j] < 1987) {
    amp_ndvi <- ee$Image(0)$rename('amp_ndvi_3yr')$updateMask(aoi_img$eq(1))
  }
  
  ## bind mapbiomas mosaic and auxiliary bands
  mosaic_i <- mosaic_i$addBands(lat)$
    addBands(lon_sin)$
    addBands(lon_cos)$
    addBands(hand)$
    addBands(amp_ndvi)
  
  ## get training samples
  training_ij <- ee$FeatureCollection(paste0(training_dir, 'v', samples_version, '/train_col8_rocky_', years[j], '_v3'))

  ## train classifier
  classifier <- ee$Classifier$smileRandomForest(numberOfTrees= n_tree)$
    train(training_ij, 'class', c(bands, aux_bands))
  
  ## perform classification and mask only to region 
  predicted <- mosaic_i$classify(classifier)$mask(mosaic_i$select('red_median'))
  
  ## add year as bandname
  predicted <- predicted$rename(paste0('classification_', as.character(years[j])))$toInt8()
  
  ## set properties
  predicted <- predicted$
    set('collection', '7')$
    set('version', output_version)$
    set('biome', 'CERRADO')$
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
file_name <- paste0('CERRADO_col3_rocky_v', output_version)

## build task
task <- ee$batch$Export$image$toAsset(
  image= stacked_classification$toInt8(),
  description= file_name,
  assetId= paste0(output_asset, file_name),
  scale= 30,
  maxPixels= 1e13,
  pyramidingPolicy= list('.default' = 'mode'),
  region= aoi_vec$geometry()
)

## export 
task$start()
print ('------------> NEXT REGION --------->')

print('end, now wait few hours and have fun :)')
