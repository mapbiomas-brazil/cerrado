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
files <- list.files('./table/acc_integration', full.names=TRUE)

## create empty recipe
recipe <- as.data.frame(NULL)

## merge data
for (i in 1:length(files)) {
  x <- read.csv(files[i])
  ## remove size 
  x <- x[,!(names(x) %in% c('system.index', 'SIZE', '.geo'))]
  ## rectify accuracy value (peso)
  x$GLOB_ACC <- x$GLOB_ACC + 0.0119
  ## bind
  recipe <- rbind(recipe, x);rm(x)
}

## aggregate data
data <- aggregate(x=list(acc= recipe$GLOB_ACC), by=list(col= recipe$VERSION, year= recipe$YEAR), FUN='mean')

## adjust strings
data$col <- gsub('CERRADO_col6_gapfill_incid_temporal_spatial_freq_v8', 'Biome', 
                 gsub('mapbiomas_collection60_integration_v1', 'Integration',
                      data$col))

## plot
ggplot(data, mapping= aes(x=year, y=acc, colour= col)) +
  #geom_point(size=2, alpha=0.5) +
  geom_line(size=3, alpha=1) + 
  scale_colour_manual('Version', values=c('turquoise4', 'darkgreen')) +
  xlab(NULL) +
  ylab('Global acc.') +
  theme_bw()

## compute collection mean
aggregate(x=list(acc= data$acc), by=list(col= data$col), FUN='mean')


