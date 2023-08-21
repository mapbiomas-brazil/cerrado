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
    x <- read.csv(files[k], dec='.', sep=',', encoding="UTF-8")
    
    ## build data frame
    y <- as.data.frame(cbind(
      year = as.numeric(x$Ano),
      accuracy = as.numeric(x$Acurácia),
      area_discordance = as.numeric(x$Discordância.de.Área),
      allocation_discordance = as.numeric(x$Discordância.de.Alocação),
      
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
data <- readData(path= './table/')

## rename collections
data$collection <- gsub('col3.1', '3.1',
                        gsub('col4.1', '4.1',
                            gsub('col5', '5',
                               gsub('col6', '6',
                                    gsub('col7.1', '7.1',
                                         gsub('col8', '8',
                                         data$collection))))))

## rename levels
data$level <- gsub('nv1', 'Level-1',
                   gsub('nv3', 'Level-3',
                        data$level))

library(scales)

## plot accuracy
ggplot(data, mapping= aes(x=as.numeric(year), y= as.numeric(accuracy),
                          colour= collection, group=collection)) +
  geom_line(size=1, alpha=0.7) + 
  geom_line(size=4, alpha=0.1) + 
  
  #geom_point(size=2) +
  scale_colour_manual('Collection', values=c('blue', 'cyan', 'violet', 'gray80', 'orange','red3')) +
  facet_wrap(~level, ncol=2, nrow=1, scales='free_y') +
  ylab('Global accuracy') +
  xlab('year') +
  theme_bw() +
  scale_x_continuous(limits = c(1985, NA))

## compute means
aggregate(x=list(value=as.numeric(data$accuracy)), by=list(collection=data$collection, level= data$level), FUN='mean')
