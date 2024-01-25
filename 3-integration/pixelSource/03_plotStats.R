## get pixel source by class
## dhemerson.costa@ipam.org.br

## read libraries
library(ggplot2)
library(sf)
library(dplyr)
library(tidyverse)
library(broom)
library(cartogram)

## avoid sci notes
options(scipen= 9e3)

## read data
data <- read.csv('./table/pixel-source-col8.csv')

## remove 8 (redundant to gapfill)
data <- subset(data, value != 8)

## translate
data$class_str <- gsub(3, 'F. Florestal',
                     gsub(4, 'F. Savânica',
                          gsub(11, 'Áreas Úmidas',
                               gsub(12, 'F. campestre',
                                    gsub(21, 'Uso Antrópico',
                                         gsub(25, 'Não Vegetado',
                                              gsub(33, 'Água',
                                                   data$class)))))))

data$value_str <- gsub('^1$', '0. Gapfill (Sem mudança)',
                     gsub('^2$', '6. Integração',
                          gsub('^3$', '5. Espacial',
                               gsub('^4$', '4. Geomorfologia',
                                    gsub('^5$', '3. Frequência',
                                         gsub('^6$', '2. Temporal',
                                              gsub('^7$', '1. Incidência',
                                                   data$value)))))))

## aggregate
data_all <- aggregate(x=list(area= data$area), by=list(
              value_str = data$value_str,
              year= data$variable), FUN= 'sum')

## get percents
recipe <- as.data.frame(NULL)
for(i in 1:length(unique(data_all$year))) {
  ## get year
  x <- subset(data_all, year == unique(data_all$year)[i])
  x$ perc <- round(x$area / sum(x$area) * 100, digits=1)
  ## store
  recipe <- rbind(recipe, x)
}; rm(x)

## plot
ggplot(data= subset(recipe, value_str != '0. Gapfill (Sem mudança)'), mapping=aes(x= year, y= area/ 1e6, fill= value_str)) +
  geom_bar(stat= 'identity', position = 'stack', alpha= 0.6) +
  scale_fill_manual('Etapa', values=c('yellow3', 'red3', 'springgreen4', 'magenta3', 'darkorange', 'black')) +
  geom_text(mapping=aes(label= perc), size= 3, 
             position = position_stack(vjust = 0.5)) + 
  #scale_colour_manual('Etapa', values=c('gray90', 'yellow3', 'red3', 'springgreen4', 'magenta3', 'darkorange', 'black')) +
  theme_minimal() +
  xlab(NULL) +
  ylab('Área (Mha)') +
  theme(text = element_text(size = 16))
  #geom_line()

## get general
x <- subset(recipe, value_str == '6. Integração')
mean(aggregate(x= list(perc= x$perc), by=list(year= x$year), FUN= 'sum')$perc) ##mean
sd(aggregate(x= list(perc= x$perc), by=list(year= x$year), FUN= 'sum')$perc) ##mean


## summarized per region
reg <- aggregate(x= list(area= data$area), by=list(mapb= data$ecoregion, value_str= data$value_str), FUN= 'sum')

## retain only the most applied 
recipe2 <- as.data.frame(NULL)
for (i in 1:length(unique(reg$mapb))) {
  x <- subset(reg, mapb == unique(reg$mapb)[i])
  ## calc percents
  x$perc <- round(x$area / sum(x$area) * 100, digits =1)
  ## remove no chance
  x <- subset(x, value_str != '0. Gapfill (Sem mudança)')
  ## retain only max
  recipe2 <- rbind(recipe2, x[which.max(x$area), ])

}

## match with map
reg_vec <- read_sf('./vec/cerrado_c8_regions.shp')
reg_vec2 <- left_join(reg_vec, recipe2, by='mapb')

## get centroids of regions
points <- as.data.frame(st_coordinates(st_centroid(reg_vec)))
points$mapb <- reg_vec$mapb
#points$X <- points$X*-1
#points$Y <- points$Y*-1

## plot
x11()
ggplot() +
  geom_sf(data= reg_vec2, mapping= aes(fill= value_str), color= 'white', size= 0.1) +
  scale_fill_manual('Filtro mais usado', values=c('yellow3', 'red3', 'darkorange', 'gray50')) +
  geom_text(data = points, aes(X, Y, label = mapb), size = 3, col='black') +
  #xlim(60, 42) +
  #ylim(25, 0) +
  theme_minimal() 

## get stats


## make a cartogram
webcart <- cartogram(st_transform(reg_vec2, 3857), "perc", itermax=30)

## get centroids of regions
points2 <- as.data.frame(st_coordinates(st_centroid(webcart)))
points2$mapb <- reg_vec2$mapb
#z <- st_as_sf(points2, coords= c('X', 'Y'))
#st_crs(z) = 4326
#z <- st_transform(z, 3857)
#z$X <- st_coordinates(z)[,1]
#z$Y <- st_coordinates(z)[,2]

## plot cartogram
x11()
ggplot() +
  geom_sf(data= webcart, mapping= aes(fill= value_str), color= 'white', size= 0.1) +
  scale_fill_manual('Filtro mais usado', values=c('yellow3', 'red3', 'darkorange', 'gray50')) +
  geom_text(data= points2, aes(X, Y, label = mapb), size = 3, col='black') +
  #xlim(60, 42) +
  #ylim(25, 0) +
  theme_minimal() 

## per class
data_class <- aggregate(x=list(area= data$area), by=list(
  value_str = data$value_str,
  year= data$variable,
  class_str= data$class_str), FUN= 'sum')

## get percents
recipe2 <- as.data.frame(NULL)
for(i in 1:length(unique(data_class$year))) {
  ## get for the year i
  x <- subset(data_class, year == unique(data_class$year)[i])
  ## for each class
  for (j in 1:length(unique(data_class$class_str))) {
    ## get class j
    y <- subset(x, class_str == unique(x$class_str)[j])
    ## get percents
    y$perc <- round(y$area / sum(y$area) * 100, digits=0)
    #store
    recipe2 <- rbind(recipe2, y)
  }
}

# ## retain only min_max and get mean per class to be used as text 
# legends <- as.data.frame(NULL)
# legends_mean <- as.data.frame(NULL)
# for(k in 1:length(unique(recipe2$class_str))) {
#   x <- subset(recipe2, class_str == unique(recipe2$class_str)[k])
#   ## get years with max 
# }

## plot
ggplot(data= subset(recipe2,  value_str != '0. Gapfill (Sem mudança)'), mapping=aes(x= year, y= area/ 1e6, fill= value_str)) +
  geom_bar(stat= 'identity', position = 'stack', alpha= 0.5) +
  scale_fill_manual('Etapa', values=c('yellow3', 'red3', 'springgreen4', 'magenta3', 'darkorange', 'black')) +
  ## plot text only for 'first', 'last', and two-mid 
  geom_text(data= subset(recipe2, value_str != '0. Gapfill (Sem mudança)' & year == 1985 |
                                  value_str != '0. Gapfill (Sem mudança)' & year == 2022 |
                                  value_str != '0. Gapfill (Sem mudança)' & year == 2000 |
                                  value_str != '0. Gapfill (Sem mudança)' & year == 2010),
    mapping=aes(label= paste0(perc, '%')), size= 3, 
    position = position_stack(vjust = 0.5)) + 
  #scale_colour_manual('Etapa', values=c('gray90', 'yellow3', 'red3', 'springgreen4', 'magenta3', 'darkorange', 'black')) +
  facet_wrap(~class_str, scales= 'free_y') + 
  theme_minimal() +
  xlab(NULL) +
  ylab('Área (Mha)') +
  theme(text = element_text(size = 16))

## calc 
x <- subset(recipe2, class_str == 'Áreas Úmidas' |  class_str == 'F. campestre' |  class_str == 'F. Florestal' |  class_str == 'F. Savânica')
x <- subset(x, value_str == '6. Integração')
mean(aggregate(x= list(perc= x$perc), by=list(year= x$year), FUN= 'sum')$perc) ##mean
sd(aggregate(x= list(perc= x$perc), by=list(year= x$year), FUN= 'sum')$perc) ##mean
