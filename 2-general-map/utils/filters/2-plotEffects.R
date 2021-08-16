## filters effect
## dhemerson.costa@ipam.org.br

## read libraries
library (ggplot2)
library (reshape2)
library (dplyr)
library (tidyr)
library (tools)

## define options to avoid scientific notation 
options(scipen= 999)

## define root directory
root <- '../tables/filter_effect/'

## define function to import tables
importTables <- function (path) {
  print('reading data')
  ## list files in the root
  files <- list.files(path, full.names= TRUE)
  files_name <- list.files(path, full.names= FALSE)
  ## create a empty recipe
  recipe <- as.data.frame(NULL)
  ## read each file
  for (i in 1:length(files)) {
    print(files_name[i])
    temp <- read.csv(files[i])[-1][-12]
    ## and bind into recipe
    recipe <- rbind(recipe, temp)
  }
  ## convert NA to 0
  recipe[is.na(recipe)] <- 0
  ## rename columns
  colnames(recipe)[1] <- "Grassland"
  colnames(recipe)[2] <- "Pasture"
  colnames(recipe)[3] <- "ONVA"
  colnames(recipe)[4] <- "Forest"
  colnames(recipe)[5] <- "Water"
  colnames(recipe)[6] <- "Savanna"
  colnames(recipe)[7] <- "Filter"
  colnames(recipe)[8] <- "Region"
  colnames(recipe)[9] <- "Reference"
  colnames(recipe)[10] <- "Reference_value"
  colnames(recipe)[11] <- "Year"
  ## convert ID to strings
  recipe$Reference <- gsub(3, "Forest", 
                        gsub(4, "Savanna", 
                          gsub(12, "Grassland", 
                            gsub(15, "Pasture", recipe$Reference))))
    ## return data
  print('done - check [data] object :)')
  return (recipe)
}

## define function to subtract reference value for reference class (compute delta)
computeDelta <- function (x) {
  ## create a recipe
  recipe <- as.data.frame(NULL)
  ## compute changes in reference class
  for (i in 1:length(unique(x$Reference))) {
    ## subset class i
    temp <- subset(x, Reference == unique(x$Reference)[i])
    ## perform subtraction from reference 
    if (unique(temp$Reference) == "Forest") {
      temp$Forest <- temp$Forest - temp$Reference_value
    }
    if (unique(temp$Reference) == "Savanna") {
      temp$Savanna <- temp$Savanna - temp$Reference_value
    }
    if (unique(temp$Reference) == "Grassland") {
      temp$Grassland <- temp$Grassland - temp$Reference_value
    }
    if (unique(temp$Reference) == "Pasture") {
      temp$Pasture <- temp$Pasture - temp$Reference_value
    }
    ## merge into bind
    recipe <- rbind(temp, recipe)
  }
  ## return result
  return(recipe)
}

## define function to transform pixel count into percent change
stackPercent <- function (x) {
  ## stack data
  melted_data <- melt (x, id= c('Region', 'Filter', 'Reference', 'Year', 'Reference_value'))
  ## summarize
  melted_data <- aggregate(list(Value= melted_data$value, Reference_value= melted_data$Reference_value),
                           FUN= 'sum', 
                           by= list(Year= melted_data$Year,
                                    Class = melted_data$variable,
                                    Filter = melted_data$Filter,
                                    Reference = melted_data$Reference))
  ## create an percentage column
  melted_data$Percentage <- melted_data$Value / melted_data$Reference_value * 100
  ## round values
  melted_data$Percentage <- round(melted_data$Percentage, digits =1)
  ## return result
  return(melted_data)
}

## create auxiliar variable to aggregate reference vs. all other classes
createAux_var <- function (x) {
  ## create an empty recipe to receive data
  recipe <- as.data.frame(NULL)
  ## for each reference class
  for (i in 1:length(unique(x$Reference))) {
    ## subset the class reference
    temp <- subset(x, Reference == unique(x$Reference)[i])
    ## subset the class reference inside class reference
    temp2 <- subset(temp, Class == unique(x$Reference)[i])
    ## insert a label to use in ggplot
    temp2$label <- "Same"
    ## subset all the classe that are not the class reference
    temp3 <- subset(temp, Class != unique(x$Reference)[i])
    ## insert a label to use in ggplot
    temp3$label <- "Other"
    ## bind data
    temp <- rbind (temp2, temp3)
    ## store into recipe
    recipe <- rbind (recipe, temp)
  }
  ## change order
  recipe$Filter <- factor(recipe$Filter, levels = c("INCIDENCE", "TEMPORAL", "SPATIAL", "FREQUENCY"))
  recipe$Class <- factor(recipe$Class, levels = c("Grassland", "Savanna", "Forest", "Pasture", "ONVA", "Water"))
  
  ## return result
  return(recipe)
}

## import data
data <- importTables(path= root)

## compute delta
data <- computeDelta(x= data)

## stack and compute percentages
data <- stackPercent(x= data)

## add a auxiliary variable to be used in ggplot
data <- createAux_var(x= data)

## plot data for grassland
ggplot(data= subset(data, Reference == "Grassland"), aes(x= Year, y= Percentage)) +
  geom_bar(aes(fill= Class), stat= "identity", position= "stack", alpha= 1) +
  scale_fill_manual(values=c("#B8AF4F", "#32CD32", "#006400", "#FFD966", "#FF99FF", "#0000FF")) +
  facet_wrap(~Filter, ncol= 1) +
  geom_hline(yintercept= 0, col= 'black', linetype= "dashed", size= 1) +
  ggtitle('Grassland') +
  theme_minimal() +
  scale_x_continuous(breaks=c(1984, 1986, 1988, 1990, 1992, 1994, 1996, 1998, 2000, 2002,
                              2004, 2006, 2008, 2010, 2012, 2014, 2016, 2018, 2020)) +
  theme(strip.text.x = element_text(size= 10, color= "black", face= "bold"),
        axis.text.x = element_text(angle = 90, vjust = 0.5, hjust=1))



## plot data for savanna
ggplot(data= subset(data, Reference == "Savanna"), aes(x= Year, y= Percentage)) +
  geom_bar(aes(fill= Class), stat= "identity", position= "stack", alpha= 1) +
  scale_fill_manual(values=c("#B8AF4F", "#32CD32", "#006400", "#FFD966", "#FF99FF", "#0000FF")) +
  facet_wrap(~Filter, ncol= 1) +
  geom_hline(yintercept= 0, col= 'black', linetype= "dashed", size= 1) +
  ggtitle('Savanna') +
  theme_minimal() +
  scale_x_continuous(breaks=c(1984, 1986, 1988, 1990, 1992, 1994, 1996, 1998, 2000, 2002,
                              2004, 2006, 2008, 2010, 2012, 2014, 2016, 2018, 2020)) +
  theme(strip.text.x = element_text(size= 10, color= "black", face= "bold"),
        axis.text.x = element_text(angle = 90, vjust = 0.5, hjust=1))


## plot data for forest
ggplot(data= subset(data, Reference == "Forest"), aes(x= Year, y= Percentage)) +
  geom_bar(aes(fill= Class), stat= "identity", position= "stack", alpha= 1) +
  scale_fill_manual(values=c("#B8AF4F", "#32CD32", "#006400", "#FFD966", "#FF99FF", "#0000FF")) +
  facet_wrap(~Filter, ncol= 1) +
  geom_hline(yintercept= 0, col= 'black', linetype= "dashed", size= 1) +
  ggtitle('Forest') +
  theme_minimal() +
  scale_x_continuous(breaks=c(1984, 1986, 1988, 1990, 1992, 1994, 1996, 1998, 2000, 2002,
                              2004, 2006, 2008, 2010, 2012, 2014, 2016, 2018, 2020)) +
  theme(strip.text.x = element_text(size= 10, color= "black", face= "bold"),
        axis.text.x = element_text(angle = 90, vjust = 0.5, hjust=1))




