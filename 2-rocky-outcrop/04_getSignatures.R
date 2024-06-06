## --- --- --- 04_getSignatures
## Exported data is composed by spatialPoints with spectral signature values grouped by column
## Auxiliary bands were computed (Lat, Long, NDVI amplitude and HAND) and imported SRTM geomorphometric features
## barbara.silva@ipam.org.br

## Read libraries
library(rgee)
ee_Initialize()

## Define strings to use as metadata
version <- "3"     ## version string

## Define output directory
dirout <- 'projects/barbaracosta-ipam/assets/collection-9_rocky-outcrop/training/v3/'

## Biome layer
biomes <- ee$Image('projects/mapbiomas-workspace/AUXILIAR/biomas-2019-raster')
cerrado <- biomes$updateMask(biomes$eq(4))

## Define mosaic input 
mosaic <- ee$ImageCollection('projects/nexgenmap/MapBiomas2/LANDSAT/BRAZIL/mosaics-2')$
  filterMetadata('biome', 'equals', 'CERRADO')

## Get mosaic rules
rules <- read.csv('./mosaic_rules.csv')

## Get samplePoints
samples<- ee$FeatureCollection('projects/barbaracosta-ipam/assets/collection-9_rocky-outcrop/sample/points/samplePoints_v3')

## Define years to extract spectral signatures (temporal operator)
years <- unique(mosaic$aggregate_array('year')$getInfo())

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

## For each year
for (j in 1:length(years)) {
  
  ## Compute additional bands
  geo_coordinates <- ee$Image$pixelLonLat()
 
  ## Get latitude
  lat <- geo_coordinates$select('latitude')$
      add(5)$
      multiply(-1)$
      multiply(1000)$
      toInt16()
  
  ## Get longitude
  lon_sin <- geo_coordinates$select('longitude')$
      multiply(pi)$divide(180)$
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
  
  ## Get height above nearest drainage
  hand <- ee$ImageCollection("users/gena/global-hand/hand-100")$
      mosaic()$
      toInt16()$
      rename('hand')
  
  ## Get the Landsat mosaic for the current year 
  mosaic_i <- mosaic$filterMetadata('year', 'equals', years[j])$
    filterMetadata('satellite', 'equals', subset(rules, year == years[j])$sensor)$
    mosaic()$select(bands)
  
  ## If the year is greater than 1986, get the 3yr NDVI amplitude
  if (years[j] > 1986) {
    print('Computing NDVI Amplitude (3yr)')
   
    ## Get previous year mosaic 
    mosaic_i1 <- mosaic$filterMetadata('year', 'equals', years[j] - 1)$
      filterMetadata('satellite', 'equals', subset(rules, year == years[j])$sensor_past1)$
      mosaic()$select(c('ndvi_median_dry','ndvi_median_wet'))
    
    ## Get previous 2yr mosaic 
    mosaic_i2 <- mosaic$filterMetadata('year', 'equals', years[j] - 2)$
      filterMetadata('satellite', 'equals', subset(rules, year == years[j])$sensor_past2)$
      mosaic()$select(c('ndvi_median_dry','ndvi_median_wet'))
    
    ## Compute the minimum NDVI over dry season 
    min_ndvi <- ee$ImageCollection$fromImages(c(mosaic_i$select('ndvi_median_dry'),
                                                mosaic_i1$select('ndvi_median_dry'),
                                                mosaic_i2$select('ndvi_median_dry')))$min()
    
    ## Compute the maximum NDVI over wet season 
    max_ndvi <- ee$ImageCollection$fromImages(c(mosaic_i$select('ndvi_median_wet'),
                                                mosaic_i1$select('ndvi_median_wet'),
                                                mosaic_i2$select('ndvi_median_wet')))$max()
    
    ## Get the amplitude
    amp_ndvi <- max_ndvi$subtract(min_ndvi)$rename('amp_ndvi_3yr')
  }
  
  ## If the year[j] is lower than 1987, get null image as amp
  if (years[j] < 1987){
    amp_ndvi <- ee$Image(0)$rename('amp_ndvi_3yr')
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
    addBands(dem)$
    addBands(ee$Image(years[j])$int16()$rename('year'))
  
  ## Print samples
  samples_ij <- samples
  print(paste0('number of points: ', samples_ij$size()$getInfo()))      
  
  ## Get training samples
  training_i <- mosaic_i$sampleRegions(collection= samples_ij,
                                       scale= 30,
                                       geometries= TRUE,
                                       tileScale= 4)
  
  ## Remove NA or NULL from extracted data
  training_i <- training_i$filter(ee$Filter$notNull(bands))
  
  ## Build task to export data
  task <- ee$batch$Export$table$toAsset(
    training_i, 
    paste0('train_col9_rocky_', years[j] , '_v' , version),
    paste0(dirout , 'train_col9_rocky_', years[j] , '_v' , version)
  )
  
  ## Start task
  task$start()
  print('========================================')
  print(paste("Ano:", years[j]))
  print('========================================')
}

## done! :)
