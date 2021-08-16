## compute accuracy from test datasets
## dhemerson.costa@IPAM.org.br

## read libraries
library (ggplot2)
library (reshape2)
library (dplyr)
library (tidyr)
library (tools)

## CSV's path
path <- '../tables/accuracy/col6_v8/'

## define functions to read data
## parse GEE tables using regex
importTables <- function (x) {
  files <- list.files(x)
  recipe <- as.data.frame(NULL)
  
  for (i in 1:length(files)) {
    tab <- read.csv(paste0(path, files[i]))$result_array
    tab <- as.data.frame(na.omit(gsub("^, $", NA, 
                                      gsub("^$", NA, 
                                           strsplit(gsub("[]]", ")", 
                                                         gsub("[[]", "(",
                                                              substr(x= tab, start= 2, stop= nchar(as.character(tab))-1))), 
                                                                     split= "[()]", fixed= FALSE)[[1]]))))
    colnames(tab)[1] <- "data"
    tab <- tab %>% separate(data, sep=",", into=c("Region","Year","Accuracy"))
    tab$Level <- file_path_sans_ext(files[i])
    recipe <- rbind(recipe, tab)
  }
  
  return(recipe)
}
## pre-format data types
formatData <- function(x) {
  #x$Region <- as.factor(as.numeric(x$Region))
  x$Year <- as.factor(as.numeric(x$Year))
  x$Accuracy <- as.numeric(x$Accuracy)
  x$Region = gsub("^1.0$", "1", x$Region)
  x$Region = gsub("^2.0$", "2", x$Region)
  x$Region = gsub("^3.0$", "3", x$Region)
  x$Region = gsub("^4.0$", "4", x$Region)
  x$Region = gsub("^5.0$", "5", x$Region)
  x$Region = gsub("^6.0$", "6", x$Region)
  x$Region = gsub("^7.0$", "7", x$Region)
  x$Region = gsub("^8.0$", "8", x$Region)
  x$Region = gsub("^9.0$", "9", x$Region)
  x$Region = gsub("^10.0$", "10", x$Region)
  x$Region = gsub("^11.0$", "11", x$Region)
  x$Region = gsub("^12.0$", "12", x$Region)
  x$Region = gsub("^13.0$", "13", x$Region)
  x$Region = gsub("^14.0$", "14", x$Region)
  x$Region = gsub("^15.0$", "15", x$Region)
  x$Region = gsub("^16.0$", "16", x$Region)
  x$Region = gsub("^17.0$", "17", x$Region)
  x$Region = gsub("^18.0$", "18", x$Region)
  x$Region = gsub("^19.0$", "19", x$Region)
  x$Region = gsub("^20.0$", "20", x$Region)
  x$Region = gsub("^21.0$", "21", x$Region)
  x$Region = gsub("^22.0$", "22", x$Region)
  x$Region = gsub("^23.0$", "23", x$Region)
  x$Region = gsub("^24.0$", "24", x$Region)
  x$Region = gsub("^25.0$", "25", x$Region)
  x$Region = gsub("^26.0$", "26", x$Region)
  x$Region = gsub("^27.0$", "27", x$Region)
  x$Region = gsub("^28.0$", "28", x$Region)
  x$Region = gsub("^29.0$", "29", x$Region)
  x$Region = gsub("^30.0$", "30", x$Region)
  x$Region = gsub("^31.0$", "31", x$Region)
  x$Region = gsub("^32.0$", "32", x$Region)
  x$Region = gsub("^33.0$", "33", x$Region)
  x$Region = gsub("^34.0$", "34", x$Region)
  x$Region = gsub("^35.0$", "35", x$Region)
  x$Region = gsub("^36.0$", "36", x$Region)
  x$Region = gsub("^37.0$", "37", x$Region)
  x$Region = gsub("^38.0$", "38", x$Region)
  
  return(x)
}
## calc average
calcAverage <- function (x) {
  #temp <- subset(x, Level != "COL5")
  temp <- aggregate(x$Accuracy, by=list(x$Level, x$Year), FUN= "mean")
  temp$Region <- as.factor("Average")
  colnames(temp)[1] <- "Level"
  colnames(temp)[2] <- "Year"
  colnames(temp)[3] <- "Accuracy"
  x <- rbind (x, temp)
  return (x)
}

## import data
acc_data <- calcAverage(formatData(importTables(x= path)))

## plot all filters by region
#x11()
ggplot (acc_data, aes(x=as.numeric(Year), y= Accuracy, colour=Level)) +
  facet_wrap(~as.numeric(Region)) +
  geom_line(size=1, alpha=0.7) +
  scale_colour_manual(values=c('black', 'blue', 'gray90', 'gray90', 'red', 'black','darkgreen', 'gray80', 'pink')) +
  #geom_point(alpha=0.5, aes(pch=Level)) +
  theme_bw() +
  xlab("Year") 


## Only Average of all regions
ggplot (subset(acc_data, Region == "Average"), aes(x=as.numeric(Year), y= Accuracy, colour=Level)) +
  facet_wrap(~Region) +
  geom_point(alpha=0.6) + 
  geom_line(size=1, alpha=0.7) +
  scale_colour_manual(values=c('black', 'orange', 'gray90', 'gray90', 'blue', 'black','darkgreen', 'gray80', 'pink')) +
  #geom_point(alpha=0.5, aes(pch=Level)) +
  theme_bw() +
  xlab("Year") 

## calc mean
a <- subset(acc_data, Region == "Average")
aggregate(a$Accuracy, by=list(a$Level), FUN="mean")


a <- subset (acc_data, Level == "CERRADO_col6_gapfill_incid_temporal_spatial_freq_v6")
mean(a$Accuracy)

col5 <- subset(acc_data, Level == "COL5")
col5 <- aggregate(col5$Accuracy, by=list(col5$Region), FUN="mean")
col6 <- aggregate(a$Accuracy, by=list(a$Region), FUN= "mean")
colnames(col5)[2] <- 'col5'
colnames(col6)[2] <- 'col6'


a <- left_join(col5, col6, by= "Group.1")
a$dif <- a$col6 - a$col5


