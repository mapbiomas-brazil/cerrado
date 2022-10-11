## plot areas from collection 7 
## dhemerson.costa@ipam.org.br

# read libraries
library(ggplot2)
library(reshape2)

## avoid sci-notation
options(scipen= 999)

## set root
root <- './table/area_71/'

## list files
files <- list.files(root, full.names= TRUE)

## create recipe
data <- as.data.frame(NULL)

## read and stack files
for (i in 1:length(unique(files))) {
  ## read file [i]
  x <- read.csv(files[i])[-1][-6]
  ## merge
  data <- rbind(data, x)
  rm(x)
}

## rename classes
data$class_id <- gsub('^3$', 'Forest', 
                      gsub('^4$', 'Savanna',
                           gsub('^11$', 'Wetland',
                                gsub('^12$', 'Grassland',
                                     gsub('^15$', 'Farming',
                                          gsub('^19$', 'Farming',
                                               gsub('^21$', 'Farming',
                                                    gsub('^25$', 'Non-vegetated',
                                                         gsub('^33$', 'Water',
                                                              gsub('^29$', 'Rocky-outcrop',
                                                              data$class_id))))))))))

## parse filenames and get suitable names
data$file <- substr(data$file, start= nchar('CERRADO_col7_') + 1, stop= 1e2)

## get specific version 
#r <- subset(data, file== 'pseudo_v9')

## plot general area class summarized for the biome 
ggplot(data= data, mapping= aes(x= year, y= area/1e6, group= as.factor(class_id), fill= as.factor(class_id))) +
  stat_summary(fun='sum', geom= 'area', position= 'stack',  alpha= .7) +
  #stat_summary(fun='sum', geom= 'point', alpha=.7) +
  scale_fill_manual('Class', values=c('#E974ED', '#006400', '#B8AF4F', '#aa0000', '#00ff00', '#0000FF', '#45C2A5')) +
  theme_minimal() +
  ylab('Área (Mha)') +
  xlab(NULL)

## get start and final year
r2 <- subset(r, year == 1985 | year == 2020)

## summarize per year
loss <- aggregate(x=list(area= r2$area), by=list(year= r2$year, class_id= r2$class_id), FUN='sum')
## cast table
loss <- dcast(loss, class_id~year)
## compute variation
loss$variation <- loss$`2020` - loss$`1985`
## get signal (loss or gain)
loss$is.loss <- schoolmath::is.negative(loss$variation)
## compute percentual variation 
loss$perc <- round(abs(loss$variation)/loss$`1985` * 100, digits=1)
## area Mha
loss$var_mha <- round(abs(loss$variation)/1e6, digits=2)
loss

## reclassify to native and anthopogenic
r2$class_id <- gsub('Forest', 'Natural',
                    gsub('Savanna', 'Natural',
                         gsub('Wetland', 'Natural',
                              gsub('Grassland', 'Natural',
                                   gsub('Farming', 'Anthropic',
                                        gsub('Non-vegetated', 'Natural',
                                             gsub('Water', 'Natural',
                                                  r2$class_id)))))))

## compute percents
perc <- aggregate(x=list(area= r2$area), by=list(year=r2$year, class=r2$class_id), FUN='sum')
recipe <- as.data.frame(NULL)

for (i in 1:length(unique(perc$year))) {
  year_i <- subset(perc, year == unique(perc$year)[i])
  year_i$perc <- round(year_i$area/sum(year_i$area) * 100, digits=1)
  recipe <- rbind(recipe, year_i)
  rm(year_i)
}

## plot bars
ggplot(data= r2, mapping= aes(x= as.factor(year), y= area/1e6, group= as.factor(class_id), fill= as.factor(class_id))) +
  geom_bar(stat='identity', alpha=0.8) +
  scale_fill_manual('Class', values=c('orange', 'forestgreen')) +
  theme_minimal() +
  ylab('Area (Mha)') +
  xlab(NULL)

## get specific version and compute diferences
r <- subset(data,file == 'gapfill_incidence_temporal_v8' |
                 file == 'gapfill_incidence_temporal_v20'
                 #file == 'gapfill_incidence_temporal_v21'
              )

## plot versions per class
ggplot(data= r, mapping= aes(x= year, y= area/1e6, group= as.factor(file), col= as.factor(file))) +
  stat_summary(fun='sum', geom= 'line',  alpha= .15, size=3) +
  stat_summary(fun='sum', geom= 'line',  alpha= .7,) +
  stat_summary(fun='sum', geom= 'point') +
  scale_colour_manual('Version', 
                      #labels=c('Col 6', 'Col 7 v9 (Pseudo-integrated)'), 
                      values=c('red', 'gray30', 'blue', 'darkgreen', 'purple', 'orange')) +
  facet_wrap(~class_id, scales= 'free_y') + 
  theme_bw() +
  ylab('Área (Mha)') +
  xlab(NULL)

## plot difference
r <- aggregate(x=list(area=r$area), by=list(file=r$file, class_id= r$class_id, year= r$year), FUN='sum')

## compute difference per class and year (first input as the target, second is reference)
recipe <- as.data.frame(NULL)

## declare the reference file
ref <- subset(r, file == 'gapfill_incidence_temporal_v8')
to_deal <- subset(r, file != 'gapfill_incidence_temporal_v8')
  
for (i in 1:length(unique(r$year))) {
  year_i <- subset(to_deal, year== unique(r$year)[i])

  for (k in 1:length(unique(year_i$class_id))) {
    class_ik <- subset(year_i, class_id== unique(year_i$class_id)[k])
    
    ## for each file - compute difference in relation to reference
    for (j in 1:length(unique(class_ik$file))) {
      ## get file
      file_ikj <- subset(class_ik, file == unique(class_ik$file)[j])
      ## get reference value
      ref_ikj <- subset(ref, year ==  unique(r$year)[i] &
                             class_id == unique(year_i$class_id)[k])
      ## subtract reference from predicted
      diff <- file_ikj$area - ref_ikj$area
      ## bind results
      temp <- as.data.frame(cbind(year= unique(file_ikj$year),
                                  class_id= unique(file_ikj$class_id),
                                  diff= diff,
                                  file= unique(file_ikj$file)))
      
      ## bind data
      recipe <- rbind(recipe, temp)
      rm(file_ikj, ref_ikj, diff, temp)
    }
    
  rm(class_ik)
  }
  rm(year_i)
}

## plot difference
ggplot(data= recipe, mapping=aes(x= as.numeric(year), y=as.numeric(diff)/1e6, colour= file)) +
  geom_line(size=3, alpha=0.15) +
  geom_line(alpha=0.9) +
  scale_colour_manual(values=c('midnightblue', 'blue')) + 
  facet_wrap(~class_id, scales='free_y') +
  theme_bw() +
  geom_blank(aes(y=-as.numeric(diff)/1e6)) + #plot mirror image points invisibly (can do same with x)
  geom_hline(yintercept=0, linetype= 'dashed', col='red') +
  ylab('Residual area (Mha, y0= Col. 6) ') +
  xlab(NULL) 


## plot specific area class by region 
#ggplot(data= subset(r, class_id == 'Forest'), mapping= aes(x= year, y= area/1e6, group= file, col= as.factor(file))) +
ggplot(data= r, mapping= aes(x= year, y= area/1e6, group= class_id, col= as.factor(class_id))) +
  stat_summary(fun='sum', geom= 'line') +
  stat_summary(fun='sum', geom= 'point', alpha= .6) +
  scale_colour_manual('Version', values=c('#E974ED', '#006400', '#B8AF4F', '#aa0000', '#00ff00', '#0000FF', '#45C2A5')) +
  facet_wrap(~territory, scales= 'free') +
  theme_bw() +
  ylab('Área (Mha)') +
  xlab(NULL) 
  #scale_y_log10() 

## rocky outcrop
rocky <- subset(data, file == 'pseudoRocky_v9' | file == 'pseudo_v9CLIP')


## plot versions per class
ggplot(data= rocky, mapping= aes(x= year, y= area/1e6, group= as.factor(file), col= as.factor(file))) +
  stat_summary(fun='sum', geom= 'line',  alpha= .15, size=3) +
  stat_summary(fun='sum', geom= 'line',  alpha= .7,) +
  scale_colour_manual('Version', 
                      labels=c('Col. 7 v9 (Pseudo-integrated)', 'Col 7 v9 (Pseudo-integrated) + Rocky'), 
                      values=c('gray30', 'red')) +
  facet_wrap(~class_id, scales= 'free_y') + 
  theme_bw() +
  ylab('Área (Mha)') +
  xlab(NULL)
