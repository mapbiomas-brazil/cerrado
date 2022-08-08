## evaluate sample quality by accuracy metrics
## dhemerson.costa@ipam.org.br

library(ggplot2)

## list files in the folder
data1 <- read.csv('./table/acc_versions.csv')[-1]
data2 <- read.csv('./table/acc_versions_gedi.csv')[-1]
data3 <- read.csv('./table/acc_versions_gedi_raw.csv')[-1]


## remopve missing regions from data1 
data1 <- subset(data1, mapb!= '20' & mapb!= '14' & balancing!= 'raw')
data3 <- subset(data3, mapb!= '20' & mapb!= '14')

## merge data
data <- rbind(data1, data2, data3)
rm(data1, data2, data3)

## analysis 1, assess sample strategy 
data.x <- subset(data, balancing == 'filtered' | balancing == 'raw' | balancing == 'GEDI*')

## rename
data.x$balancing <- gsub('filtered', 'Segment',
                            gsub('raw', 'Same C6',
                                 gsub('GEDI*', 'GEDI', data.x$balancing)))

  
## accuracy
ggplot(data= subset(data.x, variable== 'Accuracy'), mapping= aes(x= balancing, y= value, fill= balancing)) +
  geom_boxplot(alpha= .3, col='gray60') +
  geom_text(aes(label= mapb), position = position_jitter(seed = 1), size=2.5, col= 'gray30') +
  scale_fill_manual(values=c('forestgreen', 'gray60', 'violet')) +
  theme_minimal() +
  ylab('Accuracy') +
  xlab(NULL)

aggregate(x=list(acc= as.numeric(data.x$value)), by=list(var= data.x$variable, file= data.x$balancing),
          FUN= 'median')


## specific accuracy
recipe <- subset(data.x, variable == "Class: 3" | variable == "Class: 4" | variable== "Class: 12" |
                        variable == "Class: 21" | variable == "Class: 33")

## per class
ggplot(data= recipe, mapping= aes(x= balancing, y= value, fill= balancing)) +
  geom_boxplot(alpha= .3, col='gray60') +
  scale_fill_manual(values=c('forestgreen', 'gray60', 'violet')) +
  #geom_text(aes(label= mapb), position = position_jitter(seed = 1), size=1.9) +
  theme_minimal() +
  facet_wrap(~variable) +
  ylab('Accuracy') +
  xlab(NULL)

### check wetland effect 
data.x <- subset(data, balancing == 'GEDI' | balancing == 'GEDI*')

## rename
data.x$balancing <- gsub('^GEDI$', 'GEDI+W', data.x$balancing)
                         
## plot
ggplot(data= subset(data.x, variable== 'Accuracy'), mapping= aes(x= balancing, y= value, fill= balancing)) +
  geom_boxplot(alpha= .3, col='gray60') +
  geom_text(aes(label= mapb), position = position_jitter(seed = 1), size=2.5, col= 'gray30') +
  scale_fill_manual(values=c('forestgreen', 'turquoise4', 'violet')) +
  theme_minimal() +
  ylab('Accuracy') +
  xlab(NULL)

aggregate(x=list(acc= as.numeric(data.x$value)), by=list(var= data.x$variable, file= data.x$balancing),
          FUN= 'median')


## specific accuracy
recipe <- subset(data.x, variable == "Class: 3" | variable == "Class: 4" | variable== "Class: 12" |
                   variable == "Class: 21" | variable == "Class: 33")

## per class
ggplot(data= recipe, mapping= aes(x= balancing, y= value, fill= balancing)) +
  geom_boxplot(alpha= .3, col='gray60') +
  scale_fill_manual(values=c('forestgreen', 'turquoise4', 'violet')) +
  #geom_text(aes(label= mapb), position = position_jitter(seed = 1), size=1.9) +
  theme_minimal() +
  facet_wrap(~variable) +
  ylab('Accuracy') +
  xlab(NULL)
