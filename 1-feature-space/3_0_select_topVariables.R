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
write.table(unique(sum_importance$variable), "../_txt/pre_selected_variables.txt")
## Exportar top
top30 <- aggregate(sum_importance$Freq, by=list(sum_importance$variable), FUN="sum")
write.table(top30$Group.1[order(top30$x, decreasing=TRUE)][1:30], "../_txt/top30.txt")
write.table(top30$Group.1[order(top30$x, decreasing=TRUE)][1:20], "../_txt/top20.txt")
write.table(top30$Group.1[order(top30$x, decreasing=TRUE)][1:10], "../_txt/top10.txt")
write.table(top30$Group.1[order(top30$x, decreasing=TRUE)][1:5], "../_txt/top5.txt")
