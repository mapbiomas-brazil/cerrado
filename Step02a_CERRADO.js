var conta = 1
//var regioes = ['reg_10']

if (conta == 1) {
var regioes = [1, 2, 3, 4, 5, 6]
} else if (conta == 2) {
var regioes = [7, 8, 9, 10, 11, 12, 13]
} else if (conta == 3) {
var regioes = [14, 15, 16, 17, 18, 19, 21, 22]
} else if (conta == 4) {
var regioes = [23, 24, 25, 26, 27, 28, 29, 30]
} else if (conta == 5) {
var regioes = [31, 32, 33, 34, 35, 36, 37, 38]
}

var version = '_5-beta-1'
var bioma = "CERRADO"

var dirasset = 'projects/mapbiomas-workspace/MOSAICOS/workspace-c3';
var dirsamples = 'projects/mapbiomas-workspace/AMOSTRAS/col5/CERRADO/samplesv1'
var dirout = 'projects/mapbiomas-workspace/AMOSTRAS/col5/CERRADO/samplesv1'
var regioesCollection = ee.FeatureCollection('projects/mapbiomas-workspace/AMOSTRAS/col5/CERRADO/reg_b15_cerr_c5')//.filterBounds(geometry)
var palettes = require('users/mapbiomas/modules:Palettes.js');

var ano = '2000';

var palettes = require('users/mapbiomas/modules:Palettes.js');
var vis = {
    'min': 0,
    'max': 34,
    'palette': palettes.get('classification2')
};

var pixelArea = ee.Image.pixelArea().divide(1000000);

var colecao41 = ee.Image('projects/mapbiomas-workspace/public/collection4_1/mapbiomas_collection41_integration_v1').select('classification_'+ano);
colecao41 = colecao41.select('classification_'+ano).remap(
                  [3, 4, 5,  9,12,13,15,18,19,20,21,22,23,24,25,26,29,30,31,32,33],
                  [3, 4, 3, 19,12,12,15,19,19,19,19,25,25,25,25,33,25,25,25,25,33]);
                
Map.addLayer(colecao41, vis, 'colecao41 '+ano, false);


  var area03 = pixelArea.mask(colecao41.eq(3))
  var area04 = pixelArea.mask(colecao41.eq(4))
  var area12 = pixelArea.mask(colecao41.eq(12))
  var area15 = pixelArea.mask(colecao41.eq(15))
  var area19 = pixelArea.mask(colecao41.eq(19))
  var area25 = pixelArea.mask(colecao41.eq(25))
  var area33 = pixelArea.mask(colecao41.eq(33))

var processaReg = function(regiao) {
  regiao = regiao.set('floresta', ee.Number(area03.reduceRegion({reducer: ee.Reducer.sum(),geometry: regiao.geometry(), scale: 30,maxPixels: 1e13}).get('area')))
  regiao = regiao.set('savana', ee.Number(area04.reduceRegion({reducer: ee.Reducer.sum(),geometry: regiao.geometry(), scale: 30,maxPixels: 1e13}).get('area')))
  regiao = regiao.set('campo', ee.Number(area12.reduceRegion({reducer: ee.Reducer.sum(),geometry: regiao.geometry(), scale: 30,maxPixels: 1e13}).get('area')))
  regiao = regiao.set('pasto', ee.Number(area15.reduceRegion({reducer: ee.Reducer.sum(),geometry: regiao.geometry(), scale: 30,maxPixels: 1e13}).get('area')))
  regiao = regiao.set('agric', ee.Number(area19.reduceRegion({reducer: ee.Reducer.sum(),geometry: regiao.geometry(), scale: 30,maxPixels: 1e13}).get('area')))
  regiao = regiao.set('nao_veg', ee.Number(area25.reduceRegion({reducer: ee.Reducer.sum(),geometry: regiao.geometry(), scale: 30,maxPixels: 1e13}).get('area')))
  regiao = regiao.set('agua', ee.Number(area33.reduceRegion({reducer: ee.Reducer.sum(),geometry: regiao.geometry(), scale: 30,maxPixels: 1e13}).get('area')))
  return regiao
}

var regiao2 = regioesCollection.map(processaReg)
print(regiao2)

Export.table.toAsset(regiao2, 'Cerrado_regions_col5_area2000'+version, dirout + '/Cerrado_regions_col5_area2000'+version)

var blank = ee.Image(0).mask(0);
var outline = blank.paint(regioesCollection, 'AA0000', 2); 
var visPar = {'palette':'000000','opacity': 0.6};
Map.addLayer(outline, visPar, 'Regiao', true);
