## feature space analisys
## Dhemerson Conciani (dhemerson.costa@ipam.org.br)

## carregar bibliotecas
library (tools)

## listar tabelas
tabs <- list.files("../_csv", full.names= TRUE)
filenames <- file_path_sans_ext(list.files("../_csv", full.names= FALSE))

## pre-processar tabelas
# criar arquivo vazio para receber dados
recipe <- as.data.frame(NULL)

## iniciar loop 
for (i in 1:length(tabs)) {
  ## ler tabela
  temp <- read.csv(tabs[i])
  print (paste0("processing ", filenames[i]))
  
  ## extrair variaveis  do ano
  year <- sapply(strsplit(filenames[i], split='_', fixed=TRUE), function(x) (x[3]))
  class <- temp[paste0('CLASS_', year)]
  spectral <- temp[51:140]
  
  ## montar data frame
  temp <- cbind (class, spectral)
  colnames(temp)[1] <- "class"
  temp$year <- year
  
  ## empilhar no dataframe
  recipe <- rbind (temp, recipe)
  rm (temp, year, class, spectral)
}

nrow(subset(recipe, year==2016))

## Exportar 
write.table (recipe, "../_txt/spectral_signatures.txt")
