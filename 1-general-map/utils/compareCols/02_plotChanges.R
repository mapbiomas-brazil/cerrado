## comparar coleçoes

## library 
library(ggplot2)
library(dplyr)
library (networkD3)

## avoid sci-notes
options(scipen=1e3)

## carregar tabela
data <- read.csv('./table/compareCollections_71_8.csv')

# Remove columns by name
data <- data[, !(names(data) %in% c('system.index', '.geo'))]

## translate ecoregions
data$ecoregion_str <- 
  gsub(100, "Alto Parnaíba",
       gsub(200, 'Alto São Francisco',
            gsub(300, 'Araguaia Tocantins',
                 gsub(400, 'Bananal',
                      gsub(500, 'Basaltos do Paraná',
                           gsub(600, 'Bico do Papagaio',
                                gsub(700, 'Centro-norte Piauiense',
                                     gsub(800, 'Chapada dos Parecis',
                                          gsub(900, 'Chapadão do São Francisco',
                                               gsub(1000, 'Complexo Bodoquena',
                                                    gsub(1100, 'Costeiro',
                                                         gsub(1200, 'Depressão Cárstica do São Francisco',
                                                              gsub(1300, 'Depressão Cuiabana',
                                                                   gsub(1400, 'Floresta de Cocais',
                                                                        gsub(1500, 'Jequitinhonha',
                                                                             gsub(1600, 'Paracatu',
                                                                                  gsub(1700, 'Paraná Guimarães',
                                                                                       gsub(1800, 'Parnaguá',
                                                                                            gsub(1900, 'Planalto Central',
                                                                                                 gsub(2000, 'Vão do Paranã',
                                                                                                      data$ecoregion))))))))))))))))))))

## translate classes
data$from_str <- 
  gsub('^3$', 'Florestal',
     gsub('^4$', 'Savânica',
          gsub('^11$', 'Áreas Úmidas',
               gsub('^29$', 'Afloramento Rochoso',
                    gsub('^15$', 'Pastagem',
                         gsub('^18$', 'Agricultura',
                              gsub('^9$', 'Silvicultura',
                                   gsub('^21$', 'Mosaico de Usos',
                                        gsub('^22$', 'Não Vegetado',
                                             gsub('^33$', 'Água',
                                                  gsub('^12$', 'Campestre',
                                                    data$from)))))))))))

data$to_str <- 
  gsub('^3$', 'Florestal',
       gsub('^4$', 'Savânica',
            gsub('^11$', 'Áreas Úmidas',
                 gsub('^29$', 'Afloramento Rochoso',
                      gsub('^15$', 'Pastagem',
                           gsub('^18$', 'Agricultura',
                                gsub('^9$', 'Silvicultura',
                                     gsub('^21$', 'Mosaico de Usos',
                                          gsub('^22$', 'Não Vegetado',
                                               gsub('^33$', 'Água',
                                                    gsub('^12$', 'Campestre',
                                                         data$to)))))))))))

## aggregate stats
data_agg <- aggregate(x=list(area= data$area), by=list(from= data$from_str, to=data$to_str), FUN= 'sum')

## adjust labels
colnames(data_agg)[1] <- 'source'
colnames(data_agg)[2] <- 'target'

## insert a blank space after target name
data_agg$target <- paste(data_agg$target, " ", sep="")

## compute nodes
node <- data.frame(name=c(as.character(data_agg$source), as.character(data_agg$target)) %>% unique())

## create labels
data_agg$IDsource <- match(data_agg$source, node$name)-1 
data_agg$IDtarget <- match(data_agg$target, node$name)-1



## create pallete
ColourScal = 'd3.scaleOrdinal() .domain(["Agricultura", "Água", "Áreas", "Florestal", "Afloramento", "Campestre", "Mosaico", "Não", "Pastagem", "Savânica", "Silvicultura"]) 
                .range(["#e974ed", "#0000ff", "#45c2a5","#006400", "#ff8C00", "#b8af4f", "#fff3bf", "#ea9999", "#ffd966", "#00ff00", "#935132"])'


# Make the Network
x11()
sankeyNetwork(Links = subset(data_agg, area > 20000), Nodes = node,
              Source = "IDsource", Target = "IDtarget",
              Value = "area", NodeID = "name", 
              LinkGroup = "source",
              sinksRight= F, 
              colourScale=ColourScal,
              nodeWidth= 25, nodePadding= 25, 
              fontSize= 13, fontFamily= "Arial")



