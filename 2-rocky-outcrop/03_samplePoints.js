// -- -- -- -- 03_samplePoints
// sort stratified spatialPoints by region using stable pixels
// barbara.silva@ipam.org.br

// Define string to use as metadata
var version = '3';  // label string

// Reference proportion
var file_in = ee.FeatureCollection('projects/barbaracosta-ipam/assets/collection-9_rocky-outcrop/sample/area/stable_v3');

// Read area of interest
var aoi_vec = ee.FeatureCollection('projects/barbaracosta-ipam/assets/collection-9_rocky-outcrop/masks/aoi_v3').geometry();
var aoi_img = ee.Image(1).clip(aoi_vec);
Map.addLayer(aoi_img, {palette:['red']}, 'Area of Interest');

// Define output
var output = 'projects/barbaracosta-ipam/assets/collection-9_rocky-outcrop/sample/points/';

// Define classes to generate samples
var classes = [1, 2, 29];

// Rocky outcrop samples
var rocky_samples = ee.FeatureCollection('projects/barbaracosta-ipam/assets/collection-9_rocky-outcrop/sample/rocky-outcrop-collected_v2')
        // Insert reference class [29] following the mapbiomas schema
        .map(function(feature) {
          return feature.set({'class': '29'}).select(['class']);
        });
        
// Define sample size
var sampleSize = 13000;    
var nSamplesMin = rocky_samples.size().round(); 

// Stable pixels from collection 8
var stablePixels = ee.Image('projects/barbaracosta-ipam/assets/collection-9_rocky-outcrop/masks/cerrado_rockyTrainingMask_1985_2022_v3')
                  .rename('class');
     
// Cerrado biome 
var regionsCollection =  ee.FeatureCollection('projects/mapbiomas-workspace/AUXILIAR/biomas-2019')
                              .filterMetadata('Bioma', 'equals', 'Cerrado');

// Random color schema  
var vis = {
    'min': 1,
    'max': 29,
    'palette': ["32a65e","FFFFB2", "ffaa5f"]
};

Map.addLayer(stablePixels, vis, 'stable pixels');

// Read the area for each class (from previous step)
var vegetation = ee.Number(file_in.first().get('1'));
var nonvegetation = ee.Number(file_in.first().get('2'));
var rocky = ee.Number(file_in.first().get('29'));

// Compute the total area 
var total = vegetation
          .add(nonvegetation)
          .add(rocky);

// Define the equation to compute the n of samples
var computeSize = function (number) {
  return number.divide(total).multiply(sampleSize).round().int16().max(nSamplesMin);
};
  
// Apply the equation to compute the number of samples
var n_vegetation = computeSize(ee.Number(vegetation));
var n_nonvegetation = computeSize(ee.Number(nonvegetation));
var n_rocky = computeSize(ee.Number(rocky));

// Generate the sample points
var training = stablePixels.stratifiedSample(
                              {'scale': 30,
                               'classBand': 'class', 
                               'numPoints': 0,
                               'region': aoi_img.geometry(),
                               'seed': 1,
                               'geometries': true,
                               'classValues': classes,
                               'classPoints': [n_vegetation, n_nonvegetation, n_rocky]
                                }
                              );

// Plot points
Map.addLayer(training, {}, 'samplePoints');

// Print diagnosis for each class
print('vegetation', training.filterMetadata('class', 'equals', 1).size());
print('nonvegetation', training.filterMetadata('class', 'equals', 2).size());
print('rocky', training.filterMetadata('class', 'equals', 29).size());

// Merge with rocky samples
training = ee.FeatureCollection(training).merge(rocky_samples);
print ("training samples", training.first());

// Convert the 'class' column to integers
var trainingSamplesFixed = training.map(function(feature) {
  var classValue = ee.Number.parse(feature.get('class'));
  return feature.set('class', classValue);
});

// Check if the conversion was done correctly
print("trainingSamplesFixed", trainingSamplesFixed.first());

// Export as GEE asset
Export.table.toAsset({'collection': trainingSamplesFixed,
                      'description': 'samplePoints_v' + version,
                      'assetId':  output + 'samplePoints_v' + version
                      }
                    );
