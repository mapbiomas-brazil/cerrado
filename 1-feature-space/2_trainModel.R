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

## read table
data <- na.omit(read.table("../_txt/spectral_signatures.txt"))

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

## plot frequencies
x11()
ggplot(data.frame(data$class), aes(x=data$class)) +
  geom_bar() + coord_flip() + theme_classic()

## criar um dataset por classe
agricultura <- subset (data, class== "Agricultura")
agua <- subset (data, class== "Água")
campestre <- subset (data, class== "Formação campestre")
florestal <- subset (data, class== "Formação florestal")
savanica <- subset (data, class== "Formação savânica")
outros <- subset (data, class== "Outros")
pastagem <- subset (data, class== "Pastagem")

## loop for vai começar daqui (treinar multilpos modelos e extrair importancia)
## criar recipe vazio
recipe <- as.data.frame(NULL)

for (i in 1:n_models) {
  print (paste0(i/n_models*100, " %"))
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
  
  
  temp <- as.data.frame(importance(rfModel))
  temp$run <- i
  temp$variable <- row.names(temp)
  row.names(temp) <- 1:90
  recipe <- rbind (temp, recipe)
}

recipe$level <- "geral"
#write.table(recipe, "../_txt/geral_models.txt")
#varImpPlot(rfModel, n.var=45, type=2)

## treinar modelos apenas com variaveis nativas
## criar recipe vazio
recipe2 <- as.data.frame(NULL)

for (i in 1:n_models) {
  print (paste0(i/n_models*100, " %"))
  ## sortear amostras (400 por classe)
  sample_campestre <- campestre[sample(1:nrow(campestre), n_samples),]
  sample_florestal <- florestal[sample(1:nrow(florestal), n_samples),]
  sample_savanica <- savanica[sample(1:nrow(savanica), n_samples),]
 
  
  ## preparar dataset para treino
  samples <- rbind (sample_campestre, sample_florestal, sample_savanica)
  
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
  
  
  temp <- as.data.frame(importance(rfModel))
  temp$run <- i
  temp$variable <- row.names(temp)
  row.names(temp) <- 1:90
  recipe2 <- rbind (temp, recipe2)
}

recipe2$level <- "native"
#write.table(recipe2, "../_txt/native_models.txt")

## Floresta vs. all 
recipe3 <- as.data.frame(NULL)

data2 <- rbind (agricultura, agua, campestre, savanica, outros, pastagem)
data2$class <- "Outros"

for (i in 1:n_models) {
  print (paste0(i/n_models*100, " %"))
  ## sortear amostras (400 por classe)
   sample_florestal <- florestal[sample(1:nrow(florestal), n_samples),]
   sample_outros <- data2[sample(1:nrow(data2), n_samples),]
 
  ## preparar dataset para treino
  samples <- rbind (sample_florestal, sample_outros)
  
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
  
  
  temp <- as.data.frame(importance(rfModel))
  temp$run <- i
  temp$variable <- row.names(temp)
  row.names(temp) <- 1:90
  recipe3 <- rbind (temp, recipe3)
}

## exportar
recipe3$level <- "florestal"
#write.table(recipe3, "../_txt/florestal_models.txt")

## savana vs. all 
recipe4 <- as.data.frame(NULL)

data3 <- rbind (agricultura, agua, campestre, florestal, outros, pastagem)
data3$class <- "Outros"

for (i in 1:n_models) {
  print (paste0(i/n_models*100, " %"))
  ## sortear amostras (400 por classe)
  sample_savanica <- savanica[sample(1:nrow(savanica), n_samples),]
  sample_outros <- data3[sample(1:nrow(data3), n_samples),]
  
  ## preparar dataset para treino
  samples <- rbind (sample_savanica, sample_outros)
  
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
  
  
  temp <- as.data.frame(importance(rfModel))
  temp$run <- i
  temp$variable <- row.names(temp)
  row.names(temp) <- 1:90
  recipe4 <- rbind (temp, recipe4)
}

## exportar
recipe4$level <- "savanica"
#write.table(recipe4, "../_txt/savanica_models.txt")

## campestre vs. all 
recipe5 <- as.data.frame(NULL)

data4 <- rbind (agricultura, agua, savanica, florestal, outros, pastagem)
data4$class <- "Outros"

for (i in 1:n_models) {
  print (paste0(i/n_models*100, " %"))
  ## sortear amostras (400 por classe)
  sample_campestre <- campestre[sample(1:nrow(campestre), n_samples),]
  sample_outros <- data4[sample(1:nrow(data4), n_samples),]
  
  ## preparar dataset para treino
  samples <- rbind (sample_campestre, sample_outros)
  
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
  
  
  temp <- as.data.frame(importance(rfModel))
  temp$run <- i
  temp$variable <- row.names(temp)
  row.names(temp) <- 1:90
  recipe5 <- rbind (temp, recipe5)
}

## exportar
recipe5$level <- "campestre"
#write.table(recipe5, "../_txt/campestre_models.txt")
recipe_final <- rbind (recipe, recipe2, recipe3, recipe4, recipe5)
write.table(recipe_final, "../_txt/importance.txt")
