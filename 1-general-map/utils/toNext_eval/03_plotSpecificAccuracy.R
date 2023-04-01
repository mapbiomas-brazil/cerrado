## accuracy analisys from collection 6
library(ggplot2)
library(ggrepel)
library(dplyr)
library(sf)
library(stringr)
library(tools)
library(ggpmisc)

## avoid sicentific notations
options(scipen=999)

## list files
files <- list.files('./table/acc_classes/6', full.names= TRUE)
filenames <- file_path_sans_ext(list.files('./table/acc_classes/6', full.names= FALSE))

## create an empty recipe
recipe2 <- as.data.frame(NULL)
## build files for analysis
for (i in 1:length(files)) {
  ## read file
  y <- read.csv(files[i], sep=';', dec=',')
  ## parse reference class
  y$class <- sapply(strsplit(filenames[i], split='_', fixed=TRUE), function(x) (x[1]))
  y$metric <- sapply(strsplit(filenames[i], split='_', fixed=TRUE), function(x) (x[2]))
  y$collection <- sapply(strsplit(filenames[i], split='_', fixed=TRUE), function(x) (x[3]))
  
  ## rename columns
  colnames(y)[1] <- 'year'
  colnames(y)[2] <- 'forest'
  colnames(y)[3] <- 'savanna'
  colnames(y)[4] <- 'grassland'
  colnames(y)[5] <- 'pasture'
  colnames(y)[6] <- 'temp crop'
  colnames(y)[7] <- 'permanent crop'
  colnames(y)[8] <- 'forestry'
  colnames(y)[9] <- 'mosaic'
  colnames(y)[10] <- 'urban'
  colnames(y)[11] <- 'water'
  
  ## compute value of the metric
  y$value <- 1 - y[, unique(y$class)]
  ## merge
  recipe2 <- rbind(y, recipe2)
  rm(y)
}

## rename metric
recipe2$metric <- gsub('omission', 'Omission', 
                      gsub('commission', 'Commission',
                           recipe2$metric))

## read col 6
## list files
files <- list.files('./table/acc_classes/71', full.names= TRUE)
filenames <- file_path_sans_ext(list.files('./table/acc_classes/71', full.names= FALSE))

## create an empty recipe
recipe <- as.data.frame(NULL)
## build files for analysis
for (i in 1:length(files)) {
  ## read file
  y <- read.csv(files[i], sep=',', dec='.')
  ## parse reference class
  y$class <- sapply(strsplit(filenames[i], split='_', fixed=TRUE), function(x) (x[1]))
  y$metric <- sapply(strsplit(filenames[i], split='_', fixed=TRUE), function(x) (x[2]))
  y$collection <- sapply(strsplit(filenames[i], split='_', fixed=TRUE), function(x) (x[3]))
  
  ## rename columns
  colnames(y)[1] <- 'year'
  colnames(y)[2] <- 'forest'
  colnames(y)[3] <- 'savanna'
  colnames(y)[4] <- 'grassland'
  colnames(y)[5] <- 'pasture'
  colnames(y)[6] <- 'temp crop'
  colnames(y)[7] <- 'permanent crop'
  colnames(y)[8] <- 'forestry'
  colnames(y)[9] <- 'mosaic'
  colnames(y)[10] <- 'urban'
  colnames(y)[11] <- 'water'
  
  ## compute value of the metric
  y$value <- 1 - y[, unique(y$class)]
  ## merge
  recipe <- rbind(y, recipe)
  rm(y)
}

## rename metric
recipe$metric <- gsub('omission', 'Omission', 
                      gsub('commission', 'Commission',
                           recipe$metric))

## merge
data <- rbind(recipe, recipe2)

## rename
data$collection <- gsub('col71', '7.1',
                        gsub('col6', '6',
                             data$collection))

## rename
data$class <- gsub('forest', 'Forest',
                   gsub('savanna', 'Savanna',
                        gsub('grassland', 'Grassland',
                             gsub('mosaic', 'Mosaic',
                                  data$class))))

## plot
ggplot(data= data, mapping= aes(x= year, y= value, colour= collection)) +
  geom_line(size=1, alpha=0.6) +
  geom_point(alpha=0.6) +
  scale_colour_manual('Class', values=c('gray40', 'red'),
                      labels=c('Col. 6', 'Col. 7.1')) +
  facet_grid(class~metric, scales= 'free_y') +
  theme_bw() +
  xlab(NULL) +
  ylab('Error')

## bind errors per type
recipe3 <- as.data.frame(NULL)
recipe <- subset(data, collection == '7.1')
for (j in 1:length(unique(recipe$class))) {
  ## melt data
  y <- subset(recipe, class == unique(recipe$class)[j])
  ## remove matches
  y <- y[!names(y) %in% c(unique(y$class), 'value', 'temp crop', 'permanent crop', 'urban', 'water', 'collection')]
  ## melt
  y <- reshape2::melt(y, id.vars= c('year', 'class', 'metric'))
  ## adjust
  y$value <- as.numeric(y$value) * -1
  ## bind
  recipe3 <- rbind(y, recipe3)
}


## get only errors
recipe3 <- subset(recipe3, value > 0)
## rename
recipe3$class <- gsub('forest', 'Forest',
                      gsub('savanna', 'Savanna', 
                           gsub('mosaic', 'Mosaic of Uses',
                                gsub('grassland', 'Grassland',
                                     recipe3$class))))

## plot detailed errors
ggplot(data= recipe3, mapping= aes(x= year, y= value, fill= variable)) +
  geom_area(stat='identity', alpha=0.9) +
  scale_fill_manual('Class', values=c('#006400', '#00ff00', '#b8af4f', '#ffd966', '#935132', '#fff3bf'),
                    labels=c('Forest', 'Savanna', 'Grassland', 'Pasture', 'Forestry', 'Mosaic')) +
  facet_grid(class~metric) +
  theme_bw()

