## select feature space
## Dhemerson Conciani (dhemerson.costa@ipam.org.br)

## load libraries
library (ggplot2)

## load table
data <- read.table ('../_txt/importance.txt')
sum_importance <- read.table('../sum_importance.txt')

## exportar variaveis selecionadas
#write.table(unique(sum_importance$variable), "../_txt/pre_selected_variables.txt")

## plot 
x11()
## geral
ggplot (data=subset(data, level== "geral"), 
        aes (x=reorder(variable, MeanDecreaseGini), y=MeanDecreaseGini)) +
        geom_boxplot(outlier.size=-1, colour="gray20") +
  geom_vline(xintercept=60.5, color="red", size=1) +
  coord_flip() +
  theme_classic() +
  ggtitle('Native + Agr., Wat., Pas., Oth.)') + 
  xlab ('Predictor')

## apenas nativas
ggplot (data=subset(data, level== "native"), 
        aes (x=reorder(variable, MeanDecreaseGini), y=MeanDecreaseGini)) +
  geom_boxplot(outlier.size=-1, colour= "tomato") +
  geom_vline(xintercept=60.5, color="red", size=1) +
  coord_flip() +
  theme_classic() +
  ggtitle('Native (Fo., Sa., Gr.)') + 
  xlab ('Predictor')

## forest
ggplot (data=subset(data, level== "florestal"), 
        aes (x=reorder(variable, MeanDecreaseGini), y=MeanDecreaseGini)) +
  geom_boxplot(outlier.size=-1, col="darkgreen") +
  geom_vline(xintercept=60.5, color="red", size=1) +
  coord_flip() +
  theme_classic() +
  ggtitle('Forest vs. all') + 
  xlab ('Predictor')

## savanna
ggplot (data=subset(data, level== "savanica"), 
        aes (x=reorder(variable, MeanDecreaseGini), y=MeanDecreaseGini)) +
  geom_boxplot(outlier.size=-1, col="#2C9B1C") +
  geom_vline(xintercept=60.5, color="red", size=1) +
  coord_flip() +
  theme_classic() +
  ggtitle('Savanna vs. all') + 
  xlab ('Predictor')

## campestre
ggplot (data=subset(data, level== "campestre"), 
        aes (x=reorder(variable, MeanDecreaseGini), y=MeanDecreaseGini)) +
  geom_boxplot(outlier.size=-1, col="#888766") +
  geom_vline(xintercept=60.5, color="red", size=1) +
  coord_flip() +
  theme_classic() +
  ggtitle('Grassland vs. all') + 
  xlab ('Predictor')

## numero de vezes que uma variavel apareceu no top 30
ggplot (data= sum_importance, aes(x= reorder(variable, Freq), y= Freq)) +
  geom_bar(stat="identity", aes(fill=level)) +
  scale_fill_manual("Models", values=c("darkgreen", "#2C9B1C", "#888766", "tomato", "gray20"),
                             labels=c("Forest vs. all", "Savanna vs. all", "Grassland vs all", 
                                      "Native (Fo., Sa., Gr.)", "All classes (+Agr., Wat., Pas., Oth.)")) +
  coord_flip() +
  xlab ("Predictor") + 
  theme_classic()
