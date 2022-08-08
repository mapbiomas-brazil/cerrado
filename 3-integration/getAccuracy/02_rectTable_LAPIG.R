## rect tables from mapbiomas platform

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
filenames <- file_path_sans_ext(list.files('./table_class/', full.names= FALSE))

## for each file
for (i in 1:length(files)) {
  ## create empty recipe
  recipe <- as.data.frame(NULL)
  ## read file i
  x <- read.csv(files[i], dec=',', sep='/', encoding="UTF-8")
  
  ## get values per line
  for (j in 1:nrow(x)) {
    ## get year
    year <- sapply(strsplit(x[j,], split=',', fixed=TRUE), function(x) (x[1]))
    ## get forest
    forest <- paste0(sapply(strsplit(x[j,], split=',', fixed=TRUE), function(x) (x[2])),
                     '.',
                     sapply(strsplit(x[j,], split=',', fixed=TRUE), function(x) (x[3])))
    ## get savanna
    savanna <- paste0(sapply(strsplit(x[j,], split=',', fixed=TRUE), function(x) (x[4])),
                      '.',
                      sapply(strsplit(x[j,], split=',', fixed=TRUE), function(x) (x[5])))
    ## get grassland
    grassland <- paste0(sapply(strsplit(x[j,], split=',', fixed=TRUE), function(x) (x[6])),
                        '.',
                        sapply(strsplit(x[j,], split=',', fixed=TRUE), function(x) (x[7])))
    ## get pasture
    pasture <- paste0(sapply(strsplit(x[j,], split=',', fixed=TRUE), function(x) (x[8])),
                        '.',
                        sapply(strsplit(x[j,], split=',', fixed=TRUE), function(x) (x[9])))
    ## get temporary crop
    temp_crop <- paste0(sapply(strsplit(x[j,], split=',', fixed=TRUE), function(x) (x[10])),
                        '.',
                        sapply(strsplit(x[j,], split=',', fixed=TRUE), function(x) (x[11])))
    ## get permanent crop
    perm_crop <- paste0(sapply(strsplit(x[j,], split=',', fixed=TRUE), function(x) (x[12])),
                        '.',
                        sapply(strsplit(x[j,], split=',', fixed=TRUE), function(x) (x[13])))
    ## get forestry
    forestry <- paste0(sapply(strsplit(x[j,], split=',', fixed=TRUE), function(x) (x[14])),
                       '.',
                       sapply(strsplit(x[j,], split=',', fixed=TRUE), function(x) (x[15])))
    ## get mosaic
    mosaic <- paste0(sapply(strsplit(x[j,], split=',', fixed=TRUE), function(x) (x[16])),
                     '.',
                     sapply(strsplit(x[j,], split=',', fixed=TRUE), function(x) (x[17])))
    ## get urban
    urban <- paste0(sapply(strsplit(x[j,], split=',', fixed=TRUE), function(x) (x[18])),
                    '.',
                    sapply(strsplit(x[j,], split=',', fixed=TRUE), function(x) (x[19])))
    ## get water
    water <- paste0(sapply(strsplit(x[j,], split=',', fixed=TRUE), function(x) (x[20])),
                    '.',
                    sapply(strsplit(x[j,], split=',', fixed=TRUE), function(x) (x[21])))
    
    ## build table
    temp <- as.data.frame(cbind(
      year =year,
      forest=forest,
      savanna=savanna,
      grassland=grassland,
      pasture=pasture,
      temp_crop=temp_crop,
      permanent_crop=perm_crop,
      forestry=forestry,
      mosaic=mosaic,
      urban=urban,
      water=water)
    )
    
    recipe <- rbind(recipe, temp)
    rm(temp)
  }
  write.table(recipe, paste0('./filtered/', filenames[i],'.txt'), dec='.', sep=';')
}

