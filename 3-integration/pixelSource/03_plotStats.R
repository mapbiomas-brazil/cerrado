## get pixel source by class
## dhemerson.costa@ipam.org.br

## read libraries
library(ggplot2)

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
ggplot(data= recipe, mapping=aes(x= year, y= area/ 1e6, fill= value_str)) +
  geom_bar(stat= 'identity', position = 'stack', alpha= 0.6) +
  scale_fill_manual('Etapa', values=c('gray90', 'yellow3', 'red3', 'springgreen4', 'magenta3', 'darkorange', 'black')) +
  geom_text(mapping=aes(label= perc), size= 2.5, 
             position = position_stack(vjust = 0.5)) + 
  #scale_colour_manual('Etapa', values=c('gray90', 'yellow3', 'red3', 'springgreen4', 'magenta3', 'darkorange', 'black')) +
  theme_minimal() +
  xlab(NULL) +
  ylab('Área (Mha)') +
  theme(text = element_text(size = 16))
  #geom_line()

## per class
data_class <- aggregate(x=list(area= data$area), by=list(
  value_str = data$value_str,
  year= data$variable,
  class_str= data$class_str), FUN= 'sum')

## plot
ggplot(data= data_class, mapping=aes(x= year, y= area/ 1e6, fill= value_str)) +
  geom_bar(stat= 'identity', position = 'stack', alpha= 0.6) +
  scale_fill_manual('Etapa', values=c('gray90', 'yellow3', 'red3', 'springgreen4', 'magenta3', 'darkorange', 'black')) +
  #geom_text(mapping=aes(label= perc), size= 2.5, 
  #          position = position_stack(vjust = 0.5)) + 
  #scale_colour_manual('Etapa', values=c('gray90', 'yellow3', 'red3', 'springgreen4', 'magenta3', 'darkorange', 'black')) +
  facet_wrap(~class_str, scales= 'free_y') + 
  theme_minimal() +
  xlab(NULL) +
  ylab('Área (Mha)') +
  theme(text = element_text(size = 16))
#geom_line()
