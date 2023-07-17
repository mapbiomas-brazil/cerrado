## plot accuracy per version
## mapbiomas collection 7 
## dhemerson.costa@ipam.org.br

## read libraries
library(ggplot2)

## avoid scientific notation
options(scipen= 999)

## set root path
root <- './table/accuracy/'

# list files
files <- list.files('./table/accuracy', pattern= "metrics", full.names=TRUE)

## create empty recipe
recipe <- as.data.frame(NULL)

## read files
for (i in 1:length(files)) {
  ## read file [i]
  x <- na.omit(read.csv(files[i])[-1])
  ## stack into recipe
  recipe <- rbind(recipe, x)
  rm(x)
}

## get only accuracy
global <- subset(recipe, variable == "Accuracy")

## subset 
global <- subset(global, file== 'CERRADO_col8_gapfill_v3' |
                   file== 'CERRADO_col8_gapfill_incidence_v5' |
                   file== 'CERRADO_col8_gapfill_incidence_temporal_a_v14' |
                   file== 'CERRADO_col8_gapfill_incidence_temporal_v14' |
                   file== 'CERRADO_col8_gapfill_incidence_temporal_frequency_v14'|
                   file== 'CERRADO_col8_gapfill_incidence_temporal_frequency_geomorphology_v14' |
                   file== 'CERRADO_col8_gapfill_incidence_temporal_frequency_geomorphology_spatial_v14')

## plot summarized
ggplot(data= global, mapping= aes(x= year, y= value, colour= file)) +
  stat_summary(fun='mean', geom= 'line', alpha= .6) +
  stat_summary(fun='mean', geom= 'point') +
  scale_colour_manual(values=c('darkgreen', 'green', 'yellow', 'orange', 'red', 'purple', 'blue')) +
  theme_bw() +
  xlab(NULL) +
  ylab('Global accuracy')

aggregate(x=list(acc=global$value), by=list(file=global$file), FUN= 'mean')

# get specific accuracies
per_class <- subset(recipe, variable == 'Class: 3' | variable == 'Class: 4' |
                      variable == 'Class: 12' | variable == 'Class: 21' | variable == 'Class: 33')

## merge global with per class
per_class <- rbind(per_class, global)

## rename 
per_class$variable <- gsub('Class: 3', 'Forest',
                         gsub('Class: 4', 'Savanna',
                              gsub('Class: 12', 'Grassland/Wetland',
                                   gsub('Class: 21', 'Farming',
                                        gsub('Class: 33', 'Water',
                                             gsub('Accuracy', 'Acc. global',
                                                  per_class$variable))))))

## subset 
per_class2 <- subset(per_class, file == 'CERRADO_col8_gapfill_incidence_temporal_frequency_geomorphology_spatial_v9')

## plot
ggplot(data= per_class2, mapping= aes(x= year, y= value, colour= file)) +
  stat_summary(fun='mean', geom= 'line', alpha= .6) +
  stat_summary(fun='mean', geom= 'point') +
#  scale_colour_manual(values=c('red', 'gray50', 'gray70', 'black')) +
  facet_wrap(~variable, scales= 'free_y') +
  theme_bw() +
  xlab(NULL) +
  ylab('Accuracy')


## forest accuracy per region 
ggplot(data= per_class, mapping= aes(x= year, y= value, colour= variable)) +
  stat_summary(fun='mean', geom= 'line', alpha= .6) +
  stat_summary(fun='mean', geom= 'point') +
  scale_colour_manual('Version', values=c('black', '#E974ED', '#006400', '#B8AF4F', '#00ff00', '#0000FF')) +
  facet_wrap(~region, scales= 'fixed') +
  theme_bw() +
  xlab(NULL) +
  ylab('Accuracy')
