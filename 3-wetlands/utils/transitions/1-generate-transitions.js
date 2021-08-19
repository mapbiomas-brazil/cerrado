// transition analisys
// dhemerson.costa@ipam.org.br

// import datasets 
var collection = ee.Image('projects/mapbiomas-workspace/COLECAO6/classificacao-test/CERRADO_col6_wetlandsv2_generalv5_pseudointegration');
var regions = ee.FeatureCollection ('users/dhconciani/base/ECORREGIOES_CERRADO_V7');

//  reclassiy agricultures into a single class

// define start and end years
var yyyy_start = '1985';
var yyyy_mid = '2000';
var yyyy_end = '2019';

// import start classification
var class_start = collection.select(['classification_' + yyyy_start]);

// select only wetlands
    class_start = class_start.updateMask(class_start.eq(11));

// load mid year, clipping only to original wetlands
var class_mid_target = collection.select(['classification_' + yyyy_mid]).updateMask(class_start);
// remmap mid classification - dissolve agricultural classes
    class_mid_target = class_mid_target.remap([3, 4, 9, 11, 12, 15, 19, 20, 24, 25, 30, 33, 36, 39, 41], 
                                              [3, 4, 9, 11, 12, 15, 41, 20, 24, 25, 30, 33, 41, 39, 41]);
                                              
// compute source mid - only wetlands present in mid year
var class_mid_source = class_mid_target.updateMask(class_mid_target.eq(11));

var class_end = collection.select(['classification_' + yyyy_end]).updateMask(class_mid_source);
    // remmap mid classification - dissolve agricultural classes
    class_end= class_end.remap([3, 4, 9, 11, 12, 15, 19, 20, 24, 25, 30, 33, 36, 39, 41], 
                               [3, 4, 9, 11, 12, 15, 41, 20, 24, 25, 30, 33, 41, 39, 41]);


// define functions to process transitions between start and mid
var start_to_mid = function(region_i) {
    // compute frequency by region
    var count_mid_target = class_mid_target.reduceRegion({
                        reducer  : ee.Reducer.frequencyHistogram(),
                        geometry : region_i.geometry(),
                        scale:30,
                        maxPixels: 1e13});
                        
    // store frequency into a dictionary
    var value_mid = ee.Dictionary(ee.Number(count_mid_target.get('remapped')));

  // return computation
  return region_i.set(value_mid);
};

// define functions to process transitions between mid and end
var mid_to_end = function(region_i) {
    // compute frequency by region
    var count_end_target = class_end.reduceRegion({
                        reducer  : ee.Reducer.frequencyHistogram(),
                        geometry : region_i.geometry(),
                        scale:30,
                        maxPixels: 1e13});
                        
    // store frequency into a dictionary
    var value_end = ee.Dictionary(ee.Number(count_end_target.get('remapped')));

  // return computation
  return region_i.set(value_end);
};

// perform start to mid function
var start_to_mid_values = regions.map(start_to_mid);
print('start to mid', start_to_mid_values.first());
// print('start to mid', start_to_mid_values,start_to_mid_values.size());

// perform mid to end function 
var mid_to_end_values = regions.map(mid_to_end);
print('mid to end', mid_to_end_values.first());

// import mapbiomas palette
var palettes = require('users/mapbiomas/modules:Palettes.js');
var vis = {
    'min': 0,
    'max': 45,
    'palette': palettes.get('classification5')
};

// plot data
Map.addLayer(class_start, vis, yyyy_start);
Map.addLayer(class_mid_target, vis, yyyy_mid);
Map.addLayer(class_end, vis, yyyy_end);

// export start to mid to gdrive
Export.table.toDrive({
  collection: start_to_mid_values,
  description: 'start_to_mid',
  folder: 'transitions',
  fileFormat: 'CSV'
});

// export mid to end to gdrive
Export.table.toDrive({
  collection: mid_to_end_values,
  description: 'mid_to_end',
  folder: 'transitions',
  fileFormat: 'CSV'
});
