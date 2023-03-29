## get accuracy for test version in the mapbiomas collection 7
## dhemerson.costa@ipam.org.br

## get libraries
library(rgee)
library(reticulate)
library(caret)
library(reshape2)

## initialize
ee_Initialize()

## set directories
file_path <- 'projects/mapbiomas-workspace/public/collection7_1/'

##  define files to be computed
file_name <- c(
  #'CERRADO_col7_gapfill_incidence_temporal_v21'
  'mapbiomas_collection71_integration_v1'
)


## set output path (local)
output <- './table/regionalAccuracy/'

## import validation points
validation_points = ee$FeatureCollection('projects/mapbiomas-workspace/VALIDACAO/MAPBIOMAS_100K_POINTS_utf8');

## set classes to select from validation dataset
selectClasses = c(
  "Rio, Lago e Oceano",
  "Formação Savânica",
  "Formação Florestal",
  "Formação Campestre",
  "Pastagem Cultivada",
  "Cultura Anual",
  "Cultura Perene",
  "Cultura Semi-Perene"
) 

## get classification regions
regions <- ee$FeatureCollection('users/dh-conciani/collection7/classification_regions/vector_v2')
regions_list <- sort(regions$aggregate_array('mapb')$getInfo())

## set years to be processed
years <- seq(from=1985, to= 2018)

## set dictionary
classes <- ee$Dictionary(list(
  "Cultura Anual"= 21,            
  "Cultura Perene"= 21,           
  "Cultura Semi-Perene"= 21,      
  "Pastagem Cultivada"= 21,       
  "Formação Florestal"= 3,
  "Rio, Lago e Oceano"= 33,
  "Formação Campestre"= 12,
  "Formação Savânica"= 4)
)

## for each file
for (i in 1:length(unique(file_name))) {
  print(paste0('processing file --> ', file_name[i]))
  ## read file [i]
  collection <- ee$Image(paste0(file_path, file_name[i]))
  
  ## set recipes
  recipe_metrics <- as.data.frame(NULL)
  recipe_table <- as.data.frame(NULL)
  
  ## for each year
  for(j in 1:length(unique(years))) {
    ## select year [j] and remap
    print(paste0('processing year -->', years[j]))
    
    collection_ij <- collection$select(paste0('classification_', years[j]))$
      remap(c(3, 4, 5, 11, 12, 29, 15, 19, 39, 20, 40, 41, 46, 47, 48, 21, 23, 24, 30, 25, 33, 31),
            c(3, 4, 3, 12, 12, 25, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 25, 25, 25, 25, 33, 33))$
      rename(paste0('classification_', years[j]))
    
    ## get validation points
    validation_ij <- validation_points$
      filterMetadata('POINTEDITE', 'not_equals', 'true')$
      filter(ee$Filter$inList(paste0('CLASS_', years[j]), selectClasses))$
      filterBounds(regions)$
      map(function(feature) {
        return(feature$set('year', years[j])$
                 set('reference', classes$get(feature$get(paste0('CLASS_', years[j])))))
      })
    
    ## for each region
    for(k in 1:length(unique(regions_list))) {
      print(paste0('processing region --> ', regions_list[k]))
      
      ## clip classification for the region
      classification_ijk <- collection_ij$clip(
        regions$filterMetadata('mapb', 'equals', regions_list[k]))
      
      ## clip val
      validation_ijk <- validation_ij$filterBounds(
        regions$filterMetadata('mapb', 'equals', regions_list[k])$geometry())
      
      ## extract classification value for each point and pair it with the reference data
      paired_data <- classification_ijk$sampleRegions(
        collection= validation_ijk, 
        scale= 30,
        geometries= FALSE)
      
      ## get map classes
      mapped <- paired_data$aggregate_array(paste0('classification_', years[j]))$getInfo()
      ref <- paired_data$aggregate_array('reference')$getInfo()
      
      ## transform lists into factors and merge them 
      toCompute <- as.data.frame(cbind(reference= mapped,
                                       predicted= ref))
      
      ## subset by considering classes that have reference points
      toCompute <- subset(toCompute, predicted %in% unique(toCompute$predicted)[
        which(unique(toCompute$predicted) %in% unique(toCompute$reference))
      ]
      )
      
      ## compute confusion matrix
      confusion <- confusionMatrix(data = as.factor(toCompute$predicted),
                                   reference = as.factor(toCompute$reference))
      
      ## get metrics
      metrics <- rbind(melt(confusion$overall), 
                       melt(confusion$byClass[,11]))
      
      ## build results 
      ## insert variables name
      metrics$variable <- row.names(metrics)
      metrics$region <- unique(regions_list)[k]
      metrics$year <- years[j]
      metrics$file <- file_name[i]
      
      ## get confusion table
      confusionTable <- as.data.frame(confusion$table)
      confusionTable$region <- unique(regions_list)[k]
      confusionTable$year <- years[j]
      confusionTable$file <- file_name[i]
      
      ## bind data 
      recipe_metrics <- rbind(recipe_metrics, metrics)
      recipe_table <- rbind(recipe_table, confusionTable)
    }
  }
  ## save file results
  print('exporting results')
  write.csv(recipe_metrics, file= paste0(output, 'metrics_', file_name[i], '.csv'))
  write.csv(recipe_table, file= paste0(output, 'table_', file_name[i], '.csv'))
}
print('done, enjoy :)')
