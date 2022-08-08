## get balancing parameters and perform adjustment
## dhemerson.costa@ipam.org.br

## load packages
library(rgee)
library(sf)
library(caret)
library(randomForest)
library(AppliedPredictiveModeling)

## initialize earth engine 
ee_Initialize()

## load unfiltered samples 
samples <- ee_as_sf(ee$FeatureCollection('users/dh-conciani/collection7/sample/points/samplePoints_v2'), 
                    maxFeatures= 1e6,
                    via= 'drive')

## load samples filtered by segments
filtered <- ee_as_sf(ee$FeatureCollection('users/dh-conciani/collection7/sample/filtered_points/consolidated/samplePoints_filtered_v2'),
                     maxFeatures= 1e6,
                     via= 'drive')

## load classification regions
regions <- ee_as_sf(ee$FeatureCollection('users/dh-conciani/collection7/classification_regions/vector'),
                    via= 'getInfo')

## load validation points
validation <- ee_as_sf(ee$FeatureCollection('projects/mapbiomas-workspace/VALIDACAO/MAPBIOMAS_100K_POINTS_utf8')
                       ## filter to the extent of classification regions
                       $filterBounds(ee$FeatureCollection('users/dh-conciani/collection7/classification_regions/vector')),
                       maxFeatures= 1e6,
                       via= 'drive')

## remove validation points that have been edited 
validation <- subset(validation, POINTEDITE != 'true')

## paste metadata
filtered$version <- 'filtered_by_segments'
samples$version <- 'unfiltered'; samples <- samples[-2]
data <- rbind(filtered, samples)

## plot
ggplot(data= data, mapping= aes(x= as.factor(reference), fill= as.factor(reference))) +
  facet_wrap(~version) +
  stat_count(alpha=0.9) +
  scale_fill_manual('Class', values=c('#006400', '#00ff00', '#B8AF4F', '#FFD966', '#E974ED', '#fff3bf', '#ff3d3d', '0000FF')) +
  theme_bw() +
  xlab('Mapbiomas class') +
  ylab('n. of samples')


## compute regionalized distributions 
## set recipe 
recipe <- as.data.frame(NULL)
for (i in 1:length(unique(regions$mapb))) {
  ## print region name
  print(unique(regions$mapb)[i])
  ## subset region
  region_i <- subset(regions, mapb == regions$mapb[i])
  ## clip samples for the region [i]
  print('computing intersection')
  data_i <- st_intersection(data, region_i)
  data_i$value <- 1 ## insert value to identify points 
  
  ## count the number of samples in each class and version 
  prop_i <- aggregate(x=list(count= data_i$value), 
                      by= list(class= data_i$reference, version= data_i$version),
                      FUN = 'sum')
  
  ## set recipe_j and compute proportions 
  recipe_j <- as.data.frame(NULL)
  ## for each version
  for (j in 1:length(unique(prop_i$version))) {
    temp <- subset(prop_i, version == unique(prop_i$version)[j])
    temp$ratio <- temp$count/sum(temp$count) * 100
    recipe_j <- rbind(recipe_j, temp); rm(temp)
  }
  ## remove temporary files
  rm(region_i, data_i, prop_i, recipe_j, temp); gc()
}


