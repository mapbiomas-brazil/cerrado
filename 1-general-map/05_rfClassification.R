## -- -- -- -- 05_rfClassification
## Run smileRandomForest classifier - Mapbiomas Collection 9.0
## dhemerson.costa@ipam.org.br and barbara.silva@ipam.org.br

## Read libraries
library(rgee)
library(dplyr)
library(stringr)
ee_Initialize()

## Define strings to be used as metadata
samples_version <- '8'   # input training samples version
output_version <-  '8'   # output classification version 

## Define output asset
output_asset <- 'projects/mapbiomas-workspace/COLECAO_DEV/COLECAO9_DEV/CERRADO/C9-GENERAL-MAP-PROBABILITY/'

## Read landsat mosaic 
mosaic <- ee$ImageCollection('projects/nexgenmap/MapBiomas2/LANDSAT/BRAZIL/mosaics-2')$
  filterMetadata('biome', 'equals', 'CERRADO')

## Define years to be classified
years <- unique(mosaic$aggregate_array('year')$getInfo())

## Read classification regions (vetor)
regions_vec <- ee$FeatureCollection('users/dh-conciani/collection7/classification_regions/vector_v2')

## Classification regions (imageCollection, one region per image)
regions_ic <- 'users/dh-conciani/collection7/classification_regions/eachRegion_v2_10m/'

## Define regions to be processed 
regions_list <- sort(unique(regions_vec$aggregate_array('mapb')$getInfo()))

## Get already computed files (for current version)
files <- ee_manage_assetlist(path_asset= output_asset)

## Generate expected files
expected <- as.vector(outer(regions_list, years, function(r, y) {
  paste0(output_asset, 'CERRADO_', r, '_', y, '_v', output_version)
})
)

# Find remaining files to process
missing <- expected[!expected %in% files$ID]

## Define class dictionary
classDict <- list(
  class= c(3, 4, 11, 12, 15, 18, 25, 33),
  name = c('Forest', 'Savanna', 'Wetland', 'Grassland', 'Pasture', 'Agriculture', 'Non-Vegetated', 'Water')
)

### Training samples (prefix string)
training_dir <- 'projects/mapbiomas-workspace/COLECAO_DEV/COLECAO9_DEV/CERRADO/training/'

## Get mosaic rules
rules <- read.csv('./_aux/mosaic_rules.csv')

## Get bandnames to be extracted
bands <- mosaic$first()$bandNames()$getInfo()

## Remove bands with 'cloud' into their names
bands <- bands[- which(sapply(strsplit(bands, split='_', fixed=TRUE), function(x) (x[1])) == 'cloud' )]

# Extract the region using regex
regions_list <- unique(gsub(".*CERRADO_([0-9]+)_.*", "\\1", missing))

## For each region
for (i in 1:length(regions_list)) {
  print(paste0('processing region [', regions_list[i], ']'))
  
  ## Get the vector for the region [i]
  region_i_vec <- regions_vec$filterMetadata('mapb', 'equals', regions_list[i])$geometry()
  
  ## Get the raster for the region [i]
  region_i_ras = ee$Image(paste0(regions_ic, 'reg_', regions_list[i]))
  
  ## Compute static auxiliary bands
  geo_coordinates <- ee$Image$pixelLonLat()$
    updateMask(region_i_ras)
  
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
    unmask(0)$
    updateMask(region_i_ras)$
    rename('hand')
  
  ## Time since last fire
  fire_age <- ee$Image('users/barbarasilvaIPAM/collection8/masks/fire_age_v2')
  ## add 2023 
  fire_age <- fire_age$addBands(fire_age$select('classification_2022')$rename('classification_2023'))
  
  # Use grep to match exactly followed by the year and version
  missing_i <- missing[grep(paste0('CERRADO_', regions_list[i], '_[0-9]{4}_v8$'), missing)]
  
  # Extract the years using sregex
  years_ij <- as.numeric(str_extract(missing_i, "[0-9]{4}"))
  
  ## For each year
  for (j in 1:length(years_ij)) {
    print(paste0('----> ', years_ij[j]))
    
    ## Get the landsat mosaic for the current year 
    mosaic_i <- mosaic$filterMetadata('year', 'equals', years_ij[j])$
      filterMetadata('satellite', 'equals', subset(rules, year == years_ij[j])$sensor)$
      mosaic()$
      updateMask(region_i_ras)$   # filter for the region
      select(bands)               # select only relevant bands
    
    ## Compute the NDVI amplitude, following mosaic rules 
    ## If the year is greater than 1986, get the 3yr NDVI amplitude
    if (years_ij[j] > 1986) {
      ##print('Computing NDVI Amplitude (3yr)')
      
      ## Get previous year mosaic 
      mosaic_i1 <- mosaic$filterMetadata('year', 'equals', years_ij[j] - 1)$
        filterMetadata('satellite', 'equals', subset(rules, year == years_ij[j])$sensor_past1)$
        mosaic()$
        select(c('ndvi_median_dry','ndvi_median_wet'))$
        updateMask(region_i_ras)
      
      ## Get previous 2yr mosaic 
      mosaic_i2 <- mosaic$filterMetadata('year', 'equals', years_ij[j] - 2)$
        filterMetadata('satellite', 'equals', subset(rules, year == years_ij[j])$sensor_past2)$
        mosaic()$
        select(c('ndvi_median_dry','ndvi_median_wet'))$
        updateMask(region_i_ras)
      
      ## Compute the minimum NDVI over dry season 
      min_ndvi <- ee$ImageCollection$fromImages(c(mosaic_i$select('ndvi_median_dry'),
                                                  mosaic_i1$select('ndvi_median_dry'),
                                                  mosaic_i2$select('ndvi_median_dry')))$min()
      
      ## Compute the maximum NDVI over wet season 
      max_ndvi <- ee$ImageCollection$fromImages(c(mosaic_i$select('ndvi_median_wet'),
                                                  mosaic_i1$select('ndvi_median_wet'),
                                                  mosaic_i2$select('ndvi_median_wet')))$max()
      
      ## Get the amplitude
      amp_ndvi <- max_ndvi$subtract(min_ndvi)$
        rename('amp_ndvi_3yr')$
        updateMask(region_i_ras)
      
      ## Get the time since last fire
      fire_age_i <- fire_age$select(paste0('classification_',years_ij[j]))$
        rename('fire_age')$
        updateMask(region_i_ras)
      
    }
    
    ## If the year[j] is lower than 1987, get null image as amplitude
    if (years_ij[j] < 1987){
      amp_ndvi <- ee$Image(0)$
        rename('amp_ndvi_3yr')$
        updateMask(region_i_ras)
      
      fire_age_i <- ee$Image(5)$
        rename('fire_age')$
        updateMask(region_i_ras)
      
    }
    
   ## Join the mapbiomas mosaic with the auxiliary bands
    mosaic_i <- mosaic_i$addBands(lat)$
      addBands(lon_sin)$
      addBands(lon_cos)$
      addBands(hand)$
      addBands(amp_ndvi)$
      addBands(fire_age_i)
    
    ## Limit water samples only to 175 samples (avoid over-estimation)
    water_samples <- ee$FeatureCollection(paste0(training_dir, 'v', samples_version, '/train_col9_reg', regions_list[i], '_', years_ij[j], '_v', samples_version))$
      filter(ee$Filter$eq("reference", 33))$
      filter(ee$Filter$eq("hand", 0))$
      limit(175)                        ## insert water samples limited to 175 
    
    ## Merge filtered water samples with other classes
    training_ij <- ee$FeatureCollection(paste0(training_dir, 'v', samples_version, '/train_col9_reg', regions_list[i], '_', years_ij[j], '_v', samples_version))$
      filter(ee$Filter$neq("reference", 33))$ ## remove water samples
      merge(water_samples)
    
    ## Get bands
    bandNames_list <- mosaic_i$bandNames()$getInfo()
    
    ## Train classifier
    classifier <- ee$Classifier$smileRandomForest(
      numberOfTrees= 300,
      variablesPerSplit= floor(sqrt(length(bandNames_list))))$
      setOutputMode('MULTIPROBABILITY')$
      train(training_ij, 'reference', bandNames_list)
    
    ## Perform classification and mask only to region 
    predicted <- mosaic_i$classify(classifier)$
      updateMask(region_i_ras)
    
    ## Retrieve classified classes
    classes <- sort(training_ij$aggregate_array('reference')$distinct()$getInfo())
    
    ## Flatten array of probabilities
    probabilities <- predicted$arrayFlatten(list(as.character(classes)))
    
    ## Rename
    probabilities <- probabilities$select(as.character(classes), 
                                          classDict$name[match(classes, classDict$class)])
    
    ## Scale probabilities to 0-100
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
      set('mapb', as.numeric(regions_list[i]))$
      set('year', as.numeric(years_ij[j]))
    
    ## Create filename
    file_name <- paste0('CERRADO_', regions_list[i], '_', years_ij[j], '_v', output_version)
    
    ## Build task
    task <- ee$batch$Export$image$toAsset(
      image= toExport,
      description= file_name,
      assetId= paste0(output_asset, file_name),
      scale= 30,
      maxPixels= 1e13,
      pyramidingPolicy= list('.default' = 'mode'),
      region= region_i_ras$geometry()
    )
    
    ## Export 
    task$start()
    
  } ## End of year processing
  
  print ('------------> NEXT REGION --------->')
}

print('All tasks have been started. Now wait a few hours and have fun :)')
