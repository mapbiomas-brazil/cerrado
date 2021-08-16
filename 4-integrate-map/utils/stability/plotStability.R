## asses class stability by collection 
## dhemerson.costa@ipam.org.br

## load libraries
library(ggplot2)
library(reshape2)

## avoid scientific notation
options(scipen= 999)

## define function to read table
readStability <- function (file) {
  ## read table
  x <- read.csv (file)[-1][-39]
  ## melt table
  x <- melt(x, id.vars=c('col', 'mapb', 'ref'))
  ## remove wetlands from previous collections
  all <- na.omit(subset (x, ref != 11))
  ## aggregate result for all classes
  all <- aggregate(x= list(count= all$value), 
                   by= list(freq= all$variable, col= all$col, ref= all$ref), FUN= 'sum')
  
  ## select only wetlands from col 6
  wet <- na.omit(subset (x, ref == 11 & col == '6_0'))
  ## aggregate results
  wet <- aggregate(x= list(count= wet$value), 
                   by= list(freq= wet$variable, col= wet$col, ref= wet$ref), FUN= 'sum')
  ## build dataframe
  x <- rbind (all, wet)
  
  x$freq <- gsub("X", "", x$freq)
  
  return (x)
}

## define function to rename classes
int_to_str <- function (reclass) {
  return(gsub("^3$", "03- Forest Formation",
              gsub("^4$", "04- Savanna Formation",
                   gsub("^11$", "11- Wetland",
                        gsub("^12", "12- Grassland Formation",
                             reclass)))))
}

## function to compute percentages
compPercent <- function (obj) {
    ## compute percent
  colec <- unique(obj$col)
  class <- unique(obj$ref)
  
  ## define empty recipe
  recipe <- as.data.frame(NULL)
  
  ## for each collection
  for (i in 1:length(colec)) {
    ## subset for the collection i
    temp <- subset(obj, col == colec[i])
    print (unique(temp$col))
    ## for each class
    for (j in 1:length(class)) {
      ## subset for the class j
      eachClass <- subset(temp, ref == class[j])
      print(unique(eachClass$ref))
      ## compute percent
      eachClass$Percent <- eachClass$count / sum(eachClass$count) * 100
      ## store
      recipe <- rbind(recipe, eachClass)
    }
  }
  
  return(recipe)
}

## function to compute 
totalStability <- function(obj) {
  ## compute stable vs. unstable per class and per collection
  cols <- unique(obj$col)
  clasz <- unique(obj$ref)

  ## create an empty recipe
  recipe <- as.data.frame(NULL)
  
  ## for each collection
  for (i in 1:length(cols)) {
    ## define the number of frequency that responds by total stability
    if (cols[i] == '3_1') {
      maxFreq = '33'
    }
    if (cols[i] == '4_1') {
      maxFreq = '34'
    }
    if (cols[i] == '5_0') {
      maxFreq = '35'
    }
    if (cols[i] == '6_0') {
      maxFreq = '36'
    }

    ## for each reference class
    for (j in 1:length(clasz)) {
      ## parse full stability 
      stable <- cbind(cols[i], clasz[j], 'Stable', subset(obj, col == cols[i] & ref == clasz[j] & freq == maxFreq)$Percent)
      ## parse unstability (100 - stability)
      unstable <- cbind(cols[i], clasz[j], 'Unstable', 100 - subset(obj, col == cols[i] & ref == clasz[j] & freq == maxFreq)$Percent)
      ## bind
      tab_ij <- as.data.frame(rbind(stable, unstable))
      ## create an empty column in collections in which wetlands does not exists
      if (ncol(tab_ij) != 4) {
        tab_ij$Percent <- 0
      }
      ## standardize
      colnames(tab_ij)[1] <- "Collection"
      colnames(tab_ij)[2] <- "Class"
      colnames(tab_ij)[3] <- "Condition"
      colnames(tab_ij)[4] <- "Percent"
      ## store into recipe
      recipe <- rbind(recipe, tab_ij)
    }
  }
  
  ## rename collections
  recipe$Collection <- gsub("3_1", "3.1",
                            gsub("4_1", "4.1",
                                 gsub("5_0", "5.0",
                                      gsub("6_0", "6.0", 
                                           recipe$Collection))))
  
  ## reorder collections
  recipe$Collection <- factor(recipe$Collection, levels=c("6.0", "5.0", "4.1", "3.1"))
  recipe$Condition <- factor(recipe$Condition, levels=c("Unstable", "Stable"))
  
  
  return (recipe)
}

## read table
data <- readStability(file = '../tables/stability/freq_cols.csv')

## Rename references
data$ref <- int_to_str(reclass= data$ref)

## Compute percentages
data <- compPercent(obj= data)

## Compute total stability by collection
total <- totalStability(obj = data)

## plot stability 
ggplot (data, aes (x=as.numeric(freq), y= as.numeric(Percent), colour= col, linetype=col)) +
  geom_line(size=1) +
  scale_y_log10() + 
  scale_colour_manual("Collection", labels=c("3.1", "4.1", "5.0", "6.0"), values=c('gray50', 'gray30', 'red', 'forestgreen')) +
  scale_linetype_manual("Collection", labels=c("3.1", "4.1", "5.0", "6.0"), values=c("dotted", "dotdash", "twodash", "solid")) +
  facet_wrap(~ref, scales= 'free_y') +
  theme_bw() +
  xlab('Frequency') + ylab('Percent')

## plot total stability
ggplot (total, aes(x= as.factor(Collection), y= as.numeric(Percent), fill= Condition)) +
  geom_bar(stat="identity", alpha= 0.7) +
  #geom_text(aes(label=paste0(round(as.numeric(Percent), digits=1), "%")), vjust=0) +
  geom_text(aes(label=paste0(round(as.numeric(Percent), digits= 1), "%")),
            position=position_dodge(width=0), hjust= 3, size= 5, color='black') +
  scale_fill_manual(values=c('lightsalmon1', 'deepskyblue3')) +
  facet_wrap(~Class) + 
  theme_minimal() +
  coord_flip() +
  xlab('Collection') + ylab('Percent')
