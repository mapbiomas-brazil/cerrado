// compute area by ecoregion to be used as reference to estimate samples distribution 
// dhemerson.costa@ipam.org.br 

// input metadata
var version = '5';

// define classes to be assessed
var classes = [3, 4, 11, 12, 15, 19, 21, 25, 33];

// output directory
var dirout = 'users/dh-conciani/collection7/sample/area';

// cerrado classification regions
var regionsCollection = ee.FeatureCollection('users/dh-conciani/collection7/classification_regions/vector');

// set option (avaliable are 'year' or 'stable')
var option = 'year' ; 

// if option equal to year
if (option == 'year') {
  // define year to be used as reference
  var year = '2000';
  // load collection 6.0 
  var mapbiomas = ee.Image('projects/mapbiomas-workspace/public/collection6/mapbiomas_collection60_integration_v1')
                    .select('classification_'+  year);
}

if (option == 'stable') {
  var mapbiomas = ee.Image('users/dh-conciani/collection7/masks/cerrado_stablePixels_1985_2020_v2');
}


// define function to compute area (skm)
var pixelArea = ee.Image.pixelArea().divide(1000000);

// reclassify following cerrado strategy 
mapbiomas = mapbiomas.remap([3, 4, 5, 11, 12, 29, 15, 19, 39, 20, 40, 41, 46, 47, 48, 21, 23, 24, 30, 25, 33, 31],
                            [3, 4, 3, 11, 12, 25, 15, 19, 19, 19, 19, 19, 19, 19, 19, 21, 25, 25, 25, 25, 33, 33]);

// mapbiomas color pallete
var palettes = require('users/mapbiomas/modules:Palettes.js');
var vis = {
    'min': 0,
    'max': 49,
    'palette': palettes.get('classification6')
};

// plot 
Map.addLayer(mapbiomas, vis, 'Mapbiomas ' + year, true);

// define function to get class area 
// for each region 
var getArea = function(feature) {
  // get classification for the region [i]
  var mapbiomas_i = mapbiomas.clip(feature);
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
                                      maxPixels: 1e13 }
                                    ).get('area')
                                  )
                              ); // end of set
                          }); // end of class_j function
  // return feature
  return feature;
}; 

var computed_obj = regionsCollection.map(getArea);
print (computed_obj);
Map.addLayer(computed_obj, {}, 'Result');

// export computation as GEE asset
Export.table.toAsset({'collection': computed_obj, 
                      'description': year + '_v' + version,
                      'assetId': dirout + '/' + year + '_v' + version});
