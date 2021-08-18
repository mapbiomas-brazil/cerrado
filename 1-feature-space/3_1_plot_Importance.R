## select feature space
## Dhemerson Conciani (dhemerson.costa@ipam.org.br)

## load libraries
library (ggplot2)

## load table
data <- read.table ('../_txt/importance.txt')

## calc statistics
## mediana
stat <- aggregate(x= data$MeanDecreaseGini,
                  by=list(variable= data$variable, level= data$level),
                  FUN="mean")

## extrair 30 variaveis mais importates para cada nível do experimento
recipe <- as.data.frame(NULL)
for (i in 1:length(unique(stat$level))) {
  print (unique(stat$level)[i])
  temp <- subset(stat, level==unique(stat$level)[i])
  temp <- as.data.frame(temp[order(-temp$x),][1:30,]$variable)
  temp$level <- unique(stat$level)[i]
  recipe <- rbind (temp, recipe)
}

## calcular quantas vezes cada variavel aparece no top30
sum_importance <- as.data.frame(table(recipe))
colnames(sum_importance)[1] <- "variable"
sum_importance$level <- factor(sum_importance$level,
                               levels = c("florestal", "savanica", "campestre", "native", "geral"))

## exportar variaveis selecionadas
#write.table(unique(sum_importance$variable), "../_txt/pre_selected_variables.txt")
## Exportar top
#top30 <- aggregate(sum_importance$Freq, by=list(sum_importance$variable), FUN="sum")
#write.table(top30$Group.1[order(top30$x, decreasing=TRUE)][1:30], "../_txt/top30.txt")
#write.table(top30$Group.1[order(top30$x, decreasing=TRUE)][1:20], "../_txt/top20.txt")
#write.table(top30$Group.1[order(top30$x, decreasing=TRUE)][1:10], "../_txt/top10.txt")
#write.table(top30$Group.1[order(top30$x, decreasing=TRUE)][1:5], "../_txt/top5.txt")

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
