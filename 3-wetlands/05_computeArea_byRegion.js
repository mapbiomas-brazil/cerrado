// Calcular a área de LCLU para cada região com base nas amostras estáveis
// Não calcular para área úmida, esse valor virá de um ratio dinânico no próximo passo
// Esta tabela será usada para gerar as amostras de treinamento

// definir palheta
var palettes = require('users/mapbiomas/modules:Palettes.js');
var vis = {
    'min': 0,
    'max': 34,
    'palette': palettes.get('classification2')
};

// strings de identificação 
var dirout = 'users/dhconciani/c6-wetlands/input_tables/';

// definir diretórios 
// regiões de classificação do Cerrado
var regioesCollection = ee.FeatureCollection('projects/mapbiomas-workspace/AUXILIAR/CERRADO/cerrado_regioes_c6');

// função para calcular a área total em km²
var pixelArea = ee.Image.pixelArea().divide(1000000);

// carregar amostras estáveis 
// Usar as amostras estáveis vai priorizar o mapeamento majoritário de classes mais estáveis
// em cada região, potencialmente diminuindo comissão em áreas úmidas
var stable = ee.Image('users/dhconciani/c6-wetlands/input_masks/trainingMask_wetlands_c6_v2');

// calcular área de classes estáveis em cada região 
  var area03 = pixelArea.mask(stable.eq(3));  // forest
  var area04 = pixelArea.mask(stable.eq(4));  // savanna
  var area12 = pixelArea.mask(stable.eq(12)); // grassland
  var area15 = pixelArea.mask(stable.eq(15)); // pasture
  var area19 = pixelArea.mask(stable.eq(19)); // agriculture
  var area25 = pixelArea.mask(stable.eq(25)); // other non-vegetated areas
  var area33 = pixelArea.mask(stable.eq(33)); // water

// plot stable samples
Map.addLayer(stable, vis, 'stableSamples');

// compute stableSamples area forEach region 
var processaReg = function(regiao) {
  regiao = regiao.set('floresta', ee.Number(area03.reduceRegion({reducer: ee.Reducer.sum(),geometry: regiao.geometry(), scale: 30,maxPixels: 1e13}).get('area')));
  regiao = regiao.set('savana', ee.Number(area04.reduceRegion({reducer: ee.Reducer.sum(),geometry: regiao.geometry(), scale: 30,maxPixels: 1e13}).get('area')));
  regiao = regiao.set('campo', ee.Number(area12.reduceRegion({reducer: ee.Reducer.sum(),geometry: regiao.geometry(), scale: 30,maxPixels: 1e13}).get('area')));
  regiao = regiao.set('pasto', ee.Number(area15.reduceRegion({reducer: ee.Reducer.sum(),geometry: regiao.geometry(), scale: 30,maxPixels: 1e13}).get('area')));
  regiao = regiao.set('agric', ee.Number(area19.reduceRegion({reducer: ee.Reducer.sum(),geometry: regiao.geometry(), scale: 30,maxPixels: 1e13}).get('area')));
  regiao = regiao.set('nao_veg', ee.Number(area25.reduceRegion({reducer: ee.Reducer.sum(),geometry: regiao.geometry(), scale: 30,maxPixels: 1e13}).get('area')));
  regiao = regiao.set('agua', ee.Number(area33.reduceRegion({reducer: ee.Reducer.sum(),geometry: regiao.geometry(), scale: 30,maxPixels: 1e13}).get('area')));
  return regiao;
};

var regiao2 = regioesCollection.map(processaReg);
print(regiao2);

// exportar tabela para o asset
Export.table.toAsset(regiao2, 'AOIwetland_area_v2', 
                     dirout + 'AOIwetland_area_v2');

// adicionar no mapa
var blank = ee.Image(0).mask(0);
var outline = blank.paint(regioesCollection, 'AA0000', 2); 
var visPar = {'palette':'000000','opacity': 0.6};
Map.addLayer(regioesCollection, visPar, 'Região', true);
