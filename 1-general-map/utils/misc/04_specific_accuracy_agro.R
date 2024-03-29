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
files <- list.files('./table/acc_classes_agro', full.names= TRUE)
filenames <- file_path_sans_ext(list.files('./table/acc_classes_agro', full.names= FALSE))

## create an empty recipe
recipe <- as.data.frame(NULL)
## build files for analysis
for (i in 1:length(files)) {
  ## read file
  y <- read.csv(files[i], sep=';', dec=',')
  ## parse reference class
  y$class <- sapply(strsplit(filenames[i], split='_', fixed=TRUE), function(x) (x[1]))
  y$metric <- sapply(strsplit(filenames[i], split='_', fixed=TRUE), function(x) (x[2]))
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

## plot
ggplot(data= recipe, mapping= aes(x= year, y= value, colour= class)) +
  geom_line(size=1) +
  geom_point() +
  scale_colour_manual('Class', values=c('#ad4413', '#f3b4f1', '#982c9e'),
                      labels=c('Forestry', 'Perennial crop', 'Temporary crop')) +
  facet_wrap(~metric, nrow=2, ncol=1) +
  theme_bw() +
  xlab(NULL) +
  ylab('Error')

## bind errors per type
recipe2 <- as.data.frame(NULL)
for (j in 1:length(unique(recipe$class))) {
  ## melt data
  y <- subset(recipe, class == unique(recipe$class)[j])
  ## remove matches
  y <- y[!names(y) %in% c(unique(y$class), 'value', 'urban', 'water')]
  ## melt
  y <- reshape2::melt(y, id.vars= c('year', 'class', 'metric'))
  ## adjust
  y$value <- y$value * -1
  ## bind
  recipe2 <- rbind(y, recipe2)
}

## rename
recipe2$class <- gsub('forestry', 'Forestry',
                      gsub('permanent.crop', 'Perennial crop', 
                           gsub('temp.crop', 'Temporary crop',
                                recipe2$class)))

## plot detailed errors
ggplot(data= recipe2, mapping= aes(x= year, y= value, fill= variable)) +
  geom_area(stat='identity', alpha=0.9) +
  scale_fill_manual('Class', values=c('#006400', '#00ff00', '#B8AF4F', '#FFD966', '#982c9e', '#f3b4f1', '#fff3bf', '#ad4413'),
                    labels=c('Forest', 'Savanna', 'Grassland', 'Pasture', 'Temporary crop', 'Perennial crop', 'Mosaic of A/P', 'Forestry')) +
  facet_grid(class~metric) +
  theme_bw()

