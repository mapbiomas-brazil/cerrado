// Sort stratified spatialPoints by region using stable pixels
// For clarification, write to <dhemerson.costa@ipam.org.br> and <felipe.lenti@ipam.org.br>

// define sample size
var sampleSize = 5000;    // number of samples by region per year 
var nSamplesMin = 500;    // minimum sample size by class
var ratioWetland = 10;    // percentage of wetland samples 
var ratioConfusion = 10;  // percentage of samples for the "confusion/unstable class"

// compute the number of wetland points by region/year
var sampleWetSize = (sampleSize + (sampleSize / 100 * ratioWetland)) / 100 * 10; 
var sampleConfusionSize = (sampleSize + sampleWetSize + (((sampleSize + sampleWetSize) / 100) * ratioConfusion)) / 100 * 10;

// output path
var dirout = 'projects/mapbiomas-workspace/AMOSTRAS/Cerrado/col6/wetlands/samples_v1/';    // exportation asset

// import mapbiomas module
var palettes = require('users/mapbiomas/modules:Palettes.js');
var vis = {
    'bands': ['reference'],
    'min': 0,
    'max': 49,
    'palette': palettes.get('classification6')
};

// Cassia's vereda reference points
var ref_veredas = ee.FeatureCollection('users/dhconciani/base/veredas_cassia_pontos');

// training mask 
var training_mask = ee.Image('projects/mapbiomas-workspace/AUXILIAR/CERRADO/c6-wetlands/input_masks/trainingMask_wetlands_c6');

// AOI mask
var aoi = ee.Image('projects/mapbiomas-workspace/AUXILIAR/CERRADO/c6-wetlands/input_masks/aoi_wetlands_c6');

/// area by region (vector)
var regioes = ee.FeatureCollection('projects/mapbiomas-workspace/AMOSTRAS/Cerrado/col6/samples/Cerrado_regions_col5_area2000');

// generate sampling mask (value 50 equals to AOI, value 21 equals to out of AOI)
var sampleMask = aoi.remap([0,  1, 2],
                           [21, 50, 50]).blend(training_mask);

// plot sampleMask
Map.addLayer(sampleMask, vis, "sampleMask");

// generate training points based on area distribution 
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
  
  // clip stable pixels only to feature  
  var clippedGrid = ee.Feature(feature).geometry();
  var referenceMap =  sampleMask.clip(clippedGrid);
  
  // generate points
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

// plot reference points
Map.addLayer(ref_veredas,  {}, 'Pontos Cassia', false);

// plot points
Map.addLayer(mySamples, {color:'blue'},   'Pontos de treinamento');

// export as GEE asset
Export.table.toAsset(mySamples,
  'samples_wetland_col6_v1',
  dirout + 'samples_wetland_col6_v1');
