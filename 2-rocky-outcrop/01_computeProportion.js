// -- -- -- -- 01_computeProportion
// compute area by class to be used as reference to estimate samples of rocky outcrop
// barbara.silva@ipam.org.br

// input metadata
var version = '0';

// define classes to be assessed
var classes = [3, 4, 11, 12, 15, 19, 21, 33];

// output directory
var dirout = 'projects/barbaracosta-ipam/assets/collection-9_rocky-outcrop/sample/area/';

// area of interest for rocky outcrop
var aoi = ee.Image(1).clip(ee.FeatureCollection('projects/ee-barbarasilvaipam/assets/collection8-rocky/masks/aoi_v5'));
Map.addLayer (aoi, {palette: ['red']}, "Area of Interest");

// stable pixels from collection 8
var stable = ee.Image('users/dh-conciani/collection9/masks/cerrado_trainingMask_1985_2022_v0')
                .updateMask(aoi.eq(1));

// import the color ramp module from mapbiomas 
var palettes = require('users/mapbiomas/modules:Palettes.js');
var vis = {
    'min': 0,
    'max': 62,
    'palette': palettes.get('classification8')
};

Map.addLayer(stable, vis, 'stable');

// get cerrado biome layer
var cerrado = ee.FeatureCollection('projects/mapbiomas-workspace/AUXILIAR/biomas-2019')
                .filterMetadata('Bioma', 'equals', 'Cerrado');

// define function to compute area (skm)
var pixelArea = ee.Image.pixelArea().divide(1000000);

// define function to get class area 
// for each region 
var getArea = function(feature) {
  // get classification for the region [i]
  var mapbiomas_i = stable.clip(feature);
  // for each class [j]
  classes.forEach(function(class_j) {
    // create the reference area
    var reference_ij = pixelArea.mask(mapbiomas_i.eq(class_j));
    // compute area and insert as metadata into the feature 
    feature = feature.set(String(class_j),
                         ee.Number(reference_ij.reduceRegion({
                                      reducer: ee.Reducer.sum(),
                                      geometry: feature.geometry(),
                                      scale: 30,
                                      maxPixels: 1e13}
                                    ).get('area')
                                  )
                              ); // end of set
                          }); // end of class_j function
  // return feature
  return feature;
}; 

var computed_obj = cerrado.map(getArea);
print (computed_obj);

// export computation as GEE asset
Export.table.toAsset({'collection': computed_obj, 
                      'description': 'stable_v' + version,
                      'assetId': dirout + 'stable_v' + version});
