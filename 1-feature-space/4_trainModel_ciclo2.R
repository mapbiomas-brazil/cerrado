## select feature space
## Dhemerson Conciani (dhemerson.costa@ipam.org.br)

## carregar bibliotecas
library (AppliedPredictiveModeling)
library (caret)
library (ggplot2)
library (pROC)
library (doParallel)
library (dplyr)
library (randomForest)
library (reshape2)

## configure parallel processing
cl <- makePSOCKcluster(5)
registerDoParallel(cl)

## parametros de treinamento
n_models <- 400
n_samples <- 500

## read spectral signatures library
data <- na.omit(read.table("../_txt/spectral_signatures.txt"))

## read predictors selecitons tables
pred <- read.table("../_txt/pre_selected_variables.txt")
sr30 <- read.table("../_txt/top30.txt")
sr20 <- read.table("../_txt/top20.txt")
sr10 <- read.table("../_txt/top10.txt")
sr5 <-  read.table("../_txt/top5.txt")
toa <-  read.table("../_txt/toa_predictors.txt", header= TRUE)
######################################
sr <- c("class", pred$x)
sr2 <- c("year", pred$x)
######################################
sr30 <- c("class", sr30$x)
sr20 <- c("class", sr20$x)
sr10 <- c("class", sr10$x)
sr5 <- c("class", sr5$x)
######################################
toa <- c("class", toa$SR)
#####################################

## renomear classes
data$class <- gsub ("Apicum", "Outros", data$class)
data$class <- gsub ("Mangue", "Outros", data$class)
data$class <- gsub ("Aquicultura", "Outros", data$class)
data$class <- gsub ("MineraÃ§Ã£o", "Outros", data$class)
data$class <- gsub ("Praia e Duna", "Outros", data$class)
data$class <- gsub ("Cultura Anual", "Agricultura", data$class)
data$class <- gsub ("Cultura Semi-Perene", "Agricultura", data$class)
data$class <- gsub ("Pastagem Cultivada", "Pastagem", data$class)
data$class <- gsub ("Cultura Perene", "Agricultura", data$class)
data$class <- gsub ("Floresta Plantada", "Outros", data$class)
data$class <- gsub ("FormaÃ§Ã£o SavÃ¢nica", "Formação savânica", data$class)
data$class <- gsub ("FormaÃ§Ã£o Florestal", "Formação florestal", data$class)
data$class <- gsub ("Rio, Lago e Oceano", "Água", data$class)
data$class <- gsub ("Afloramento Rochoso", "Outros", data$class)
data$class <- gsub ("FormaÃ§Ã£o Campestre", "Formação campestre", data$class)
data$class <- gsub ("Infraestrutura Urbana", "Outros", data$class)
data$class <- gsub ("Outra Ã\u0081rea NÃ£o Vegetada", "OANV", data$class)
data$class <- gsub ("Ã\u0081rea Ãšmida Natural NÃ£o Florestal", "Outros", data$class)
data$class <- gsub ("Outra FormaÃ§Ã£o Natural NÃ£o Florestal", "Outros", data$class)
data$class <- gsub ("NÃ£o Observado", "Outros", data$class)

## exlcluir classe "outros"
data  <- subset (data, class != "Outros")

## criar um dataset por classe
agricultura <- subset (data, class== "Agricultura")
agua <- subset (data, class== "Água")
campestre <- subset (data, class== "Formação campestre")
florestal <- subset (data, class== "Formação florestal")
savanica <- subset (data, class== "Formação savânica")
#outros <- subset (data, class== "Outros")
pastagem <- subset (data, class== "Pastagem")

## loop for vai começar daqui (treinar multilpos modelos e extrair acurácia)
## criar recipe vazio
recipe <- as.data.frame(NULL)

for (i in 1:n_models) {
  print (paste0("all variables ", i/n_models*100, " %"))
  ## sortear amostras (400 por classe)
  sample_agricultura <- agricultura[sample(1:nrow(agricultura), n_samples),]
  sample_agua <- agua[sample(1:nrow(agua), n_samples),]
  sample_campestre <- campestre[sample(1:nrow(campestre), n_samples),]
  sample_florestal <- florestal[sample(1:nrow(florestal), n_samples),]
  sample_savanica <- savanica[sample(1:nrow(savanica), n_samples),]
  sample_pastagem <- pastagem[sample(1:nrow(pastagem), n_samples),]
  
  ## preparar dataset para treino
  samples <- rbind (sample_agricultura, sample_agua, sample_campestre, sample_florestal, 
                    sample_savanica, sample_pastagem)
  
  ## separar variaveis de labels
  dataValues <- samples[2:91]
  dataClass <- samples[1]
  
  ## converter em numerico
  dataValues <- mutate_all(dataValues, function(x) as.numeric(as.character(x)))
  
  ## control
  control <- trainControl(method="repeatedcv", number=5, repeats=3, classProbs=TRUE) 
  
  ## treinar modelo
  rfModel <- randomForest(dataValues, as.factor(dataClass[,1]),
                          ntree= 100,
                          mtry= 4,
                          trControl=control,
                          preProc = c ("center", "scale"),
                          allowParallel = TRUE)
  
  
  temp <- as.data.frame(1-rfModel$err.rate[100]); colnames(temp)[1] <- "accuracy"
  temp$run <- i
  temp$level <- "all"
  recipe <- rbind (temp, recipe)
}

## calcular com os 59 preditores selecionados
## criar recipe vazio
recipe2 <- as.data.frame(NULL)

for (i in 1:n_models) {
  print (paste0("only 59 from SR - ", i/n_models*100, " %"))
  ## sortear amostras (400 por classe)
  sample_agricultura <- agricultura[sample(1:nrow(agricultura), n_samples),]
  sample_agricultura <- sample_agricultura[, which(names(sample_agricultura) %in% sr)]
  sample_agua <- agua[sample(1:nrow(agua), n_samples),]
  sample_agua <- sample_agua[, which(names(sample_agua) %in% sr)]
  sample_campestre <- campestre[sample(1:nrow(campestre), n_samples),]
  sample_campestre <- sample_campestre[, which(names(sample_campestre) %in% sr)]
  sample_florestal <- florestal[sample(1:nrow(florestal), n_samples),]
  sample_florestal <- sample_florestal[, which(names(sample_florestal) %in% sr)]
  sample_savanica <- savanica[sample(1:nrow(savanica), n_samples),]
  sample_savanica <- sample_savanica[, which(names(sample_savanica) %in% sr)]
  sample_pastagem <- pastagem[sample(1:nrow(pastagem), n_samples),]
  sample_pastagem <- sample_pastagem[, which(names(sample_pastagem) %in% sr)]
  
  ## preparar dataset para treino
  samples <- rbind (sample_agricultura, sample_agua, sample_campestre, sample_florestal, 
                    sample_savanica, sample_pastagem)
  
  ## separar variaveis de labels
  dataValues <- samples[2:60]
  dataClass <- samples[1]
  
  ## converter em numerico
  dataValues <- mutate_all(dataValues, function(x) as.numeric(as.character(x)))
  
  ## control
  control <- trainControl(method="repeatedcv", number=5, repeats=3, classProbs=TRUE) 
  
  ## treinar modelo
  rfModel <- randomForest(dataValues, as.factor(dataClass[,1]),
                          ntree= 100,
                          mtry= 4,
                          trControl=control,
                          preProc = c ("center", "scale"),
                          allowParallel = TRUE)
  
  
  temp <- as.data.frame(1-rfModel$err.rate[100]); colnames(temp)[1] <- "accuracy"
  temp$run <- i
  temp$level <- "SR_59"
  recipe2 <- rbind (temp, recipe2)
}

## calcular com os 31 preditores descartados
## criar recipe vazio
recipe3 <- as.data.frame(NULL)

for (i in 1:n_models) {
  print (paste0("only 31 discarded from SR - ", i/n_models*100, " %"))
  ## sortear amostras (400 por classe)
  sample_agricultura <- agricultura[sample(1:nrow(agricultura), n_samples),]
  sample_agricultura <- sample_agricultura[, -which(names(sample_agricultura) %in% sr2)]
  sample_agua <- agua[sample(1:nrow(agua), n_samples),]
  sample_agua <- sample_agua[, -which(names(sample_agua) %in% sr2)]
  sample_campestre <- campestre[sample(1:nrow(campestre), n_samples),]
  sample_campestre <- sample_campestre[, -which(names(sample_campestre) %in% sr2)]
  sample_florestal <- florestal[sample(1:nrow(florestal), n_samples),]
  sample_florestal <- sample_florestal[, -which(names(sample_florestal) %in% sr2)]
  sample_savanica <- savanica[sample(1:nrow(savanica), n_samples),]
  sample_savanica <- sample_savanica[, -which(names(sample_savanica) %in% sr2)]
  sample_pastagem <- pastagem[sample(1:nrow(pastagem), n_samples),]
  sample_pastagem <- sample_pastagem[, -which(names(sample_pastagem) %in% sr2)]
  
  ## preparar dataset para treino
  samples <- rbind (sample_agricultura, sample_agua, sample_campestre, sample_florestal, 
                    sample_savanica, sample_pastagem)
  
  ## separar variaveis de labels
  dataValues <- samples[2:32]
  dataClass <- samples[1]
  
  ## converter em numerico
  dataValues <- mutate_all(dataValues, function(x) as.numeric(as.character(x)))
  
  ## control
  control <- trainControl(method="repeatedcv", number=5, repeats=3, classProbs=TRUE) 
  
  ## treinar modelo
  rfModel <- randomForest(dataValues, as.factor(dataClass[,1]),
                          ntree= 100,
                          mtry= 4,
                          trControl=control,
                          preProc = c ("center", "scale"),
                          allowParallel = TRUE)
  
  
  temp <- as.data.frame(1-rfModel$err.rate[100]); colnames(temp)[1] <- "accuracy"
  temp$run <- i
  temp$level <- "SR_D31"
  recipe3 <- rbind (temp, recipe3)
}

## calcular com o top 30
## criar recipe vazio
recipe4 <- as.data.frame(NULL)

for (i in 1:n_models) {
  print (paste0("only top 30 from SR - ", i/n_models*100, " %"))
  ## sortear amostras (400 por classe)
  sample_agricultura <- agricultura[sample(1:nrow(agricultura), n_samples),]
  sample_agricultura <- sample_agricultura[, which(names(sample_agricultura) %in% sr30)]
  sample_agua <- agua[sample(1:nrow(agua), n_samples),]
  sample_agua <- sample_agua[, which(names(sample_agua) %in% sr30)]
  sample_campestre <- campestre[sample(1:nrow(campestre), n_samples),]
  sample_campestre <- sample_campestre[, which(names(sample_campestre) %in% sr30)]
  sample_florestal <- florestal[sample(1:nrow(florestal), n_samples),]
  sample_florestal <- sample_florestal[, which(names(sample_florestal) %in% sr30)]
  sample_savanica <- savanica[sample(1:nrow(savanica), n_samples),]
  sample_savanica <- sample_savanica[, which(names(sample_savanica) %in% sr30)]
  sample_pastagem <- pastagem[sample(1:nrow(pastagem), n_samples),]
  sample_pastagem <- sample_pastagem[, which(names(sample_pastagem) %in% sr30)]
  
  ## preparar dataset para treino
  samples <- rbind (sample_agricultura, sample_agua, sample_campestre, sample_florestal, 
                    sample_savanica, sample_pastagem)
  
  ## separar variaveis de labels
  dataValues <- samples[2:31]
  dataClass <- samples[1]
  
  ## converter em numerico
  dataValues <- mutate_all(dataValues, function(x) as.numeric(as.character(x)))
  
  ## control
  control <- trainControl(method="repeatedcv", number=5, repeats=3, classProbs=TRUE) 
  
  ## treinar modelo
  rfModel <- randomForest(dataValues, as.factor(dataClass[,1]),
                          ntree= 100,
                          mtry= 4,
                          trControl=control,
                          preProc = c ("center", "scale"),
                          allowParallel = TRUE)
  
  
  temp <- as.data.frame(1-rfModel$err.rate[100]); colnames(temp)[1] <- "accuracy"
  temp$run <- i
  temp$level <- "TOP30"
  recipe4 <- rbind (temp, recipe4)
}

## calcular com o top 20
## criar recipe vazio
recipe5 <- as.data.frame(NULL)

for (i in 1:n_models) {
  print (paste0("only top 20 from SR - ", i/n_models*100, " %"))
  ## sortear amostras (400 por classe)
  sample_agricultura <- agricultura[sample(1:nrow(agricultura), n_samples),]
  sample_agricultura <- sample_agricultura[, which(names(sample_agricultura) %in% sr20)]
  sample_agua <- agua[sample(1:nrow(agua), n_samples),]
  sample_agua <- sample_agua[, which(names(sample_agua) %in% sr20)]
  sample_campestre <- campestre[sample(1:nrow(campestre), n_samples),]
  sample_campestre <- sample_campestre[, which(names(sample_campestre) %in% sr20)]
  sample_florestal <- florestal[sample(1:nrow(florestal), n_samples),]
  sample_florestal <- sample_florestal[, which(names(sample_florestal) %in% sr20)]
  sample_savanica <- savanica[sample(1:nrow(savanica), n_samples),]
  sample_savanica <- sample_savanica[, which(names(sample_savanica) %in% sr20)]
  sample_pastagem <- pastagem[sample(1:nrow(pastagem), n_samples),]
  sample_pastagem <- sample_pastagem[, which(names(sample_pastagem) %in% sr20)]
  
  ## preparar dataset para treino
  samples <- rbind (sample_agricultura, sample_agua, sample_campestre, sample_florestal, 
                    sample_savanica, sample_pastagem)
  
  ## separar variaveis de labels
  dataValues <- samples[2:21]
  dataClass <- samples[1]
  
  ## converter em numerico
  dataValues <- mutate_all(dataValues, function(x) as.numeric(as.character(x)))
  
  ## control
  control <- trainControl(method="repeatedcv", number=5, repeats=3, classProbs=TRUE) 
  
  ## treinar modelo
  rfModel <- randomForest(dataValues, as.factor(dataClass[,1]),
                          ntree= 100,
                          mtry= 4,
                          trControl=control,
                          preProc = c ("center", "scale"),
                          allowParallel = TRUE)
  
  
  temp <- as.data.frame(1-rfModel$err.rate[100]); colnames(temp)[1] <- "accuracy"
  temp$run <- i
  temp$level <- "TOP20"
  recipe5 <- rbind (temp, recipe5)
}

## calcular com o top 10
## criar recipe vazio
recipe6 <- as.data.frame(NULL)

for (i in 1:n_models) {
  print (paste0("only top 10 from SR - ", i/n_models*100, " %"))
  ## sortear amostras (400 por classe)
  sample_agricultura <- agricultura[sample(1:nrow(agricultura), n_samples),]
  sample_agricultura <- sample_agricultura[, which(names(sample_agricultura) %in% sr10)]
  sample_agua <- agua[sample(1:nrow(agua), n_samples),]
  sample_agua <- sample_agua[, which(names(sample_agua) %in% sr10)]
  sample_campestre <- campestre[sample(1:nrow(campestre), n_samples),]
  sample_campestre <- sample_campestre[, which(names(sample_campestre) %in% sr10)]
  sample_florestal <- florestal[sample(1:nrow(florestal), n_samples),]
  sample_florestal <- sample_florestal[, which(names(sample_florestal) %in% sr10)]
  sample_savanica <- savanica[sample(1:nrow(savanica), n_samples),]
  sample_savanica <- sample_savanica[, which(names(sample_savanica) %in% sr10)]
  sample_pastagem <- pastagem[sample(1:nrow(pastagem), n_samples),]
  sample_pastagem <- sample_pastagem[, which(names(sample_pastagem) %in% sr10)]
  
  ## preparar dataset para treino
  samples <- rbind (sample_agricultura, sample_agua, sample_campestre, sample_florestal, 
                    sample_savanica, sample_pastagem)
  
  ## separar variaveis de labels
  dataValues <- samples[2:11]
  dataClass <- samples[1]
  
  ## converter em numerico
  dataValues <- mutate_all(dataValues, function(x) as.numeric(as.character(x)))
  
  ## control
  control <- trainControl(method="repeatedcv", number=5, repeats=3, classProbs=TRUE) 
  
  ## treinar modelo
  rfModel <- randomForest(dataValues, as.factor(dataClass[,1]),
                          ntree= 100,
                          mtry= 4,
                          trControl=control,
                          preProc = c ("center", "scale"),
                          allowParallel = TRUE)
  
  
  temp <- as.data.frame(1-rfModel$err.rate[100]); colnames(temp)[1] <- "accuracy"
  temp$run <- i
  temp$level <- "TOP10"
  recipe6 <- rbind (temp, recipe6)
}

## calcular com o top 5
## criar recipe vazio
recipe7 <- as.data.frame(NULL)

for (i in 1:n_models) {
  print (paste0("only top 5 from SR - ", i/n_models*100, " %"))
  ## sortear amostras (400 por classe)
  sample_agricultura <- agricultura[sample(1:nrow(agricultura), n_samples),]
  sample_agricultura <- sample_agricultura[, which(names(sample_agricultura) %in% sr5)]
  sample_agua <- agua[sample(1:nrow(agua), n_samples),]
  sample_agua <- sample_agua[, which(names(sample_agua) %in% sr5)]
  sample_campestre <- campestre[sample(1:nrow(campestre), n_samples),]
  sample_campestre <- sample_campestre[, which(names(sample_campestre) %in% sr5)]
  sample_florestal <- florestal[sample(1:nrow(florestal), n_samples),]
  sample_florestal <- sample_florestal[, which(names(sample_florestal) %in% sr5)]
  sample_savanica <- savanica[sample(1:nrow(savanica), n_samples),]
  sample_savanica <- sample_savanica[, which(names(sample_savanica) %in% sr5)]
  sample_pastagem <- pastagem[sample(1:nrow(pastagem), n_samples),]
  sample_pastagem <- sample_pastagem[, which(names(sample_pastagem) %in% sr5)]
  
  ## preparar dataset para treino
  samples <- rbind (sample_agricultura, sample_agua, sample_campestre, sample_florestal, 
                    sample_savanica, sample_pastagem)
  
  ## separar variaveis de labels
  dataValues <- samples[2:6]
  dataClass <- samples[1]
  
  ## converter em numerico
  dataValues <- mutate_all(dataValues, function(x) as.numeric(as.character(x)))
  
  ## control
  control <- trainControl(method="repeatedcv", number=5, repeats=3, classProbs=TRUE) 
  
  ## treinar modelo
  rfModel <- randomForest(dataValues, as.factor(dataClass[,1]),
                          ntree= 100,
                          mtry= 4,
                          trControl=control,
                          preProc = c ("center", "scale"),
                          allowParallel = TRUE)
  
  
  temp <- as.data.frame(1-rfModel$err.rate[100]); colnames(temp)[1] <- "accuracy"
  temp$run <- i
  temp$level <- "TOP5"
  recipe7 <- rbind (temp, recipe7)
}

## calcular com os antigos preditores TOA
## criar recipe vazio
recipe8 <- as.data.frame(NULL)

for (i in 1:n_models) {
  print (paste0("Old predictors from TOA - ", i/n_models*100, " %"))
  ## sortear amostras (400 por classe)
  sample_agricultura <- agricultura[sample(1:nrow(agricultura), n_samples),]
  sample_agricultura <- sample_agricultura[, which(names(sample_agricultura) %in% toa)]
  sample_agua <- agua[sample(1:nrow(agua), n_samples),]
  sample_agua <- sample_agua[, which(names(sample_agua) %in% toa)]
  sample_campestre <- campestre[sample(1:nrow(campestre), n_samples),]
  sample_campestre <- sample_campestre[, which(names(sample_campestre) %in% toa)]
  sample_florestal <- florestal[sample(1:nrow(florestal), n_samples),]
  sample_florestal <- sample_florestal[, which(names(sample_florestal) %in% toa)]
  sample_savanica <- savanica[sample(1:nrow(savanica), n_samples),]
  sample_savanica <- sample_savanica[, which(names(sample_savanica) %in% toa)]
  sample_pastagem <- pastagem[sample(1:nrow(pastagem), n_samples),]
  sample_pastagem <- sample_pastagem[, which(names(sample_pastagem) %in% toa)]
  
  ## preparar dataset para treino
  samples <- rbind (sample_agricultura, sample_agua, sample_campestre, sample_florestal, 
                    sample_savanica, sample_pastagem)
  
  ## separar variaveis de labels
  dataValues <- samples[2:48]
  dataClass <- samples[1]
  
  ## converter em numerico
  dataValues <- mutate_all(dataValues, function(x) as.numeric(as.character(x)))
  
  ## control
  control <- trainControl(method="repeatedcv", number=5, repeats=3, classProbs=TRUE) 
  
  ## treinar modelo
  rfModel <- randomForest(dataValues, as.factor(dataClass[,1]),
                          ntree= 100,
                          mtry= 4,
                          trControl=control,
                          preProc = c ("center", "scale"),
                          allowParallel = TRUE)
  
  
  temp <- as.data.frame(1-rfModel$err.rate[100]); colnames(temp)[1] <- "accuracy"
  temp$run <- i
  temp$level <- "OLD_PRED"
  recipe8 <- rbind (temp, recipe8)
}

##
print ("done!! =)")
final <- rbind (recipe, recipe2, recipe3, recipe4, recipe5, recipe6, recipe7, recipe8)
write.table(final, "../_txt/accuracy.txt")
