## For clarification, write to <dhemerson.costa@ipam.org.br> 
## Exported data is composed by spatialPoints with spectral signature values grouped by column
## Auxiliary bands were computed (Lat, Long, NDVI amplitude and HAND)

## read libraries
library(rgee)
ee_Initialize()

## define strings to use as metadata (output)
version <- "2"     ## version string

## define output directory
dirout <- 'users/dh-conciani/collection7/training/v2/'

## biome
biomes <- ee$Image('projects/mapbiomas-workspace/AUXILIAR/biomas-2019-raster')
cerrado <- biomes$updateMask(biomes$eq(4))

## define mosaic input 
mosaic <- ee$ImageCollection('projects/nexgenmap/MapBiomas2/LANDSAT/BRAZIL/mosaics-2')$
  filterMetadata('biome', 'equals', 'CERRADO')

## get mosaic rules
rules <- read.csv('./_aux/mosaic_rules.csv')

## import classification regions
regionsCollection <- ee$FeatureCollection('users/dh-conciani/collection7/classification_regions/vector')

## import sample points
samples <- ee$FeatureCollection('users/dh-conciani/collection7/sample/points/samplePoints_v7')

## time since last fire
fire_age <- ee$Image('users/dh-conciani/collection7/masks/fire_age')

## define regions to extract spectral signatures (spatial operator)
regions_list <- unique(regionsCollection$aggregate_array('mapb')$getInfo())

## define years to extract spectral signatures (temporal operator)
years <- unique(mosaic$aggregate_array('year')$getInfo())

## get bandnames to be extracted
bands <- mosaic$first()$bandNames()$getInfo()

## remove bands with 'cloud' or 'shade' into their names
bands <- bands[- which(sapply(strsplit(bands, split='_', fixed=TRUE), function(x) (x[1])) == 'cloud' |
                        sapply(strsplit(bands, split='_', fixed=TRUE), function(x) (x[1])) == 'shade') ]

## for each region 
for (i in 1:length(regions_list)) {
  ## for each year
  for (j in 1:length(years)) {
    ## print status
    print(paste0('region ' , regions_list[i] , ' || year ' , years[j]))
    ## subset region
    region_i <- regionsCollection$filterMetadata('mapb', "equals", regions_list[i])$geometry()
    
    ## compute additional bands
    geo_coordinates <- ee$Image$pixelLonLat()$clip(region_i)
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
      clip(region_i)$rename('hand')
    
    ## get the landsat mosaic for the current year 
    mosaic_i <- mosaic$filterMetadata('year', 'equals', years[j])$
      filterMetadata('satellite', 'equals', subset(rules, year == years[j])$sensor)$
      filterBounds(region_i)$
      mosaic()$select(bands)
    
    ## if the year is greater than 1986, get the 3yr NDVI amplitude
    if (years[j] > 1986) {
      print('Computing NDVI Amplitude (3yr)')
      ## get previous year mosaic 
      mosaic_i1 <- mosaic$filterMetadata('year', 'equals', years[j] - 1)$
        filterMetadata('satellite', 'equals', subset(rules, year == years[j])$sensor_past1)$
        mosaic()$select(c('ndvi_median_dry','ndvi_median_wet'))$clip(region_i)
      ## get previous 2yr mosaic 
      mosaic_i2 <- mosaic$filterMetadata('year', 'equals', years[j] - 2)$
        filterMetadata('satellite', 'equals', subset(rules, year == years[j])$sensor_past2)$
        mosaic()$select(c('ndvi_median_dry','ndvi_median_wet'))$clip(region_i)
      
      ## compute the minimum NDVI over dry season 
      min_ndvi <- ee$ImageCollection$fromImages(c(mosaic_i$select('ndvi_median_dry'),
                                                  mosaic_i1$select('ndvi_median_dry'),
                                                  mosaic_i2$select('ndvi_median_dry')))$min()
      
      ## compute the mmaximum NDVI over wet season 
      max_ndvi <- ee$ImageCollection$fromImages(c(mosaic_i$select('ndvi_median_wet'),
                                                  mosaic_i1$select('ndvi_median_wet'),
                                                  mosaic_i2$select('ndvi_median_wet')))$max()
      
      ## get the amplitude
      amp_ndvi <- max_ndvi$subtract(min_ndvi)$rename('amp_ndvi_3yr')$clip(region_i);
      
      ## get the time since last fire
      fire_age_i <- fire_age$select(paste0('classification_', years[j]))$rename('fire_age')$clip(region_i)
    }
    
    ## if the year[j] is lower than 1987, get null image as amp
    if (years[j] < 1987){
      amp_ndvi <- ee$Image(0)$rename('amp_ndvi_3yr')$clip(region_i)
      fire_age_i <- ee$Image(5)$rename('fire_age')$clip(region_i)
    }
    
    ## bind mapbiomas mosaic and auxiliary bands
    mosaic_i <- mosaic_i$addBands(lat)$
      addBands(lon_sin)$
      addBands(lon_cos)$
      addBands(hand)$
      addBands(amp_ndvi)$
      addBands(fire_age_i)$
      addBands(ee$Image(years[j])$int16()$rename('year'))
    
    ## subset sample points for the region 
    samples_ij <- samples$filterBounds(regionsCollection$filterMetadata('mapb', "equals", regions_list[i]))
    print(paste0('number of points: ', samples_ij$size()$getInfo()))      
    
    ## extract signatures
    #training_i <- samples_ij$map(function(feature) {
    #  feature$set(mosaic_i$reduceRegion(reducer='mean', 
    #                                    geometry= feature$geometry(),
    #                                    scale=30))
    #    }
    #  )
    
    ## get training samples
    training_i <- mosaic_i$sampleRegions(collection= samples_ij,
                                         scale= 30,
                                         geometries= TRUE,
                                         tileScale= 2)
    
    ## remove NA or NULL from extracted data
    training_i <- training_i$filter(ee$Filter$notNull(bands))
    
    ## build task to export data
    task <- ee$batch$Export$table$toAsset(
      training_i, paste0('train_col7_reg' , regions_list[i] , '_' , years[j] , '_v' , version),
      paste0(dirout , 'train_col7_reg' , regions_list[i] , '_' , years[j] , '_v' , version))
    
    ## start task
    task$start()
    print ('========================================')
    
  }
}
