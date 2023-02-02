## accuracy analisys from collection 6
# read library
library(ggplot2)
library(ggrepel)
library(dplyr)
library(sf)
library(tools)
library(treemapify)

## avoid scientific notation
options(scipen= 999)

## read table
data <- read.csv('./table/trajectories/wetland_trajectories.csv')

## rename
data$class_id <- gsub('^2$', 'Pr-Pr Ch=0',
                      gsub('^3$', 'Ab-Pr Ch=1',
                           gsub('^4$', 'Pr-Ab Ch=1',
                                gsub('^5$', 'Ab-Pr Ch>2',
                                     gsub('^6$', 'Pr-Ab Ch>2',
                                          gsub('^7$', 'Ab-Ab Ch>1',
                                               gsub('^8$', 'Pr-Pr Ch>1',
                                                    data$class_id)))))))

ggplot(data= subset(data, class_id != 1), mapping= aes(area= area, fill= class_id)) +
  geom_treemap() +
  geom_treemap_text(mapping= aes(label= class_id)) +
  scale_fill_manual(values=c('#f58700', '#00598d', '#02d6f2', '#9d006d', '#ff4dd5', '#999999', '#ffbf70'))

## compute percents
data <- subset(data, class_id != 1)
data$perc <- round(data$area / sum(data$area) * 100, digits=2)
