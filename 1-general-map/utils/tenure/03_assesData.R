## translate and merge gee outputs 
## dhemerson.costa@ipam.org.br

## get libraries

## avoid scientific notation
options(scipen=999)

## list files to be parsed
files <- list.files('./table/tenure', full.names= TRUE)

## import land tenure dictionary
tenure_dict <- read.csv('./dictionary/tenure-dict.csv', sep= ';', fileEncoding= 'latin1')

## import states dictionary
state_dict <- read.csv('./dictionary/state-dict.csv', sep= ';', fileEncoding= 'latin1')

## import mapbiomas dictionary
mapbiomas_dict <- read.csv('./dictionary/mapbiomas-dict-ptbr.csv', sep= ';', fileEncoding= 'latin1')

## create recipe to receive data
data <- as.data.frame(NULL)
## for each fiel (state)
for (i in 1:length(unique(files))) {
  ## read file i
  x <- read.csv(files[i])
  ## delete undesired columns
  x <- x[!names(x) %in% c("system.index", ".geo")]
  ## parse state id from basename
  x$state <- sapply(strsplit(basename(files[i]), split='_', fixed=TRUE),
                    function(x) (x[1]))
  
  ## create recipe to translate each land tenure
  recipe <- as.data.frame(NULL)
  ## for each tenure id
  for (j in 1:length(unique(x$tenure))) {
    ## for each unique value, get mean in n levels
    y <- subset(tenure_dict, Value == unique(x$tenure)[j])
    ## select matched land tenure 
    z <- subset(x, tenure == unique(x$tenure)[j])
    ## apply tenure translation for each level
    z$tenure_l1 <- gsub(paste0('^',y$Value,'$'), y$tenure.l1, z$tenure)
    z$tenure_l2 <- gsub(paste0('^',y$Value,'$'), y$tenure.l2, z$tenure)
    z$tenure_l3 <- gsub(paste0('^',y$Value,'$'), y$tenure.l3, z$tenure)
    ## bind into recipe
    recipe <- rbind(recipe, z)
    
  }
  
  data <- rbind(data, recipe)
}

## empty bin
rm(recipe, i, j, x, y, z)

## create recipe to translate each state
recipe2 <- as.data.frame(NULL)
## for each tenure id
for (k in 1:length(unique(data$state))) {
  ## for each unique value, get mean in n levels
  y <- subset(state_dict, id == unique(data$state)[k])
  ## select matched state
  z <- subset(data, state == unique(data$state)[k])
  ## apply tenure translation for each level
  z$state_sig <- gsub(paste0('^',y$id,'$'), y$state, z$state)
  ## bind into recipe
  recipe2 <- rbind(recipe2, z)
}

## empty bin
rm(data, k, y, z)

## create recipe to translate mapbiomas classes
data <- as.data.frame(NULL)
## for each tenure id
for (l in 1:length(unique(recipe2$class_id))) {
  ## for each unique value, get mean in n levels
  y <- subset(mapbiomas_dict, id == unique(recipe2$class_id)[l])
  if (nrow(y) == 0) {
    next
  }
  ## select matched class
  z <- subset(recipe2, class_id == unique(recipe2$class_id)[l])
  ## apply tenure translation for each level
  z$mapb_0 <- gsub(paste0('^',y$id,'$'), y$mapb_0, z$class_id)
  z$mapb_1 <- gsub(paste0('^',y$id,'$'), y$mapb_1, z$class_id)
  z$mapb_1_2 <- gsub(paste0('^',y$id,'$'), y$mapb_1_2, z$class_id)
  z$mapb_2 <- gsub(paste0('^',y$id,'$'), y$mapb_2, z$class_id)
  z$mapb_3 <- gsub(paste0('^',y$id,'$'), y$mapb_3, z$class_id)
  z$mapb_4 <- gsub(paste0('^',y$id,'$'), y$mapb_4, z$class_id)
  
  ## bind into recipe
  data <- rbind(data, z)
}

## remove bin
rm(recipe2, l, y, z)

## export table
write.csv(data, './table/cover-per-tenure-per-state.csv')
