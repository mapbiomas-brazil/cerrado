## select feature space
## Dhemerson Conciani (dhemerson.costa@ipam.org.br)

## load libraries
library (ggplot2)

## define functions outside packages
fun_median <- function(x){
  return(data.frame(y=round(median(x), digits=3), label=round(median(x,na.rm=T), digits=3)))
}

## load table
data <- read.table ('../_txt/accuracy.txt')

## rename classes aesthetic
data$level <- gsub('all', 'ALL 90', data$level)
data$level <- gsub('SR_59', 'SEL 59', data$level)
data$level <- gsub('OLD_PRED', 'C5 45', data$level)
data$level <- gsub('TOP30', 'TOP 30', data$level)
data$level <- gsub('TOP20', 'TOP 20', data$level)
data$level <- gsub('SR_D31', 'UNS 31', data$level)
data$level <- gsub('TOP10', 'TOP 10', data$level)
data$level <- gsub('TOP5', 'TOP 5', data$level)

## plotar
x11()
ggplot (data, aes(x=reorder(level, -accuracy), y= accuracy)) +
  stat_boxplot(geom = "errorbar", width = 0.2) +  
  geom_boxplot(outlier.size=-1, fill= "white", alpha=1) +
  geom_jitter(alpha=0.02) +
  stat_summary(fun= median, geom="line", aes(group=1), col="darkgreen", alpha=0.3, size=1) +
  stat_summary(fun= median, geom="point", aes(group=1), col="darkgreen", alpha=0.3, size=1.5) +
  stat_summary(fun.data = fun_median, geom="text", vjust=-5, col="darkgreen") +
  xlab("Design") + ylab("Accuracy") + 
  theme_classic()
  
## promover teste tukey
# What is the effect of the treatment on the value ?
model <- lm(data$accuracy ~ data$level)
anova <- aov(model)

# Tukey test to study each pair of treatment :
tukey <- TukeyHSD(x= anova, 'data$level', conf.level=0.95)

tukey
