## compute accuracy from test datasets
## dhemerson.costa@IPAM.org.br

## read libraries
library (ggplot2)
library (reshape2)
library (dplyr)
library (tidyr)
library (tools)

## avoid scientific notation
options(scipen= 999)

## path of files
path = "../tables/area/finalv10/"

## function to bind collection data
readCollection <- function (dir, version) {
  recipe <- as.data.frame(NULL)
  
  if (version == 'col5') {
    
    col_files <- list.files(dir, pattern= version, full.names= TRUE)
    for (i in 1:length(col_files)) {
      temp <- read.csv(col_files[i])
      recipe <- rbind (recipe, temp)
    }
    recipe$col <- version
    colnames(recipe)[11] <- 'level'
    recipe <- recipe[-1][-9]
    
    recipe$wetland <- 0
    recipe$restinga <- 0
    return (recipe)
  } else {
    col_files <- list.files(dir, pattern= 'col6', full.names= TRUE)
    for (i in 1:length(col_files)) {
      temp <- read.csv(col_files[i])
      recipe <- rbind (recipe, temp)
    }
    return (recipe[-1][-13][-13][-1])
  }
}

## load collection 6 areas 
col6 <- readCollection(dir= path, version= 'col6')

## load collection 5 areas
col5 <- readCollection(dir= path, version= 'col5')

## bind data
data <- rbind (col6, col5)
data <- col6

## melt data
melted <- melt (data, id= c('year', 'level', 'region'))

## aggregate
statistics <- aggregate(melted$value, FUN= "sum", by= list(year= melted$year, 
                                                           col= melted$level,
                                                           class= melted$variable))

statistics2 <- as.data.frame(NULL)

## for each version
for (i in 1:length(unique(statistics$col))) {
  temp <- subset (statistics, col == unique(statistics$col)[i])
  ## subset natural classes
  temp <- subset(temp, class != "pasture" & class != "other_nonVeg")
  ## summarize by year
  temp <- aggregate(x= list(area= temp$x), FUN= "sum", by= list(year= temp$year))
  temp$anthropic <- 2045000 - temp$natural 
  ## insert version id
  temp$level <- unique(statistics$col)[i]
  ## bind data 
  statistics2 <- rbind(statistics2, temp)
}

statistics2 <- melt(statistics2, id=c("year", "level"))

## plot natural vs anthropic
ggplot (statistics2, aes(x=year, y= value, colour= level)) +
  geom_line() +
  geom_point(aes(pch=level), alpha= 0.5) +
  scale_colour_manual(values= c('gray90', 'gray90', 'gray90', 'blue', 'gray90', 'black')) +
  facet_wrap(~variable, scales= "free_y") +
  theme_bw() +
  xlab ('Year') + ylab ("Area (km²")


### fazer subset de agua
#statistics <- subset (statistics, class == 'water')
#statistics <- subset (statistics, col == 'col5' | col == 'CERRADO_col6_wetlandsv6_generalv8_rect')
### ajustar area
#statistics$x <- statistics$x *100 - 300900

## plot general
##ggplot (subset(statistics, class== 'forest'), aes(x=year, y= x, colour= col)) +
ggplot (data= subset(statistics, class != "restinga"), aes(x=year, y= x, colour= col)) +
  geom_line(size=1.5) +
  geom_point(aes(pch=col), alpha= 0.5) +
  scale_colour_manual(values= c('green4', 'black', 'blue', 'black', 'gray90', 'black')) +
  facet_wrap(~class, scales= "free_y") +
  theme_bw() +
  xlab ('Year') + ylab ("Area (km2)")


a <- subset(melted, variable == 'wetland')

## plot by region
ggplot(data= subset(a, level != "col5"), aes(x= year, y= value, colour= level)) +
  geom_line() +
  geom_point(aes(pch=level), alpha= 0.5) +
  facet_wrap(~region, scales= "free_y") +
  scale_colour_manual(values= c('green4', 'black', 'black', 'blue', 'gray90', 'black')) +
  theme_bw() +
  xlab ('Year') + ylab ("Area (km²)")
  



## plot wetlands by region
ggplot(subset(data, level == "pseudointegration" | level == "col5"),
       aes(x=year, y= wetland, colour= level, group= level)) +
  geom_line() +
  geom_point(alpha= 0.5) +
  scale_colour_manual(values= c('black', 'red', 'red','gray80', 'gray80', 'black', 'gray80', 'gray80', 'gray80')) +
  facet_wrap(~region, scales= "free_y") +
  #ggtitle('Wetland') +
  theme_bw()

## subset only to tests
data2 <- subset (data, level == "pseudointegration")
melted2 <- melt (data2, id= c('year', 'level', 'region'))
statistics2 <- aggregate(melted2$value, FUN= "sum", by= list(year= melted2$year, 
                                                            col= melted2$level,
                                                            class= melted2$variable))


ggplot (subset(statistics2, class == "forest"), aes(x=year, y= x, colour= col)) +
  geom_line(size=1.5) +
  geom_point(aes(pch=col), size= 4, alpha= 0.9) +
  scale_colour_manual(values= c('red', 'blue')) +
  facet_wrap(~class, scales= "free_y") +
  #ylim(62500,72500) +
  xlab('Ano') + ylab ('Área (km²)') +
  theme_bw()

subset(statistics2, year == 2019 & class == "wetland")


subset(statistics2, level == "CERRADO_col6_wetlandsv2_generalv8_pseudofix")

