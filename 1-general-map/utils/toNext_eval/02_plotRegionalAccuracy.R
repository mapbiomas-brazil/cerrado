## accuracy analisys from collection 6

library(ggplot2)
library(ggrepel)
library(dplyr)
library(sf)
library(tools)
library(ggpmisc)

## avoid sicentific notations
options(scipen=999)

## read data
data <- subset(
  read.csv('./table/regionalAccuracy/metrics_mapbiomas_collection71_integration_v1.csv'),
  variable == 'Accuracy'
  )

## rename
colnames(data)[4] <- 'mapb'

## read vector
reg_vec <- read_sf(dsn= './vec', layer= 'cerrado_c6_regions')
states_vec <- read_sf(dsn= './vec', layer= 'estados_2010')


## merge
reg_vec <- left_join(reg_vec, data, by='mapb')

## boxplot
ggplot(data= data, mapping= aes(x= as.factor(year), y= value, label=mapb)) +
  geom_jitter(position = position_jitter(seed = 1), alpha=0.1) +
  geom_boxplot(fill='blue', alpha= 0.2) +
  #geom_bin2d(bins=6, alpha=1) +
  #scale_fill_continuous('Freq.', type = "viridis") +
  #geom_text(position = position_jitter(seed = 1), size=2.5, color= 'white') +
  theme_minimal() +
  theme(axis.text.x = element_text(angle = 90, vjust = 0.5, hjust=1)) +
  xlab(NULL) +
  ylab('Global acc.')

## plot maps of accuracy per year 
x11()
ggplot() +
  geom_sf(data= reg_vec, mapping= aes(fill= value), color= 'gray40', size= 0.1) +  
  #geom_text(data = points, aes(X, Y, label = mapb), size = 3, col='black') +
  #geom_sf(data= states_vec, color= 'gray20', fill= NA, size= 0.1, alpha=0.5, linetype='dotted') +
  scale_fill_fermenter('Global acc.', n.breaks=6, palette= "RdYlGn", direction = 1) +
  facet_wrap(~year, ncol=7, nrow=5) + 
  xlim(60, 42) +
  ylim(25, 0) +
  theme_minimal()


