# Perform analisys for the Webinar/Fact Sheet of Cerrado biome - collection 7
# dhemerson.costa@ipam.org.br

## Load libraries
library(dplyr)
library(ggplot2)
library(tidyr)
library(tools)
library(reshape2)
library(sf)
library(ggrepel)

## avoid scientific notation
options(scipen= 999)

## read collecitons area
data <- read.csv('./table/lcluc/area_biomes_per_state_from_5_to_7_v20.csv',
                 sep='\t', 
                 dec=',',
                 header=TRUE,
                 encoding= 'UTF-8')

## select only collection 7 and level 0
data_l0 <- subset(data, collection == "Collection 7" & 
                    level == "level_0" & 
                    biome == 'Cerrado' &
                    class != "Not applied" &
                    state == 'Mato Grosso')

## select only collection 7 and level 2
data_l2 <- subset(data, collection == "Collection 7" & 
                    level == "level_2" & 
                    biome == 'Cerrado' &
                    state == 'Mato Grosso')

## select only collection 7 and level 4 (for the year of 2021) 
data_l4 <- subset(data, collection == "Collection 7" & 
                    level == "level_4" & 
                    biome == 'Cerrado' &
                    year == 2021 &
                    state == 'Mato Grosso')


## aggregate level-4 for the entire biome
data_l4_agg <- aggregate(x= list(area= data_l4$area), 
                         by= list(class= data_l4$class), FUN= 'sum')

## get proportions of level-4 in 2021
data_l4_agg$perc <- round(data_l4_agg$area/ sum(data_l4_agg$area) * 100, digits=1)

## rename classes in level 2
data_l2$class_1 <- 
  gsub('Rocky outcrop', 'Others',
       gsub('Forest Plantation', 'Agriculture',
            gsub('Mosaic of Agriculture and Pasture', 'Mosaic of Uses',
                 gsub('Urban Infrastructure', 'Others',
                      gsub('Other Non Vegetated Area', 'Others',
                           gsub('Mining', 'Others',
                                gsub('Magrove', 'Forest Formation',
                                     gsub('Salt flat', 'Others',
                                          gsub('Beach and Dune', 'Others',
                                               gsub('Aquaculture', 'Others',
                                                    data_l2$class))))))))))

## remove non observed
data_l2 <- subset(data_l2, class_1 != 'Non Observed')

## plot historic (1985 - 2021) - anthropic vs. natural 
ggplot(data= data_l0, aes(x= as.numeric(year), y= area, fill= class)) +
  stat_summary(geom='area', fun='sum', position='stack', alpha=0.9) + 
  scale_fill_manual('Legenda', values=c('orange', 'forestgreen')) +
  theme_minimal() +
  xlab('Ano') + ylab('Área (Mha)')

## aggregate
data_l0_agg <- aggregate(x=list(area=data_l0$area), by=list(class=data_l0$class, year= data_l0$year), FUN='sum')

## get anthropized area from 1985 to 2021
from_1985_to_2021 <-
  subset(data_l0_agg, year == 2021 & class == "Anthropic")$area - 
  subset(data_l0_agg, year == 1985 & class == "Anthropic")$area 

## get anthropized area from [x] to 1985
from_x_to_1985 <- subset(data_l0_agg, year == 1985 & class == "Anthropic")$area 

## get remaining native
native_2021 <- subset(data_l0_agg, year == 2021 & class == "Natural")$area 

## build data frame
ant <-
  as.data.frame(
    rbind(
      c(Class= '< 1985', Area= from_x_to_1985, Class_0 = 'Antrópico'),
      c(Class= '> 1985', Area= from_1985_to_2021, Class_0 = 'Antrópico')
    )
  )

## compute percents of anthropized area before and after 1985
ant$perc <- round(as.numeric(ant$Area)/sum(as.numeric(ant$Area)) * 100, digits=1)

## bind natural
ant <- 
  rbind(ant,
        c(Class = 'Natural', Area= subset(data_l0_agg, year == 2021 & class == "Natural")$area, 
          Class_0= 'Natural',perc= NA))

## plot temporal partitions of anthropization 
ggplot(data= ant, mapping= aes(x=as.factor(Class_0), y= as.numeric(Area), fill= Class)) +
  geom_bar(stat= 'identity', position= 'stack') +
  scale_fill_manual(NULL, values=c('#FFF792', '#FF0000', '#E3E3E3'),
                    labels=c('Antropizado antes de 1985', 'Antropizado depois de 1985', 'Áreas Naturais')) +
  geom_text(mapping=aes(label= paste0(perc, '%')),
            position = position_stack(vjust = 0.5), size=5) +
  xlab(NULL) +
  ylab('Área (Mha)') +
  theme_minimal() +
  coord_flip()

## Merge grassland and wetland into "Formação Não Florestal"
data_l2$class_hist <- gsub('Wetland', 'Other Non Forest',
                           gsub('Grassland', 'Other Non Forest',
                                data_l2$class_1))

## create levels of "native" and "farming" 
data_l2$class_hist_gen <- gsub('^Forest Formation$', 'Nativa',
                               gsub('^Savanna Formation$', 'Nativa',
                                    gsub('^Other Non Forest$', 'Nativa',
                                         gsub('^Other$', 'Outros',
                                              gsub('^Pasture$', 'Agropecuária',
                                                   gsub('^Agriculture$', 'Agropecuária',
                                                        gsub('^Mosaic of Uses$', 'Agropecuária',
                                                             gsub('^River, Lake and Ocean$', 'Outros',
                                                                  data_l2$class_hist))))))))

## insert forestry
x <- subset(data_l2, class == 'Forest Plantation')
y <- subset(data_l2, class != 'Forest Plantation')

## insert label
x$class_hist <- "Silvicultura"

## bind data
data_l2 <- rbind(x,y); rm(x,y)

# re-order classes in level 2
data_l2$class_hist <- factor(data_l2$class_hist, levels = c("Forest Formation", "Savanna Formation", "Other Non Forest", 
                                                            "Pasture", "Agriculture", "Mosaic of Uses", "Silvicultura"))

## re-order grpahj position
data_l2$class_hist_gen <- factor(data_l2$class_hist_gen, levels = c("Nativa", "Agropecuária"))

## plot historic (1985 - 2021) - level 2
ggplot(data= subset(data_l2, class_hist_gen == "Nativa" | class_hist_gen == "Agropecuária"),
       aes(x= as.numeric(year), y= area, fill= class_hist, group= class_hist)) +
  stat_summary(geom='area', fun='sum', position='stack', alpha=0.9) + 
  facet_wrap(~class_hist_gen) +
  scale_fill_manual(NULL, values=c("#006400", "#32CD32", "#BBFCAC", "#FFD966", "#E974ED", "#FFEFC3", "#935132"),
                    labels=c('Form. Florestal', 'Form. Savânica', 'Form. Não Florestal', 'Pastagem', 'Agricultura', 'Mosaico de Usos', 'Silvicultura')) +
  theme_minimal() +
  xlab('Ano') + ylab('Área (Mha)')

## aggreate per state
x <- subset(data_l2, state == "Mato Grosso")

## aggregate
x <- aggregate(x= list(area= x$area), by=list(class= x$class_hist, year= x$year), FUN= 'sum')

## get proportions
r1 <- as.data.frame(NULL)
for (i in 1:unique(length(x$year))) {
  ## get year i
  y <- subset(x, year == unique(x$year)[i])
  ## calc prop
  y$perc <- y$area / sum(y$area) * 100
  ## bind
  r1 <- rbind(y, r1)
}

## compute absolute area and proportions - considering native vs. farming
data_l2_agg <- aggregate(x=list(area=data_l2$area), 
                         by=list(class= data_l2$class_hist_gen, year= data_l2$year),
                         FUN='sum')

## compute absolute loss for the same classes that previous graph
data_l2_agg <- aggregate(x=list(area=data_l2$area), 
                         by=list(class= data_l2$class_hist, year= data_l2$year),
                         FUN='sum')

## compute proportions in start (x) and end (y) years
## get for 1985
x <- subset(data_l2_agg, year== 1985)
x$perc <- round(x$area/sum(x$area) * 100, digits=1)
## get for 2021
y <- subset(data_l2_agg, year== 2021)
y$perc <- round(y$area/sum(y$area) * 100, digits=1)

## compute liquid loss/gain (2021 - 1985)
y$loss_area <- y$area - x$area
y$loss_perc <- (y$loss_area/x$area) * 100

## aggregate areas by class (more detailed) - with wetlands 
data_l2_agg <- aggregate(x=list(area=data_l2$area), 
                         by=list(class= data_l2$class_1, year= data_l2$year),
                         FUN='sum')

## compute proportions in start (x) and end (y) years
## get for 1985
x <- subset(data_l2_agg, year== 1985)
x$perc <- round(x$area/sum(x$area) * 100, digits=1)
## get for 2021
y <- subset(data_l2_agg, year== 2021)
y$perc <- round(y$area/sum(y$area) * 100, digits=1)

## compute liquid loss/gain (2021 - 1985)
y$loss_area <- y$area - x$area
y$loss_perc <- (y$loss_area/x$area) * 100

## plot land cover and land use (level-2) for the year of 2021
x <- subset(data_l2, year == 2021)  

## aggregate values
x <- aggregate(x=list(area=x$area), by=list(class= x$class_1), FUN='sum')

## compute metrics to build donut plot
x$relac <- (x$area / sum(x$area) * 100)
x$fraction <- x$relac / sum(x$relac)
x$ymax = cumsum(x$fraction)
x$ymin = c(0, head(x$ymax, n=-1))
x$labelPosition <- (x$ymax + x$ymin) / 2
x$label <- paste0(round(x$relac, digits=1), "%")

# plot donut for 2021
ggplot(x, aes(ymax=ymax, ymin=ymin, xmax=4, xmin=3, fill=class)) +
  geom_rect(alpha=0.9) +
  coord_polar(theta="y") + # Try to remove that to understand how the chart is built initially
  xlim(c(2, 4)) + # Try to remove that to see how to make a pie chart
  theme_void() 
#scale_fill_manual(NULL, values=c("#006400", "#00ff00", "#45C2A5", "#B8AF4F", "#0000FF", "#fff3bf", "#FFD966", "#E974ED", "#aa0000"))
#geom_label_repel(x=3.5, aes(y=labelPosition, label=label), label.size=NA, size=7, color='black', fill=NA)


## create labels to perform the farming expansion analisys
data_l2$level_agro <- gsub("^Forest Formation", "Formação Florestal",
                           gsub('Savanna Formation', 'Formação Savânica',
                                gsub('Wetland', 'Formação Natural Não Florestal',
                                     gsub('Grassland', 'Formação Natural Não Florestal',
                                          gsub('Pasture', 'Pastagem',
                                               gsub('Agriculture', 'Agricultura',
                                                    gsub('Urban Infrastructure', 'Outros',
                                                         gsub('Mining', 'Outros',
                                                              gsub('River, Lake and Ocean', 'Outros',
                                                                   gsub('Non Observed', 'Outros',
                                                                        gsub('Other Non Vegetated Area', 'Outros',
                                                                             gsub('Forest Plantation', 'Floresta Plantada',
                                                                                  gsub('Magrove', 'Formação Florestal',
                                                                                       gsub('Salt flat', 'Formação Natural Não Florestal',
                                                                                            gsub('Beach and Dune', 'Outros',
                                                                                                 gsub('Mosaic of Agriculture and Pasture', 'Mosaico de Usos',
                                                                                                      gsub('Rocky outcrop', 'Formação Natural Não Florestal',
                                                                                                           gsub('Aquaculture', 'Outros',
                                                                                                                gsub('Other Non Forest Natural Formation', 'Formação Natural Não Florestal',
                                                                                                                     gsub('Forest Restinga', 'Formação Florestal', data_l2$class))))))))))))))))))))


## key to translate sates
data_l2$state_sigla <- gsub('Bahia', 'BA',
                            gsub('Distrito Federal', 'DF',
                                 gsub('Goiás', 'GO',
                                      gsub('Maranhão', 'MA',
                                           gsub('Mato Grosso', 'MT',
                                                gsub('Mato Grosso do Sul', 'MS',
                                                     gsub('Minas Gerais', 'MG',
                                                          gsub('Pará', 'PA',
                                                               gsub('Paraná', 'PR',
                                                                    gsub('Piauí', 'PI',
                                                                         gsub('Rondônia', 'RO',
                                                                              gsub('São Paulo', 'SP',
                                                                                   gsub('Tocantins', 'TO',
                                                                                        data_l2$state)))))))))))))

## aggregate farming class by year for each state
data_agro <- aggregate(x=list(area=data_l2$area),
                       by=list(year=data_l2$year, 
                               class= data_l2$level_agro,
                               state=data_l2$state_sigla), FUN='sum')

## subset an retain only farming classes
data_agro <- subset(data_agro, class == "Agricultura" | 
                      class == "Pastagem" |
                      class == "Floresta Plantada" |
                      class == "Mosaico de Usos")

## reorder to harmonize graphics
data_agro$class <- factor(data_agro$class, levels = c(
  "Floresta Plantada", "Agricultura", "Mosaico de Usos", "Pastagem")) 

## compute per state totam farming area in first (y) and last years (z)
recipe <- as.data.frame(NULL)
for (i in 1:length(unique(data_agro$state))) {
  x <- subset(data_agro, state == unique(data_agro$state)[i])
  y <- subset(x, year == 2021)
  z <- subset(x, year == 1985)
  x$area2021 <- sum(y$area)
  x$area1985 <- sum(z$area)
  recipe <- rbind(recipe, x)
  rm(x, y, z)
}

## compute delta (estimate loss/gain) of farming
recipe$diff <- recipe$area2021 - recipe$area1985
recipe$perc <- round(recipe$area2021 / recipe$area1985, digits=1)

## reoder by states with highest relative increases 
recipe$state <- reorder(recipe$state, -recipe$perc)

## plot farming growth per state 
ggplot(recipe, aes(x=as.numeric(year), y= area)) +
  geom_area(aes(group=class, fill=class), alpha=0.9) +
  facet_wrap(~state, scales= "free", ncol=5) +
  scale_fill_manual(values=c("#935132", "#E974ED", "#fff3bf", "#FFD966")) +
  xlab("Ano") + ylab("Área (Mha)") +
  theme_minimal() +
  theme(strip.text = element_text(size=12))

## aggregate values to estimate farming expansion
aggregate(x=list(area=recipe$area), by=list(year=recipe$year), FUN='sum')


### get data to build per state level 1-2 historic 
## first, select only native vegetation classes
native <- subset(data_l2, level_agro == "Formação Florestal" |
                   level_agro == "Formação Savânica" |
                   level_agro == "Formação Natural Não Florestal")

## now, get anthopogenic use 
ant <- subset(data_l2, level_agro != "Formação Florestal" &
                level_agro != "Formação Savânica" &
                level_agro != "Formação Natural Não Florestal")

## rename classes that are in 'others' but needs to be included as anthropic
ant$level_states <- gsub('Urban Infrastructure', 'Antrópico',
                         gsub('Mining', 'Antrópico',
                              ant$class))

## rename classes in native vegetation to create same column as in ant
native$level_states <- native$level_agro

## rename classes in ant to 'anthropogenic use'
ant$level_states <- 
  gsub('Pasture', 'Antrópico',
       gsub('Agriculture', 'Antrópico',
            gsub('Forest Plantation', 'Antrópico',
                 gsub('Mosaic of Agriculture and Pasture', 'Antrópico',
                      gsub('Aquaculture', 'Antrópico',
                           gsub('Other Non Vegetated Area', 'Outros',
                                gsub('River, Lake and Ocean', 'Outros',
                                     gsub('Beach and Dune', 'Outros',
                                          ant$level_states))))))))

## bind data
data_bind <- rbind(native, ant); rm(native, ant)

## aggregate statistics per state 
data3 <- aggregate(x=list(area=data_bind$area),
                   by=list(year=data_bind$year,
                           class= data_bind$level_states,
                           state=data_bind$state_sigla), FUN='sum')

## compute the sum and proportion of anthropogenic use per state in the last year 
## (will be used to reorder graphics)
recipe <- as.data.frame(NULL)
for (i in 1:length(unique(data3$state))) {
  x <- subset(data3, state == unique(data3$state)[i])
  y <- subset(x, class == "Antrópico" & year == 2021)
  z <- subset(x, year == 2021)
  x$perc <- (y$area / sum(z$area) * 100)
  recipe <- rbind(recipe, x)
  rm (x, y, z)
}

## reorderstates by anthropogenic predominance 
recipe$state <- reorder(recipe$state, recipe$perc)

## reorder classes 
recipe$class <- factor(recipe$class, levels = c("Formação Florestal", "Formação Savânica",
                                                "Formação Natural Não Florestal", "Antrópico", "Outros"))

## plot historic per state 
ggplot(data=recipe, aes(x=as.numeric(year), y=area)) +
  geom_area(aes(group=class, fill=class)) +
  facet_wrap(~state, scales='free_y', ncol=4) +
  theme_minimal() +
  theme(strip.text = element_text(size=13)) +
  scale_fill_manual(values=c('#006400', '#32CD32', '#BBFCAC', 'orange', 'gray90')) +
  xlab('Ano') + ylab ('Area (Mha)')

## get the total area of 1985 and 2021, per state in level 0
data3 <- aggregate(x=list(area=data_l0$area),
                   by=list(year=data_l0$year, class= data_l0$class, state=data_l0$state), FUN='sum')

## get only first and last year
data3 <- subset(data3, year == 1985 | year == 2021)

## get relative values per state 
recipe <- as.data.frame(NULL)
for (i in 1:length(unique(data3$state))) {
  x <- subset(data3, state == unique(data3$state)[i])
  for (j in 1:length(unique(x$year))) {
    y <- subset(x, year== unique(x$year)[j])
    y$perc <- (y$area / sum(y$area) * 100)
    recipe <- rbind(recipe, y)
  }
  rm(x, y)
}

## key to translate sates
recipe$state_sigla <- gsub('Bahia', 'BA',
                           gsub('Distrito Federal', 'DF',
                                gsub('Goiás', 'GO',
                                     gsub('Maranhão', 'MA',
                                          gsub('Mato Grosso', 'MT',
                                               gsub('Mato Grosso do Sul', 'MS',
                                                    gsub('Minas Gerais', 'MG',
                                                         gsub('Pará', 'PA',
                                                              gsub('Paraná', 'PR',
                                                                   gsub('Piauí', 'PI',
                                                                        gsub('Rondônia', 'RO',
                                                                             gsub('São Paulo', 'SP',
                                                                                  gsub('Tocantins', 'TO',
                                                                                       recipe$state)))))))))))))



## plot comparisons by state (first vs. last year) in level-0
ggplot(recipe, aes(x= as.factor(year), y=perc, fill= class))+
  geom_bar(stat="identity", alpha=0.85) +
  scale_fill_manual(values=c('orange', 'forestgreen', 'gray', 'red')) +
  facet_wrap(~state_sigla, ncol=7) +
  theme_minimal() +
  theme(strip.text = element_text(size=13)) +
  geom_text(aes(label = paste0(round(perc, digits=0), "%")), position = position_stack(vjust = .5)) + ## com % em cada barra
  #geom_text(aes(label= round(liq_loss, digits=1))) +
  xlab('Ano') + ylab('Área (Mha)') +
  theme(strip.text = element_text(size=13))


#### compute the vegetation loss per state by considering different time windows
loss <- subset(data_bind, class == 'Forest Formation' |
                 class == 'Savanna Formation' |
                 class == 'Grassland' |
                 class == 'Wetland')

## get deforestation between all years for each state and class 
recipe <- as.data.frame(NULL)
for (i in 1:length(unique(loss$state))) {
  ## get state [i]
  x <- subset(loss, state == unique(loss$state)[i])
  print(unique(loss$state)[i])
  ## for each year [j]
  for (j in 1:length(unique(x$year))) {
    print(unique(x$year)[j])
    ## compute the loss between years
    if (unique(loss$year)[j] != 2021) {
      yj <- subset(x, year == unique(loss$year)[j])     ## get year  [ij]
      yj1 <- subset(x, year == unique(loss$year)[j+1])  ## get year  [ij+1]
      ## subtract ij from i+1 (deforestation had positive values, regeneration negative)
      diff <- yj$area - yj1$area
      ## put it on a labeled data.frame
      z <- as.data.frame(
        cbind(
          class= yj$class,
          diff= diff,
          interval= paste0(yj1$year),
          state= yj$state_sigla
        )
      )
      ## put computatiom into recipe
      recipe <- rbind(recipe, z)
      rm(yj, yj1, diff, z)
    } else {
      print('skip')
    }
    
  }
  rm(x)
}

## get cummulative deforestation for each state
recipe2 <- as.data.frame(NULL)
for (i in 1:length(unique(recipe$state))) {
  ## get state [i]
  x <- subset(recipe, state == unique(recipe$state)[i])
  ## aggregate statistics
  x <- aggregate(x= list(diff= as.numeric(x$diff)), 
                 by= list(interval= x$interval), FUN= 'sum')
  ## add state
  x$state <- unique(recipe$state)[i]
  ## get absolute cummulative sum
  x$cumsum <- cumsum(x$diff)
  ## bind
  recipe2 <- rbind(recipe2, x)
  rm(x)
}

## plot deforestation in absolute terms, comparing states
ggplot(data= recipe2, mapping= aes(x= as.numeric(interval), y= cumsum, group= state, colour= cumsum)) +
  geom_line(size= 2, alpha= 0.2) + 
  geom_line(size= 0.8, alpha= 0.7) + 
  theme_minimal() +
  theme(axis.text.x = element_text(angle = 90), legend.position="none") + 
  ## insert label (state) in the last time interval
  geom_text_repel(data = subset(recipe2, interval == 2021),
                  aes(label = state, colour = cumsum, x = as.numeric(interval), y = cumsum), hjust = -.1, size=4) +
  scale_colour_gradient(low = "black", high = "red", space = "Lab", 
                        na.value = "grey50", guide = "colourbar", aesthetics = "colour") +
  ylab('Supressão de vegetação nativa acumulada (Mha)') +
  xlab(NULL)

## here start the generation of maps
vec_states <- read_sf(dsn='./vec', layer='states_cerrado_clipped')
vec_states_raw <- read_sf(dsn='./vec', layer='states_cerrado_clipped')

## get cummulative deforestation for the entire period 
loss_total <- subset(recipe2, interval == 2021)

## join values of deforestation with states vector
loss_total <- left_join(vec_states, loss_total, by= c('sigla' = 'state'))

## extract centroids of each state to use as position for the label
point_states <- st_point_on_surface(vec_states)
point_states <- as.data.frame(st_coordinates(point_states))
point_states$NAME <- vec_states$sigla

## plot map
ggplot(loss_total) +
  geom_sf(mapping= aes(fill= cumsum), col= 'gray40') +
  scale_fill_fermenter('Área (Mha)', n.breaks = 6, palette = "YlOrRd", direction = 1) +
  geom_text(data = point_states, aes(X, Y, label = NAME), colour = "black", size=4) +
  theme_void()

## get cumulative deforestation per state from 2010 to 2021
xij <- subset(loss, year > 2009 & year < 2021)
recipe <- as.data.frame(NULL)
for (i in 1:length(unique(xij$state))) {
  ## get state [i]
  x <- subset(xij, state == unique(xij$state)[i])
  print(unique(xij$state)[i])
  ## for each year [j]
  for (j in 1:length(unique(x$year))) {
    print(unique(x$year)[j])
    ## compute the xij between years
    if (unique(xij$year)[j] != 2020) {
      yj <- subset(x, year == unique(xij$year)[j])     ## get year  [ij]
      yj1 <- subset(x, year == unique(xij$year)[j+1])  ## get year  [ij+1]
      ## subtract ij from i+1 (deforestation had positive values, regeneration negative)
      diff <- yj$area - yj1$area
      ## put it on a labeled data.frame
      z <- as.data.frame(
        cbind(
          class= yj$class,
          diff= diff,
          interval= paste0(yj1$year),
          state= yj$state_sigla
        )
      )
      ## put computatiom into recipe
      recipe <- rbind(recipe, z)
      rm(yj, yj1, diff, z)
    } else {
      print('skip')
    }
    
  }
  rm(x)
}

## get cummulative deforestation for each state
recipe2 <- as.data.frame(NULL)
for (i in 1:length(unique(recipe$state))) {
  ## get state [i]
  x <- subset(recipe, state == unique(recipe$state)[i])
  ## aggregate statistics
  x <- aggregate(x= list(diff= as.numeric(x$diff)), 
                 by= list(interval= x$interval), FUN= 'sum')
  ## add state
  x$state <- unique(recipe$state)[i]
  ## get absolute cummulative sum
  x$cumsum <- cumsum(x$diff)
  ## bind
  recipe2 <- rbind(recipe2, x)
  rm(x)
}

## plot deforestation in absolute terms, comparing states from 2010 to 2021
ggplot(data= recipe2, mapping= aes(x= as.factor(interval), y= cumsum, group= state, colour= cumsum)) +
  geom_line(size= 2, alpha= 0.2) + 
  geom_line(size= 0.8, alpha= 0.7) + 
  theme_minimal() +
  theme(legend.position="none") + 
  ## insert label (state) in the last time interval
  geom_text_repel(data = subset(recipe2, interval == 2020),
                  aes(label = state, colour = cumsum, x = as.factor(interval), y = cumsum), hjust = -.1, size=4) +
  scale_colour_gradient(low = "black", high = "red", space = "Lab", 
                        na.value = "grey50", guide = "colourbar", aesthetics = "colour") +
  ylab('Perda líquida acumulada (Mha)') +
  xlab(NULL)


## plot trajectories of conversion, following the agrosatelite analisys (from 1985 to 2009)
traj_i <- read.csv('./table/transitions_agrosatelite/AREA_1985-2009_Expansao_Cerrado.csv')

## translate trajectories
traj_i$class_i <- gsub(1, 'Mosaico de Usos -> Lavoura Temporária',
                       gsub(2, 'Veg. Nativa -> Pastagem -> Lavoura Temporária',
                            gsub(3, 'Veg. Nativa -> Lavoura Temporária',
                                 gsub(4, 'Pastagem -> Lavoura Temporária',
                                      gsub(5, 'Veg. Nativa -> Pastagem',
                                           traj_i$class)))))

## compute percents
traj_i$perc <- round(traj_i$area/sum(traj_i$area) * 100, digits=1)

## plot
ggplot(data= traj_i, mapping= aes(x= reorder(class_i, area), y= area/1e6, fill= class_i)) +
  geom_bar(stat= 'identity', alpha=0.9) +
  scale_fill_manual(NULL, values=c("#ff1515", "#9344eb", "#65e8a0", "#daa858", "#f2ff00")) +
  geom_text(mapping=aes(label= paste0(perc, '%')), position = position_stack(vjust = 0.5), size=5) +
  coord_flip() +
  xlab(NULL) + 
  ylab('Área (Mha)') +
  theme_minimal()


## plot trajectories of conversion, following the agrosatelite analisys (from 2010 to 1985)
traj_i <- read.csv('./table/transitions_agrosatelite/AREA_2010-2021_Expansao_Cerrado.csv')

## translate trajectories
traj_i$class_i <- gsub(1, 'Mosaico de Usos -> Lavoura Temporária',
                       gsub(2, 'Veg. Nativa -> Pastagem -> Lavoura Temporária',
                            gsub(3, 'Veg. Nativa -> Lavoura Temporária',
                                 gsub(4, 'Pastagem -> Lavoura Temporária',
                                      gsub(5, 'Veg. Nativa -> Pastagem',
                                           traj_i$class)))))

## compute percents
traj_i$perc <- round(traj_i$area/sum(traj_i$area) * 100, digits=1)

## plot
ggplot(data= traj_i, mapping= aes(x= reorder(class_i, area), y= area/1e6, fill= class_i)) +
  geom_bar(stat= 'identity', alpha=0.9) +
  scale_fill_manual(NULL, values=c("#ff1515", "#9344eb", "#65e8a0", "#daa858", "#f2ff00")) +
  geom_text(mapping=aes(label= paste0(perc, '%')), position = position_stack(vjust = 0.5), size=5) +
  coord_flip() +
  xlab(NULL) + 
  ylab('Área (Mha)') +
  theme_minimal()


# 
# ## perda de vegetação nativa por bioma
# data4 <- aggregate(x=list(area=data$value), by=(list(biome=data$state, year=data$variable, class=data$level_0)), FUN='sum')
# 
# ## plot
# ggplot(subset(data4, class == "Natural"), aes(x=as.numeric(year), y=area/1000000)) +
#   geom_area(aes(group=class, fill=class), alpha= 0.9) +
#   scale_fill_manual(values=c("forestgreen")) +
#   facet_wrap(~biome, scales= "free") +
#   theme_minimal() +
#   xlab('Ano') + ylab('Área (Mha)')

# 
# urban <- subset(data, level_2 == "Urban Infrastructure" )
# urban<- aggregate(x=list(area=urban$value), by=list(year=urban$variable), FUN='sum')
# urban

## read matopiba
# matopiba <- read.csv('./table/lcluc/area_matopiba.csv',
#                       sep=',', 
#                       dec='.',
#                       header=TRUE,
#                       encoding= 'UTF-8')
# 
# ## remove undesirable columns
# matopiba <- matopiba[ , -which(names(matopiba) %in% c("system.index", ".geo"))]
# 
# ## get 2021 
# matopiba_x <- subset(matopiba, year== 2010)
# matopiba_y <- subset(matopiba, year== 2021)
# 
# ## compute native loss
# sum(subset(matopiba_y, class_id == 3 |
#              class_id == 4 | class_id == 11 | class_id == 12)$area) - 
#   sum(subset(matopiba_x, class_id == 3 |
#                      class_id == 4 | class_id == 11 | class_id == 12)$area) 
# 
# cerrado_x <- subset(data_l2_agg, year == 2010)
# cerrado_y <- subset(data_l2_agg, year == 2021)
# 
# 
# 











# 
# 
# 
# 
# ## subset classes de interesse
# df_map_states<- subset(data, level_2 == "Forest Formation" | level_2 == "Savanna Formation" | 
#                              level_2 == "Magrove" | level_2 == "River, Lake and Ocean" |
#                              level_2 == "Pasture" | level_g0 == "Formação Campestre" |
#                              level_g0 == "Campo alagado e Área Pantanosa" |
#                              level_g0 == "Agricultura" | level_agro == "Floresta Plantada" | 
#                              level_2 == "Urban Infrastructure" | level_2 == "Mining")
# 
# ## rename
# df_map_states$level_map <- gsub("Forest Formation", "Formação Florestal",
#                                 gsub("Savanna Formation", "Formação Savânica",
#                                      gsub("Wetland", "Campo Alagado e Área Pantanosa",
#                                           gsub("Grassland", "Formação Campestre",
#                                                gsub("Pasture", "Pastagem",
#                                                     gsub("Agriculture", "Agricultura",
#                                                          gsub("Urban Infrastructure", "Área Urbanizada",
#                                                               gsub("Mining", "Mineração",
#                                                                    gsub("River, Lake and Ocean", "Água",
#                                                                         gsub("Forest Plantation", "Silvicultura",
#                                                                              gsub("Magrove", "Mangue",
#                                                                                   gsub("Salt flat", "Formação Natural Não Florestal",
#                                                                                        gsub("Rocky outcrop", "Formação Natural Não Florestal",
#                                                                                             gsub("Other Non Forest Natural Formation", "Formação Natural Não Florestal", df_map_states$level_2))))))))))))))
# ## remove mosaic and subset only to 2020
# df_map_states <- subset(df_map_states, level_map != "Mosaic of Agricultura and Pastagem" & variable == 2020)
# 
# ## aggregate value by state
# df_map_states <- aggregate(x=list(area=df_map_states$value), by=list(class=df_map_states$level_map, state=df_map_states$state), FUN= 'sum')
# 
# ## computar valores relativos por estados
# recipe <- as.data.frame(NULL)
# for (i in 1:length(unique(df_map_states$state))) {
#   temp <- subset(df_map_states, state == unique(df_map_states$state)[i])
#   temp$perc <- (temp$area / sum(temp$area)) * 100
#   temp$area <- temp$area / 1000000
#   recipe <- rbind(recipe, temp)
#   rm(temp)
# }
# 
# ## rename 
# colnames(recipe)[2] <- "sigla"
# 
# ## associar dados os vetores de estados
# vec_states <- left_join(vec_states, recipe, by= "sigla")
# 

# 
# 
# ## plotar floresa
# ggplot(subset(vec_states, class == "Formação Florestal")) +
#   geom_sf(aes(fill=area), col='gray60') +
#   scale_fill_gradient('Área (Mha)', low="#4dff4d", high="#003300", space="Lab") +
#   geom_text(data = point_states, aes(X, Y, label = NAME), colour = "black", size=8) +
#   theme_void()
# 
# ## savana
# ggplot(subset(vec_states, class == "Formação Savânica")) +
#   geom_sf(aes(fill=area), col='gray60') +
#   scale_fill_gradient("Área (Mha)", low="#d6f5d6", high="#32CD32", space="Lab") +
#   geom_text(data = point_states, aes(X, Y, label = NAME), colour = "black", size=8) +
#   geom_sf(data=vec_states_raw, fill= NA, col = 'gray60') +
#   theme_void()
# 
# 
# ## formação campestre 
# ggplot(subset(vec_states, class == "Campo Alagado e Área Pantanosa")) +
#   geom_sf(aes(fill=area), col=NA) +
#   scale_fill_gradient('Área (Mha)', low="#ecf9f6", high="#1f6051", space="Lab") +
#   geom_text(data = point_states, aes(X, Y, label = NAME), colour = "black", size=8) +
#   geom_sf(data=vec_states_raw, fill= NA, col = 'gray60') +
#   theme_void()
# 
# ## formação campestre 
# ggplot(subset(vec_states, class == "Formação Campestre")) +
#   geom_sf(aes(fill=area), col=NA) +
#   scale_fill_gradient('Área (Mha)', low="#f8f0ec", high="#391f14", space="Lab") +
#   geom_text(data = point_states, aes(X, Y, label = NAME), colour = "black", size=8) +
#   geom_sf(data=vec_states_raw, fill= NA, col = 'gray60') +
#   theme_void()
# 
# 
# ## agua
# ggplot(subset(vec_states, class == "Água")) +
#   geom_sf(aes(fill=area), col=NA) +
#   scale_fill_gradient('Área (Mha)', low="#cce0ff", high="#0052cc", space="Lab") +
#   geom_text(data = point_states, aes(X, Y, label = NAME), colour = "black", size=8) +
#   geom_sf(data=vec_states_raw, fill= NA, col = 'gray60') +
#   theme_void()
# 
# ## pastagem
# ggplot(subset(vec_states, class == "Pastagem")) +
#   geom_sf(aes(fill=area), col= NA) +
#   scale_fill_gradient('Area (Mha)', low="#fff9e6", high="#e6ac00", space="Lab") +
#   geom_text(data = point_states, aes(X, Y, label = NAME), colour = "black", size=8) +
#   geom_sf(data=vec_states_raw, fill= NA, col = 'gray60') +
#   theme_void()
# 
# # agricultura
# ggplot(subset(vec_states, class == "Agricultura")) +
#   geom_sf(aes(fill=area), col=NA) +
#   scale_fill_gradient('Área (Mha)', low="#fbe8fc", high="#c51acb", space="Lab") +
#   geom_text(data = point_states, aes(X, Y, label = NAME), colour = "black", size=8) +
#   geom_sf(data=vec_states_raw, fill= NA, col = 'gray60') +
#   theme_void()
# 

###### municipíos
df_mun <- read.csv('./tables/col6_cidades_2020_lv2.csv', sep=';', dec=',')

## remove undesirable columns
df_mun <- df_mun[ , -which(names(df_mun) %in% c("X", "X.1", "X.2", "X.3", "X.4", "X.5"))]

## aggregate by mun
df_mun <- aggregate(x=list(area=df_mun$X2020), by=list(city=df_mun$city, class= df_mun$level_2, state=df_mun$state), FUN="sum")

## replace NA by zero
df_mun<- df_mun %>% mutate(across(everything(), .fns = ~replace_na(.,0)))

## subset only to classes of interest
df_mun <- subset(df_mun, class == "Forest Formation" | class =="Pasture" | class =="Savanna Formation" |
                   class== "River, Lake and Ocean" | class == "Agriculture" | class== "Grassland" | 
                   class== "Wetland" | class == "Urban Infrastructure")

## get class by mun
recipe <- as.data.frame(NULL)
for (i in 1:length(unique(df_mun$city))) {
  print (paste0(i/length(unique(df_mun$city))))
  temp <- subset(df_mun, city == unique(df_mun$city)[i])
  temp$perc_class <- (temp$area/sum(temp$area)) * 100
  temp <- subset(temp, perc_class == max(temp$perc_class))
  recipe <- rbind(recipe, temp)
  rm(temp)
}

## rename recipe 
colnames(recipe)[1] <- "NM_MUN"

## carregar municipios
vec_mun <- read_sf(dsn="./shp", layer="mun_cerrado_2020")
vec_cerrado <- read_sf(dsn="./shp", layer="cerrado")

## join data
vec_mun <- left_join(vec_mun, recipe, by= "NM_MUN")

library(ggnewscale)
## plot data
x11()
ggplot() +
  geom_sf(data= subset(vec_mun, class == "Forest Formation"), aes(fill=perc_class), col=NA, alpha=0.8) +
  scale_fill_gradient('% Floresta', low="#009900", high="#003300", space="Lab") +
  new_scale_fill() +
  geom_sf(data= subset(vec_mun, class == "Savanna Formation"), aes(fill=perc_class), col=NA, alpha=0.8) +
  scale_fill_gradient("% Savana", low="#d6f5d6", high="#32CD32", space="Lab") +
  new_scale_fill() +
  geom_sf(data= subset(vec_mun, class == "Pasture"), aes(fill=perc_class), col=NA,  alpha=0.8) +
  scale_fill_gradient('% Pastagem', low="#ffffcc", high="#ff8c1a", space="Lab") +
  new_scale_fill() +
  geom_sf(data= subset(vec_mun, class == "Agriculture"), aes(fill=perc_class), col=NA,  alpha=0.8) +
  scale_fill_gradient('% Agricultura', low="#fbe8fc", high="#c51acb", space="Lab") +
  new_scale_fill() +
  geom_sf(data= subset(vec_mun, class == "River, Lake and Ocean"), aes(fill=perc_class), col=NA,  alpha=0.8) +
  scale_fill_gradient('% Água', low="#cce0ff", high="#0052cc", space="Lab") +
  new_scale_fill() +
  geom_sf(data= subset(vec_mun, class == "Grassland"), aes(fill= perc_class), col=NA,  alpha=0.8) +
  scale_fill_gradient('% Campestre', low="#f9f2ec", high="#604020", space="Lab") +
  new_scale_fill() +
  geom_sf(data= subset(vec_mun, class == "Wetland"), aes(fill= perc_class), col=NA,  alpha=0.8) +
  scale_fill_gradient('% Úmida', low="#ecf9f6", high="#1f6051", space="Lab") +
  new_scale_fill() +
  geom_sf(data= subset(vec_mun, class == "Urban Infrastructure"), aes(fill= perc_class), col=NA, alpha=0.8) +
  scale_fill_gradient('% Área Não Vegetada', low="#ffe6e6", high="red", space="Lab") +
  geom_sf(data= vec_cerrado, fill=NA, col= 'gray40') +
  theme_void() 

## loss by municipio
# contar quantos municipios em cada classe
freq <- as.data.frame(table(vec_mun$class))
freq$perc <- freq$Freq/sum(freq$Freq) * 100

##renomear
freq$Var1 <- gsub("Agriculture", "Agricultura", 
                  gsub("Forest Formation", "Form. Florestal",
                       gsub("Grassland", "Form. Campestre",
                            gsub("Pasture", "Pastagem",
                                 gsub("River, Lake and Ocean", "Água",
                                      gsub("Savanna Formation", "Form. Savânica",
                                           gsub("Urban Infrastructure", "Área Não Vegetada",
                                                gsub("Wetland", "Campo alagado e Área Pantanosa", freq$Var))))))))


## plotar
ggplot (freq, aes(x=reorder(Var1, -Freq), y= Freq, fill= Var1)) +
  geom_bar(stat="identity") +
  scale_fill_manual(values=c("#e974ed", "#0000ff", "#aa0000", "#45c2a5", "#b8af4f", "#006400", "#00ff00", "#ffd966")) +
  geom_text(aes(label=Freq), vjust=-1) +
  theme_minimal() +
  theme(axis.text.x = element_text(angle = 90, vjust = 1.1, hjust=1)) +
  xlab(NULL) + ylab(NULL) +
  ylim(0,600)


## cidades que mais perderam vegetaçaõ nativa
df_mun <- read.csv('./tables/col6_cidades_2020_lv2_diff.csv', sep=';', dec=',')

## remove undesirable columns
df_mun <- df_mun[ , -which(names(df_mun) %in% c("X", "X.1", "X.2", "X.3", "X.4", "X.5"))]

## melt table
df_mun <- melt(df_mun)

## aggregate by mun
df_mun <- aggregate(x=list(area=df_mun$value), by=list(city=df_mun$city, class= df_mun$level_2, year= df_mun$variable, state=df_mun$state), FUN="sum")

## replace NA by zero
df_mun<- df_mun %>% mutate(across(everything(), .fns = ~replace_na(.,0)))

## subset only to classes of interest
df_mun <- subset(df_mun, class == "Forest Formation" | class =="Savanna Formation" |
                   class== "Grassland" | class== "Wetland" | class == 'River, Lake and Ocean')

## gsub
df_mun$year <- gsub("X", "", df_mun$year)

## compuite diff
recipe <- as.data.frame(NULL)
for (i in 1:length(unique(df_mun$class))) {
  temp <- subset(df_mun, class == unique(df_mun$class)[i])
  temp85 <- subset(temp, year == 1985)
  temp20 <- subset(temp, year ==  2020)
  temp20$diff <- (temp20$area - temp85$area) * -1
  recipe <- rbind(recipe, temp20)
  rm(temp, temp85, temp20)
}

## join com o vetor
colnames(recipe)[1] <- "NM_MUN"
joined <- as.data.frame(left_join(recipe, vec_mun, by="NM_MUN"))
joined <- na.omit(joined)


## filtar por 
joined <- subset(joined, perc > 40)

## create label
joined$label <- paste0(joined$NM_MUN, " - ", joined$state.x)


## aggregate by mun
recipe<- aggregate(x=list(diff=joined$diff), by=list(city=joined$label, class= joined$class.x), FUN="sum")
recipe3<- aggregate(x=list(diff=joined$diff), by=list(city=joined$NM_MUN, class= joined$class.x), FUN="sum")

## computar top 10
recipe2 <- as.data.frame(NULL)
for (i in 1:length(unique(recipe$class))) {
  temp <- subset (recipe, class == unique(recipe$class)[i])
  temp <- temp[order(temp$diff, decreasing=T),][1:10,]
  recipe2 <- rbind (recipe2, temp)
  rm(temp)
}

## remover municipios quie nao tem pelo menos 40% da area no Cerrado
ggplot (subset(recipe2, class == "Forest Formation"), aes(x=reorder(city, diff), y= diff/1000000, fill=class)) +
  geom_bar(stat="identity") +
  scale_fill_manual(NULL, labels=c(NULL), values=c("#006400")) +
  #facet_wrap(~class) +
  coord_flip() + 
  theme_minimal() +
  ylab('Área (Mha)') + xlab(NULL) +
  
  theme(text = element_text(size = 21))

x11()
ggplot() +
  geom_sf(data= subset(joined, class.x == "Forest Formation"), aes(fill=diff/1000000, geometry= geometry), col=NA, alpha=0.8) +
  scale_fill_gradient('Perda (Mha)', low="#009900", high="#003300", space="Lab") +
  geom_sf(data= vec_cerrado, fill=NA, col= 'gray40') +
  theme_void()



ggplot (subset(recipe2, class == "Savanna Formation"), aes(x=reorder(city, diff), y= diff/1000000, fill=class)) +
  geom_bar(stat="identity") +
  scale_fill_manual(NULL, labels=c(NULL), values=c("#00ff00")) +
  #facet_wrap(~class) +
  coord_flip() + 
  theme_minimal() +
  ylab('Área (Mha)') + xlab(NULL) +
  theme(text = element_text(size = 21))

ggplot() +
  geom_sf(data= subset(joined, class.x == "Savanna Formation"), aes(fill=diff/1000000, geometry= geometry), col=NA, alpha=0.8) +
  scale_fill_gradient("Perda (Mha)", low="#d6f5d6", high="#32CD32", space="Lab") +
  geom_sf(data= vec_cerrado, fill=NA, col= 'gray40') +
  theme_void()


ggplot (subset(recipe2, class == "Grassland"), aes(x=reorder(city, diff), y= diff/1000000, fill=class)) +
  geom_bar(stat="identity") +
  scale_fill_manual(NULL, labels=c(NULL), values=c("#b8af4f")) +
  #facet_wrap(~class) +
  coord_flip() + 
  theme_minimal() +
  ylab('Área (Mha)') + xlab(NULL) +
  theme(text = element_text(size = 21))

ggplot() +
  geom_sf(data= subset(joined, class.x == "Grassland"), aes(fill=diff/1000000, geometry= geometry), col=NA, alpha=0.8) +
  scale_fill_gradient('Perda (Mha)', low="#f9f2ec", high="#604020", space="Lab") +
  geom_sf(data= vec_cerrado, fill=NA, col= 'gray40') +
  theme_void()

ggplot (subset(recipe2, class == "Wetland"), aes(x=reorder(city, diff), y= diff/1000000, fill=class)) +
  geom_bar(stat="identity") +
  scale_fill_manual(NULL, labels=c(NULL), values=c("#45c2a5")) +
  #facet_wrap(~class) +
  coord_flip() + 
  theme_minimal() +
  ylab('Área (Mha)') + xlab(NULL) +
  theme(text = element_text(size = 21))

ggplot() +
  geom_sf(data= subset(joined, class.x == "Wetland"), aes(fill=diff/1000000, geometry= geometry), col=NA, alpha=0.8) +
  scale_fill_gradient('Perda (Mha)', low="#ecf9f6", high="#1f6051", space="Lab") +
  geom_sf(data= vec_cerrado, fill=NA, col= 'gray40') +
  theme_void()

ggplot (subset(recipe2, class == "River, Lake and Ocean"), aes(x=reorder(city, diff), y= diff/1000, fill=class)) +
  geom_bar(stat="identity") +
  scale_fill_manual(NULL, labels=c(NULL), values=c("#0000ff")) +
  #facet_wrap(~class) +
  coord_flip() + 
  theme_minimal() +
  ylab('Área (Kha)') + xlab(NULL) +
  theme(text = element_text(size = 21))


a <- subset(joined, class.x == "River, Lake and Ocean" & diff > 0)

ggplot() +
  geom_sf(data= a, aes(fill=diff/1000, geometry= geometry), col=NA, alpha=0.8) +
  scale_fill_gradient('Perda (Kha)', low="#cce0ff", high="#0052cc", space="Lab") +
  geom_sf(data= vec_cerrado, fill=NA, col= 'gray40') +
  theme_void()




## WETLANDS BIOME
## plot wetland history
wet <- subset(data, level_2 == "Wetland")

## aggregate
wet <- aggregate(x=list(area=wet$value), by=list(class=wet$level_2, year=wet$variable), FUN='sum')

ggplot(wet, aes(x=as.numeric(year), y= area/1000000, group=class)) +
  geom_line(size=1.5, col='#45c2a5',alpha=.5) +
  geom_point(size=2.5, pch=15, col='#45c2a5') +
  theme_bw() +
  xlab("Ano") + ylab("Área (Mha)")


## lerm transição
trans <- read.csv('./tables/transicoes_cerrado_col6.csv', dec=",", sep=";")
trans <- melt(trans)

## adjust labels
colnames(trans)[1] <- 'source'
colnames(trans)[2] <- 'target'


## aggregate
#trans <- aggregate(x=list(value=trans$value), by=list(source=trans$source, target=trans$target), FUN='sum')

## subset
trans <- subset(trans, source == "Wetland")

## insert a blank space after target name
trans$target <- paste(trans$target, " ", sep="")

## compute nodes
node <- data.frame(name=c(as.character(trans$source), as.character(trans$target)) %>% unique())

## create labels
trans$IDsource <- match(trans$source, node$name)-1 
trans$IDtarget <- match(trans$target, node$name)-1

## rename
trans$source


library (networkD3)

## create pallete
ColourScal = 'd3.scaleOrdinal() .domain(["Forest", "Savanna", "Grassland", "Wetland", "Pasture", "Agriculture", "Mosaic", "Water"]) 
                .range(["#006400", "#32CD32", "#B8AF4F", "#45C2A5", "#FFD966", "#E974ED", "#fff3bf", "#0000FF"])'


# Make the Network
sankeyNetwork(Links = trans, Nodes = node,
              Source = "IDsource", Target = "IDtarget",
              Value = "value", NodeID = "name", 
              LinkGroup = "source",
              sinksRight= F, 
              colourScale=ColourScal,
              nodeWidth= 25, nodePadding= 25, 
              fontSize= 13, fontFamily= "Arial")

## compute equiv
trans$perc <- trans$value/sum(trans$value)*100



################# UCS and TI
## read geometry
vec_pa <- read_sf(dsn='./shp/protected', layer='merge_PA')

## read table
df_pa <- read.csv('./tables/areas_ucs_ti.csv', header=TRUE)[-6]

## join
pa_join <- as.data.frame(na.omit(left_join(df_pa, vec_pa, by='feature_id')))[-1][-9]
rm(df_pa, vec_pa)


## cmanage ids
pa_uc <- subset(pa_join, key !="indigenous_land")
pa_uc$key <- 'uc'
pa_ti <- subset(pa_join, key =="indigenous_land")
pa_ti$key <- 'ti'
pa_join <- rbind(pa_uc, pa_ti)

## create native
pa_join$class2 <- gsub('^3$', 'nat',
                       gsub('^4$', 'nat', 
                            gsub('^11$', 'nat',
                                 gsub('^12$', 'nat', 
                                      gsub('^33$', 'nat', pa_join$class)))))

## compute area nativa total em 2020
ref <- subset(data, variable == '2020' & level_0 == "Natural")
ref <- sum(ref$value)

## compute
pa_ref <- subset(pa_join, year== '2020')
aggregate(x=list(area=pa_ref$area), by=list(class=pa_ref$class2), FUN='sum')

a <- aggregate(x=list(area=pa_ref$area), by=list(class=pa_ref$class), FUN='sum')
a$perc <- a$area/sum(a$area) * 100

## aggregate
areas <- aggregate(x=list(area=pa_ref$area), by=list(class=pa_ref$name_en), FUN='sum')



############ MATOPIBA
options(scipen=999)
df_mato <- read.csv('./tables/area_matopiba.csv', header=TRUE)[-6]

## create native
df_mato$class <- gsub('^3$', 'nat',
                      gsub('^4$', 'nat', 
                           gsub("^5$", 'nat',
                                gsub('^11$', 'nat',
                                     gsub('^12$', 'nat', 
                                          df_mato$class)))))

## create ant
ant <- subset(df_mato, class != 'nat')

## agua
df_agua <- subset(ant, class == "33")
df_agua$class <- "Água"

## pastagem
df_pasto <- subset(ant, class == '15')
df_pasto$class <-  "Pastagem"

## Agro
df_agro <- subset(ant, class =="18" | class == "19" | class == "39" |
                    class == "20" | class == "40" | class == "41" | class =="36" |
                    class =="46" | class == "47" | class == 48 | class =="9")
df_agro$class <- "Agricultura"

## Outros
df_outros <- subset(ant, class == '21' | class == '23' | class == '24' |
                      class == '25' | class == '29' | class == '30' | class == '31' |
                      class == '32')
df_outros$class <- "Outros"

## merge
df_ant <- rbind(df_pasto, df_agro, df_outros)
df_mato <- subset(df_mato, class == 'nat')

df_mato <- rbind(df_mato, df_pasto, df_agro, df_outros, df_agua)
rm(df_agua, df_ant, df_nat, df_pasto, df_agro, df_outros)


## aggregate
df_mato <- aggregate(x=list(area=df_mato$area), by=list(year=df_mato$year, class=df_mato$class), FUN='sum')

## reorder
df_mato$class <- factor(df_mato$class, levels = c("Outros", "Pastagem", "Agricultura", "Água", "nat"))


## Plot natural vs antropico
ggplot(data= df_mato, aes(x= as.numeric(year), y= area/1000000)) +
  geom_area(aes(group=class, fill=class), alpha=0.9) +
  scale_fill_manual('Legenda', values=c('gray', '#ffd966', '#e974ed', '#0000ff', 'forestgreen')) +
  theme_minimal() +
  xlab('Ano') + ylab('Área (Mha)')


subset(df_mato, class == 'nat' & year == 2020)
48067069/62977919 * 100

## ultimos 10 anos
mato10 <- subset(df_mato, year > 2010 & year < 2022)

ggplot(data= mato10, aes(x= as.numeric(year), y= area/1000000)) +
  geom_area(aes(group=class, fill=class), alpha=0.9) +
  scale_fill_manual('Legenda', values=c('gray', '#ffd966', '#e974ed', '#0000ff', 'forestgreen')) +
  theme_minimal() +
  xlab('Ano') + ylab('Área (Mha)')


mato5 <- subset(df_mato, year > 2014 & year < 2022)

ggplot(data= mato5, aes(x= as.numeric(year), y= area/1000000)) +
  geom_area(aes(group=class, fill=class), alpha=0.9) +
  scale_fill_manual('Legenda', values=c('gray', '#ffd966', '#e974ed', '#0000ff', 'forestgreen')) +
  theme_minimal() +
  xlab('Ano') + ylab('Área (Mha)')




################################
## ANALISE POR BACIAS NIVEL 0

## perda ultimos 10- anos
df_mato <- read.csv('./tables/area_matopiba.csv', header=TRUE)[-6]

## create native
df_mato$class <- gsub('^3$', 'nat',
                      gsub('^4$', 'nat', 
                           gsub('^11$', 'nat',
                                gsub('^12$', 'nat', df_mato$class))))

a <- subset(df_mato, class == 'nat')
a <- aggregate(x=list(area=a$area), by=list(year=a$year), FUN='sum')


