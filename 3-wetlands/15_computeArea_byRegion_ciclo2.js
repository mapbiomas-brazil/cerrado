// Compute area by ecoregion
// For clarification, write to <dhemerson.costa@ipam.org.br> and <felipe.lenti@ipam.org.br>

// mapbiomas color pallete
var palettes = require('users/mapbiomas/modules:Palettes.js');
var vis = {
    'min': 0,
    'max': 49,
    'palette': palettes.get('classification6')
};

// output directory
var dirout = 'projects/mapbiomas-workspace/AUXILIAR/CERRADO/c6-wetlands/input_tables/';

// cerrado classification regions
var regioesCollection = ee.FeatureCollection('projects/mapbiomas-workspace/AUXILIAR/CERRADO/cerrado_regioes_c6');

// define function to compute area in squared kilometers
var pixelArea = ee.Image.pixelArea().divide(1000000);

// training mask
var stable = ee.Image('projects/mapbiomas-workspace/AUXILIAR/CERRADO/c6-wetlands/input_masks/trainingMask_wetlands_c6_ciclo2_v53');

// generate a image by each one of the classes
  var area03 = pixelArea.mask(stable.eq(3));  // forest
  var area04 = pixelArea.mask(stable.eq(4));  // savanna
  var area11 = pixelArea.mask(stable.eq(11)); // wetland
  var area12 = pixelArea.mask(stable.eq(12)); // grassland
  var area15 = pixelArea.mask(stable.eq(15)); // pasture
  var area19 = pixelArea.mask(stable.eq(19)); // agriculture
  var area25 = pixelArea.mask(stable.eq(25)); // other non-vegetated areas
  var area33 = pixelArea.mask(stable.eq(33)); // water

// plot stable pixels
Map.addLayer(stable, vis, 'stableSamples');

// define .map function to apply area computation over each classification region
var processaReg = function(regiao) {
  regiao = regiao.set('floresta', ee.Number(area03.reduceRegion({reducer: ee.Reducer.sum(),geometry: regiao.geometry(), scale: 30,maxPixels: 1e13}).get('area')));
  regiao = regiao.set('savana', ee.Number(area04.reduceRegion({reducer: ee.Reducer.sum(),geometry: regiao.geometry(), scale: 30,maxPixels: 1e13}).get('area')));
  regiao = regiao.set('wetland', ee.Number(area11.reduceRegion({reducer: ee.Reducer.sum(),geometry: regiao.geometry(), scale: 30,maxPixels: 1e13}).get('area')));
  regiao = regiao.set('campo', ee.Number(area12.reduceRegion({reducer: ee.Reducer.sum(),geometry: regiao.geometry(), scale: 30,maxPixels: 1e13}).get('area')));
  regiao = regiao.set('pasto', ee.Number(area15.reduceRegion({reducer: ee.Reducer.sum(),geometry: regiao.geometry(), scale: 30,maxPixels: 1e13}).get('area')));
  regiao = regiao.set('agric', ee.Number(area19.reduceRegion({reducer: ee.Reducer.sum(),geometry: regiao.geometry(), scale: 30,maxPixels: 1e13}).get('area')));
  regiao = regiao.set('nao_veg', ee.Number(area25.reduceRegion({reducer: ee.Reducer.sum(),geometry: regiao.geometry(), scale: 30,maxPixels: 1e13}).get('area')));
  regiao = regiao.set('agua', ee.Number(area33.reduceRegion({reducer: ee.Reducer.sum(),geometry: regiao.geometry(), scale: 30,maxPixels: 1e13}).get('area')));
  return regiao;
};

// apply function 
var regiao2 = regioesCollection.map(processaReg);
print(regiao2);

// export computation as GEE asset
Export.table.toAsset(regiao2, 'areabyRegion_ciclo2_v53', 
                     dirout + 'areabyRegion_ciclo2_v53');

// plot 
var blank = ee.Image(0).mask(0);
var outline = blank.paint(regioesCollection, 'AA0000', 2); 
var visPar = {'palette':'000000','opacity': 0.6};
Map.addLayer(regioesCollection, visPar, 'Região', true);
