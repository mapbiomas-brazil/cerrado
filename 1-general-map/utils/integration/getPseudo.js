// simulate integration
// dhemerson.costa@ipam.org.br

// set root
var root = 'users/dh-conciani/collection7/c7-general-post/';

// file to simulate integration
var file_in = ee.Image(root + 'CERRADO_col7_gapfill_incidence_temporal_frequency_spatial_v5');

// set output version
var version_out = '5';

// previous mapbiomas collection
var mapbiomas = ee.Image('projects/mapbiomas-workspace/public/collection6/mapbiomas_collection60_integration_v1');

// create empty recipe
var recipe = ee.Image([]);

// for each year
ee.List.sequence({'start': 1985, 'end': 2020}).getInfo()
    .forEach(function(year_i) {
      // get year_i files
      var file_in_i = file_in.select(['classification_' + year_i]);
      // get mapbiomas 
      var mapbiomas_i = mapbiomas.select(['classification_' + year_i])
        // remap 
        .remap([3, 4, 5, 9,  11, 12, 29, 15, 19, 39, 20, 40, 41, 46, 47, 48, 21, 23, 24, 30, 25, 33, 31],
               [3, 4, 3, 21, 11, 12, 25, 21, 21, 21, 21, 21, 21, 21, 21, 21, 15, 25, 25, 25, 15, 33, 33])
               .rename('classification_' + year_i)
               .updateMask(file_in_i);
      // insert anthropogenic from mapbiomas over file_i
      file_in_i = file_in_i.blend(mapbiomas_i.updateMask(mapbiomas_i.eq(21)))
                            .blend(mapbiomas_i.updateMask(mapbiomas_i.eq(25)));
      // store into recipe
      recipe = recipe.addBands(file_in_i);
    });

// import the color ramp module from mapbiomas 
var palettes = require('users/mapbiomas/modules:Palettes.js');
var vis = {
    'min': 0,
    'max': 49,
    'palette': palettes.get('classification6')
};

Map.addLayer(file_in.select(['classification_2020']), vis, 'input');
Map.addLayer(recipe.select(['classification_2020']), vis, 'filtered raw');

// apply spatial filter
// create an empty recipe
var filtered = ee.Image([]);

// apply filter
ee.List.sequence({'start': 1985, 'end': 2020}).getInfo()
      .forEach(function(year_i) {
        // compute the focal model
        var focal_mode = recipe.select(['classification_' + year_i])
                .unmask(0)
                .focal_mode({'radius': 1, 'kernelType': 'square', 'units': 'pixels'});
 
        // compute te number of connections
        var connections = recipe.select(['classification_' + year_i])
                .unmask(0)
                .connectedPixelCount({'maxSize': 100, 'eightConnected': false});
        
        // get the focal model when the number of connections of same class is lower than parameter
        var to_mask = focal_mode.updateMask(connections.lte(6));

        // apply filter
        var classification_i = recipe.select(['classification_' + year_i])
                .blend(to_mask)
                .reproject('EPSG:4326', null, 30);

        // stack into recipe
        filtered = filtered.addBands(classification_i.updateMask(classification_i.neq(0)));
        }
      );

// print filtered
Map.addLayer(filtered.select(['classification_2020']), vis, 'filtered 2020');

// export as GEE asset
Export.image.toAsset({
    'image': filtered,
    'description': 'CERRADO_col7_gapfill_incidence_temporal_frequency_spatial_integration_v' + version_out,
    'assetId': root + 'CERRADO_col7_gapfill_incidence_temporal_frequency_spatial_integration_v' + version_out,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': file_in.geometry(),
    'scale': 30,
    'maxPixels': 1e13
});
