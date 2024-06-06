## --- --- --- 04_getSignatures
## Exported data is composed by spatialPoints with spectral signature values grouped by column
## Auxiliary bands were computed (Lat, Long, NDVI amplitude and HAND)
## dhemerson.costa@ipam.org.br and barbara.silva@ipam.org.br

## Read libraries
library(rgee)
library(stringr)
ee_Initialize()

## Define version to be checked 
version_in <- "4"     ## version string
version_out <- "8"

## Set folder to be checked 
dirout <- paste0('projects/mapbiomas-workspace/COLECAO_DEV/COLECAO9_DEV/CERRADO/training/v', version_out, '/')

## List files on the asset
files <- ee_manage_assetlist(path_asset= dirout)

## Set regions ids
regions <- 1:38

## set years
years <- 1985:2023

# Generate expected patterns
expected <- as.vector(outer(regions, years, function(r, y) {
  paste0('projects/mapbiomas-workspace/COLECAO_DEV/COLECAO9_DEV/CERRADO/training/v', version_out, '/train_col9_reg', r, '_', y, '_v', version_out)
  })
)

# Find missing entries
missing <- expected[!expected %in% files$ID]

## -- ## -- ## -- ## -- ## -- ## -- ## -- ## -- ## -- ## -- ## -- ##
## Biome layer
biomes <- ee$Image('projects/mapbiomas-workspace/AUXILIAR/biomas-2019-raster')
cerrado <- biomes$updateMask(biomes$eq(4))

## Define mosaic input 
mosaic <- ee$ImageCollection('projects/nexgenmap/MapBiomas2/LANDSAT/BRAZIL/mosaics-2')$
  filterMetadata('biome', 'equals', 'CERRADO')

## Get mosaic rules
rules <- read.csv('./_aux/mosaic_rules.csv')

## Import classification regions
regionsCollection <- ee$FeatureCollection('users/dh-conciani/collection7/classification_regions/vector_v2')

## Import sample points
samples <- ee$FeatureCollection(paste0('users/dh-conciani/collection9/sample/points/samplePoints_v', version_in))

## Time since last fire
fire_age <- ee$Image('users/barbarasilvaIPAM/collection8/masks/fire_age_v2')
## add 2023 
fire_age <- fire_age$addBands(fire_age$select('classification_2022')$rename('classification_2023'))

## Get bandnames to be extracted
bands <- mosaic$first()$bandNames()$getInfo()

## Remove bands with 'cloud' into their names
bands <- bands[- which(sapply(strsplit(bands, split='_', fixed=TRUE), function(x) (x[1])) == 'cloud')]

## Process each missing file 
for(m in 1:length(missing)) {
  
  ## Get region name
  region_list <- as.numeric(str_extract(missing[m], "(?<=reg)\\d+"))
  
  # Extract year
  year_i <- str_extract(missing[m], "\\d{4}")
  
  ## Print
  print(missing[m])
  
  ## Subset region
  region_i <- regionsCollection$filterMetadata('mapb', "equals", region_list)$geometry()
  
  ## Compute additional bands
  geo_coordinates <- ee$Image$pixelLonLat()$clip(region_i)
  
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
      clip(region_i)$
      rename('hand')
  
  ## Get the landsat mosaic for the current year 
  mosaic_i <- mosaic$filterMetadata('year', 'equals', as.numeric(year_i))$
    filterMetadata('satellite', 'equals', subset(rules, year == year_i)$sensor)$
    filterBounds(region_i)$
    mosaic()$select(bands)
  
  ## If the year is greater than 1986, get the 3yr NDVI amplitude
  if (year_i > 1986) {
    print('Computing NDVI Amplitude (3yr)')
  
    ## Get previous year mosaic 
    mosaic_i1 <- mosaic$filterMetadata('year', 'equals', as.numeric(year_i) - 1)$
      filterMetadata('satellite', 'equals', subset(rules, year == year_i)$sensor_past1)$
      mosaic()$select(c('ndvi_median_dry','ndvi_median_wet'))$clip(region_i)
   
    ## Get previous 2yr mosaic 
    mosaic_i2 <- mosaic$filterMetadata('year', 'equals', as.numeric(year_i) - 2)$
      filterMetadata('satellite', 'equals', subset(rules, year == year_i)$sensor_past2)$
      mosaic()$select(c('ndvi_median_dry','ndvi_median_wet'))$clip(region_i)
    
    ## Compute the minimum NDVI over dry season 
    min_ndvi <- ee$ImageCollection$fromImages(c(mosaic_i$select('ndvi_median_dry'),
                                                mosaic_i1$select('ndvi_median_dry'),
                                                mosaic_i2$select('ndvi_median_dry')))$min()
    
    ## Compute the mmaximum NDVI over wet season 
    max_ndvi <- ee$ImageCollection$fromImages(c(mosaic_i$select('ndvi_median_wet'),
                                                mosaic_i1$select('ndvi_median_wet'),
                                                mosaic_i2$select('ndvi_median_wet')))$max()
    
    ## Get the amplitude
    amp_ndvi <- max_ndvi$subtract(min_ndvi)$rename('amp_ndvi_3yr')$clip(region_i);
    
    ## Get the time since last fire
    fire_age_i <- fire_age$select(paste0('classification_', year_i))$rename('fire_age')$clip(region_i)
  }
  
  ## If the year[j] is lower than 1987, get null image as amplitude
  if (year_i < 1987){
    amp_ndvi <- ee$Image(0)$rename('amp_ndvi_3yr')$clip(region_i)
    fire_age_i <- ee$Image(5)$rename('fire_age')$clip(region_i)
  }
  
  ## Join the mapbiomas mosaic with the auxiliary bands
  mosaic_i <- mosaic_i$addBands(lat)$
    addBands(lon_sin)$
    addBands(lon_cos)$
    addBands(hand)$
    addBands(amp_ndvi)$
    addBands(fire_age_i)$
    addBands(ee$Image(as.numeric(year_i))$int16()$rename('year'))
  
  ## Subset sample points for each region 
  samples_ij <- samples$filterBounds(regionsCollection$filterMetadata('mapb', "equals", region_list))
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
    training_i, paste0('train_col9_reg' , region_list , '_' , year_i , '_v' , version_out),
    paste0(dirout , 'train_col9_reg' , region_list , '_' , year_i , '_v' , version_out))
  
  ## Start task
  task$start()
  print ('========================================')
}
