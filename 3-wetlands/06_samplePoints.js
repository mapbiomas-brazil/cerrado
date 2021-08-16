// sortear pontos de amostragem (areas umidas vs. não umidas)

// definir parametros
var sampleSize = 5000;    // number of samples by year regions (all classes, except wetlands)
var nSamplesMin = 500;    // numero minimo de amostras 10%
var ratioWetland = 10;    // percentage of wetland samples 
var ratioConfusion = 10;  // percentage of samples for the "confusion class"

// number of wetland points by region/year

var sampleWetSize = (sampleSize + (sampleSize / 100 * ratioWetland)) / 100 * 10; 
var sampleConfusionSize = (sampleSize + sampleWetSize + (((sampleSize + sampleWetSize) / 100) * ratioConfusion)) / 100 * 10;

// output directory
var dirout = 'projects/mapbiomas-workspace/AMOSTRAS/Cerrado/col6/wetlands/samples_v1/';    // exportation asset

// definir palheta
var palettes = require('users/mapbiomas/modules:Palettes.js');
var vis = {
    'min': 0,
    'max': 34,
    'palette': palettes.get('classification2')
};

// Cassia's vereda reference points
var ref_veredas = ee.FeatureCollection('users/dhconciani/base/veredas_cassia_pontos');

// training mask asset 
var training_mask = ee.Image('projects/mapbiomas-workspace/AUXILIAR/CERRADO/c6-wetlands/input_masks/trainingMask_wetlands_c6');

// AOI mask
var aoi = ee.Image('projects/mapbiomas-workspace/AUXILIAR/CERRADO/c6-wetlands/input_masks/aoi_wetlands_c6');

/// Feature de área da AOI por região
var regioes = ee.FeatureCollection('projects/mapbiomas-workspace/AMOSTRAS/Cerrado/col6/samples/Cerrado_regions_col5_area2000');

// criar mascara de sorteio
// base = 50[AOI], 21 [NAOI]
// training = 11 [wetland] + other classes mapbiomas cerrado
var sampleMask = aoi.remap([0,  1, 2],
                           [21, 50, 50]).blend(training_mask);

// plot sampleMask
Map.addLayer(sampleMask, vis, "sampleMask");


// generate training points based on area distribution 
////////////////////////////////////////////////////////
var getTrainingSamples = function (feature) {
  var regiao = feature.get('mapb');
  // read stableArea of each class
  var floresta = ee.Number(feature.get('floresta'));
  var savana = ee.Number(feature.get('savana'));
  var campo = ee.Number(feature.get('campo'));
  var pasto = ee.Number(feature.get('pasto'));
  var agro = ee.Number(feature.get('agric'));
  var nao_veg = ee.Number(feature.get('nao_veg'));
  var agua = ee.Number(feature.get('agua'));
  
  // compute total sum of areas
  var total = floresta.add(savana).add(campo).add(pasto).add(agro).add(nao_veg).add(agua);  
  
  // compute number of points for each class
  var sampleFloSize = ee.Number(floresta).divide(total).multiply(sampleSize).round().int16().max(nSamplesMin);
  var sampleSavSize = ee.Number(savana).divide(total).multiply(sampleSize).round().int16().max(nSamplesMin);
  var sampleCamSize = ee.Number(campo).divide(total).multiply(sampleSize).round().int16().max(nSamplesMin);
  var samplePasSize = ee.Number(pasto).divide(total).multiply(sampleSize).round().int16().max(nSamplesMin);
  var sampleAgrSize = ee.Number(agro).divide(total).multiply(sampleSize).round().int16().max(nSamplesMin);
  var sampleNVeSize = ee.Number(nao_veg).divide(total).multiply(sampleSize).round().int16().max(nSamplesMin);
  var sampleAguSize = ee.Number(agua).divide(total).multiply(sampleSize).round().int16().max(nSamplesMin);
  
 
  var clippedGrid = ee.Feature(feature).geometry();

  var referenceMap =  sampleMask.clip(clippedGrid);
                      
  var training = referenceMap.stratifiedSample({scale:30, 
                              classBand: 'remapped', 
                              numPoints: 0, 
                              region: feature.geometry(), 
                              seed: 1, 
                              geometries: true,
                              classValues: [3, 4, 11, 12, 15, 19, 21, 25, 33], 
                              classPoints: [sampleFloSize, sampleSavSize, ee.Number(sampleWetSize).round(),
                                            sampleCamSize, samplePasSize, sampleAgrSize,
                                            ee.Number(sampleConfusionSize).round(), sampleNVeSize, sampleAguSize]
  });

  training = training.map(function(feat) {return feat.set({'region': regiao})});
    
  return training;
 };

var mySamples = regioes.map(getTrainingSamples).flatten(); 

Map.addLayer(ref_veredas,  {}, 'Pontos Cassia', false);
// plotar pontos de treinamento
Map.addLayer(mySamples, {color:'blue'},   'Pontos de treinamento');

// Export
Export.table.toAsset(mySamples,
  'samples_wetland_col6_v1',
  dirout + 'samples_wetland_col6_v1');
