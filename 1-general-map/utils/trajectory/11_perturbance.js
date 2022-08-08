// stabilize temporal patches of native vegetation 
// dhemerson.costa@ipam.org.br

// set root directory 
var root = 'users/dh-conciani/collection7/c7-general-post/';

// set file to be processed
var file_in = 'CERRADO_col7_gapfill_incidence_temporal_frequency_spatial_v5';

// set metadata to export 
var version_out = '5';

// import mapbiomas color ramp
var vis = {
    'min': 0,
    'max': 49,
    'palette': require('users/mapbiomas/modules:Palettes.js').get('classification6')
};

// import classification 
var inputClassification = ee.Image(root + file_in);

Map.addLayer(inputClassification.select(['classification_2021']), vis, 'data 2021');

// create recipe 
var binary = ee.Image([]);
// binarize native vegetation
ee.List.sequence({'start': 1985, 'end': 2021}).getInfo()
  .forEach(function(year_i) {
    var image_i = inputClassification.select(['classification_' + year_i])
                                 .remap([3, 4, 11, 12, 21, 25, 33],
                                        [1, 1,  1,  1,  0,  0,  0])
                                        .rename('binary_' + year_i);
    // bind
    binary = binary.addBands(image_i.updateMask(image_i.eq(1)));
  });

// plot
Map.addLayer(binary, {}, 'binary', false);
Map.addLayer(inputClassification, {}, 'input', false);
//Map.addLayer(inputClassification.reduce(ee.Reducer.countDistinctNonNull()).randomVisualizer());

// update collection only with native vegetation temporal patches
var patches = ee.Image([]);
ee.List.sequence({'start': 1985, 'end': 2021}).getInfo()
  .forEach(function(year_i) {
    // get classification
    var image_i = inputClassification.select(['classification_' + year_i])
      // select only native vegetation pixels
      .updateMask(binary.select(['binary_' + year_i]).eq(1))
        // rename
        .rename('native_' + year_i);
    // bind
    patches = patches.addBands(image_i);
  });
  
// get the mode for the native vegetation temporal patches
var native_mode = patches.reduce(ee.Reducer.mode());
Map.addLayer(native_mode, vis, 'native mode', false);

// create filtered recipe
var filtered = ee.Image([]);

// apply mode for the temporal patches of native vegetation
ee.List.sequence({'start': 1985, 'end': 2021}).getInfo()
  .forEach(function(year_i) {
    var image_i = inputClassification.select(['classification_' + year_i])
                    .where(binary.select(['binary_' + year_i]).eq(1), native_mode);
  // bind
  filtered = filtered.addBands(image_i);
  });
  
// plot filtered
Map.addLayer(filtered.select(['classification_2021']), vis, 'filtered 2021');
Map.addLayer(filtered, {}, 'all', false);

// export as GEE asset
Export.image.toAsset({
    'image': filtered,
    'description': 'CERRADO_col7_gapfill_incidence_temporal_frequency_spatial_perturbance_v' + version_out,
    'assetId': root + 'CERRADO_col7_gapfill_incidence_temporal_frequency_spatial_perturbance_v' + version_out,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': inputClassification.geometry(),
    'scale': 30,
    'maxPixels': 1e13
});
