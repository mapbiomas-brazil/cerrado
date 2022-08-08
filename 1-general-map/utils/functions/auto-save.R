## criar tabela fake com 100 mil linhas
data <- as.data.frame(cbind(value= runif(100000, min=0, max=1),
                            desc= runif(100000, min=50, max=100)))

## checar se o arquivo de salvamento ja existe
if (file.exists('./auto-save.csv') == TRUE) {
  ## se existir, carregar arquivo
  file <- read.csv('auto-save.csv')[-1]
} else {
  ## se não, criar um recipiente vazio 
  file <- as.data.frame(NULL)
}

## set saving interval
save_interval = 1e4
## set empty counter 
counter = as.numeric(0)

## salvar numero de referencia para processo
ref_n <- nrow(file)

## para cada linha
for(i in 1:nrow(data)) {
  ## plotar display da tarefa
  print(paste0('line ', i + ref_n, ' |x| ', round((i + ref_n) / nrow(data) * 100, digits=1), '%'))
  ## adiciona valor X na linha subsequente a ultima em file correspondente em data
  line <- data[ref_n + i ,]
  ## insere o valor de interesse
  line$get <- 'A'
  ## empilha no objeto
  file <- rbind(file, line)
  ## soma +1 ao contador
  counter <- counter + 1
  ## quando o contador for == 1e4, salva o arquivo
  if (counter == 1e4) {
    print('saving file into ./')
    ## save csv
    write.csv(file, './auto-save.csv')
    ## reseta o contador 
    counter = 0
  }
  ## parar quando chegar em i + nrow(file) == nrow(data)
  if (i + ref_n == nrow(data)) {
    print('end ====>')
    break
  }
}

