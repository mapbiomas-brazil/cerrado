## accuracy analisys from collection 6
library(ggplot2)
library(ggrepel)
library(dplyr)
library(sf)
library(ggsn)

## import table 
data <- read.csv('./table/scene_avaliability/scene_avaliability_full.csv')[-1][-28]

## import wrs vector
wrs_vec <- read_sf(dsn= './vec', layer= 'landsat_grid')

## import cerrado
cerrado <- read_sf(dsn= './vec', layer= 'cerrado')

# merge path/row
data$path_row <- paste0(data$WRS_PATH, '_', data$WRS_ROW)
wrs_vec$path_row <- paste0(wrs_vec$PATH, '_', wrs_vec$ROW)

## insert season
dry <- subset(data, month >3 & month <10); dry$season <- 'Dry'
rainy <- subset(data, month <4 | month >9); rainy$season <- 'Rainy'
data <- rbind(dry, rainy)
data$value <- 1

## compute the number of scenes for each path row
data_dist <- aggregate(x=list(value= data$value), by= list(year= data$year, season= data$season), FUN= 'sum')

## plot temporal dist
ggplot(data= data_dist, mapping= aes(x= year, y= value/length(unique(data$path_row)), group= season)) +
  #geom_jitter(alpha=0.02, size=2) +
  #stat_summary(fun.y = "mean", geom = "bar", size = 1) +
  geom_bar(stat='identity', mapping= aes(fill= season), alpha=0.9) +
  scale_fill_manual('Season', values=c('orange', 'darkgreen')) +
  theme_minimal() +
  xlab(NULL) +
  ylab('Landsat scenes')

## qualidade das imagens
data_dist <- aggregate(x=list(value= data$IMAGE_QUALITY), by= list(year= data$year, season= data$season), FUN= 'mean')
## plot
ggplot(data= data_dist, mapping= aes(x= year, y=value, group= season)) + 
  geom_line(mapping= aes(colour= season), size=1) + 
  geom_point(mapping= aes(colour= season), size=1.5) + 
  scale_colour_manual('Season', values=c('orange', 'darkgreen')) +
  theme_minimal() +
  xlab(NULL) +
  ylab('Image Quality')


## subset by group of years
data1 <- subset(data, year < 2003); data1$group <- '1985-2002'
data2 <- subset(data, year > 2002); data2$group <- '2003-2020'
data <- rbind(data1, data2); rm(data1, data2)

## compute the sum of scenes per wrs-2
total_sum <- as.data.frame(table(path_row= data$path_row, season= data$season, group= data$group))

## merge
wrs_vec_total <- left_join(wrs_vec, total_sum, by='path_row')

## plot
ggplot() +
  geom_sf(data= wrs_vec_total, mapping= aes(fill= Freq), col=NA) +
  geom_sf(data= cerrado, color= 'black', fill= NA, size= 0.1, alpha=0.5) +
  scale_fill_fermenter('Scenes', n.breaks=11, palette= "Spectral", na.value="gray90", direction = 1) +
  theme_bw() +
  facet_grid(group~season)

## plot cerrado
ggplot() +
  geom_sf(data= wrs_vec_total, mapping= aes(fill= Freq), col=NA) +
  geom_sf(data= cerrado, color= 'black', fill= NA, size= 0.1, alpha=0.5) +
  scale_fill_fermenter('Scenes', n.breaks=11, palette= "Spectral", na.value="gray90", direction = 1) +
  theme_bw() +
  facet_wrap(~season)


## plot for the wetland paper
total_sum <- as.data.frame(table(path_row= data$path_row))

## merge
wrs_vec_total_2 <- left_join(wrs_vec, total_sum, by='path_row')

## import brasil
vec_br <- read_sf(dsn='./vec', layer= 'brasil_dissolved')

## plot
ggplot() +
  ## preenchimento brasil
  geom_sf(data= vec_br, colour= NA, fill= 'gray90', linetype= 'dashed', size= 0.1, alpha=0.9) +
  ## frequencia por wrs-path/row
  geom_sf(data= wrs_vec_total_2, mapping= aes(fill= Freq), col=NA) +
  ## escala de cores 
  scale_fill_fermenter('N. scenes', n.breaks=9, palette= "Spectral", na.value="gray90", direction = 1) +
  ## limite cerrado
  geom_sf(data= cerrado, color= 'black', fill= NA, linetype= 'dotdash') +
  ## limite brasil 
  geom_sf(data= vec_br, colour= 'gray60', fill= NA) +
 
  theme_bw() +
  north(vec_br, scale= .06, symbol=12) +
  scalebar(vec_br, dist = 750, dist_unit = "km", transform = TRUE, model = "WGS84", 
           st.size=2.5, height=0.01) +
  xlab(NULL) + ylab(NULL)
