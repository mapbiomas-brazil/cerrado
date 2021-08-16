// STEP 02 
// Calcular a área proporcional para cada classe em cada região
// Esta tabela será usada para gerar as amostras de treinamento 
// Update para usar classes da coleção 5

// strings de identificação 
var version = '1';
var bioma = "CERRADO";

// definir diretórios 
//// mosaicos SR (para coleção 6)
var dirasset = 'projects/nexgenmap/MapBiomas2/LANDSAT/mosaics';

//// diretório de saída
var dirout = 'projects/mapbiomas-workspace/AUXILIAR/CERRADO/';
// regiões brasil
var regioesCollection = ee.FeatureCollection('projects/mapbiomas-workspace/AUXILIAR/CERRADO/cerrado_regioes_c6');
// palheta de cores
var palettes = require('users/mapbiomas/modules:Palettes.js');
var vis = {
    'min': 0,
    'max': 34,
    'palette': palettes.get('classification2')
};

// ?
var ano = '2000';
print(regioesCollection);

// área do pixel
var pixelArea = ee.Image.pixelArea().divide(1000000);

// carregar coleção 5
var colecao5 = ee.Image('projects/mapbiomas-workspace/public/collection5/mapbiomas_collection50_integration_v1').select('classification_'+ano);
// reclassificar coleção 5
colecao5 = colecao5.select('classification_'+ ano).remap(
                  [3, 4, 5,  9,12,13,15,18,19,20,21,22,23,24,25,26,29,30,31,32,33],
                  [3, 4, 3, 19,12,12,15,19,19,19,19,25,25,25,25,33,25,25,25,25,33]);

// plotar coleção 5
Map.addLayer(colecao5, vis, 'Coleção 5 '+ano, false);

// calcular área para as classes
  var area03 = pixelArea.mask(colecao5.eq(3));
  var area04 = pixelArea.mask(colecao5.eq(4));
  var area12 = pixelArea.mask(colecao5.eq(12));
  var area15 = pixelArea.mask(colecao5.eq(15));
  var area19 = pixelArea.mask(colecao5.eq(19));
  var area25 = pixelArea.mask(colecao5.eq(25));
  var area33 = pixelArea.mask(colecao5.eq(33));

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
Export.table.toAsset(regiao2, 'Cerrado_regions_col5_area' + ano + version, dirout + '/Cerrado_regions_col5_area'+ano +version);

// adicionar no mapa
var blank = ee.Image(0).mask(0);
var outline = blank.paint(regioesCollection, 'AA0000', 2); 
var visPar = {'palette':'000000','opacity': 0.6};
Map.addLayer(regioesCollection, visPar, 'Região', true);
