# Compare Collections 6 and 7 for the Cerrado biome
# dhemerson.costa@ipam.org.br

## read libraries
library(ggplot2)

## read csv
data <- read.csv2('./area_biomes_per_state_from_5_to_7_v20.csv', 
                 header=TRUE,
                 encoding= 'UTF-8',
                 sep='\t',
                 dec=',')

## select only collections 6 and 7 for the Cerrado biome
data_l2 <- subset(data, collection != 'Collection 5' 
               & biome == 'Cerrado'
               & level == 'level_2' 
               & class != 'Non Observed')

## rename classes
#data_l2$class <- gsub('Magrove', 'Forest Formation',
#                     gsub('Salt flat', 'Grassland',
#                          gsub('Urban Infrastructure', 'Other Non Vegetated Area',
#                               gsub('Mining', 'Other Non Vegetated Area',
#                                    gsub('Beach and Dune', 'Other Non Vegetated Area',
#                                         gsub('Aquaculture', 'River, Lake and Ocean',
#                                              data_l2$class))))))

## plot
ggplot(data= data_l2, mapping= aes(x= as.numeric(year), y= area, colour= collection)) +
  stat_summary(fun='sum', position= 'identity', geom= 'line', alpha=0.2, size=3) +
  stat_summary(fun='sum', position= 'identity', geom= 'line', alpha=0.7, size=1) +
  scale_colour_manual('Collection', values=c('gray50', 'orange')) + 
  facet_wrap(~class, scales= 'free_y') +
  theme_bw() +
  xlab(NULL) +
  ylab('Area (Mha)')
