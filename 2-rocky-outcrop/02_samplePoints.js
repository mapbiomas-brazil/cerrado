// -- -- -- -- 02_samplePoints
// sort stratified spatialPoints by region using stable pixels
// barbara.silva@ipam.org.br

// reference proportion
var file_in = ee.FeatureCollection('projects/barbaracosta-ipam/assets/collection-9_rocky-outcrop/sample/area/stable_v0');

// rocky outcrop samples
var rocky_samples = ee.FeatureCollection('users/barbarasilvaIPAM/rocky_outcrop/collection8/sample/afloramento_collect_v5')
        // insert reference class [29] following the mapbiomas schema
        .map(function(feature) {
          return feature.set({'class': '29'}).select(['class']);
        });

print('rocky outcrop samples', rocky_samples.first());

// area of interest for AOIS
var aoi_vec = ee.FeatureCollection('projects/ee-barbarasilvaipam/assets/collection8-rocky/masks/aoi_v5');

// transform into image
var aoi = ee.Image(1).clip(aoi_vec);
Map.addLayer(aoi, {palette:['red']}, 'Area of Interest');

// create a buffer around AOI
var collect_area = ee.Image(1).clip(ee.FeatureCollection(aoi_vec).map(
                    function (feature) {
                      return (feature.buffer(80000));
                      }
                    )
                  ).updateMask(aoi.unmask(0).neq(1));

Map.addLayer(collect_area, {palette:['blue']}, 'Area to collect samples of non-rocky');

// define string to use as metadata
var version = '0';  // label string

// define output
var output = 'projects/barbaracosta-ipam/assets/collection-9_rocky-outcrop/sample/points/';

// define classes to generate samples
var classes = [3, 4, 11, 12, 15, 19, 21, 33];

// define sample size
var sampleSize = 15000;    
var nSamplesMin = rocky_samples.size().round();     // minimum sample size by class

// stable pixels from collection 8 
var stablePixels = ee.Image('users/dh-conciani/collection9/masks/cerrado_trainingMask_1985_2022_v0')
                      .remap([3, 4, 5, 11, 12, 29, 15, 19, 39, 20, 40, 41, 46, 47, 48, 21, 23, 24, 30, 25, 33, 31],
                             [3, 4, 3, 11, 12, 25, 15, 19, 19, 19, 19, 19, 19, 19, 19, 21, 25, 25, 25, 25, 33, 33])
                      .rename('class')
                      // update for collect area
                      .updateMask(collect_area);
                      
// import the color ramp module from mapbiomas 
var palettes = require('users/mapbiomas/modules:Palettes.js');
var vis = {
    'min': 0,
    'max': 62,
    'palette': palettes.get('classification8')
};

Map.addLayer(stablePixels, vis, 'stable pixels - around AOI');

// Cerrado biome 
var regionsCollection =  ee.FeatureCollection('projects/mapbiomas-workspace/AUXILIAR/biomas-2019')
                              .filterMetadata('Bioma', 'equals', 'Cerrado');

// read the area for each class (from previous step)
var forest = ee.Number(file_in.first().get('3'));
var savanna = ee.Number(file_in.first().get('4'));
var wetland = ee.Number(file_in.first().get('11'));
var grassland = ee.Number(file_in.first().get('12'));
var pasture = ee.Number(file_in.first().get('15'));
var agriculture = ee.Number(file_in.first().get('19'));
var mosaic = ee.Number(file_in.first().get('21'));
var water = ee.Number(file_in.first().get('33'));

// compute the total area 
var total = forest
          .add(savanna)
          .add(wetland)
          .add(grassland)
          .add(pasture)
          .add(agriculture)
          .add(mosaic)
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
                                               n_agriculture, n_mosaic, n_water]
                                }
                              );

// plot points
Map.addLayer(training, {}, 'samplePoints');

// print diagnosis
print('forest', training.filterMetadata('class', 'equals', 3).first());
print('savanna', training.filterMetadata('class', 'equals', 4).first());
print('wetland', training.filterMetadata('class', 'equals', 11).first());
print('grassland', training.filterMetadata('class', 'equals', 12).first());
print('agriculture', training.filterMetadata('class', 'equals', 19).first());

// merge with rocky samples
training = ee.FeatureCollection(training).merge(rocky_samples);
print ("training samples", training.first());

// convert the 'class' column into integers
var trainingSamplesFixed = training.map(function(feature) {
  var classValue = ee.Number.parse(feature.get('class'));
  return feature.set('class', classValue);
});

print(trainingSamplesFixed.first());

// export as GEE asset
Export.table.toAsset({'collection': trainingSamplesFixed,
                      'description': 'samplePoints_v' + version,
                      'assetId':  output + 'samplePoints_v' + version
                      }
                    );
