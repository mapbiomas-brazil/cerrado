## accuracy analisys from collection 6
# read library
library(ggplot2)
library(ggrepel)
library(dplyr)
library(sf)
library(tools)

## avoid scientific notation
options(scipen= 999)

## define function to read data
readAgreement <- function(path) {
  ## create recipe
  y <- as.data.frame(NULL)
  for (i in 1:length(list.files(path))) {
    z <- read.csv(list.files(path, full.names= TRUE)[i])[-1][-5]
    z$file <- file_path_sans_ext(list.files(path, full.names= FALSE))[i]
    ## bind
    y <- rbind(y, z)
  }
  ## isolate variables
  y$status <- substr(y$class_id, start=1, stop=1)
  y$n_prods <- substr(y$class_id, start=2, stop=2)
  y$prods <- substr(y$class_id, start=3, stop=6)
  return (y)
}

## function to parse id
parseId <- function(x) {
  x$status <- gsub('^1$', 'Agreement', 
                   gsub('^2$', 'Disagreement',
                        x$status))
  
  return (x)
}

## function to translate prods
translateProds <- function(x) {
  ## products
  obj <- x
  obj$prods <- gsub('^1$', 'Mapbiomas',
                 gsub('^3$', 'FIP',
                      gsub('^4$', 'TC',
                           gsub('^9$', 'Mapbiomas*',
                                gsub('^13$', 'Mapbiomas + FIP',
                                     gsub('^14$', 'Mapbiomas + TC',
                                          gsub('^34$', 'FIP + TC',
                                               gsub('^134$', 'Mapbiomas + FIP + TC',
                                                    gsub('^2$', 'FBDS',
                                                         gsub('^12$', 'Mapbiomas + FBDS', 
                                                              gsub('^23$', 'FBDS + FIP',
                                                                   gsub('^24$', 'FBDS + TC',
                                                                        gsub('^123$', 'Mapbiomas + FBDS + FIP',
                                                                             gsub('^124$', 'Mapbiomas + FBDS + TC',
                                                                                  gsub('^234$', 'FBDS + FIP + TC',
                                                                                       gsub('^1234$', 'Mapbiomas + FBDS + FIP + TC',
                                                                                            obj$prods))))))))))))))))
  obj$file <- gsub('forest', 'Forest',
                   gsub('nonforest', 'Non-Forest',
                        obj$file))
  
  return (obj)
}

## read data
data <- translateProds(parseId(readAgreement(path= './table/agreement')))

## detailed
ggplot(data=subset(data, file != "native"), mapping= aes(x=reorder(prods, area), y= area/ 1000)) +
  geom_bar(stat='identity', mapping=aes(fill= status)) +
  scale_fill_manual(values=c('olivedrab3', 'tomato1')) +
  facet_grid(status ~ file, scales='free_y') +
  coord_flip() +
  xlab('N. of products') + ylab('Área km² * 1000') +
  theme_bw()

## geral
data2 <- subset(aggregate(x=list(area=data$area),
                          by=list(status=data$status, file= data$file),
                          FUN='sum'), file != 'native')

## compute proportion
recipe <- as.data.frame(NULL)
for (i in 1:length(unique(data2$file))) {
  x <- subset(data2, file == unique(data2$file)[i])
  x$perc <- round(x$area / sum(x$area) * 100, digits=2)
  recipe <- rbind(x, recipe)
  rm(x)
}
rm(data2)

## plot 
ggplot(data= recipe, mapping= aes(x=file, y= perc, fill= status)) +
  geom_bar(stat='identity') +
  scale_fill_manual(values=c('olivedrab3', 'tomato1')) +
  theme_minimal() +
  ylab('%')

## analise para native
data2 <- subset(aggregate(x=list(area=data$area),
                          by=list(status=data$status, file= data$file),
                          FUN='sum'), file == 'native')
## compute proportion
data2$perc <- round(data2$area / sum(data2$area) * 100, digits=2)

ggplot(data= data2, mapping= aes(x=file, y= perc, fill= status)) +
  geom_bar(stat='identity') +
  scale_fill_manual(values=c('olivedrab3', 'tomato1')) +
  theme_minimal() +
  ylab('%') +
  coord_flip()

