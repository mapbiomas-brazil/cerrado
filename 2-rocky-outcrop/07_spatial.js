// --- --- --- 07_spatial
// spatial filter - minimum area
// barbara.silva@ipam.org.br 

// set metadata 
var input_version = '0';
var output_version = '0';

// set directories
var input = 'projects/barbaracosta-ipam/assets/collection-9_rocky-outcrop/general-class-post/CERRADO_col9_rocky_gapfill_frequency_v' + input_version;
var dirout = 'projects/barbaracosta-ipam/assets/collection-9_rocky-outcrop/general-class-post/';

// load classification
var classification = ee.Image(input);
print ("input", classification);

// import mapbiomas color ramp
var vis = {
      min:0,
      max:62,
      palette: require('users/mapbiomas/modules:Palettes.js').get('classification8'),
    };

// plot  input version
Map.addLayer(classification.select(['classification_2010']), vis, 'input 2010');

// create an empty recipe
var filtered = ee.Image([]);

// define minimum mapeable area
var filter_size = 50;

// apply filter
ee.List.sequence({'start': 1985, 'end': 2023}).getInfo()
      .forEach(function(year_i) {
        // compute the focal model
        var focal_mode = classification.select(['classification_' + year_i])
                .unmask(0)
                .focal_mode({'radius': 10, 'kernelType': 'square', 'units': 'pixels'});
 
        // compute te number of connections
        var connections = classification.select(['classification_' + year_i])
                .unmask(0)
                .connectedPixelCount({'maxSize': 100, 'eightConnected': false});
        
        // get the focal model when the number of connections of same class is lower than parameter
        var to_mask = focal_mode.updateMask(connections.lte(filter_size));

        // apply filter
        var classification_i = classification.select(['classification_' + year_i])
                .blend(to_mask)
                .reproject('EPSG:4326', null, 30);

        // stack into recipe
        filtered = filtered.addBands(classification_i.updateMask(classification_i.neq(0)));
        }
      );

// print filtered
Map.addLayer(filtered.select(['classification_2010']), vis, 'filtered 2010 - round 1');

// set recipe 
var recipe = ee.Image([]);

// apply filter
ee.List.sequence({'start': 1985, 'end': 2023}).getInfo()
      .forEach(function(year_i) {
        // compute the focal model
        var focal_mode = filtered.select(['classification_' + year_i])
                .unmask(0)
                .focal_mode({'radius': 10, 'kernelType': 'square', 'units': 'pixels'});
 
        // compute te number of connections
        var connections = filtered.select(['classification_' + year_i])
                .unmask(0)
                .connectedPixelCount({'maxSize': 100, 'eightConnected': false});
        
        // get the focal model when the number of connections of same class is lower than parameter
        var to_mask = focal_mode.updateMask(connections.lte(filter_size));

        // apply filter
        var classification_i = filtered.select(['classification_' + year_i])
                .blend(to_mask)
                .reproject('EPSG:4326', null, 30);

        // stack into recipe
        recipe = recipe.addBands(classification_i.updateMask(classification_i.neq(0)));
        }
      );

Map.addLayer(recipe.select(['classification_2010']), vis, 'filtered 2010 - round 2');

print ('output', recipe);

// export as GEE asset
Export.image.toAsset({
    'image': recipe,
    'description': 'CERRADO_col9_rocky_gapfill_frequency_spatial_v' + output_version,
    'assetId': dirout + 'CERRADO_col9_rocky_gapfill_frequency_spatial_v' + output_version,
    'pyramidingPolicy': {
        '.default': 'mode'
    },
    'region': classification.geometry(),
    'scale': 30,
    'maxPixels': 1e13
});
