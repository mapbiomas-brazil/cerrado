## assess landowners and lcluc
## dhemerson.costa@ipam.org.br

## Load libraries
library(ggplot2)
library(treemapify)

## avoid scientific notation
options(scipen= 999)

## read collecitons area
data <- read.csv('./table/lcluc/matopiba_collection70_integration_v2.csv', sep=',', dec='.')

## remove undesirable columns
data <- data[ , -which(names(data) %in% c("system.index", ".geo"))]

## create class labels
data$classes <- 
  gsub('^3$', 'Form. Florestal',
       gsub('^4$', 'Form. Savânica',
            gsub('^5$', 'Form. Florestal',
                 gsub('^9$', 'Outros',
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

## aggregate
data_sum <- aggregate(x=list(area=data$area), by=list(class= data$classes, year= data$year), FUN='sum')

## reorder
#data_sum$class <- factor(data_sum$class, levels=c('Soybean', 'Agriculture', 'Mosaic of Uses', 'Pasture', 'Other'))

## compute percent for each year
recipe <- as.data.frame(NULL)
for (i in 1:length(unique(data_sum$year))) {
  ## get year i
  x <- subset(data_sum, year == unique(data_sum$year)[i])
  ## compute perc
  x$perc <- x$area / sum(x$area) * 100
  ## bind
  recipe <- rbind(x, recipe); rm(x)
}

## get only first and last year
x <- subset(recipe, year == 1985 | year == 2021)

## reorder factors 
x$class <- factor(x$class, levels=c('Outros', 'Agricultura', 'Pastagem', 'Mosaico de Usos',
                                    'Form. Campestre', 'Campo Alagado e Área Pantanosa', 'Form. Savânica', 'Form. Florestal'))

## plot
ggplot(data= subset(x, class != 'Outros'), mapping= aes(x= as.factor(year), y= as.numeric(perc), fill= class)) +
  geom_bar(stat='identity', position= 'stack') +
  scale_fill_manual(NULL, values=c('#E974ED', '#FFD966', '#FFEFC3', '#B8AF4F', '#45C2A5', '#32CD32', '#006400')) +
  #geom_text(mapping=aes(label=paste0(round(perc, digits=1), '%')),
  #          position = position_stack(vjust = .5), size=4.5, col= 'gray20') +
  theme_minimal() +
  coord_flip()
