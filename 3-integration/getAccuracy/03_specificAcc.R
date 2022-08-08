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
files <- list.files('./table_class/', full.names= TRUE)
filenames <- file_path_sans_ext(list.files('./table_class', full.names= FALSE))


## create an empty recipe
recipe <- as.data.frame(NULL)
## build files for analysis
for (i in 1:length(files)) {
  ## read file
  y <- read.csv(files[i], sep=';', dec=',')
  ## excludee classes
  y <- y[ , !names(y) %in% c("permanent.crop","urban","water", "mosaic", "forestry", "temp.crop")] ## works as expected
  
  ## parse reference class
  y$class <- sapply(strsplit(filenames[i], split='_', fixed=TRUE), function(x) (x[1]))
  y$metric <- sapply(strsplit(filenames[i], split='_', fixed=TRUE), function(x) (x[2]))
  y$collection <- sapply(strsplit(filenames[i], split='_', fixed=TRUE), function(x) (x[3]))
  ## compute value of the metric
  y$value <- 1 - as.numeric(y[, unique(y$class)])
  ## merge
  recipe <- rbind(y, recipe)
  rm(y)
}

## rename metric
recipe$metric <- gsub('omission', 'Omission', 
                      gsub('commission', 'Commission',
                           recipe$metric))

recipe$class <- gsub('forest', 'Forest Formation', 
                      gsub('savanna', 'Savanna Formation',
                           gsub('grassland', 'Grassland Formation',
                              recipe$class)))

## plot
ggplot(data= recipe, mapping= aes(x= year, y= value, colour= collection)) +
  geom_line(size=1) +
  geom_line(size=4, alpha=0.1) +
  scale_colour_manual('Collection', values=c('red', 'darkgreen'),
                      labels=c('6', '7')) +
  facet_grid(metric~class) +
  theme_bw() +
  xlab(NULL) +
  ylab('Error')

ggsave(paste0('./save/', 'specific', '.jpeg'))

## get only collection 7
col7 <- subset(recipe, collection == 'col7')

## bind errors per type
recipe2 <- as.data.frame(NULL)
for (j in 1:length(unique(col7$class))) {
  ## melt data
  y <- subset(col7, class == unique(recipe$class)[j])
  ## remove matches
  y <- y[!names(y) %in% c(unique(y$class), 'value', 'collection')]
  ## melt
  y <- reshape2::melt(y, id.vars= c('year', 'class', 'metric'))
  ## adjust
  y$value <- as.numeric(y$value) * -1
  ## bind
  recipe2 <- rbind(y, recipe2)
}

## rename
recipe2$class <- gsub('forest', 'Forest',
                      gsub('savanna', 'Savanna', 
                           gsub('mosaic', 'Mosaic of A/P',
                                gsub('grassland', 'Grassland',
                                     recipe2$class))))

recipe2$variable <- gsub('forest', 'Forest Formation',
                      gsub('savanna', 'Savanna Formation', 
                           gsub('pasture', 'Pasture',
                                gsub('grassland', 'Grassland Formation',
                                     recipe2$variable))))

## plot detailed errors
ggplot(data= recipe2, mapping= aes(x= year, y= value, fill= variable)) +
  geom_area(stat='identity', alpha=0.9) +
  scale_fill_manual('Class', values=c("#006400", "#B8AF4F", "#FFD966", "#00ff00")) +
  facet_grid(class~metric) +
  theme_bw()
ggsave(paste0('./save/', 'historic', '.jpeg'))

