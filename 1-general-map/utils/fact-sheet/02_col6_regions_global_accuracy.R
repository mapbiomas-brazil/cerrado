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
data <- read.csv('./table/accuracy/metrics_mapbiomas_collection70_integration_v2.csv')[-1][-6]

## read vector
reg_vec <- read_sf(dsn= './vec', layer= 'classification_regions_col7')
states_vec <- read_sf(dsn= './vec', layer= 'estados_2010')

## get only accuracy values
data <- subset(data, variable == 'Accuracy')

## resume patterns
## mean global accuracy
temp <- aggregate(x=list(mean= data$value), by=list(mapb= data$region), FUN= 'mean')
temp$median <- aggregate(x=list(median= data$value), by=list(mapb= data$region), FUN= 'median')$median
temp$sd <- aggregate(x=list(sd= data$value), by=list(mapb= data$region), FUN= 'sd')$sd
temp$max <- aggregate(x=list(max= data$value), by=list(mapb= data$region), FUN= 'max')$max
temp$min <- aggregate(x=list(min= data$value), by=list(mapb= data$region), FUN= 'min')$min
temp$amp <- temp$max - temp$min

## merge
reg_vec <- left_join(reg_vec, temp, by='mapb');rm(temp)

## density 2d plot
ggplot(data= data, mapping= aes(x= as.factor(year), y= value, label=region)) +
  #geom_jitter(position = position_jitter(seed = 1)) +
  #geom_boxplot(fill='green3', alpha= 0.4) +
  geom_bin2d(bins=6, alpha=1) +
  scale_fill_continuous('Freq.', type = "viridis") +
  geom_text(position = position_jitter(seed = 1), size=2.5, color= 'white') +
  theme_classic() +
  theme(axis.text.x = element_text(angle = 90, vjust = 0.5, hjust=1)) +
  xlab(NULL) +
  ylab('Global acc.')

## boxplot
## density 2d plot
ggplot(data= data, mapping= aes(x= as.factor(year), y= value, label=region)) +
  geom_jitter(position = position_jitter(seed = 1), alpha=0.1) +
  geom_boxplot(fill='blue', alpha= 0.2) +
  #geom_bin2d(bins=6, alpha=1) +
  #scale_fill_continuous('Freq.', type = "viridis") +
  #geom_text(position = position_jitter(seed = 1), size=2.5, color= 'white') +
  theme_minimal() +
  theme(axis.text.x = element_text(angle = 90, vjust = 0.5, hjust=1)) +
  xlab(NULL) +
  ylab('Global acc.')


## run a linear model for each region
recipe <- as.data.frame(NULL)
data2 <- as.data.frame(NULL)
## for each region
for (i in 1:length(unique(data$region))) {
  ## subset region
  temp <- subset(data, region== unique(data$region)[i])
  ## run lm (glob acc ~ year)
  temp$resid <- summary(lm(value ~ year, temp))$residuals
  ## build data with residuals
  data2 <- rbind(data2, temp)
  ## run lm (residuals ~ size)
  r2 <- summary(lm(resid ~ SIZE, temp))$r.squared
  ## get region
  reg <- unique(data$mapb)[i]
  ## build temp obj
  temp <- as.data.frame(cbind(mapb=reg, rsquared=r2))
  ## insert into recipe
  recipe <- rbind(recipe, temp)
  ## clean processes
  rm(temp, r2, reg)
}

formula <- y ~ poly(x, 1, raw = TRUE)    

# relation size ~ glob accuracy
ggplot(data2, mapping= aes(x=YEAR, y=GLOB_ACC)) +
  geom_point(aes(colour=as.factor(mapb))) +
  facet_wrap(~mapb) +
  stat_poly_eq(formula = formula, parse = TRUE, 
               mapping = aes(label = stat(rr.label)),
               colour='red') +
  theme_bw() +
  xlab('Validation points') +
  ylab('residuals(lm(global_acc ~ year)')


## compute minimum and maximum accuracy by region
temp_min <- aggregate(x=list(value=data$value), by=list(region= data$region), FUN='min')
temp_max <- aggregate(x=list(value=data$value), by=list(region= data$region), FUN='max')
## match to extract years
temp_min <- left_join(temp_min, data, by='value'); temp_min$condition <- 'min'
temp_max <- left_join(temp_max, data, by='value'); temp_max$condition <- 'max'
## bind
data2 <- rbind(temp_min, temp_max);rm(temp_min, temp_max)

## plot min density
ggplot(data2, mapping= aes(x=year, colour= condition)) +
  #geom_histogram(bins=20, position='stack', alpha=.8) +
  stat_density(position='identity', alpha=0.9, geom='line') + 
  stat_density(position='identity', alpha=0.2, geom='line', size=4) + 
  scale_colour_manual('Cond', values=c('forestgreen', 'firebrick')) +
  xlab(NULL) + ylab('Density') +
  theme_classic()

## compute proportions
table(subset(data2, condition== 'min')$year)

## accuracy histogram - per region 
ggplot(data= data, mapping= aes(x= year, y= value)) +
  geom_line(col='red') +
  facet_wrap(~region, scales= 'free_y') +
  theme_minimal() +
  xlab(NULL) +
  ylab('Global Accuracy')

## get centroids of regions
points <- as.data.frame(st_coordinates(st_centroid(reg_vec)))
points$mapb <- reg_vec$mapb
points$X <- points$X*-1
points$Y <- points$Y*-1

## plot median
ggplot() +
  geom_sf(data= reg_vec, mapping= aes(fill= median), color= 'white', size= 0.1, alpha=1) +  
  geom_text(data = points, aes(X, Y, label = mapb), size = 3, col='black') +
  geom_sf(data= states_vec, color= 'gray20', fill= NA, size= 0.1, alpha=0.5, linetype='dotted') +
  scale_fill_fermenter('Global acc.', n.breaks=6, palette= "RdYlGn", na.value="gray90", direction = 1) +
  xlim(60, 42) +
  ylim(25, 0) +
  theme_minimal() 

# rename region to map 
names(data)[3] <- 'mapb'

## bind for year
z <- NULL
for (i in 1:length(unique(data$year))) {
  x <- subset(data, year== unique(data$year)[i])
  y <- left_join(reg_vec, x, by='mapb')
  z <- rbind(z, y)
  rm(x, y)
}

## plot accuracy per year 
x11()
ggplot() +
  geom_sf(data= z, mapping= aes(fill= value), color= 'gray40', size= 0.1) +  
  #geom_text(data = points, aes(X, Y, label = mapb), size = 3, col='black') +
  #geom_sf(data= states_vec, color= 'gray20', fill= NA, size= 0.1, alpha=0.5, linetype='dotted') +
  scale_fill_fermenter('Global acc.', n.breaks=6, palette= "RdYlGn", direction = 1) +
  facet_wrap(~year, ncol=7, nrow=5) + 
  xlim(60, 42) +
  ylim(25, 0) +
  theme_minimal()

## plot amp
ggplot() +
  geom_sf(data= reg_vec, mapping= aes(fill= amp), color= 'white', size= 0.1, alpha=1) +  
  geom_text(data = points, aes(X, Y, label = mapb), size = 3, col='black') +
  geom_sf(data= states_vec, color= 'gray20', fill= NA, size= 0.1, alpha=0.5, linetype='dotted') +
  scale_fill_fermenter('Amplitude', n.breaks=6, palette= "PuOr", na.value="gray90", direction = -1) +
  xlim(60, 42) +
  ylim(25, 0) +
  theme_minimal()

## regressions
## read LCLUC 
col6 <- read.csv('./table/Reg-cover.csv')[-1][-5]

## create clases
## native
nat <- subset(col6, class_id == '3' | class_id == '4' | class_id == '5' | class_id == '11' | class_id == '12' | class_id == '23' | class_id == '32')
## farming
#farming <- subset(col6, class_id != '3' & class_id != '4' & class_id != '5' & class_id != '11' & class_id != '12' & class_id != '33' & class_id != '23' & class_id != '32' )
farming <- subset(col6, class_id == '21')
## insert names
nat$class1 <- 'Native'
farming$class1 <- "Farming"

## bind
data2 <- rbind(nat, farming)

## compute farming delta
recipe <- as.data.frame(NULL)
for (i in 1:length(unique(data2$territory))) {
  ## subset for region i
  temp <- subset(data2, territory == unique(data2$territory)[i])
  ## subset start
  start <- subset(temp, year == 1985 & class1 == 'Farming')
  ## subset end
  end <- subset(temp, year == 2020 & class1 == 'Farming')
  ## compute increase or decrease in farming
  delta <- sum(end$area) - sum(start$area)
  ## relative delta
  relative <- delta/sum(start$area) * 100
  ## area 2020
  farm_2020 <- sum(end$area)
  ## build temporary file
  obj <- cbind(mapb= unique(data2$territory)[i], delta_farm= delta, relative_delta = relative, farm_2020= farm_2020)
  ## insert into recipe
  recipe <- rbind(obj, recipe)
  ## clean memory
  rm(temp, start, end, delta, obj, relative)
}

## merge with other data
reg_vec <- left_join(reg_vec, recipe, by='mapb')

# set polynomum
formula <- y ~ poly(x, 1, raw = TRUE)    

## plot relation
ggplot(subset(reg_vec, mapb != '25'), mapping= aes(x=delta_farm / 1000, y=amp)) +
  geom_text(mapping= aes(label=mapb), col='black', size=4) +
  geom_smooth(method='loess', se=F, col='red') +
  # stat_poly_eq(formula = formula, parse = TRUE, 
  #              mapping = aes(label = stat(rr.label)),
  #              colour='red') +
  geom_vline(xintercept=0, col= 'blue', linetype='dashed', size=1) +
  #geom_point(mapping= aes(size= farm_2020)) +
  theme_classic() +
  xlab('Mosaic of A/P change (x 1000 km²)') +
  ylab('Acc. Amplitude (max-min)')

