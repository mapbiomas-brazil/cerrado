## compute confusion matrix for the year of 2013- version 5 from collection 6
## dhemerson.costa@IPAM.org.br

## read libraries
library (caret)
library (dplyr)
library (ggplot2)
library (raster)
library (sf)
library (networkD3)
library (reshape2)

## function to convert all mapbiomas agriculture classes to 19
convertAgr <- function (input) {
  input <- gsub('^18$', '19', input)
  input <- gsub('^20$', '19', input)
  input <- gsub('^39$', '19', input)
  input <- gsub('^41$', '19', input)
  input <- gsub('^36$', '19', input)
  input <- gsub('^21$', '19', input)
  
  return (input)
}

## function to adjust LAPIG point labels
adjustLAPIG <- function (input) {
  ## adjust labels
  temp =
    gsub(pattern="^Área mida Natural Nao Florestal$", replacement= "Área Úmida Natural Não Florestal",
         gsub(pattern="^Outra Formação Natural N$", replacement= "Outra Formação Natural Não Florestal",
              gsub(pattern="爀", replacement= "ã",
                   gsub(pattern="椀", replacement= "ã",
                        gsub(pattern="Minerao", replacement= "Mineração",
                             gsub(pattern="No", replacement= "Não",
                                  gsub(pattern="NOo", replacement= "Não",
                                       gsub(pattern="rea", replacement= "Área",
                                            gsub(pattern="ལ", replacement= "ã", 
                                                 gsub(pattern="]", replacement= "ã", 
                                                      gsub(pattern="汃", replacement= "ã", 
                                                           gsub(pattern="Savnica", replacement= "Savânica", 
                                                                gsub(pattern= "瀀", replacement= "ã",
                                                                     gsub(pattern="Formao", replacement= "Formação",
                                                                          gsub(pattern= '[0-9]+', replacement= "", 
                                                                               input)))))))))))))))
  
  return (temp)
}

## function to convert LAPIG labels into integer 
str_to_integer <- function (str) {
  temp <- gsub("Formação Florestal", "3", str)
  temp <- gsub("Formação Campestre", "12", temp)
  temp <- gsub("Formação Savânica", "4", temp)
  temp <- gsub("Pastagem Cultivada", "15", temp)
  temp <- gsub("Rio, Lago e Oceano", "33", temp)
  temp <- gsub("Cultura Anual", "19", temp)
  temp <- gsub("Outra Área Não Vegetada", "25", temp)
  temp <- gsub("Cultura Semi-Perene", "19", temp)
  temp <- gsub("Cultura Perene", "19", temp)
  
  return (temp)
}

## function to convert integer to string
integer_to_str <- function (str) {
  temp <- gsub("^ 3$", "Forest", str)
  temp <- gsub("^ 4$", "Savanna", temp)
  temp <- gsub("^ 12$", "Grassland", temp)
  temp <- gsub("^ 15$", "Pasture", temp)
  temp <- gsub("^ 19$", "Agriculture", temp)
  temp <- gsub("^ 25$", "Other nonVeg", temp)
  temp <- gsub("^ 33$", "Water", temp)
  
  return (temp)
}

## function to convert integer to string
integer_to_str_source <- function (str) {
  temp <- gsub("^3$", "Forest", str)
  temp <- gsub("^4$", "Savanna", temp)
  temp <- gsub("^12$", "Grassland", temp)
  temp <- gsub("^15$", "Pasture", temp)
  temp <- gsub("^19$", "Agriculture", temp)
  temp <- gsub("^25$", "Other nonVeg", temp)
  temp <- gsub("^33$", "Water", temp)
  
  return (temp)
}

# function to convert integer to string
integer_to_str_target <- function (str) {
  temp <- gsub("^3$", "Forest", str)
  temp <- gsub("^4$", "Savanna", temp)
  temp <- gsub("^11$", "Wetland", temp)
  temp <- gsub("^12$", "Grassland", temp)
  temp <- gsub("^21$", "Mosaic", temp)
  temp <- gsub("^25$", "Other nonVeg", temp)
  temp <- gsub("^33$", "Water", temp)
  
  return (temp)
}

## function to extract metrics by class
extract_metrics <- function (c5, c6) {
  ## sensitivity
  sens <- as.data.frame(c5$byClass)[1]
  sens$level <- 'col5'
  sens$class <- rownames(sens)
  sens6 <- as.data.frame(c6$byClass)[1]
  sens6$level <- 'col6'
  sens6$class <- rownames(sens6)
  sens <- rbind (sens, sens6)
  sens$metric <- "omission error"
  colnames(sens)[1] <- 'value'
  
  
  ## specificity
  spec <- as.data.frame(c5$byClass)[2]
  spec$level <- 'col5'
  spec$class <- rownames(spec)
  spec6 <- as.data.frame(c6$byClass)[2]
  spec6$level <- 'col6'
  spec6$class <- rownames(spec6)
  spec <- rbind (spec, spec6)
  spec$metric <- "commission error"
  colnames(spec)[1] <- 'value'
  
  ##merge
  metrics <- rbind (spec, sens)
  metrics$value <- 1 - metrics$value
  
  ## format
  metrics$class <- gsub ("Class:", "", metrics$class)
  
  return (metrics)
}

## load classification 
r_c6 <- raster ('../raster/col6_v8_wetlands_v6_finalv1_remmaped/col6_v8_wet6_final1.tif')

## load LAPIG points
val_points <- read_sf(dsn= '../shapefiles/points_cerrado.shp')

## format LAPIG inconsistenses
val_points$CLASS_2013 <- str_to_integer(str= adjustLAPIG(input= val_points$CLASS_2013))

## subset validation points only to Cerrado classes
val_points <- subset (val_points, CLASS_2013 == 3  | 
                                  CLASS_2013 == 4  |
                                  CLASS_2013 == 12 |
                                  CLASS_2013 == 15 |
                                  CLASS_2013 == 19 |
                                  CLASS_2013 == 33 )


## extract data from classification collection 6 v5
val_points$COL6_V8 <- raster::extract(x= r_c6, y= val_points)

## convert to agriculure
val_points$COLECAO_5_ <- convertAgr (val_points$COLECAO_5_)

## subset validation points only to Cerrado classes 
val_points_c6 <- subset (val_points, COL6_V8 == 3  | 
                          COL6_V8 == 4  |
                          COL6_V8 == 11 |
                          COL6_V8 == 12 |
                          COL6_V8 == 21 |
                          #COL6_V8 == 19 |
                          COL6_V8 == 33 )

## subset validation points only to Cerrado classes 
val_points_c5 <- subset (val_points, COLECAO_5_ == 3  | 
                           COLECAO_5_ == 4  |
                           COLECAO_5_ == 12 |
                           COLECAO_5_ == 15 |
                           COLECAO_5_ == 19 |
                           COLECAO_5_ == 33 )

## compute confusion matrix - C6
confusion_C6 <- caret::confusionMatrix(data= as.factor(val_points_c6$COL6_V5), 
                                       reference= as.factor(val_points_c6$CLASS_2013))

## compute confusion matrix - C5
confusion_C5 <- caret::confusionMatrix(data= as.factor(val_points_c5$COLECAO_5_), 
                                       reference= as.factor(val_points_c5$CLASS_2013))

## compute metrics 
metrics <- extract_metrics(c5= confusion_C5, c6= confusion_C6)

## convert integer to string
metrics$class <- integer_to_str(str=metrics$class)

## Plot collection 6 
ggplot(as.data.frame(confusion_C6$table), aes(Prediction,sort(Reference,decreasing = T), fill= Freq)) +
  geom_tile() + geom_text(aes(label=Freq)) +
  scale_fill_gradient(low="white", high="red") +
  labs(x = "Reference",y = "Prediction") +
  scale_x_discrete(labels=c("Grassland","Pasture","Agriculture","Forest", "Water", "Savanna")) +
  scale_y_discrete(labels=c("Savanna", "Water", "Forest","Agriculture","Pasture","Grassland"))

## Plot collection 5 
ggplot(as.data.frame(confusion_C5$table), aes(Prediction,sort(Reference,decreasing = T), fill= Freq)) +
  geom_tile() + geom_text(aes(label=Freq)) +
  scale_fill_gradient(low="white", high="red") +
  labs(x = "Reference",y = "Prediction") +
  scale_x_discrete(labels=c("Grassland","Pasture","Agriculture","Forest", "Water", "Savanna")) +
  scale_y_discrete(labels=c("Savanna", "Water", "Forest","Agriculture","Pasture","Grassland"))

## plot metrics
ggplot (metrics, aes(x=as.factor(class), y= value, fill= level)) +
  geom_bar(stat="identity", position= position_dodge(), alpha=0.9) +
  facet_wrap(~metric) +
  scale_fill_manual(values= c('orangered3', 'forestgreen')) + 
  ylab('Value') + xlab ('Class') +
  theme_bw()

## perform transition analisys
## subset 
data <- subset (val_points_c6, COLECAO_5_ == 3  | 
                COLECAO_5_ == 4  |
                COLECAO_5_ == 12 |
                COLECAO_5_ == 15 |
                COLECAO_5_ == 19 |
                COLECAO_5_ == 33 )

## perform count
data <- melt(table(source= data$COLECAO_5_, target= data$COL6_V8))

## remove values equal to zero
data$value[data$value<100] <- NA
data <- na.omit(data)


## convert interger to string
data$source <- integer_to_str_source(data$source)
data$target <- integer_to_str_target(data$target)
data$target <- paste(data$target, " ", sep="")

## compute nodes
node <- data.frame(name=c(as.character(data$source), as.character(data$target)) %>% unique())

## create labels
data$IDsource <- match(data$source, node$name)-1 
data$IDtarget <- match(data$target, node$name)-1

## create pallete
ColourScal = 'd3.scaleOrdinal() .domain(["Forest", "Savanna", "Grassland", "Wetland", "Pasture", "Agriculture", "Mosaic", "Water"]) 
                .range(["#006400", "#32CD32", "#B8AF4F", "#45C2A5", "#FFD966", "#E974ED", "#fff3bf", "#0000FF"])'

# Make the Network
sankeyNetwork(Links = data, Nodes = node,
              Source = "IDsource", Target = "IDtarget",
              Value = "value", NodeID = "name", 
              LinkGroup = "source",
              sinksRight= FALSE, 
              colourScale=ColourScal,
              nodeWidth= 25, nodePadding= 25, 
              fontSize= 13, fontFamily= "Arial")


