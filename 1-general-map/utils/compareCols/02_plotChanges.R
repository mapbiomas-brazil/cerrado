## comparar coleçoes

## library 
library(ggplot2)

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
  gsub('^3$', 'F. Florestal',
     gsub('^4$', 'F. Savânica',
          gsub('^11$', 'Áreas Úmidas',
               gsub('^29$', 'Afloramento Rochoso',
                    gsub('^15$', 'Pastagem',
                         gsub('^18$', 'Agricultura',
                              gsub('^9$', 'Silvicultura',
                                   gsub('^21$', 'Mosaico de Usos',
                                        gsub('^22$', 'Não Vegetado',
                                             gsub('^33$', 'Água',
                                                  gsub('^12$', 'F. Campestre',
                                                    data$from)))))))))))

data$to_str <- 
  gsub('^3$', 'F. Florestal',
       gsub('^4$', 'F. Savânica',
            gsub('^11$', 'Áreas Úmidas',
                 gsub('^29$', 'Afloramento Rochoso',
                      gsub('^15$', 'Pastagem',
                           gsub('^18$', 'Agricultura',
                                gsub('^9$', 'Silvicultura',
                                     gsub('^21$', 'Mosaico de Usos',
                                          gsub('^22$', 'Não Vegetado',
                                               gsub('^33$', 'Água',
                                                    gsub('^12$', 'F. Campestre',
                                                         data$to)))))))))))


