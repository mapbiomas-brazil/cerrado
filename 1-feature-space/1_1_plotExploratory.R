## carregar bibliotecas
library(corrplot)
library(ggplot2)
library (ggfortify)

## carregar biblioteca espectral
data <- read.table("../_txt/spectral_signatures.txt")

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

##collect subsample
data2 <- subset (data, class == "Outros")
sample_data <- data2[sample(1:nrow(data2), 2500),]

##
#x11()
dataValues <- na.omit(mutate_all(sample_data[2:91], function(x) as.numeric(as.character(x))))
data_cor <- cor(dataValues)
corrplot(data_cor, method="color", type="upper", tl.cex=0.7, title= "Outros")


##########################
## Plotar PCA
sample_data <- na.omit(data[sample(1:nrow(data), 10000),])
pca_res <- prcomp(sample_data[2:91], scale. = TRUE)

autoplot(pca_res, data=sample_data, colour= "class",
         loadings= TRUE, loadings.label=TRUE, loadings.label.size=2.7, loadings.colour='gray40',
         alpha=0.4) +
  scale_colour_manual(values=c("#E974ED", "#0000FF", "#B8AF4F", "#006400", "#32CD32", 
                               "red", "black", "#FFD966")) +
  theme_bw()
  

