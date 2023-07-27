## --- --- --- 03_getSignatures
## Exported data is composed by spatialPoints with spectral signature values grouped by column
## Auxiliary bands were computed (Lat, Long, NDVI amplitude and HAND)
## barbara.silva@ipam.org.br

## read libraries
library(rgee)
ee_Initialize()

## define strings to use as metadata
version <- "3"     ## version string

## define output directory
dirout <- 'projects/ee-barbarasilvaipam/assets/collection8-rocky/training/v3/'

## biome
biomes <- ee$Image('projects/mapbiomas-workspace/AUXILIAR/biomas-2019-raster')
cerrado <- biomes$updateMask(biomes$eq(4))

## define mosaic input 
mosaic <- ee$ImageCollection('projects/nexgenmap/MapBiomas2/LANDSAT/BRAZIL/mosaics-2')$
  filterMetadata('biome', 'equals', 'CERRADO')

## get mosaic rules
rules <- read.csv('./_aux/mosaic_rules.csv')

## non rocky samples
samples_non_rocky <- ee$FeatureCollection('users/barbarasilvaIPAM/rocky_outcrop/collection8/sample/point/samplePoints_v3')
## rocky outcrop
samples_rocky <- ee$FeatureCollection('users/barbarasilvaIPAM/rocky_outcrop/collection8/sample/afloramento_collect_v5')$
  ##insert class number based on mapbiomas
  map(function(feature) {
    return(feature$set(list('class' = 29)))
  })

## merge to get samples dataset 
samples <- samples_non_rocky$merge(samples_rocky);

## compute random column
samples <- samples$randomColumn()
## subset 70% randomly
samples <- samples$filter(ee$Filter$lt('random', 0.6))

## define years to extract spectral signatures (temporal operator)
years <- unique(mosaic$aggregate_array('year')$getInfo())

## get bandnames to be extracted
bands <- mosaic$first()$bandNames()$getInfo()

## remove bands with 'cloud' or 'shade' into their names
bands <- bands[- which(sapply(strsplit(bands, split='_', fixed=TRUE), function(x) (x[1])) == 'cloud' |
                        sapply(strsplit(bands, split='_', fixed=TRUE), function(x) (x[1])) == 'shade') ]

## for each year
for (j in 1:length(years)) {

  ## compute additional bands
  geo_coordinates <- ee$Image$pixelLonLat()
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
    rename('hand')
  
  ## get the landsat mosaic for the current year 
  mosaic_i <- mosaic$filterMetadata('year', 'equals', years[j])$
    filterMetadata('satellite', 'equals', subset(rules, year == years[j])$sensor)$
    mosaic()$select(bands)
  
  ## if the year is greater than 1986, get the 3yr NDVI amplitude
  if (years[j] > 1986) {
    print('Computing NDVI Amplitude (3yr)')
    ## get previous year mosaic 
    mosaic_i1 <- mosaic$filterMetadata('year', 'equals', years[j] - 1)$
      filterMetadata('satellite', 'equals', subset(rules, year == years[j])$sensor_past1)$
      mosaic()$select(c('ndvi_median_dry','ndvi_median_wet'))
    ## get previous 2yr mosaic 
    mosaic_i2 <- mosaic$filterMetadata('year', 'equals', years[j] - 2)$
      filterMetadata('satellite', 'equals', subset(rules, year == years[j])$sensor_past2)$
      mosaic()$select(c('ndvi_median_dry','ndvi_median_wet'))
    
    ## compute the minimum NDVI over dry season 
    min_ndvi <- ee$ImageCollection$fromImages(c(mosaic_i$select('ndvi_median_dry'),
                                                mosaic_i1$select('ndvi_median_dry'),
                                                mosaic_i2$select('ndvi_median_dry')))$min()
    
    ## compute the mmaximum NDVI over wet season 
    max_ndvi <- ee$ImageCollection$fromImages(c(mosaic_i$select('ndvi_median_wet'),
                                                mosaic_i1$select('ndvi_median_wet'),
                                                mosaic_i2$select('ndvi_median_wet')))$max()
    
    ## get the amplitude
    amp_ndvi <- max_ndvi$subtract(min_ndvi)$rename('amp_ndvi_3yr')
  }
  
  ## if the year[j] is lower than 1987, get null image as amp
  if (years[j] < 1987){
    amp_ndvi <- ee$Image(0)$rename('amp_ndvi_3yr')
  }
  
  ## bind mapbiomas mosaic and auxiliary bands
  mosaic_i <- mosaic_i$addBands(lat)$
    addBands(lon_sin)$
    addBands(lon_cos)$
    addBands(hand)$
    addBands(amp_ndvi)$
    addBands(ee$Image(years[j])$int16()$rename('year'))
  
  ## subset sample points for the region 
  samples_ij <- samples
  print(paste0('number of points: ', samples_ij$size()$getInfo()))      
  
  ## get training samples
  training_i <- mosaic_i$sampleRegions(collection= samples_ij,
                                       scale= 30,
                                       geometries= TRUE,
                                       tileScale= 2)
  
  ## remove NA or NULL from extracted data
  training_i <- training_i$filter(ee$Filter$notNull(bands))
  
  ## build task to export data
  task <- ee$batch$Export$table$toAsset(
    training_i, paste0('train_col8_rocky_', years[j] , '_v' , version),
    paste0(dirout , 'train_col8_rocky_', years[j] , '_v' , version))
  
  ## start task
  task$start()
  print ('========================================')
  
}
