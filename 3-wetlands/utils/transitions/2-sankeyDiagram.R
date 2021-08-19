## compute sankey transitions for wetlands class

# library
library(networkD3)
library(dplyr)
library(reshape2)

## avoid scientific notation
options(scipen=999)

## function to read transitions data 
readTransition <- function (path, file) {
  ## import file
  data <- read.csv(paste0(path, '/', file, '.csv'))
  ## remove undesirable variables
  data <- data[-1][-21][-14][-14][-14][-15][-15][-15]
  ## transform all NA into zero
  data[is.na(data)] <- 0
  
  return(data)
}

## function to reshape table
reshapeTable <- function (object) {
  ## reshape table
  data <- melt(object, value.name= 'area')
  ##round values
  data$area <- round(data$area, digits=0)
  
  return (data)
}

## function to convert ID to Label
id_to_label <- function (chr_vector, step) {
  data <- as.character(chr_vector)
  
  if (step == "start_to_mid") {
    data <- gsub("^X3$", "Forest 00", data)
    data <- gsub("^X4$", "Savanna 00", data)
    data <- gsub("^X9$", "Forestry 00", data)
    data <- gsub("^X11$", "Wetland 00", data)
    data <- gsub("^X12$", "Grassland 00", data)
    data <- gsub("^X15$", "Pasture 00", data)
    data <- gsub("^X20$", "Sugar Cane 00", data)
    data <- gsub("^X24$", "Urban 00", data)
    data <- gsub("^X25$", "Non vegetated 00", data)
    data <- gsub("^X30$", "Mining 00", data)
    data <- gsub("^X33$", "Water 00", data)
    data <- gsub("^X39$", "Soybean 00", data)
    data <- gsub("^X41$", "Agriculture 00", data)
  }
  
  if (step == "mid_to_end") {
    data <- gsub("^X3$", "Forest 19", data)
    data <- gsub("^X4$", "Savanna 19", data)
    data <- gsub("^X9$", "Forestry 19", data)
    data <- gsub("^X11$", "Wetland 19", data)
    data <- gsub("^X12$", "Grassland 19", data)
    data <- gsub("^X15$", "Pasture 19", data)
    data <- gsub("^X20$", "Sugar Cane 19", data)
    data <- gsub("^X24$", "Urban 19", data)
    data <- gsub("^X25$", "Non vegetated 19", data)
    data <- gsub("^X30$", "Mining 19", data)
    data <- gsub("^X33$", "Water 19", data)
    data <- gsub("^X39$", "Soybean 19", data)
    data <- gsub("^X41$", "Agriculture 19", data)
  }
  
  return (data)
}

## function to dissolve data from regions into cerrado 
dissolve_table <- function (table, step) {
  ## aggregate values for the entire cerrado
  data <- aggregate(x= list(area= table$area),
                            by= list(target= table$variable), 
                            FUN= "sum")
  
  ## insert sorce class
  if (step == "start_to_mid") {
    data$source <- "Wetland 85"
  }
  
  if (step == "mid_to_end") {
    data$source <- "Wetland 00"
  }
  
  
  return (data)
}

## import datasets - removing geometry 
start_to_mid <- readTransition(path='../tables/wetland_transitions', file= 'start_to_mid')
mid_to_end <- readTransition(path='../tables/wetland_transitions', file= 'mid_to_end')

## reshape table 
start_to_mid <- reshapeTable(object= start_to_mid)
mid_to_end <- reshapeTable(object= mid_to_end)

## convert ID to label
start_to_mid$variable <- id_to_label(chr_vector= start_to_mid$variable, step= "start_to_mid")
mid_to_end$variable <- id_to_label(chr_vector= mid_to_end$variable, step= "mid_to_end")

## aggregate data
start_to_mid <- dissolve_table(table= start_to_mid, step= "start_to_mid")
mid_to_end <- dissolve_table(table= mid_to_end, step= "mid_to_end")

## merge data
data <- rbind (start_to_mid, mid_to_end)

## convert pixel count to km2
data$area <- data$area * 900 / 1e6 

## subset only to transtions great than 
data <- subset(data, area > 20)

## create target
#data$target <- paste(data$target, " ", sep="")

## criar nodes
node <- data.frame(name=c(as.character(data$source), as.character(data$target)) %>% unique())

## criar nomes
data$IDsource <- match(data$source, node$name)-1
data$IDtarget <- match(data$target, node$name)-1


## criar palheta
# prepare colour scale
ColourScal <- 'd3.scaleOrdinal() .domain(["Wetland 85", "Agriculture 00", "Forest 00", "Grassland 00", "Non vegetated 00", "Pasture 00", "Savanna 00", "Soybean 00"]) 
                                  .range(["#45C2A5", "#e787f8", "#006400", "#B8AF4F", "#af2a2a", "#FFD966", "#32CD32", "#c59ff4"])'

# Make the Network
p <- sankeyNetwork(Links = data, Nodes = node,
                   Source = "IDsource", Target = "IDtarget",
                   Value = "area", NodeID = "name", 
                   sinksRight=FALSE, colourScale=ColourScal, nodeWidth=40, fontSize=13, nodePadding=20)

p

