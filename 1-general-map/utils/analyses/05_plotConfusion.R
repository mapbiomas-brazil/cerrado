## asses confusion matrixes 
## mapbiomas collection 7 
## dhemerson.costa@ipam.org.br

## read libraries
library(ggplot2)

## avoid scientific notation
options(scipen= 999)

data <- read.csv('./table/accuracy/table_CERRADO_col7_gapfill_incidence_temporal_frequency_geomorfology_spatial_v9.csv')[-1]

## invert to solve issue on getAcc code
colnames(data)[1] <- 'Reference'
colnames(data)[2] <- 'Prediction'

## get agree
agree <- subset(data, Prediction == Reference)
disagree <- subset(data, Prediction != Reference)

## aggregate frequencies
disagree_general <- aggregate(x=list(Freq= disagree$Freq), 
                              by=list(year= disagree$year,
                                      reference= disagree$Reference,
                                      prediction= disagree$Prediction), FUN='sum')

## plot
ggplot(data= disagree_general, mapping= aes(x=year, y= Freq, fill= as.factor(prediction))) +
  geom_bar(stat= 'identity') +
  scale_fill_manual('Predicted' ,
                    labels=c('Forest', 'Savanna', 'Grassland/Wet', 'Farming', 'Non-vegetated', 'Water'),
                    values=c('#006400', '#00ff00', '#B8AF4F', '#f1c232', '#ff3d3d', '#0000FF')) +
  facet_wrap(~reference, scales= 'fixed') +
  theme_minimal()

## get only forest wrong classified
forest <- subset(disagree, Prediction == 21 & Reference == 4)
ggplot(forest, mapping= aes(x= year, y= Freq)) +
  geom_bar(stat= 'identity', col='#00ff00') +
  facet_wrap(~region) +
  theme_bw()
