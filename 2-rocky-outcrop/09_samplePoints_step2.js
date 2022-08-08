// sort stratified spatialPoints by region using stable pixels
// dhemerson.costa@ipam.org.br

// reference proportion
var file_in = ee.FeatureCollection('users/dh-conciani/collection7/rocky/sample/area/stable_v2');

// area of interest for AOIS
var aoi_vec = ee.FeatureCollection('users/dh-conciani/collection7/rocky/masks/aoi_v1');

// transform into image
var aoi = ee.Image(1).clip(aoi_vec);
Map.addLayer(aoi, {palette:['red', 'blue'], min:1, max:2}, 'Sampling AOI');

// define string to use as metadata
var version = '2';  // label string

// define output
var output = 'users/dh-conciani/collection7/rocky/sample/points/';

// define classes to generate samples
var classes = [3, 4, 11, 12, 15, 19, 21, 29, 33];

// define sample size
var sampleSize = 13000;    
var nSamplesMin = 1300; 

// import rocky outcrop classification
var rocky_image = ee.Image('users/dh-conciani/collection7/c7-rocky-general-post/CERRADO_col7_rocky_gapfill_frequency_spatial_v1')
              .select(['classification_2021']);

// collection 6.0 stable pixels (generated by step 1)
var stablePixels = ee.Image('users/dh-conciani/collection7/masks/cerrado_stablePixels_1985_2020_v3')
                      .remap([3, 4, 5, 11, 12, 29, 15, 19, 39, 20, 40, 41, 46, 47, 48, 21, 23, 24, 30, 25, 33, 31],
                             [3, 4, 3, 11, 12, 25, 15, 19, 19, 19, 19, 19, 19, 19, 19, 21, 25, 25, 25, 25, 33, 33])
                      .rename('class')
                      // update for collect area
                      .updateMask(aoi)
                      // insert rocky classification
                      .blend(rocky_image.updateMask(rocky_image.eq(29)));

// Cerrado biome 
var regionsCollection =  ee.FeatureCollection('projects/mapbiomas-workspace/AUXILIAR/biomas-2019')
                              .filterMetadata('Bioma', 'equals', 'Cerrado');

// import mapbiomas module
var palettes = require('users/mapbiomas/modules:Palettes.js');
var vis = {
    'min': 0,
    'max': 49,
    'palette': palettes.get('classification6')
};

// plot stable pixels
Map.addLayer(stablePixels, vis, 'Training Mask', true);

// read the area for each class (from previous step)
var forest = ee.Number(file_in.first().get('3'));
var savanna = ee.Number(file_in.first().get('4'));
var wetland = ee.Number(file_in.first().get('11'));
var grassland = ee.Number(file_in.first().get('12'));
var pasture = ee.Number(file_in.first().get('15'));
var agriculture = ee.Number(file_in.first().get('19'));
var mosaic = ee.Number(file_in.first().get('21'));
var rocky = ee.Number(file_in.first().get('29'));
var water = ee.Number(file_in.first().get('33'));

// compute the total area 
var total = forest
          .add(savanna)
          .add(wetland)
          .add(grassland)
          .add(pasture)
          .add(agriculture)
          .add(mosaic)
          .add(rocky)
          .add(water);

// define the equation to compute the n of samples
var computeSize = function (number) {
  return number.divide(total).multiply(sampleSize).round().int16().max(nSamplesMin);
};
  
// apply the equation to compute the number of samples
var n_forest = computeSize(ee.Number(forest));
var n_savanna = computeSize(ee.Number(savanna));
var n_wetland = computeSize(ee.Number(wetland));
var n_grassland = computeSize(ee.Number(grassland));
var n_pasture = computeSize(ee.Number(pasture));
var n_agriculture = computeSize(ee.Number(agriculture));
var n_mosaic = computeSize(ee.Number(mosaic));
var n_rocky = computeSize(ee.Number(rocky));
var n_water = computeSize(ee.Number(water));

// generate the sample points
var training = stablePixels.stratifiedSample(
                              {'scale': 30,
                               'classBand': 'class', 
                               'numPoints': 0,
                               'region': file_in.geometry(),
                               'seed': 1,
                               'geometries': true,
                               'classValues': classes,
                               'classPoints': [n_forest, n_savanna, n_wetland, n_grassland, n_pasture,
                                               n_agriculture, n_mosaic, n_rocky, n_water]
                                }
                              );

// plot points
Map.addLayer(training, {}, 'samplePoints');

// print diagnosis
print('forest', training.filterMetadata('class', 'equals', 3).size());
print('savanna', training.filterMetadata('class', 'equals', 4).size());
print('wetland', training.filterMetadata('class', 'equals', 11).size());
print('grassland', training.filterMetadata('class', 'equals', 12).size());
print('agriculture', training.filterMetadata('class', 'equals', 19).size());
print('rocky', training.filterMetadata('class', 'equals', 29).size());

// export as GEE asset
Export.table.toAsset({'collection': training,
                      'description': 'samplePoints_v' + version,
                      'assetId':  output + 'samplePoints_v' + version
                      }
                    );
