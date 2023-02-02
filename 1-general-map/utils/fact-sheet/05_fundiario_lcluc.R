## assess landowners and lcluc
## dhemerson.costa@ipam.org.br

## Load libraries
library(ggplot2)
library(treemapify)

## avoid scientific notation
options(scipen= 999)


## read collecitons area
data <- read.csv('./table/fundiario/base_ipam/fundiario_ipam_2021.csv', sep=',', dec='.')

## remove undesirable columns
data <- data[ , -which(names(data) %in% c("system.index", ".geo"))]

## create class labels
data$classes <- 
gsub('^3$', 'Form. Florestal',
     gsub('^4$', 'Form. Savânica',
          gsub('^5$', 'Form. Florestal',
               gsub('^9$', 'Silvicultura',
                    gsub('^11$', 'Campo Alagado e Área Pantanosa',
                         gsub('^12$', 'Form. Campestre',
                              gsub('^15$', 'Pastagem',
                                   gsub('^20$', 'Agricultura',
                                        gsub('^21$', 'Mosaico de Usos',
                                             gsub('^23$', 'Outros',
                                                  gsub('^24$', 'Outros',
                                                       gsub('^25$', 'Outros',
                                                            gsub('^29$', 'Outros',
                                                                 gsub('^30$', 'Outros',
                                                            gsub('^31$', 'Outros',
                                                       gsub('^32$', 'Form. Campestre',
                                                  gsub('^33$', 'Outros',
                                             gsub('^39$', 'Agricultura',
                                        gsub('^40$', 'Agricultura',
                                   gsub('^41$', 'Agricultura',
                              gsub('^46$', 'Agricultura',
                         gsub('^47$', 'Agricultura',
                    gsub('^48$', 'Agricultura',
               gsub('^62$', 'Agricultura',
        data$class))))))))))))))))))))))))

## create landowners 
data$landowner <- 
  gsub(1, 'Imov. Rural Privado',
     gsub(2, 'Assen. Rural',
          gsub(3, 'Terra índigena',
               gsub(4, 'Unidade de Conservação',
                    gsub(5, 'Área de Proteção Ambiental',
                         gsub(6, 'Sem Info. Cadastral',
                              gsub(7, 'Floresta Pub. Não Destinada',
                                   gsub(8, 'Outros',
                                      data$territory))))))))

## create block to plot
data$block <- 
  gsub(1, 'A',
          gsub(2, 'A',
               gsub(3, 'B',
                    gsub(4, 'B',
                         gsub(5, 'B',
                              gsub(6, 'C',
                                   gsub(7, 'C',
                                        gsub(8, 'C',
                                             data$territory))))))))

## reorder classes
data$classes <- factor(data$classes, levels=c("Form. Florestal", "Form. Savânica", "Campo Alagado e Área Pantanosa",
                                              "Form. Campestre", "Silvicultura", "Pastagem", "Agricultura",
                                              "Mosaico de Usos", "Outros"))

## plot
ggplot(data= subset(data, classes != 0), mapping= aes(x= reorder(landowner, area), y= area/1000000, fill= classes)) +
  stat_summary(position='stack', geom='bar', fun='sum') +
  coord_flip() +
  scale_fill_manual(values=c("#006400", "#00ff00", "#45C2A5", "#B8AF4F", "#935132", "#FFD966", "#E974ED", "#fff3bf", "gray80")) +
  facet_wrap(~block, ncol=1, scales='free_y') +
  theme_classic() +
  ylab('Area (Mha)') +
  xlab(NULL)

## compute per landowner proportion 
data2 <- aggregate(x=list(area=data$area), by= list(landowner= data$landowner, class= data$classes), FUN='sum')

## create empty recipe
recipe <- as.data.frame(NULL)
## compute proportion in the class
for (i in 1:length(unique(data2$class))) {
  ## subset class i
  x <- subset(data2, class == unique(as.character(data2$class))[i])
  ## compute perc
  x$perc_l4 <- x$area/sum(x$area) * 100
  recipe <- rbind(x, recipe)
}

## get only native vegetation
native <- subset(recipe, class == "Form. Florestal" | class == "Form. Savânica" | class == "Form. Campestre" |
                   class == "Campo Alagado e Área Pantanosa")
native <- aggregate(x= list(area=native$area), by= list(landowner= native$landowner), FUN= 'sum')
native$perc <- native$area / sum(native$area) * 100

## get proportional area per land tenure
x <- aggregate(x= list(area= data2$area), by= list(tenure= data2$landowner), FUN= 'sum')
x$perc <- x$area/sum(x$area) * 100


## get stability by landowner
rm(data, data2, recipe, native, x, i)
data <- read.csv('./table/fundiario/stable_fundiario_col7.csv', sep=',', dec='.')

## remove undesirable columns
data <- data[ , -which(names(data) %in% c("system.index", ".geo"))]

## create class labels
data$classes <- 
  gsub('^0$', 'Unstable',
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
                                                                                       gsub('^39$', 'Agriculture',
                                                                                            gsub('^40$', 'Agriculture',
                                                                                                 gsub('^41$', 'Agriculture',
                                                                                                      gsub('^46$', 'Agriculture',
                                                                                                           gsub('^47$', 'Agriculture',
                                                                                                                gsub('^48$', 'Agriculture',
                                                                                                                     gsub('^62$', 'Agriculture',
                                                                                                                          data$class)))))))))))))))))))))))))

## rename landowner
data$landowner <- 
gsub(1, 'Áreas Privadas',
     gsub(2, 'Áreas Públicas',
          gsub(3, 'Sem Info. Cadastral',
               data$territory)))

## insert stable
stable <- subset(data, classes != "Unstable")
unstable <- subset(data, classes == 'Unstable')

## insert legend
stable$is.stable <- 'Stable'
unstable$is.stable <- 'Unstable'

## bind
data <- rbind(stable, unstable); rm(stable, unstable)

## compute sums in the level 
data2 <- aggregate(x=list(area=data$area),
                   by=list(landowner= data$landowner, is.stable=data$is.stable),
                   FUN='sum')

## compuite proportion ofor each land owner
recipe <- as.data.frame(NULL)
for (i in 1:length(unique(data$landowner))) {
  ## get land i
  x <- subset(data2, landowner == unique(data2$landowner)[i])
  ## calc prop
  x$perc <- round(x$area / sum(x$area) * 100, digits=1)
  x$stable <- x$perc[1]
  ## bind
  recipe <- rbind(x, recipe)
  rm(x)
}

recipe$is.stable <- factor(recipe$is.stable, levels=c("Unstable", "Stable"))


## plot
ggplot(data= recipe, mapping= aes(x= reorder(landowner, stable), y= perc, fill= is.stable)) +
  stat_summary(geom='bar', position='stack', fun='sum', alpha=0.75) +
  geom_text(aes(label= paste0(perc, "%")), colour = "black", size=3.5, 
            position = position_stack(vjust = .5)) +
  scale_fill_manual('', values=c('#FEC8F4', '#73C233')) +
  coord_flip() +
  xlab(NULL) +
  ylab('Percent (%)') +
  theme_minimal()

names(data)

## get stability only for native vegetation (based on clark analisys)
traj <- read.csv('./table/fundiario/stable_native_fundiario_col7.csv', sep=',', dec='.')[-1][-5]

## rename landowner
traj$landowner <- 
  gsub(1, 'Áreas Privadas (CAR, SIGEF, Assent.)',
       gsub(2, 'Áreas Protegidas (TI, UC)',
            gsub(3, 'Áreas sem Info. Cadastral',
                 traj$territory)))

## rename stability
traj$classes <- 
  gsub(1, 'Unstable',
     gsub(2, 'Unstable',
          gsub(3, 'Unstable',
               gsub(4, 'Unstable',
                    gsub(5, 'Unstable',
                         gsub(6, 'Stable',
                              gsub(7, 'Other',
                                   traj$class_id)))))))

## aggregate
traj2 <- subset(aggregate(x=list(area=traj$area),
                   by=list(landowner= traj$landowner, classes=traj$classes),
                   FUN='sum'), classes != 'Other')

## compute proportion
recipe <- as.data.frame(NULL)
for (i in 1:length(unique(traj2$landowner))) {
  ## get land i
  x <- subset(traj2, landowner == unique(traj$landowner)[i])
  ## calc prop
  x$perc <- round(x$area / sum(x$area) * 100, digits=1)
  x$stable <- x$perc[1]
  ## bind
  recipe <- rbind(x, recipe)
  rm(x)
}

recipe$classes <- factor(recipe$classes, levels=c("Unstable", "Stable"))

## plot
ggplot(data= recipe, mapping= aes(x= reorder(landowner, stable), y= perc, fill= classes)) +
  stat_summary(geom='bar', position='stack', fun='sum', alpha=0.75) +
  geom_text(aes(label= paste0(perc, "%")), colour = "black", size=3.5, 
            position = position_stack(vjust = .5)) +
  scale_fill_manual('', values=c('#FEC8F4', '#73C233')) +
  coord_flip() +
  xlab(NULL) +
  ylab('Percent (%)') +
  theme_minimal()

## summarize trajectories 
traj3 <- aggregate(x=list(area=traj$area), by=list(traj=traj$class_id), FUN='sum')

## translate
traj3$traj <- 
gsub('^1$', 'Loss without Alternation (Pr-Ab Ch=1)',
     gsub('^2$', 'Gain without Alternation (Ab-Pr Ch=1)',
          gsub('^3$', 'Loss with Alternation (Pr-Ab Ch>2)',
               gsub('^4$', 'Gain with Alternation (Ab-Pr Ch>2)',
                    gsub('^5$', 'All Alternation (Ab-Ab or Pr-Pr Ch>1)',
                         gsub('^6$', 'Stable Presence (Pr-Pr Ch=0)',
                              gsub('^7$', 'Stable Absence (Ab-Ab Ch=0)',
                                   traj3$traj)))))))

## remove abscen
traj3 <- subset(traj3, traj != 'Stable Absence (Ab-Ab Ch=0)')

#3 compuite perc
traj3$perc <- round(traj3$area/sum(traj3$area) * 100, digits= 1)

## plot
ggplot(data= traj3, mapping= aes(area = area, fill = traj, label = paste0(perc, '%'))) +
  geom_treemap() +
  scale_fill_manual(values=c('#ffff00', '#14a5e3', '#020e7a', '#f5261b', '#941004', '#666666')) +
  #geom_treemap_text(place = "centre", size = 15, col= 'black')
  geom_treemap_text(colour = c('black', 'white', 'white', 'black', 'black', 'black'),
                    place = "centre", size = 15)

