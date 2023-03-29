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

## define function to read data
readData <- function (path) {
  ## list files
  files <- list.files(path, full.names= TRUE)
  ## create an empty recipe 
  recipe <- as.data.frame(NULL)
  ## start file reading
  for (k in 1:length(files)) {
    ## read raw file
    x <- read.csv(files[k], dec=',', sep=',', encoding="UTF-8")
    
    ## build data frame
    y <- as.data.frame(cbind(
      year = rownames(x),
      accuracy = paste0(x$X.U.FEFF.Ano, '.', x$Acurácia),
      area_discordance = paste0(x$Discordância.de.Área, '.', x$Discordância.de.Alocação),
      allocation_discordance = paste0(x$X, '.', x$Y),
      ## parse collection string
      collection = rep(sapply(strsplit(
          file_path_sans_ext(
            list.files(path)),
          split='_', fixed=TRUE),
          function(x) (x[1]))[k], nrow(x)),
      ## parse level string
      level = rep(sapply(strsplit(
          file_path_sans_ext(
            list.files(path)), 
          split='_', fixed=TRUE),
          function(x) (x[2]))[k], nrow(x)
        )
      )
    )
    ## merge with recipe
    recipe <- rbind(recipe, y)
  }
  return (recipe)
}

## import file
data <- readData(path= './table/acc_collections')

## rename collections
data$collection <- gsub('col31', '3.1',
                        gsub('col41', '4.1',
                            gsub('col5', '5',
                               gsub('col6', '6',
                                    gsub('col7', '7',
                                         gsub('col71', '7.1',
                                              data$collection))))))

## rename levels
data$level <- gsub('nv1', 'Level-1',
                   gsub('nv3', 'Level-3',
                        data$level))


## compute means
leg <- aggregate(x=list(value=as.numeric(data$accuracy)), by=list(collection=data$collection, level= data$level), FUN='mean')

## compute position
for (i in 1:length(unique(data$collection))) {
  for(j in 1:length(unique(data$level))) {
    x <- subset(data, collection == unique(data$collection)[i] & 
                  level == unique(data$level)[j])
    
    ## get y position of rhte last year to place mean labels
    y <- subset(leg, collection == unique(data$collection)[i] &
                  level == unique(data$level)[j])
    
    y$position <- subset(x, year == max(x$year))$accuracy
    
    if (exists('leg2') == FALSE) {
      leg2 <- y
    } else {
      leg2 <- rbind(leg2, y)
    }
    
  }
}
rm(x, y, leg)

## plot accuracy
ggplot(data, mapping= aes(x=as.numeric(year), y= as.numeric(accuracy),
                          colour= collection, group=collection)) +
  geom_line(size=1, alpha=0.7) + 
  geom_point(size=2) +
  scale_colour_manual('Collection', values=c('red', 'orange', 'purple', 'darkgreen', 'yellow', 'brown')) +
  facet_wrap(~level, ncol=1, nrow=2, scales='free_y') +
  xlab(NULL) +
  ylab('Global acc.') +
  theme_bw() +
  geom_text_repel(data= leg2, mapping=aes(x= 2024, y= as.numeric(position), 
                                  label= paste0(round(value*100, digits=2))), size=4)



## collection 6
col6 <- subset(data, collection == '6' & level == 'Level-3')
