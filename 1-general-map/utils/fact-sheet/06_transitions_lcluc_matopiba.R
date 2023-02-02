## assess landowners and lcluc
## dhemerson.costa@ipam.org.br

## Load libraries
library(ggplot2)
library(treemapify)

## avoid scientific notation
options(scipen= 999)

## read collecitons area
data <- read.csv('./table/transitions_matopiba/to_2010_2021.csv', sep=',', dec='.')

## remove undesirable columns
data <- data[ , -which(names(data) %in% c("system.index", ".geo"))]

## remove undesired data
data <- subset(data, 
               class_id != 0 &
               territory != 2 &
               territory != 3 &
               class_id != 3 &
               class_id != 4 &
               class_id != 11 &
               class_id != 12 &
               class_id != 5 &
               class_id != 32)

## create class labels
data$classes <- 
gsub('^3$', 'Forest',
     gsub('^4$', 'Savanna',
          gsub('^5$', 'Forest',
               gsub('^9$', 'Agriculture',
                    gsub('^11$', 'Wetland',
                         gsub('^12$', 'Grassland',
                              gsub('^15$', 'Pasture',
                                   gsub('^20$', 'Agriculture',
                                        gsub('^21$', 'Mosaic of Uses',
                                             gsub('^23$', 'Other',
                                                  gsub('^24$', 'Other',
                                                       gsub('^25$', 'Other',
                                                            gsub('^29$', 'Other',
                                                                 gsub('^30$', 'Other',
                                                            gsub('^31$', 'Other',
                                                       gsub('^32$', 'Grassland',
                                                  gsub('^33$', 'Other',
                                             gsub('^39$', 'Soybean',
                                        gsub('^40$', 'Agriculture',
                                   gsub('^41$', 'Agriculture',
                              gsub('^46$', 'Agriculture',
                         gsub('^47$', 'Agriculture',
                    gsub('^48$', 'Agriculture',
               gsub('^62$', 'Agriculture',
        data$class))))))))))))))))))))))))

## rename territory
data$territory <-
gsub(1, 'Matopiba',
     gsub(4, 'Cerrado',
          data$territory))

## aggregate
data_sum <- aggregate(x=list(area=data$area), by=list(class= data$classes, territory= data$territory), FUN='sum')

## reorder
data_sum$class <- factor(data_sum$class, levels=c('Soybean', 'Agriculture', 'Mosaic of Uses', 'Pasture', 'Other'))

## compute percents
recipe <- as.data.frame(NULL)
for (i in 1:length(unique(data_sum$territory))) {
  ## subset
  x <- subset(data_sum, territory == unique(data_sum$territory)[i])
  ## get percetns
  x$perc <- round(x$area / sum(x$area) * 100, digits=1)
  ## bind
  recipe <- rbind(recipe, x); rm(x)
}

## plot
ggplot(data= recipe, mapping=aes(x= as.factor(territory), y= area/1000000, fill= class)) +
  geom_bar(stat='identity', position='stack', alpha=0.9) +
  scale_fill_manual(NULL, values=c('#e075ad', '#D5A6BD', '#fff3bf', '#FFD966', '#D5D5E5')) +
  geom_text(aes(label= paste0(perc, "%")), colour = "black", size=3, 
            position = position_stack(vjust = .5)) +
  coord_flip() +
  xlab(NULL) +
  ylab('Area (Mha)') +
  theme_minimal()

## subset soybean
soy <- subset(recipe, class == 'Soybean')
soy$perc <- round(soy$area/sum(soy$area) * 100, digits=1)

#3 plot soy
ggplot(data= soy, mapping=aes(x= as.factor(territory), y= area/1000000, fill= class)) +
  geom_bar(stat='identity', position='stack', alpha=0.9) +
  scale_fill_manual(NULL, values=c('#e075ad', '#D5A6BD', '#fff3bf', '#FFD966', '#D5D5E5')) +
  geom_text(aes(label= paste0(perc, "%")), colour = "black", size=3, 
            position = position_stack(vjust = .5)) +
  coord_flip() +
  xlab(NULL) +
  ylab('Area (Mha)') +
  theme_minimal()

# deforestation general
data_all <- aggregate(x=list(area=data$area), by=list(territory= data$territory), FUN='sum')
data_all$perc <- round(data_all$area/sum(data$area) * 100, digits=1)

## read destination
soy <- read.csv('./table/transitions_matopiba/fromNAT_toSOYBEAN_2010_2021.csv', sep=',', dec='.')
past <- read.csv('./table/transitions_matopiba/fromNAT_toPASTURE_2010_2021.csv', sep=',', dec='.')

## insert use
soy$to <- 'Soybean'
past$to <- 'Pasture'

## bind
from <- rbind(soy, past); rm(soy, past)

## remove undesirable columns
from <- from[ , -which(names(from) %in% c("system.index", ".geo"))]

## remove territories
from <- subset(from, territory != 2 & territory != 3)

## rename territory
from$territory <-
  gsub(1, 'Matopiba',
       gsub(4, 'Cerrado',
            from$territory))

## rename class
from$classes <- 
gsub(3, 'Forest',
     gsub(4, 'Savanna',
          gsub(11, 'Wetland',
               gsub(12, 'Grassland',
                    from$class_id))))

## reorder
from$classes <- factor(from$classes, levels=c('Forest', 'Savanna', 'Wetland', 'Grassland'))

## compute percents
recipe2 <- as.data.frame(NULL)
for (i in 1:length(unique(from$to))) {
  ## for each destination class
  x <- subset(from, to == unique(from$to)[i])
  ## for each territory
  for (j in 1:length(unique(from$territory))) {
    y <- subset(x, territory == unique(from$territory)[j])
    ## compute percent
    y$perc <- round(y$area / sum(y$area) * 100, digits=1)
    ## bind
    recipe2 <- rbind(recipe2, y)
  }
  rm(x,y)
}

## plot from 
ggplot(data= recipe2, mapping= aes(x= territory, y= area/1000000, fill= classes)) +
  geom_bar(stat='identity', position= 'stack', alpha=0.85) +
  scale_fill_manual('From', values=c('#006400', '#00ff00', '#45C2A5', '#B8AF4F')) + 
  geom_text_repel(aes(label= paste0(perc, "%")), colour = "gray10", size=3, 
            position = position_stack(vjust = .5)) +
  facet_wrap(~to) +
  theme_minimal() +
  xlab(NULL) +
  ylab('Area (Mha)') 

## aggregate
recipe2_sum <- aggregate(x=list(area=recipe2$area), by=list(classes= recipe2$classes), FUN='sum')

## compute perc
recipe2_sum$perc <- round(recipe2_sum$area / sum(recipe2_sum$area) * 100, digits=1)
recipe2_sum$territory <- 'All'

## plot sum
ggplot(data= recipe2_sum, mapping= aes(x= territory, y= area/1000000, fill= classes)) +
  geom_bar(stat='identity', position= 'stack', alpha=0.85) +
  scale_fill_manual('From', values=c('#006400', '#00ff00', '#45C2A5', '#B8AF4F')) + 
  geom_text(aes(label= paste0(perc, "%")), colour = "gray10", size=3, 
                  position = position_stack(vjust = .5)) +
  theme_minimal() +
  xlab(NULL) +
  ylab('Area (Mha)') +
  coord_flip()
