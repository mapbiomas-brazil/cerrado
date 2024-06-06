// -- -- -- -- 02_computeProportion
// compute area by class to be used as reference to estimate samples of rocky outcrop
// barbara.silva@ipam.org.br

// Output version
var output_version = '3';
var input_version = '3';

// Define classes to be assessed
var classes = [1, 2, 29];

// Output directory
var dirout = 'projects/barbaracosta-ipam/assets/collection-9_rocky-outcrop/sample/area/';

// Read area of interest
var aoi_vec = ee.FeatureCollection('projects/barbaracosta-ipam/assets/collection-9_rocky-outcrop/masks/aoi_v3').geometry();
var aoi_img = ee.Image(1).clip(aoi_vec);
Map.addLayer(aoi_img, {palette:['red']}, 'Area of Interest');

// Stable pixels from collection 8
var stable = ee.Image('projects/barbaracosta-ipam/assets/collection-9_rocky-outcrop/masks/cerrado_rockyTrainingMask_1985_2022_v'+input_version);

// Random color schema  
var vis = {
    'min': 1,
    'max': 29,
    'palette': ["32a65e","FFFFB2", "ffaa5f"]
};

Map.addLayer(stable, vis, 'stable pixels');
print ('stable', stable);

// Get cerrado biome layer
var cerrado = ee.FeatureCollection('projects/mapbiomas-workspace/AUXILIAR/biomas-2019')
                .filterMetadata('Bioma', 'equals', 'Cerrado');

// Define function to compute area (skm)
var pixelArea = ee.Image.pixelArea().divide(1000000); //km²

// Define function to get class area 
// For each region 
var getArea = function(feature) {

  // Get classification for the region [i]
  var mapbiomas_i = stable.clip(feature);
  
  // For each class [j]
  classes.forEach(function(class_j) {

    // Create the reference area
    var reference_ij = pixelArea.mask(mapbiomas_i.eq(class_j));

    // Compute area and insert as metadata into the feature 
    feature = feature.set(String(class_j),
                         ee.Number(reference_ij.reduceRegion({
                                      reducer: ee.Reducer.sum(),
                                      geometry: feature.geometry(),
                                      scale: 30,
                                      maxPixels: 1e13,
                                      tileScale: 4}
                                    ).get('area')
                                  )
                              ); // End of set
                          }); // End of class_j function
  // Return feature
  return feature;
}; 

var computed_obj = cerrado.map(getArea);
print ('Result: ', computed_obj);

// Export computation as GEE asset
Export.table.toAsset({'collection': computed_obj, 
                      'description': 'stable_v' + output_version,
                      'assetId': dirout + 'stable_v' + output_version});
