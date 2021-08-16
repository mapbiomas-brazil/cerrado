## perform accuracy analisys 
## developed by IPAM
## write to dhemerson.costa@ipam.org.br

## read libraries
library (dplyr)
library (ggplot2)
library (sf)

## define root directory for accuracy tables
path <- '../tables/specific_accuracy/'

## define spatial data
spatial <- read_sf(dsn= '../vectors', layer= 'cerrado_c6_regions')
plot(spatial) ## check spatial data

## define functions to be used along the analisys

## function to read accuracy tables
read_accTables <- function (x) {
  ## list files into root directory
  files <- list.files(x)
  ## create empty recipe
  recipe <- as.data.frame(NULL)
  ## read each file and merge into recipe
  for (i in 1:length(files)) {
    ## import tables, excluding "system:index" [1] and ".geo" [13] columns
    table <- read.csv(paste0(path, files[i]))[-1][-13]
    ## merge current table to recipe
    recipe <- rbind(recipe, table)
  }
  ## return merged tables
  return (recipe)
}

## compute omission error mean 
omissionMean <- function(input) {
  temp <- input
  ## compute mean value for omission error
  forest_omission <- aggregate (list(temp$FOREST_OMISSION), by= list(temp$mapb), FUN= "mean")
  savanna_omission <- aggregate (list(temp$SAVANNA_OMISSION), by= list(temp$mapb), FUN= "mean")
  grassland_omission <- aggregate (list(temp$GRASSLAND_OMISSION), by= list(temp$mapb), FUN= "mean")
  
  ## rename cols
  colnames(forest_omission)[2] <- "Mean"; colnames(forest_omission)[2] <- "Mean"; forest_omission$level <- "Omission Error" ; forest_omission$class <- "Forest"
  colnames(savanna_omission)[2] <- "Mean"; savanna_omission$level <- "Omission Error" ; savanna_omission$class <- "Savanna"
  colnames(grassland_omission)[2] <- "Mean"; grassland_omission$level <- "Omission Error" ; grassland_omission$class <- "Grassland"
  
  ## bind data
  omission_error <- rbind (forest_omission, savanna_omission, grassland_omission)
  colnames(omission_error)[1] <- 'mapb'
  
  ## join with spatial
  omission_error <- left_join(spatial, omission_error, by= 'mapb')
  omission_error$Mean[omission_error$Mean == 1] <- NA
  
  return (omission_error)
}

## compute commission error mean 
commissionMean <- function(input) {
  temp <- input

  ## compute mean value for commission error
  forest_commission <- aggregate (list(temp$FOREST_COMMISSION), by= list(temp$mapb), FUN= "mean")
  savanna_commission <- aggregate (list(temp$SAVANNA_COMMISSION), by= list(temp$mapb), FUN= "mean")
  grassland_commission <- aggregate (list(temp$GRASSLAND_COMMISSION), by= list(temp$mapb), FUN= "mean")
  
  ## rename cols
  colnames(forest_commission)[2] <- "Mean"; forest_commission$level <- "Commission Error" ; forest_commission$class <- "Forest"
  colnames(savanna_commission)[2] <- "Mean"; savanna_commission$level <- "Commission Error" ; savanna_commission$class <- "Savanna"
  colnames(grassland_commission)[2] <- "Mean"; grassland_commission$level <- "Commission Error" ; grassland_commission$class <- "Grassland"
  
  ## bind data
  commission_error <- rbind (forest_commission, savanna_commission, grassland_commission)
  colnames(commission_error)[1] <- 'mapb'
  
  ## join with spatial
  commission_error <- left_join(spatial, commission_error, by= 'mapb')
  commission_error$Mean[commission_error$Mean == 1] <- NA
  
  return (commission_error)
}

## import accuracy tables
## parameter x refers to the root directory where CSV files are stored
data <- read_accTables(x= path) 

## assign spatial reference to accuracy table
## for this, you need to specify the field tht corresponds to the "region ID" in the CSV and spatial data
## in the mapibomas cerrado case we use the field "mapb"
data <- left_join (spatial, data, by= "mapb")

## compute omission  and commission errors mean by class
omission_error <- omissionMean(input= data)
commission_error <- commissionMean(input= data)

## plot map of global accuracy by year
x11()
ggplot () +
  geom_sf(data=na.omit(data), aes(fill=GLOBAL_ACC), color="gray50", size= 0.1, alpha=0.9) + 
  facet_wrap(~YEAR, ncol=7) + 
  scale_fill_fermenter(n.breaks=6, palette= "RdYlGn", na.value="gray90", direction = 1) +
  labs(fill="Global accuracy")  + 
  ggtitle("Cerrado V7 (without wetlands)") +
  theme_minimal()

## plot boxplot of global accuracy by year
ggplot (data, aes(x= as.factor(YEAR), y= GLOBAL_ACC)) +
  geom_jitter(alpha=0.1) +
  geom_boxplot(fill='green4', alpha=0.5) +
  theme_minimal() +
  xlab('Year') + ylab ('Global Accuracy') +
  theme(axis.text.x = element_text(angle = 90, vjust = 0.5, hjust=1))

## plot mean omission by class
ggplot () +
  geom_sf(data=na.omit(omission_error), aes(fill=Mean), color="gray50", size= 0.1, alpha=0.9) + 
  facet_wrap(~class, ncol=7) + 
  scale_fill_fermenter(n.breaks=6, palette= "RdYlGn", na.value="gray90", direction = -1) +
  labs(fill="Omission Error")  + 
  ggtitle("Cerrado V7 (without wetlands)") +
  theme_minimal()

## plot mean commission by class
ggplot () +
  geom_sf(data=na.omit(commission_error), aes(fill=Mean), color="gray50", size= 0.1, alpha=0.9) + 
  facet_wrap(~class, ncol=7) + 
  scale_fill_fermenter(n.breaks=6, palette= "RdYlGn", na.value="gray90", direction = -1) +
  labs(fill="Commission Error")  + 
  ggtitle("Cerrado V7 (without wetlands)") +
  theme_minimal()

