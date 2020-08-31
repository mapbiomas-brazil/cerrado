////////////////////////////////////////////////////////
//////////////User parameters//////////////////////////


var bioma = "CERRADO";
var versao = '_5-beta-1'
var sampleSize = 7000;
var nSamplesMin = 700

var dirsamples = ee.Image('projects/mapbiomas-workspace/AMOSTRAS/col5/CERRADO/CE_amostras_estaveis85a18_col41_v1');
var dirout = 'projects/mapbiomas-workspace/AMOSTRAS/col5/CERRADO/samplesv1';
var regioesCollection = ee.FeatureCollection('projects/mapbiomas-workspace/AMOSTRAS/col5/CERRADO/samplesv1/Cerrado_regions_col5_area2000')


var palettes = require('users/mapbiomas/modules:Palettes.js');

var vis = {
    'bands': ['reference'],
    'min': 0,
    'max': 34,
    'palette': palettes.get('classification2')
};
Map.addLayer(dirsamples, vis, 'Classes persistentes 85 a 17', true);

print(regioesCollection.size())

////////////////////////////////////////////////////////
var getTrainingSamples = function (feature) {
  var regiao = feature.get('mapb');
  var floresta = ee.Number(feature.get('floresta'));
  var savana = ee.Number(feature.get('savana'));
  var campo = ee.Number(feature.get('campo'));
  var pasto = ee.Number(feature.get('pasto'));
  var agro = ee.Number(feature.get('agric'));
  var nao_veg = ee.Number(feature.get('nao_veg'));
  var agua = ee.Number(feature.get('agua'));
  
  var total = floresta.add(savana).add(campo).add(pasto).add(agro).add(nao_veg).add(agua)

  var sampleFloSize = ee.Number(floresta).divide(total).multiply(sampleSize).round().int16().max(nSamplesMin)
  var sampleSavSize = ee.Number(savana).divide(total).multiply(sampleSize).round().int16().max(nSamplesMin)
  var sampleCamSize = ee.Number(campo).divide(total).multiply(sampleSize).round().int16().max(nSamplesMin)
  var samplePasSize = ee.Number(pasto).divide(total).multiply(sampleSize).round().int16().max(nSamplesMin)
  var sampleAgrSize = ee.Number(agro).divide(total).multiply(sampleSize).round().int16().max(nSamplesMin)
  var sampleNVeSize = ee.Number(nao_veg).divide(total).multiply(sampleSize).round().int16().max(nSamplesMin)
  var sampleAguSize = ee.Number(agua).divide(total).multiply(sampleSize).round().int16().max(nSamplesMin)

  var clippedGrid = ee.Feature(feature).geometry()

  var referenceMap =  dirsamples.clip(clippedGrid);
                      

  var training = referenceMap.stratifiedSample({scale:30, classBand: 'reference', numPoints: 0, region: feature.geometry(), seed: 1, geometries: true,
           classValues: [3,4,12,15,19,25,33], 
           classPoints: [sampleFloSize,sampleSavSize,sampleCamSize,samplePasSize,sampleAgrSize,sampleNVeSize,sampleAguSize]
  });

  training = training.map(function(feat) {return feat.set({'mapb': regiao})});
    
  return training;
 };

var mySamples = regioesCollection.map(getTrainingSamples).flatten();

Map.addLayer(mySamples)

print(mySamples.size())
print(mySamples.limit(1))


Export.table.toAsset(mySamples,
  'samples_col5_'+bioma+'_v'+versao,
  dirout+'/samples_col5_'+bioma+'_v'+versao)
  
